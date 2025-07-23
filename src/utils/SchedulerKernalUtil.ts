import { ISessionContext } from "@jupyterlab/apputils";
import { IKernelDetails } from "../interfaces/ComposerInterface";
import { ExecutionMode, SchedulerType } from "../types/CommonSchedulerTypes";
import { Kernel, KernelAPI, KernelSpecAPI } from "@jupyterlab/services";
import { SchedulerService } from "../services/composer/SchedulerServices";

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
  sessionContext: ISessionContext,
  availableKernelSpecs: any,
  serverlessNamesList: string[], // <-- Now expects string[] directly for matching
  clusterList: string[]
): Promise<IKernelDetails> => {
  const kernelDisplayName = sessionContext.kernelDisplayName;
  console.debug('Kernel Display Name:', kernelDisplayName);

  const kernelDetails: IKernelDetails = {
    executionMode: 'local', // Default to local
    selectedServerlessName: undefined,
    selectedClusterName: undefined,
    kernelParentResource: undefined,
    isDataprocKernel: false,
    kernelDisplayName: kernelDisplayName
  };

  // --- 1. Basic Local/No Kernel Check ---
  if (
    kernelDisplayName.includes('Local') ||
    kernelDisplayName.includes('No Kernel')
  ) {
    return kernelDetails; // Local or no kernel, return default details that is local
  }

  // --- 2. Attempt to get details from running kernel (preferred for active session) ---
  let parentResource: string | undefined;
  try {
    const currentKernelId = sessionContext.session?.kernel?.id;
    if (currentKernelId) {
      const runningKernels: Kernel.IModel[] = await KernelAPI.listRunning();
      const runningKernel = runningKernels.find(
        kernel => kernel.id === currentKernelId
      );
      parentResource = (runningKernel as any)?.metadata?.endpointParentResource as string;
      kernelDetails.kernelParentResource = parentResource;
      console.debug('Kernel Parent Resource (from running kernel):', parentResource);
    }
  } catch (error) {
    console.warn('Could not get running kernel details, falling back to kernel specs:', error);
  }

  // --- 3. If running kernel details not found or for more definitive type, check kernel specs ---
  if (!parentResource && availableKernelSpecs && sessionContext.kernelPreference.name) {
    const kernels = availableKernelSpecs.kernelspecs;
    if (kernels && kernels[sessionContext.kernelPreference.name]) {
      parentResource = kernels[sessionContext.kernelPreference.name].resources?.endpointParentResource as string;
      kernelDetails.kernelParentResource = parentResource;
      console.debug('Kernel Parent Resource (from kernel spec):', parentResource);
    }
  }

  // --- 4. Determine execution mode and match resources based on parentResource ---
  if (parentResource) {
    if (parentResource.includes('/sessions')) { // Dataproc Serverless Sessions
      kernelDetails.executionMode = 'serverless';
      kernelDetails.isDataprocKernel = true;
      console.debug('Detected Dataproc Serverless Session Kernel');

      // Match against serverlessNamesList (strings)
      const matchedServerlessName = serverlessNamesList.find(
        (serverlessName: string) =>
          kernelDisplayName.includes(serverlessName)
      );

      if (matchedServerlessName) {
        kernelDetails.selectedServerlessName = matchedServerlessName;
      }
    } else if (parentResource.includes('/clusters')) { // Dataproc Clusters
      kernelDetails.executionMode = 'cluster';
      kernelDetails.isDataprocKernel = true;
      console.debug('Detected Dataproc Cluster Kernel');

      // Match against clusterList
      const matchedCluster = clusterList.find((cluster: string) =>
        kernelDisplayName.includes(cluster)
      );

      if (matchedCluster) {
        kernelDetails.selectedClusterName = matchedCluster;
      }
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
  sessionContext: ISessionContext,
  availableKernelSpecs: any,
  serverlessNamesList: string[], // <-- Now expects string[]
  clusterList: string[]
): Promise<{
  schedulerType: SchedulerType;
  executionMode: ExecutionMode;
  selectedServerlessName?: string;
  selectedClusterName?: string;
}> => {
  let schedulerType: SchedulerType = 'vertex'; // Default to vertex
  let executionMode: ExecutionMode = 'local'; // Default execution mode
  let selectedServerlessName: string | undefined;
  let selectedClusterName: string | undefined;

  try {
    const kernelDetails = await getKernelDetails(
      sessionContext,
      availableKernelSpecs,
      serverlessNamesList, // Pass the string array
      clusterList
    );

    executionMode = kernelDetails.executionMode;

    if (kernelDetails.executionMode === 'serverless') {
      schedulerType = 'composer';
      selectedServerlessName = kernelDetails.selectedServerlessName;
    } else if (kernelDetails.executionMode === 'cluster') {
      schedulerType = 'composer';
      selectedClusterName = kernelDetails.selectedClusterName;
    } else {
      schedulerType = 'vertex'; // Local or unknown defaults to Vertex
    }

    return {
      schedulerType,
      executionMode,
      selectedServerlessName,
      selectedClusterName
    };
  } catch (error) {
    console.error('Error extracting scheduler type and kernel details:', error);
    // Return safe defaults on error
    return {
      schedulerType: 'vertex',
      executionMode: 'local'
    };
  }
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
  sessionContext: ISessionContext
): Promise<{
  schedulerType: SchedulerType;
  executionMode: ExecutionMode;
  selectedServerlessName?: string;
  selectedClusterName?: string;
}> => {
  let availableKernelSpecs: any = null;
  let fetchedServerlessNamesList: string[] = []; // Store only names now
  let fetchedClusterList: string[] = [];

  // A simple flag for SchedulerService's setIsLoadingKernelDetail
  const tempSetIsLoading = (isLoading: boolean) => {
    console.debug(`MyApiServices internal loading state: ${isLoading}`);
  };

  try {
    // 1. Fetch Kernel Specs
    availableKernelSpecs = await KernelSpecAPI.getSpecs();

    // 2. Fetch Clusters using MyApiServices
    await new Promise<void>((resolve, reject) => {
      SchedulerService.listClustersAPIService(
        (clusters: string[]) => { // Callback for setClusterList receives string[]
          fetchedClusterList = clusters; // Assign the array directly
          resolve();
        },
        tempSetIsLoading // Callback for setIsLoadingKernelDetail
      ).catch(reject);
    });

    // 3. Fetch Session Templates using MyApiServices
    await new Promise<void>((resolve, reject) => {
     
      SchedulerService.listSessionTemplatesAPIService(
        (serverlessNames: string[]) => { 
          fetchedServerlessNamesList = serverlessNames; // Assign the array of names
          resolve();
        },
        (serverlessNames: string[]) => { /* This is the second callback, also string[], effectively redundant for our need here */ },
        tempSetIsLoading
      ).catch(reject);
    });

  } catch (error) {
    console.error('Error fetching initial API data in getDefaultSchedulerTypeOnLoad:', error);
    // On error during API calls, return default values
    return {
      schedulerType: 'vertex',
      executionMode: 'local',
      selectedServerlessName: undefined,
      selectedClusterName: undefined,
    };
  }

  // Now that all data is fetched, process it.
  // We pass fetchedServerlessNamesList (string[]) to extractSchedulerTypeAndKernelDetails
  return await extractSchedulerTypeAndKernelDetails(
    sessionContext,
    availableKernelSpecs,
    fetchedServerlessNamesList, // Pass the array of names
    fetchedClusterList
  );
};