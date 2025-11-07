/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { requestAPI } from '../../handler/Handler';
import { LOG_LEVEL, SchedulerLoggingService } from '../common/LoggingService';
import { ABORT_MESSAGE, HTTP_STATUS_BAD_REQUEST } from '../../utils/Constants';
import {
  IClusterAPIResponse,
  IComposerEnvAPIResponse,
  IComposerSchedulePayload,
  IDagList,
  ISchedulerDagData,
  IUpdateSchedulerAPIResponse,
  IListDagInfoAPIServiceResponse,
  IListComposer
} from '../../interfaces/ComposerInterface';
import { Notification } from '@jupyterlab/apputils';
import { toast } from 'react-toastify';
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
import { toastifyCustomStyle } from '../../components/common/notificationHandling/Config';
import { IEnvDropDownOption } from '../../interfaces/FormInterface';
import { AuthenticationError } from '../../exceptions/AuthenticationException';
import { settingController } from '../../utils/Config';

/**
 * All the API Services needed for  Cloud Composer (Jupyter Lab Notebook) Scheduler Module.
 */
export class ComposerServices {
  /**
   * Fetches the list of Cluster Options available.
   * @param nextPageToken
   * @param previousClustersList
   */
  static readonly listClustersAPIService = async (
    nextPageToken?: string,
    previousClustersList?: (value: string[]) => void
  ) => {
    const pageToken = nextPageToken ?? '';
    try {
      const serviceURL = `clusterList?pageSize=500&pageToken=${pageToken}`;

      const clusterListResponse: any = await requestAPI(serviceURL);
      let transformClusterListData = [];
      if (clusterListResponse?.clusters) {
        transformClusterListData = clusterListResponse?.clusters?.map(
          (data: IClusterAPIResponse) => {
            return {
              clusterName: data.clusterName
            };
          }
        );
      }
      const existingClusterData = previousClustersList ?? [];
      //setStateAction never type issue
      const allClustersData: any = [
        ...(existingClusterData as []),
        ...transformClusterListData
      ];

      if (clusterListResponse.nextPageToken) {
        this.listClustersAPIService(
          clusterListResponse.nextPageToken,
          allClustersData
        );
      } else {
        const transformClusterListData = allClustersData;

        const clusterOptionList = transformClusterListData.map(
          (obj: { clusterName: string }) => ({
            label: obj.clusterName,
            value: obj.clusterName
          })
        );

        return clusterOptionList;
      }
      if (clusterListResponse?.error) {
        handleErrorToast({
          error: clusterListResponse?.error
        });
        return;
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      SchedulerLoggingService.log('Error listing clusters', LOG_LEVEL.ERROR);
      const errorResponse = `Failed to fetch clusters : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      return;
    }
  };

  /**
   * Fetches the list of session templates from the Composer API.
   * @param nextPageToken - Token for fetching the next page of results.
   * @param previousSessionTemplatesList - Previously fetched session templates.
   */
  static readonly listSessionTemplatesAPIService = async (
    nextPageToken?: string,
    previousSessionTemplatesList?: object
  ) => {
    const pageToken = nextPageToken ?? '';

    try {
      const serviceURL = `runtimeList?pageSize=500&pageToken=${pageToken}`;

      const runtimeListResponse: any = await requestAPI(serviceURL);
      let transformSessionTemplateListData = [];
      if (
        runtimeListResponse &&
        Object.hasOwn(runtimeListResponse, 'sessionTemplates')
      ) {
        transformSessionTemplateListData = runtimeListResponse.sessionTemplates
          .filter((item: any) => Object.hasOwn(item, 'jupyterSession'))
          .map((data: any) => {
            return {
              serverlessName: data.jupyterSession.displayName,
              serverlessData: data
            };
          });
      }
      const existingSessionTemplateData = previousSessionTemplatesList ?? [];
      //setStateAction never type issue
      const allSessionTemplatesData: any = [
        ...(existingSessionTemplateData as []),
        ...transformSessionTemplateListData
      ];

      if (runtimeListResponse.nextPageToken) {
        this.listSessionTemplatesAPIService(
          // setServerlessDataList,
          // setServerlessOptions,
          runtimeListResponse.nextPageToken,
          allSessionTemplatesData
        );
      } else {
        const transformSessionTemplateListData = allSessionTemplatesData;
        const serverlessOptionList = transformSessionTemplateListData.map(
          (obj: { serverlessName: string }) => ({
            label: obj.serverlessName,
            value: obj.serverlessName
          })
        );

        // setServerlessDataList(transformSessionTemplateListData);
        return serverlessOptionList;
      }
      if (runtimeListResponse?.error) {
        handleErrorToast({
          error: runtimeListResponse?.error
        });
        return;
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      SchedulerLoggingService.log(
        'Error listing session templates',
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch session templates : ${error}`;
      handleErrorToast({
        error: errorResponse
      });

      return;
    }
  };

  /**
   * Fetches the list of Composer environments.
   * @param projectId - The ID of the project.
   * @param region - The region to fetch environments from.
   * @returns A promise that resolves to an array of dropdown options for Composer environments.
   */
  static readonly listComposersAPIService = async (
    projectId: string,
    region: string
  ): Promise<IListComposer> => {
    try {
      const composerListResponse: IComposerEnvAPIResponse[] = await requestAPI(
        `composerList?project_id=${projectId}&region_id=${region}`
      );

      if (!Array.isArray(composerListResponse)) {
        // This custom error will now be thrown and caught by the caller.
        throw new Error('Invalid response format for composer environments');
      }

      const environmentOptions: IEnvDropDownOption[] = composerListResponse.map(
        (env: IComposerEnvAPIResponse) => ({
          label: env.label,
          value: env.name,
          state: env.state
        })
      );
      environmentOptions.sort((a, b) => a.label.localeCompare(b.label));

      const data = {
        environmentOptions: environmentOptions,
        composerListResponse: composerListResponse
      };

      return data;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      const errorResponse = `Failed to fetch composer environment list : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      return { environmentOptions: [], composerListResponse: [] };
    }
  };

  /**
   * Creates or Updates a Cloud Composer Notebook Schedule Job.
   * @param composerScheduleData
   * @param projectId
   * @param region
   * @param isEditMode
   * @returns
   */
  static readonly saveComposerNotebookJobSchedule = async (
    composerScheduleData: IComposerSchedulePayload,
    projectId?: string,
    region?: string,
    isEditMode?: boolean
  ): Promise<boolean> => {
    try {
      if (!projectId) {
        projectId = composerScheduleData.project_id;
      }
      if (!region) {
        region = composerScheduleData.region_id;
      }
      console.log('project: ', projectId, 'region', region);
      const createScheduleResponse: any = await requestAPI(
        `createJobScheduler?project_id=${projectId}&region_id=${region}`,
        {
          body: JSON.stringify(composerScheduleData),
          method: 'POST'
        }
      );
      // Check if the schedule was created successfully
      if (createScheduleResponse?.error) {
        handleErrorToast({
          error: createScheduleResponse.error
        });
        return false;
      } else {
        if (isEditMode) {
          // In case of update Schedule
          Notification.success('Notebook Job Scheduler Successfully Updated', {
            autoClose: false
          });
        } else {
          // create schedule
          Notification.success('Notebook Job Scheduler Successfully Created', {
            autoClose: false
          });
        }
        // If there are packages to install, notify the user
        if (
          composerScheduleData.packages_to_install &&
          composerScheduleData.packages_to_install.length > 0
        ) {
          Notification.success('Installation of packages will take sometime', {
            autoClose: false
          });
        }
        return true;
      }
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      handleErrorToast({
        error: reason
      });
      return false;
    }
  };
  /**
   * Edits the notebook in a scheduled job.
   * @param bucketName - The name of the bucket.
   * @param dagId - The ID of the DAG.
   * @returns A promise that resolves to the response from the API.
   */
  static readonly editComposerNotebookInScheduledJob = async (
    bucketName: string,
    dagId: string
  ): Promise<any> => {
    try {
      const serviceURL = `getInputFileName?&dag_id=${dagId}&bucket_name=${bucketName}`;
      const inputFilenameResponse: any = await requestAPI(serviceURL, {
        method: 'GET'
      });

      if (!inputFilenameResponse?.input_filename) {
        handleErrorToast({
          error: `Error in fetching filename for ${dagId}`
        });
      }
      return inputFilenameResponse;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      const errorResponse = `Error on POST: ${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  /**
   * Fetch the data of a scheduled composer job.
   * @param bucketName - The name of the bucket.
   * @param dagId - The ID of the DAG.
   */
  static readonly getComposerJobScheduleDetails = async (
    dagId: string | undefined,
    region: string | undefined,
    projectId: string | undefined,
    environment: string | undefined
  ) => {
    try {
      const serviceURL = `getComposerJobSchedule?dag_id=${dagId}&project_id=${projectId}&region_id=${region}&composer=${environment}`;
      const composerJobScheduleDetails: IComposerSchedulePayload =
        await requestAPI(serviceURL, {
          method: 'GET'
        });
      if (composerJobScheduleDetails.error) {
        handleErrorToast({
          error: `Error on getting schedule details.\n${composerJobScheduleDetails.error}`
        });
        return;
      }
      console.log(
        'ComposerServices: Fetched Composer Job Schedule Details:',
        composerJobScheduleDetails
      );

      return composerJobScheduleDetails;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      const errorResponse = `Error on getting schedule details.\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
      return;
    }
  };

  static readonly listDagRunsListService = async (payload: {
    composerName: string;
    dagId: string;
    startDate: string;
    endDate: string;
    projectId: string;
    region: string;
    abortControllers: any;
    offset?: number;
  }): Promise<any> => {
    const {
      composerName,
      dagId,
      startDate,
      endDate,
      projectId,
      region,
      abortControllers,
      offset = 0
    } = payload;

    const signal = settingController(abortControllers);
    const serviceURL = `dagRun?composer=${composerName}&dag_id=${dagId}&start_date=${startDate}&end_date=${endDate}&offset=${offset}&project_id=${projectId}&region_id=${region}`;

    try {
      const data: any = await requestAPI(serviceURL, { signal });
      return data;
    } catch (error) {
      // Check for AuthenticationError
      if (error instanceof AuthenticationError) {
        throw error;
      }

      const errorResponse = `Error in listing dag runs..\n${error}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly listDagInfoAPIService = async (
    composerSelected: string,
    region: string,
    project: string
  ): Promise<IListDagInfoAPIServiceResponse> => {
    try {
      const serviceURL = `dagList?composer=${composerSelected}&project_id=${project}&region_id=${region}`;
      const dagListResponse: any = await requestAPI(serviceURL);

      let transformDagListData: IDagList[] = [];
      if (dagListResponse?.length > 0) {
        transformDagListData = dagListResponse[0]?.dags?.map((dag: any) => ({
          jobid: dag.dag_id,
          notebookname: dag.dag_id,
          schedule: dag.timetable_description,
          status: dag.is_paused ? 'Paused' : 'Active',
          scheduleInterval: dag.schedule_interval?.value
        }));
      }
      return {
        dagList: transformDagListData,
        bucketName: dagListResponse[1]
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      if (!toast.isActive('dagListError')) {
        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? error.message
            : 'Unknown error';

        toast.error(`Failed to fetch schedule list: ${errorMessage}`, {
          toastId: 'dagListError'
        });
      }
      throw error;
    }
  };

  listDagInfoAPIServiceForCreateNotebook = (
    setDagList: (value: IDagList[]) => void,
    composerSelected: string,
    setJobNameUniquenessError: React.Dispatch<React.SetStateAction<boolean>>,
    region: string,
    project: string
  ) => {
    const serviceURL = `dagList?composer=${composerSelected}&project_id=${project}&region_id=${region}`;
    requestAPI(serviceURL)
      .then((dagListResponse: any) => {
        let transformDagListData = [];
        if (dagListResponse?.[0].dags) {
          transformDagListData = dagListResponse[0].dags.map(
            (dag: ISchedulerDagData) => {
              return {
                jobid: dag.dag_id,
                notebookname: dag.dag_id,
                schedule: dag.timetable_description,
                status: dag.is_paused ? 'Paused' : 'Active',
                scheduleInterval: dag.schedule_interval?.value
              };
            }
          );
        }
        setDagList(transformDagListData);
        setJobNameUniquenessError(false);
      })
      .catch(error => {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        SchedulerLoggingService.log(
          'Error listing dag Scheduler list',
          LOG_LEVEL.ERROR
        );
        setJobNameUniquenessError(true);
      });
  };

  static readonly handleDownloadOutputNotebookAPIService = async (
    composerName: string,
    dagRunId: string,
    bucketName: string,
    dagId: string,
    setDownloadOutputDagRunId: (value: string) => void,
    projectId: string,
    region: string
  ) => {
    setDownloadOutputDagRunId(dagRunId);
    try {
      dagRunId = encodeURIComponent(dagRunId);
      const serviceURL = `downloadOutput?composer=${composerName}&bucket_name=${bucketName}&dag_id=${dagId}&dag_run_id=${dagRunId}&project_id=${projectId}&region_id=${region}`;
      const downloadOutputReponse: any = await requestAPI(serviceURL, {
        method: 'POST'
      });
      dagRunId = decodeURIComponent(dagRunId);
      if (downloadOutputReponse.status === 0) {
        Notification.success(`${dagId}_${dagRunId} downloaded successfully`, {
          autoClose: false
        });
      } else {
        Notification.error(`Failed to download the ${dagId}_${dagRunId}`, {
          autoClose: false
        });
      }
      setDownloadOutputDagRunId('');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      SchedulerLoggingService.log('Error in Download api', LOG_LEVEL.ERROR);
      const errorResponse = `Error in Download api : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      setDownloadOutputDagRunId('');
    }
  };

  static readonly handleDeleteComposerScheduleAPIService = async (
    composerSelected: string,
    dag_id: string,
    region: string,
    project: string,
    fromPage?: string | undefined
  ): Promise<IUpdateSchedulerAPIResponse> => {
    try {
      const serviceURL = `dagDelete?composer=${composerSelected}&dag_id=${dag_id}&from_page=${fromPage}&project_id=${project}&region_id=${region}`;
      const deleteResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL,
        { method: 'DELETE' }
      );

      if (deleteResponse.status === 0) {
        // Success: show notification and refresh the list
        Notification.success(
          `Deleted job ${dag_id}. It might take a few minutes for it to be deleted from the list of jobs.`,
          { autoClose: false }
        );
      } else {
        // Failure: show error notification
        Notification.error(`Failed to delete the ${dag_id}`, {
          autoClose: false
        });
      }
      return deleteResponse;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      // Handle network or unexpected errors
      SchedulerLoggingService.log('Error in Delete api', LOG_LEVEL.ERROR);
      Notification.error(`Failed to delete the ${dag_id} : ${error}`, {
        autoClose: false
      });
      throw error;
    }
  };

  static readonly handleUpdatComposerSchedulerAPIService = async (
    composerSelected: string,
    dag_id: string,
    is_status_paused: boolean,
    region: string,
    project: string
  ): Promise<IUpdateSchedulerAPIResponse> => {
    try {
      const serviceURL = `dagUpdate?composer=${composerSelected}&dag_id=${dag_id}&status=${is_status_paused}&project_id=${project}&region_id=${region}`;

      const updateResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL,
        { method: 'POST' }
      );
      if (updateResponse?.status === 0) {
        Notification.success(`Scheduler ${dag_id} updated successfully`, {
          autoClose: false
        });
      } else {
        const errorResponse = `Error in updating the schedule: ${updateResponse?.error}`;
        handleErrorToast({
          error: errorResponse
        });
      }

      return updateResponse;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      SchedulerLoggingService.log('Error in Update API', LOG_LEVEL.ERROR);
      const errorResponse = `Error in updating the schedule: ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      throw error;
    }
  };

  static readonly listDagTaskInstancesListService = async (
    composerName: string,
    dagId: string,
    dagRunId: string,
    projectId: string,
    region: string,
    abortControllers: any
  ) => {
    try {
      const signal = settingController(abortControllers);
      dagRunId = encodeURIComponent(dagRunId);
      const dagRunTask: any = await requestAPI(
        `dagRunTask?composer=${composerName}&dag_id=${dagId}&dag_run_id=${dagRunId}&project_id=${projectId}&region_id=${region}`,
        { signal }
      );
      dagRunTask.task_instances?.sort(
        (a: any, b: any) => new Date(a.start_date).getTime() - 12
      );
      let transformDagRunTaskInstanceListData = [];
      transformDagRunTaskInstanceListData = dagRunTask.task_instances?.map(
        (dagRunTask: any) => {
          return {
            tryNumber: dagRunTask.try_number,
            taskId: dagRunTask.task_id,
            duration: dagRunTask.duration,
            state: dagRunTask.state,
            date: new Date(dagRunTask.start_date).toDateString(),
            time: new Date(dagRunTask.start_date).toTimeString().split(' ')[0]
          };
        }
      );
      return transformDagRunTaskInstanceListData;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      const errorResponse = `Error in dag task instances..\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly listDagTaskLogsListService = async (
    composerName: string,
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber: number,
    projectId: string,
    region: string,
    abortControllers: any
  ) => {
    try {
      const signal = settingController(abortControllers);
      dagRunId = encodeURIComponent(dagRunId);
      const dagRunTaskLogs: any = await requestAPI(
        `dagRunTaskLogs?composer=${composerName}&dag_id=${dagId}&dag_run_id=${dagRunId}&task_id=${taskId}&task_try_number=${tryNumber}&project_id=${projectId}&region_id=${region}`,
        { signal }
      );
      return dagRunTaskLogs?.content;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      const errorResponse = `Error in listing task logs..\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly handleImportErrordataService = async (
    composerSelectedList: string,
    project: string,
    region: string,
    abortControllers?: any
  ) => {
    const controller = new AbortController();
    // abortControllers.current.push(controller);
    const signal = controller.signal;

    try {
      const importErrors: any = await requestAPI(
        `importErrorsList?composer=${composerSelectedList}&project_id=${project}&region_id=${region}`,
        { signal }
      );
      return importErrors;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      if (typeof reason === 'object' && reason !== null) {
        if (
          reason instanceof TypeError &&
          reason.toString().includes(ABORT_MESSAGE)
        ) {
          // Return nothing if the request was aborted
          return;
        }
      }

      // Handle and display the error notification
      const errorResponse = `Error in fetching import errors list: ${reason}`;
      if (!toast.isActive('importListError')) {
        toast.error(errorResponse, {
          ...toastifyCustomStyle,
          toastId: 'importListError'
        });
      }
      // Return nothing on error
      return;
    }
  };

  static readonly triggerComposerDagService = async (
    dagId: string,
    composerSelectedList: string,
    project: string,
    region: string,
    missingPackageList: any
  ): Promise<any> => {
    try {
      const triggerResponse: any = await requestAPI(
        `triggerDag?dag_id=${dagId}&composer=${composerSelectedList}&project_id=${project}&region_id=${region}`,
        { method: 'POST' }
      );

      // If a 'Bad Request' error is returned, perform the secondary API call
      if (
        triggerResponse?.error &&
        triggerResponse?.error.includes('Bad Request')
      ) {
        const jsonstr = triggerResponse?.error.slice(
          triggerResponse?.error.indexOf('{'),
          triggerResponse?.error.lastIndexOf('}') + 1
        );
        const errorObject = JSON.parse(jsonstr);

        if (errorObject?.status === HTTP_STATUS_BAD_REQUEST) {
          // const installedPackageList: any = await requestAPI(
          //   `checkRequiredPackages?composer_environment_name=${composerSelectedList}&region_id=${region}`
          // );
          // Return the response from the secondary API call to the handler
          return missingPackageList;
        }
      }

      // Check for success or different types of errors
      if (triggerResponse?.error) {
        if (triggerResponse.length > 0) {
          // This condition checks the response from checkRequiredPackages
          Notification.error(
            `Failed to trigger ${dagId} : required packages are not installed`,
            { autoClose: false }
          );
        } else {
          Notification.error(
            `Failed to trigger ${dagId} : ${triggerResponse?.error}`,
            {
              autoClose: false
            }
          );
        }
      } else {
        // Success case
        Notification.success(`${dagId} triggered successfully `, {
          autoClose: false
        });
      }

      // Otherwise, return the initial data
      return triggerResponse;
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        throw reason;
      }
      // Catch network or unexpected errors
      Notification.error(`Failed to trigger ${dagId} : ${reason}`, {
        autoClose: false
      });
    }
  };

  static readonly listComposersAPICheckService = async () => {
    try {
      const composerListResponse: any = await requestAPI('composerList');
      return composerListResponse;
    } catch (error) {
      return error;
    }
  };

  static readonly getComposerEnvApiService = async (
    composerEnvName: string | undefined
  ) => {
    try {
      const composerEnvResponse: any = await requestAPI(
        `getComposerEnvironment?env_name=${composerEnvName}`
      );
      return composerEnvResponse;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      return error;
    }
  };
}
