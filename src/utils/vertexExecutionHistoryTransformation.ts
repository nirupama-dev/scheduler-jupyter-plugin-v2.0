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

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import {
  IGroupedExecutionHistoryDates,
  IVertexScheduleRun
} from '../interfaces/VertexInterface';

export const vertexScheduleRunResponseTransformation = (
  vertexExecutionHistoryScheduleRunList: any
) => {
  if (
    !vertexExecutionHistoryScheduleRunList ||
    !Array.isArray(vertexExecutionHistoryScheduleRunList)
  ) {
    return {
      scheduleRuns: [],
      groupedDates: { grey: [], red: [], green: [], darkGreen: [] }
    };
  }

  const transformedScheduleRuns = vertexExecutionHistoryScheduleRunList.map(
    (scheduleRun: IVertexScheduleRun) => {
      const createTime = dayjs(scheduleRun.createTime);
      const updateTime = dayjs(scheduleRun.updateTime);
      const duration = dayjs.duration(updateTime.diff(createTime));

      const codeValue = scheduleRun.status?.code ?? '-';
      const statusMessage = scheduleRun.status?.message ?? '-';
      const jobState = scheduleRun.jobState.split('_')[2]?.toLowerCase() ?? '';

      return {
        scheduleRunId: scheduleRun.name.split('/').pop() ?? '',
        startDate: scheduleRun.createTime,
        endDate: scheduleRun.updateTime,
        gcsUrl: scheduleRun.gcsOutputUri,
        state: jobState,
        scheduleName: scheduleRun.displayName,
        createTime: createTime,
        date: createTime.toDate(),
        fileName: scheduleRun.gcsNotebookSource.uri.split('/').pop() ?? '',
        time: `${duration.minutes()} min ${duration.seconds()} sec`,
        code: jobState === 'failed' ? codeValue : '-',
        statusMessage: jobState === 'failed' ? statusMessage : '-'
      };
    }
  );

  const groupedData: Record<
    string,
    Record<string, any[]>
  > = transformedScheduleRuns.reduce((acc: any, item) => {
    const dateKey = dayjs(item.date).format('YYYY-MM-DD');
    const status = item.state;

    if (!acc[dateKey]) {
      acc[dateKey] = {};
    }
    if (!acc[dateKey][status]) {
      acc[dateKey][status] = [];
    }
    acc[dateKey][status].push(item);
    return acc;
  }, {});

  const groupedDates: IGroupedExecutionHistoryDates = {
    grey: [],
    red: [],
    green: [],
    darkGreen: []
  };

  Object.entries(groupedData).forEach(([date, statuses]) => {
    const anyPending =
      statuses.running?.length ||
      statuses.queued?.length ||
      statuses.pending?.length ||
      statuses.unspecified?.length ||
      statuses.paused?.length ||
      statuses.updating?.length;
    const anyFailed =
      statuses.failed?.length ||
      statuses.cancelled?.length ||
      statuses.expired?.length ||
      statuses.partially?.length;
    const anySucceeded = statuses.succeeded;

    if (anyPending) {
      groupedDates.grey.push(date);
    } else if (anyFailed) {
      groupedDates.red.push(date);
    } else if (anySucceeded?.length === 1) {
      groupedDates.green.push(date);
    } else if (anySucceeded) {
      groupedDates.darkGreen.push(date);
    }
  });

  return {
    scheduleRuns: transformedScheduleRuns,
    groupedDates
  };
};
