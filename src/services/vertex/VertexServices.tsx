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
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
import { requestAPI } from '../../handler/Handler';
import {
  IFormattedResponse,
  IUpdateSchedulerAPIResponse,
  IUpdateSchedulerArgs
} from '../../interfaces/VertexInterface';
import { ABORT_MESSAGE } from '../../utils/Constants';
import { LOG_LEVEL, SchedulerLoggingService } from '../common/LoggingService';

export class VertexServices {
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
