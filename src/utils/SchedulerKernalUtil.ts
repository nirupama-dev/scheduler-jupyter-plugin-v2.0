/**
 *
 * This utility file provides functions to extract kernel details and determine the scheduler type
 * based on the current JupyterLab session context.
 */
import { ISessionContext } from '@jupyterlab/apputils';
import { IKernelDetails } from '../interfaces/ComposerInterface';
import { SchedulerType } from '../types/CommonSchedulerTypes';
import { Kernel, KernelAPI, KernelSpecAPI } from '@jupyterlab/services';
import {
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
const extractKernelDetails = async (
  availableKernelSpecs: any,
  sessionContext?: ISessionContext | null | undefined
): Promise<IKernelDetails> => {
  const kernelDisplayName = sessionContext?.kernelDisplayName;
  console.debug('Kernel Display Name:', kernelDisplayName);

  const kernelDetails: IKernelDetails = {
    executionMode: 'local', // Default to local
    isDataprocKernel: false,
    kernelDisplayName: kernelDisplayName ?? ''
  };

  // --- Attempt to get details from running kernel (preferred for active session) ---
  let parentResource: string | undefined;
  try {
    const currentKernelId = sessionContext?.session?.kernel?.id;
    if (currentKernelId) {
      const runningKernels: Kernel.IModel[] = await getRunningKernelsCached();
      const runningKernel = runningKernels.find(
        kernel => kernel.id === currentKernelId
      );
      parentResource = (runningKernel as any)?.metadata
        ?.endpointParentResource as string;
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
    }
  }

  // ---  Determine execution mode and match resources based on parentResource ---
  if (parentResource) {
    if (parentResource.includes('/sessions')) {
      kernelDetails.executionMode = 'serverless';
      kernelDetails.isDataprocKernel = true;
     
    } else if (parentResource.includes('/clusters')) {
      kernelDetails.executionMode = 'cluster';
      kernelDetails.isDataprocKernel = true;
   
    }
  }
  return kernelDetails;
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
  
  try {
    availableKernelSpecs = await KernelSpecAPI.getSpecs();
  } catch (error) {
    console.error(
      'Error fetching Kernel Specs. Falling back to default scheduler type and execution mode.',
      error
    );
    return { kernalAndSchedulerDetails }; // Return default values if specs cannot be fetched
  }

   try {
    const kernelDetails = await extractKernelDetails(
      availableKernelSpecs,
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
          isDataprocKernel: kernelDetails.isDataprocKernel
        }
      }
    };
  } catch (error) {
    console.error('Error extracting scheduler type and kernel details:', error);
    
    // Return safe defaults on error
    return {
      kernalAndSchedulerDetails: {
        schedulerType: 'vertex',
        kernelDetails: {
          executionMode: 'local',
          kernelDisplayName: sessionContext?.kernelDisplayName ?? '',
          isDataprocKernel: false
        }
      }
    };
  }
};
