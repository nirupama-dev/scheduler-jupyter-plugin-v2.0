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
  IFormattedResponse,
  IUpdateSchedulerAPIResponse,
  IUpdateSchedulerArgs
} from '../../interfaces/VertexInterface';
import { ABORT_MESSAGE } from '../../utils/Constants';
import { LOG_LEVEL, SchedulerLoggingService } from '../common/LoggingService';
import { toast } from 'react-toastify';
import {
  IAcceleratorConfig,
  IMachineType
} from '../../interfaces/VertexInterface';
// import { HTTP_STATUS_FORBIDDEN, URL_LINK_PATTERN } from "../../utils/Constants";
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';

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
    region: string,
    pageLength: number = 25
    //TODO: other api error
  ) => {
    try {
      //TODO implement abort logic and next page logic

      const serviceURL = 'api/vertex/listSchedules';
      let urlparam = `?region_id=${region}&page_size=${pageLength}`;

      // API call
      const formattedResponse = await requestAPI(
        serviceURL + urlparam
        //     , {
        //   signal
        // }
      );

      if (!formattedResponse || Object.keys(formattedResponse).length === 0) {
        // setVertexScheduleList([]);
        // setNextPageToken(null);
        // setHasNextPageToken(false);
        return {
          schedulesList: [],
          error: '',
          isLoading: false
        };
      }

      const {
        schedules
        //nextPageToken,
        //error
      } = formattedResponse as IFormattedResponse;

      if (schedules && schedules.length > 0) {
        return {
          schedulesList: schedules,
          error: '',
          isLoading: false
        };
      } else {
        return {
          schedulesList: [],
          error: 'No schedules found',
          isLoading: false
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
          error: 'An error occurrd while fetching schedules.',
          isLoading: false
        };
      }
    } finally {
      // setIsLoading(false); // Ensure loading is stopped
    }
  };

  static readonly fetchLastFiveRunStatus = (schedule: any, region: string) => {
    // TODO add abort call
    const scheduleId = schedule.name.split('/').pop();
    const serviceURLLastRunResponse = 'api/vertex/listNotebookExecutionJobs';
    let res: any = [];
    requestAPI(
      serviceURLLastRunResponse +
        `?region_id=${region}&schedule_id=${scheduleId}&page_size=5&order_by=createTime desc`
      //   { signal }
    )
      .then((jobExecutionList: any) => {
        console.log('jobExecutionlist from sevice', jobExecutionList);
        const lastFiveRun = jobExecutionList.map((job: any) => job.jobState);
        schedule.jobState = lastFiveRun;
        console.log('lastFiveRn from service', lastFiveRun);
        res = lastFiveRun;
      })
      .catch((lastRunError: any) => {
        SchedulerLoggingService.log(
          'Error fetching last five job executions',
          LOG_LEVEL.ERROR
        );

        res = [];
      });
    console.log('res from services', res);
    return res;
  };

  static readonly handleUpdateSchedulerPauseAPIService = async (
    args: IUpdateSchedulerArgs
  ) => {
    // setResumeLoading(scheduleId);

    // // setting controller to abort pending api call
    // const controller = new AbortController();
    // abortControllers.current.push(controller);
    // const signal = controller.signal;
    const { scheduleId, region, displayName } = args;

    try {
      const serviceURL = 'api/vertex/pauseSchedule';
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&&schedule_id=${scheduleId}`,
        {
          method: 'POST'
          //   signal
        }
      );
      if (Object.keys(formattedResponse).length === 0) {
        Notification.success(`Schedule ${displayName} updated successfully`, {
          autoClose: false
        });
        // setResumeLoading('');
      } else {
        // setResumeLoading('');
        SchedulerLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
        Notification.error('Failed to pause schedule', {
          autoClose: false
        });
      }
    } catch (error) {
      //   setResumeLoading('');
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
    args: IUpdateSchedulerArgs
    // setResumeLoading: (value: string) => void,
    // abortControllers: any
  ) => {
    // setResumeLoading(scheduleId);

    // setting controller to abort pending api call
    // const controller = new AbortController();
    // abortControllers.current.push(controller);
    // const signal = controller.signal;
    const { scheduleId, region, displayName } = args;

    try {
      const serviceURL = 'api/vertex/resumeSchedule';
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        {
          method: 'POST'
          //   signal
        }
      );
      if (Object.keys(formattedResponse).length === 0) {
        Notification.success(`Schedule ${displayName} updated successfully`, {
          autoClose: false
        });
        // setResumeLoading('');
      } else {
        // setResumeLoading('');
        SchedulerLoggingService.log(
          'Error in resume schedule',
          LOG_LEVEL.ERROR
        );
        Notification.error('Failed to resume schedule', {
          autoClose: false
        });
      }
    } catch (error) {
      //   setResumeLoading('');
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
