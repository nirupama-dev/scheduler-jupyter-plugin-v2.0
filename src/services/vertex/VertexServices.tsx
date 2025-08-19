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
  IFormattedResponse,
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
import { settingController } from '../../utils/Config';
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
      const formattedResponse: any = await requestAPI(
        `api/vertex/uiConfig?region_id=${region}`
      );

      if (
        formattedResponse &&
        Array.isArray(formattedResponse) &&
        formattedResponse.length > 0
      ) {
        const response: IMachineType[] = formattedResponse.map(
          uiConfigAPIResponseTransform
        );
        return response; // Return the data
      } else if (formattedResponse?.error) {
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
        const errorResponse = `Error fetching machine type list: ${formattedResponse.error}`;
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
    const { region, nextToken, scheduleListPageLength, abortControllers } =
      listVertexPayload;

    try {
      const signal = settingController(abortControllers);
      const serviceURL = 'api/vertex/listSchedules';
      let urlparam = `?region_id=${region}&page_size=${scheduleListPageLength}`;

      if (nextToken) {
        urlparam += `&page_token=${nextToken}`;
      }

      // API call
      const formattedResponse = await requestAPI(serviceURL + urlparam, {
        signal
      });

      if (!formattedResponse || Object.keys(formattedResponse).length === 0) {
        return {
          schedulesList: [],
          nextPageToken: null,
          hasNextPageToken: false,
          error: '',
          isLoading: false
        };
        // setNextPageToken(null);
        // setHasNextPageToken(false);
        // return {
        //   schedulesList: [],
        //   error: '',
        //   isLoading: false
        // };
      }

      const {
        schedules,
        nextPageToken
        //error
      } = formattedResponse as IFormattedResponse;

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
          error: 'No schedules found'
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
        // Handle errors during the API call
        // setVertexScheduleList([]);
        // setNextPageToken(null);
        // setHasNextPageToken(false);
        // setIsApiError(true);
        // setApiError('An error occurred while fetching schedules.');
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
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (Object.keys(formattedResponse).length === 0) {
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
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (Object.keys(formattedResponse).length === 0) {
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
      const data: ITriggerSchedule = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        {
          method: 'POST',
          signal
        }
      );
      if (data.name) {
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
