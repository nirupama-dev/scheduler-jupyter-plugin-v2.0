/**
 *
 * This utility file provides functions to extract kernel details and determine the scheduler type
 * based on the current JupyterLab session context.
 */
import { ISessionContext } from '@jupyterlab/apputils';
import { IKernelDetails } from '../interfaces/ComposerInterface';
import { SchedulerType } from '../types/CommonSchedulerTypes';
import { Kernel, KernelAPI, KernelSpecAPI } from '@jupyterlab/services';
import { ComposerServices } from '../services/composer/ComposerServices';
import {
  ILabelValue,
  INotebookKernalSchdulerDefaults
} from '../interfaces/CommonInterface';

/**
 * caching KernelAPI.listRunning() to improve preformance.
 */
let cachedRunningKernels: Kernel.IModel[] | null = null;
let lastFetchTime: number = 0;
const CACHE_LIFETIME = 10 * 1000; // 5 seconds, adjust as needed

async function getRunningKernelsCached(): Promise<Kernel.IModel[]> {
  const now = Date.now();
  if (cachedRunningKernels && now - lastFetchTime < CACHE_LIFETIME) {
    console.debug('Using cached running kernels');
    return cachedRunningKernels;
  }

  console.debug('Fetching running kernels (uncached)');
  const kernels = await KernelAPI.listRunning();
  cachedRunningKernels = kernels;
  lastFetchTime = now;
  return kernels;
}

/**
 * Retrieves essential kernel details: its execution mode and matching resource names.
 * This function is pure and does not set any external state.
 *
 * @param sessionContext The session context for the current JupyterLab session.
 * @param availableKernelSpecs The result of KernelSpecAPI.getSpecs().
 * @param serverlessNamesList The pre-fetched list of available serverless names (strings).
 * @param clusterList The pre-fetched list of available cluster names (strings).
 * @returns A promise that resolves to an IKernelDetails object.
 */
const getKernelDetails = async (
  availableKernelSpecs: any,
  serverlessNamesList: string[], // <-- Now expects string[] directly for matching
  clusterList: string[],
  sessionContext?: ISessionContext | null | undefined
): Promise<IKernelDetails> => {
  const kernelDisplayName = sessionContext?.kernelDisplayName;
  console.debug('Kernel Display Name:', kernelDisplayName);

  const kernelDetails: IKernelDetails = {
    executionMode: 'local', // Default to local
    selectedServerlessName: undefined,
    selectedClusterName: undefined,
    kernelParentResource: undefined,
    isDataprocKernel: false,
    kernelDisplayName: kernelDisplayName ?? ''
  };

  // --- Attempt to get details from running kernel (preferred for active session) ---
  let parentResource: string | undefined;
  try {
    const currentKernelId = sessionContext?.session?.kernel?.id;
    console.log('Current Kernel ID:', currentKernelId);
    if (currentKernelId) {
      const runningKernels: Kernel.IModel[] = await getRunningKernelsCached();
      console.log('runningKernal', runningKernels);
      const runningKernel = runningKernels.find(
        kernel => kernel.id === currentKernelId
      );
      console.log('Running Kernel Details:', runningKernel);
      parentResource = (runningKernel as any)?.metadata
        ?.endpointParentResource as string;
      kernelDetails.kernelParentResource = parentResource;
      console.debug(
        'Kernel Parent Resource (from running kernel):',
        parentResource
      );
      console.log(
        'Kernel Parent Resource (from running kernel):',
        parentResource
      );
    }
  } catch (error) {
    console.warn(
      'Could not get running kernel details, falling back to kernel specs:',
      error
    );
  }

  //... If running kernel details not found or for more definitive type, check kernel specs ---
  if (
    !parentResource &&
    availableKernelSpecs &&
    sessionContext?.kernelPreference.name
  ) {
    const kernels = availableKernelSpecs.kernelspecs;
    if (kernels && kernels[sessionContext.kernelPreference.name]) {
      parentResource = kernels[sessionContext.kernelPreference.name].resources
        ?.endpointParentResource as string;
      kernelDetails.kernelParentResource = parentResource;
      console.log(
        'Kernel Parent Resource (from kernel specs):',
        parentResource
      );
      console.debug(
        'Kernel Parent Resource (from kernel spec):',
        parentResource
      );
    }
  }

  // ---  Determine execution mode and match resources based on parentResource ---
  if (parentResource) {
    if (parentResource.includes('/sessions')) {
      kernelDetails.executionMode = 'serverless';
      kernelDetails.isDataprocKernel = true;
      kernelDetails.selectedServerlessName = serverlessNamesList.find(
        serverlessName => kernelDisplayName?.includes(serverlessName)
      );
    } else if (parentResource.includes('/clusters')) {
      kernelDetails.executionMode = 'cluster';
      kernelDetails.isDataprocKernel = true;
      kernelDetails.selectedClusterName = clusterList.find(cluster =>
        kernelDisplayName?.includes(cluster)
      );
    }
  }
  return kernelDetails;
};

/**
 * Determines the scheduler type, execution mode, and matched kernel details.
 * This function calls `getKernelDetails` internally.
 *
 * @param sessionContext The session context.
 * @param availableKernelSpecs All available kernel specifications.
 * @param serverlessNamesList List of available serverless names (strings).
 * @param clusterList List of available cluster names (strings).
 * @returns A promise resolving to an object containing schedulerType, executionMode,
 * and matched serverless/cluster names.
 */
const extractSchedulerTypeAndKernelDetails = async (
  availableKernelSpecs: any,
  serverlessNamesList: string[], // <-- Now expects string[]
  clusterList: string[],
  sessionContext?: ISessionContext | null | undefined
): Promise<{
  kernalAndSchedulerDetails: INotebookKernalSchdulerDefaults;
}> => {
  try {
    const kernelDetails = await getKernelDetails(
      availableKernelSpecs,
      serverlessNamesList, // Pass the string array
      clusterList,
      sessionContext
    );
    const schedulerType: SchedulerType =
      kernelDetails.executionMode === 'serverless' ||
      kernelDetails.executionMode === 'cluster'
        ? 'composer'
        : 'vertex';

    return {
      kernalAndSchedulerDetails: {
        schedulerType,
        kernelDetails: {
          executionMode: kernelDetails.executionMode,
          kernelDisplayName: sessionContext?.kernelDisplayName ?? '',
          selectedServerlessName: kernelDetails.selectedServerlessName,
          selectedClusterName: kernelDetails.selectedClusterName,
          kernelParentResource: kernelDetails.kernelParentResource,
          isDataprocKernel: kernelDetails.isDataprocKernel
        }
      }
    };
  } catch (error) {
    console.error('Error extracting scheduler type and kernel details:', error);
    console.log(
      'GetKernal Details: Falling back to default scheduler type and execution mode.'
    );
    // Return safe defaults on error
    return {
      kernalAndSchedulerDetails: {
        schedulerType: 'vertex',
        kernelDetails: {
          executionMode: 'local',
          kernelDisplayName: sessionContext?.kernelDisplayName ?? '',
          selectedServerlessName: undefined,
          selectedClusterName: undefined,
          kernelParentResource: undefined,
          isDataprocKernel: false
        }
      }
    };
  }
};

/**
 * Promisifies the listClustersAPIService to return a full list of cluster names.
 * @returns Promise resolving to an array of cluster names (strings).
 */
const promisifiedListClusters = async (): Promise<string[]> => {
  const apiResponse = await ComposerServices.listClustersAPIService();
  return apiResponse.map((option: ILabelValue<string>) => option.value);
};

/**
 * Promisifies the listSessionTemplatesAPIService to return a full list of serverless names.
 * @returns Promise resolving to an array of serverless names (strings).
 */
const promisifiedListSessionTemplates = async (): Promise<string[]> => {
  // Await the API call to get the resolved array of objects
  const apiResponse = await ComposerServices.listSessionTemplatesAPIService();

  // Map the resolved array of objects to an array of string values
  const templateValues = apiResponse.map(
    (option: ILabelValue<string>) => option.value
  );

  // Return the final array
  return templateValues;
};

/**
 * The primary entry point to get scheduler-related kernel details.
 * This function handles fetching necessary API data using MyApiServices
 * and then processes it.
 *
 * @param sessionContext The session context for the current JupyterLab session.
 * @returns A promise that resolves to an object containing the determined scheduler type,
 * execution mode, and any matched serverless or cluster names.
 */
export const getDefaultSchedulerTypeOnLoad = async (
  sessionContext?: ISessionContext | null | undefined
): Promise<{
  kernalAndSchedulerDetails: INotebookKernalSchdulerDefaults;
}> => {
  const kernalAndSchedulerDetails: INotebookKernalSchdulerDefaults = {
    schedulerType: 'vertex',
    kernelDetails: {
      executionMode: 'local',
      kernelDisplayName: sessionContext?.kernelDisplayName ?? '',
      selectedServerlessName: undefined,
      selectedClusterName: undefined,
      kernelParentResource: undefined,
      isDataprocKernel: false
    }
  };
  // Early exit for local or no kernel
  if (
    sessionContext?.kernelDisplayName.includes('Local') ||
    sessionContext?.kernelDisplayName.includes('No Kernel')
  ) {
    return { kernalAndSchedulerDetails };
  }
  let availableKernelSpecs: any = null;
  let fetchedServerlessNamesList: string[] = [];
  let fetchedClusterList: string[] = [];
  console.log('getDefaultSchedulerTypeOnLoad called');

  try {
    availableKernelSpecs = await KernelSpecAPI.getSpecs();
    console.log('Available Kernel Specs fetched.');
  } catch (error) {
    console.error(
      'Error fetching Kernel Specs. Cannot determine full scheduler details.',
      error
    );
    console.log('Falling back to default scheduler type and execution mode.');
    return { kernalAndSchedulerDetails }; // Return default values if specs cannot be fetched
  }

  // Fetch cluster and session templates in parallel
  const [clustersResult, serverlessTemplatesResult] = await Promise.allSettled([
    promisifiedListClusters(),
    promisifiedListSessionTemplates()
  ]);

  if (clustersResult.status === 'fulfilled') {
    fetchedClusterList = clustersResult.value;
  } else {
    console.warn('Failed to fetch cluster list:', clustersResult.reason);
  }

  if (serverlessTemplatesResult.status === 'fulfilled') {
    fetchedServerlessNamesList = serverlessTemplatesResult.value;
  } else {
    console.warn(
      'Failed to fetch session templates:',
      serverlessTemplatesResult.reason
    );
  }

  console.log('Processing fetched data...', {
    availableKernelSpecs,
    fetchedServerlessNamesList,
    fetchedClusterList
  });

  return extractSchedulerTypeAndKernelDetails(
    availableKernelSpecs,
    fetchedServerlessNamesList, // Pass the string array directly
    fetchedClusterList,
    sessionContext
  );
};
