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

import { Notification } from '@jupyterlab/apputils';
import { requestAPI } from '../../handler/Handler';
import {
  IDeleteSchedulerAPIResponse,
  IDownloadFile,
  IExecutionPayload,
  IFormattedResponse,
  IOutputFileExistsPayload,
  ITriggerSchedule,
  IUpdateSchedulerAPIResponse,
  IUpdateSchedulerArgs,
  IVertexDeleteAPIArgs,
  IVertexListPayload
} from '../../interfaces/VertexInterface';
import { ABORT_MESSAGE } from '../../utils/Constants';
import { LOG_LEVEL, SchedulerLoggingService } from '../common/LoggingService';
import { toast } from 'react-toastify';
import {
  IAcceleratorConfig,
  IMachineType
} from '../../interfaces/VertexInterface';
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
import { aiplatform_v1 } from 'googleapis';

import { settingController } from '../../utils/Config';
import { vertexScheduleRunResponseTransformation } from '../../utils/vertexExecutionHistoryTransformation';
import path from 'path';
export class VertexServices {
  /**
   * Fetches machine types for a given region.
   * This service now returns the fetched data and handles its own error notifications.
   * @param region The region to fetch machine types for.
   * @returns A Promise that resolves with an array of `IMachineType` objects on success,
   * or an empty array if no data or an error occurred.
   * Error messages/toasts are handled internally by this service.
   */
  static async machineTypeAPIService(region: string): Promise<IMachineType[]> {
    try {
      const uiConfigResponse: any = await requestAPI(
        `api/vertex/uiConfig?region_id=${region}`
      );

      if (
        uiConfigResponse &&
        Array.isArray(uiConfigResponse) &&
        uiConfigResponse.length > 0
      ) {
        const response: IMachineType[] = uiConfigResponse.map(
          uiConfigAPIResponseTransform
        );
        return response; // Return the data
      } else if (uiConfigResponse?.error) {
        // Check for `error` property in the response
        // try {
        //   if (formattedResponse.error.code === HTTP_STATUS_FORBIDDEN) {
        //     const url = formattedResponse.error.message.match(URL_LINK_PATTERN);

        //     if (url && url.length > 0) {
        //       // setIsApiError(true);
        //       // setApiError(formattedResponse.error.message);
        //       // setApiEnableUrl(url);
        //     } else {
        //       // setApiError(formattedResponse.error.message);
        //     }

        //   }
        // } catch (error: any) {
        const errorResponse = `Error fetching machine type list: ${uiConfigResponse.error}`;
        toast.error(errorResponse, { autoClose: false }); // Throw toast from service
      }
      return [];
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error listing machine type list: ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch machine type list: ${error}`;
      handleErrorToast({ error: errorResponse }); // Throw toast from service
      return []; // Return empty array on caught exception
    }
  }

  /**
   * Lists Vertex schedules for a given region.
   * This service now returns the fetched data and handles its own error notifications.
   * @param region The region to fetch schedules for.
   * @param pageLength The number of schedules to fetch per page.
   * @returns A Promise that resolves with an object containing the list of schedules,
   * an error message, and a loading state.
   */
  static readonly listVertexSchedules = async (
    listVertexPayload: IVertexListPayload
    //TODO: other api error
  ) => {
    const { region, nextToken, scheduleListPageLength, abortControllers, app } =
      listVertexPayload;

    try {
      const signal = settingController(abortControllers);
      const serviceURL = 'api/vertex/listSchedules';
      let urlparam = `?region_id=${region}&page_size=${scheduleListPageLength}`;

      if (nextToken) {
        urlparam += `&page_token=${nextToken}`;
      }

      // API call
      const listSchedulesResponse: aiplatform_v1.Schema$GoogleCloudAiplatformV1ListSchedulesResponse =
        await requestAPI(serviceURL + urlparam, {
          signal
        });

      if (
        !listSchedulesResponse ||
        Object.keys(listSchedulesResponse).length === 0
      ) {
        return {
          schedulesList: [],
          nextPageToken: null,
          hasNextPageToken: false,
          error: '',
          isLoading: false
        };
      }

      const {
        schedules,
        nextPageToken
        //error
      } = listSchedulesResponse as IFormattedResponse;

      //TODO error handling for API enablement error

      if (schedules && schedules.length > 0) {
        return {
          schedulesList: schedules,
          nextPageToken: nextPageToken ? nextPageToken : null,
          error: '',
          isLoading: false
        };
      } else {
        return {
          schedulesList: [],
          nextPageToken: null,
          hasNextPageToken: false,
          error: formattedResponse
        };
      }
    } catch (error: any) {
      if (typeof error === 'object' && error !== null) {
        if (
          error instanceof TypeError &&
          error.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        SchedulerLoggingService.log(
          `Error listing vertex schedules ${error}`,
          LOG_LEVEL.ERROR
        );
        handleErrorToast({
          error: error
        });

        return {
          schedulesList: [],
          nextPageToken: null,
          hasNextPageToken: false,
          error: 'An error occurred while fetching schedules: ' + error
        };
      }
    }
  };

  static readonly fetchLastFiveRunStatus = async (
    schedule: any,
    region: string,
    abortControllers: any
  ) => {
    try {
      const signal = settingController(abortControllers);
      const scheduleId = schedule.name.split('/').pop();
      const serviceURLLastRunResponse = 'api/vertex/listNotebookExecutionJobs';
      const jobExecutionList: any = await requestAPI(
        serviceURLLastRunResponse +
          `?region_id=${region}&schedule_id=${scheduleId}&page_size=5&order_by=createTime desc`,
        { signal }
      );
      // jobExecutionList should be an array
      const lastFiveRun = Array.isArray(jobExecutionList)
        ? jobExecutionList.map((job: any) => job.jobState)
        : [];
      return lastFiveRun;
    } catch (lastRunError: any) {
      SchedulerLoggingService.log(
        'Error fetching last five job executions',
        LOG_LEVEL.ERROR
      );
      return [];
    }
  };

  static readonly handleUpdateSchedulerPauseAPIService = async (
    activatePayload: IUpdateSchedulerArgs
  ) => {
    const { scheduleId, region, displayName, abortControllers } =
      activatePayload;

    try {
      const signal = settingController(abortControllers);
      const serviceURL = 'api/vertex/pauseSchedule';
      const pauseResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (Object.keys(pauseResponse).length === 0) {
        Notification.success(`Schedule ${displayName} updated successfully`, {
          autoClose: false
        });
      } else {
        SchedulerLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
        Notification.error('Failed to pause schedule', {
          autoClose: false
        });
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null) {
        if (
          error instanceof TypeError &&
          error.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        SchedulerLoggingService.log(
          `Error in pause schedule ${error}`,
          LOG_LEVEL.ERROR
        );
        const errorResponse = `Failed to pause schedule : ${error}`;
        handleErrorToast({
          error: errorResponse
        });
      }
    }
  };

  static readonly handleUpdateSchedulerResumeAPIService = async (
    activatePayload: IUpdateSchedulerArgs
  ) => {
    const { scheduleId, region, displayName, abortControllers } =
      activatePayload;

    try {
      const signal = settingController(abortControllers);
      const serviceURL = 'api/vertex/resumeSchedule';
      const resumeResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (Object.keys(resumeResponse).length === 0) {
        Notification.success(`Schedule ${displayName} updated successfully`, {
          autoClose: false
        });
      } else {
        SchedulerLoggingService.log(
          'Error in resume schedule',
          LOG_LEVEL.ERROR
        );
        Notification.error('Failed to resume schedule', {
          autoClose: false
        });
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null) {
        if (
          error instanceof TypeError &&
          error.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        SchedulerLoggingService.log(
          `Error in resume schedule ${error}`,
          LOG_LEVEL.ERROR
        );
        const errorResponse = `Failed to resume schedule : ${error}`;
        handleErrorToast({
          error: errorResponse
        });
      }
    }
  };

  static readonly triggerSchedule = async (
    triggerPayload: IUpdateSchedulerArgs
  ) => {
    const { scheduleId, region, displayName, abortControllers } =
      triggerPayload;

    try {
      const signal = settingController(abortControllers);
      const serviceURL = 'api/vertex/triggerSchedule';
      const triggerResponse: ITriggerSchedule = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (triggerResponse.name) {
        Notification.success(`${displayName} triggered successfully `, {
          autoClose: false
        });
      } else {
        Notification.error(`Failed to Trigger ${displayName}`, {
          autoClose: false
        });
      }
    } catch (reason) {
      if (typeof reason === 'object' && reason !== null) {
        if (
          reason instanceof TypeError &&
          reason.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        SchedulerLoggingService.log(
          `Error in Trigger schedule ${reason}`,
          LOG_LEVEL.ERROR
        );
        const errorResponse = `Failed to Trigger schedule : ${reason}`;
        handleErrorToast({
          error: errorResponse
        });
      }
    }
  };

  static readonly handleDeleteSchedulerAPIService = async (
    deletePayload: IVertexDeleteAPIArgs
  ) => {
    const {
      region,
      uniqueScheduleId,
      scheduleDisplayName,
      listVertexScheduleInfoAPI
    } = deletePayload;
    try {
      const serviceURL = 'api/vertex/deleteSchedule';
      const deleteResponse: IDeleteSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${uniqueScheduleId}`,
        { method: 'DELETE' }
      );

      if (deleteResponse && deleteResponse.done) {
        listVertexScheduleInfoAPI(null); // Refresh the list after deletion
        Notification.success(
          `Deleted job ${deletePayload.scheduleDisplayName}. It might take a few minutes for the job to be deleted from the list of jobs.`,
          {
            autoClose: false
          }
        );
      } else {
        Notification.error(
          `Failed to delete the ${deletePayload.scheduleDisplayName}`,
          {
            autoClose: false
          }
        );
      }
      // return deleteResponse;
    } catch (error) {
      SchedulerLoggingService.log(
        `Error in Delete api ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to delete the ${scheduleDisplayName} : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly executionHistoryServiceList = async (
    executionPayload: IExecutionPayload
  ) => {
    const { region, scheduleId, selectedMonth, abortControllers } =
      executionPayload;
    if (!scheduleId || !selectedMonth) {
      return null;
    }

    try {
      const signal = settingController(abortControllers);
      const selected_month = selectedMonth.format('YYYY-MM-DDTHH:mm:ssZ[Z]');
      const schedule_id = scheduleId.split('/').pop();
      const serviceURL = 'api/vertex/listNotebookExecutionJobs';

      const vertexExecutionHistoryScheduleRunList = await requestAPI(
        `${serviceURL}?region_id=${region}&schedule_id=${schedule_id}&start_date=${selected_month}&order_by=createTime desc`,
        { signal }
      );

      const executionHistoryScheduleData =
        vertexScheduleRunResponseTransformation(
          vertexExecutionHistoryScheduleRunList
        );
      return executionHistoryScheduleData;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        error instanceof TypeError &&
        error.toString().includes(ABORT_MESSAGE)
      ) {
        return null; // Return null on abort
      } else {
        SchedulerLoggingService.log(
          `Error in execution history API: ${error}`,
          LOG_LEVEL.ERROR
        );
        handleErrorToast({
          error: `Error in fetching the execution history: ${error}`
        });
        return {
          scheduleRuns: [],
          groupedDates: { grey: [], red: [], green: [], darkGreen: [] }
        };
      }
    }
  };

  //Funtion to check weather output file exists or not
  static readonly outputFileExists = async (
    outputFileExistsPayload: IOutputFileExistsPayload
  ) => {
    try {
      const { bucketName, scheduleRunId, fileName, abortControllers } =
        outputFileExistsPayload;
      const signal = settingController(abortControllers);
      const outputFileExists = await requestAPI(
        `api/storage/outputFileExists?bucket_name=${bucketName}&job_run_id=${scheduleRunId}&file_name=${fileName}`,
        { signal }
      );
      if (outputFileExists === 'true') {
        return true;
      } else {
        return true;
      }
    } catch (lastRunError: any) {
      if (typeof lastRunError === 'object' && lastRunError !== null) {
        if (
          lastRunError instanceof TypeError &&
          lastRunError.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        SchedulerLoggingService.log(
          `Error checking output file ${lastRunError}`,
          LOG_LEVEL.ERROR
        );
      }
    }
  };

  static readonly downloadJobAPIService = async (
    downloadPayload: IDownloadFile
  ) => {
    try {
      const { gcsUrl, fileName, scheduleRunId, scheduleName } = downloadPayload;
      const bucketName = gcsUrl?.split('//')[1];
      const downloadOutputResponse: any = await requestAPI(
        `api/storage/downloadOutput?bucket_name=${bucketName}&job_run_id=${scheduleRunId}&file_name=${fileName}`,
        {
          method: 'POST'
        }
      );
      if (downloadOutputResponse.status === 0) {
        const base_filename = path.basename(
          downloadOutputResponse.downloaded_filename
        );
        Notification.success(
          `${base_filename} has been successfully downloaded from the ${scheduleName} job history`,
          {
            autoClose: false
          }
        );
      } else {
        SchedulerLoggingService.log(
          'Error in downloading the job history',
          LOG_LEVEL.ERROR
        );
        Notification.error('Error in downloading the job history', {
          autoClose: false
        });
      }
    } catch (error) {
      SchedulerLoggingService.log(
        'Error in downloading the job history',
        LOG_LEVEL.ERROR
      );
      Notification.error('Error in downloading the job history', {
        autoClose: false
      });
    }
  };

  static readonly getVertexJobScheduleDetails = async (
    jobId: string,
    region: string | undefined
  ) => {
    if (region) {
      try {
        const serviceURL = 'api/vertex/getSchedule';
        const vertexScheduleData: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule =
          await requestAPI(
            serviceURL + `?region_id=${region}&schedule_id=${jobId}`
          );

        if (vertexScheduleData && Object.keys(vertexScheduleData).length > 0) {
          return vertexScheduleData;
        } else {
          Notification.error('Error fetching schedule details', {
            autoClose: false
          });
          return;
        }
      } catch (reason) {
        if (typeof reason === 'object' && reason !== null) {
          if (
            reason instanceof TypeError &&
            reason.toString().includes(ABORT_MESSAGE)
          ) {
            return;
          }
        } else {
          SchedulerLoggingService.log(
            `Error in update api ${reason}`,
            LOG_LEVEL.ERROR
          );
          const errorResponse = `Error in updating notebook. ${reason}`;

          Notification.error(
            `Error fetching schedule details: ${errorResponse}`,
            {
              autoClose: false
            }
          );
          return;
        }
      }
    } else {
      Notification.error(
        'Error fetching schedule details. No region information available.',
        {
          autoClose: false
        }
      );
      return;
    }
  };

  /**
   * Create a Vertex Scheduler
   * @param vertexSchedulePayload - The payload containing the scheduler details
   * @param setCreateCompleted - Callback to set the create completed state
   * @param setCreatingVertexScheduler - Callback to set the creating vertex scheduler state
   * @param setCreateMode - Callback to set the create mode state
   */
  static readonly createVertexNotebookJobSchedule = async (
    vertexSchedulePayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule,
    region: string
  ) => {
    try {
      const createResponse: any = await requestAPI(
        `api/vertex/createJobScheduler?region_id=${region}`,
        {
          body: JSON.stringify(vertexSchedulePayload),
          method: 'POST'
        }
      );
      if (createResponse.error) {
        handleErrorToast({
          error: createResponse.error
        });
        return false;
      } else {
        Notification.success(
          `Job ${vertexSchedulePayload.displayName} successfully created`,
          {
            autoClose: false
          }
        );
        return true;
      }
    } catch (reason: any) {
      SchedulerLoggingService.log(
        `Error creating schedule: ${reason}`,
        LOG_LEVEL.ERROR
      );
      handleErrorToast({
        error: reason
      });
      return false;
    }
  };

  /**
   * Update a Vertex Job Scheduler
   * @param jobId - The ID of the job to edit
   * @param region - The region of the job
   * @param updatedVertexScheduleData - The updated job details
   * @param setCreateCompleted - Callback to set the create completed state
   * @param setCreatingVertexScheduler - Callback to set the creating vertex scheduler state
   * @param gcsPath - The GCS path for the notebook
   * @param setEditMode - Callback to set the edit mode state
   * @param setCreateMode - Callback to set the create mode state
   */
  static readonly updateVertexNotebookJobSchedule = async (
    jobId: string,
    region: string,
    updatedVertexScheduleData: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule
  ) => {
    try {
      const updateResponse: any = await requestAPI(
        `api/vertex/updateSchedule?region_id=${region}&schedule_id=${jobId}`,
        {
          body: JSON.stringify(updatedVertexScheduleData),
          method: 'POST'
        }
      );
      if (updateResponse.error) {
        handleErrorToast({
          error: updateResponse.error
        });
        return false;
      } else {
        Notification.success(
          `Job ${updatedVertexScheduleData.displayName} successfully updated`,
          {
            autoClose: false
          }
        );
        return true;
      }
    } catch (reason: any) {
      console.error(`Error updating schedule: ${reason}`);
      SchedulerLoggingService.log(
        `Error updating schedule: ${reason}`,
        LOG_LEVEL.ERROR
      );
      handleErrorToast({
        error: `Error updating schedule: ${reason}`
      });
      return false;
    }
  };
}

// Helper to transform raw API response into IMachineType structure
const uiConfigAPIResponseTransform = (rawItem: any): IMachineType => {
  const transformedAccelerators: IAcceleratorConfig[] = [];
  if (rawItem.acceleratorConfigs && Array.isArray(rawItem.acceleratorConfigs)) {
    for (const config of rawItem.acceleratorConfigs) {
      transformedAccelerators.push({
        acceleratorType: {
          label: config.acceleratorType,
          value: config.acceleratorType
        },
        allowedCounts: config.allowedCounts.map((count: number) => ({
          label: String(count),
          value: count
        }))
      });
    }
  }

  return {
    machineType: {
      label: rawItem.machineType,
      value: rawItem.machineType
    },
    acceleratorConfigs:
      transformedAccelerators.length > 0 ? transformedAccelerators : null
  };
};
