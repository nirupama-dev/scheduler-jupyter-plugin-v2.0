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
import { useCallback, useEffect, useReducer } from 'react';
import { VertexServices } from '../services/vertex/VertexServices';

const executionHistoryReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PROJECT_ID':
      return { ...state, projectId: action.payload };
    case 'SET_CALENDAR_DATES':
      return {
        ...state,
        greyListDates: action.payload.grey,
        redListDates: action.payload.red,
        greenListDates: action.payload.green,
        darkGreenListDates: action.payload.darkGreen
      };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_MONTH': {
      const resolvedMonth = action.payload;
      return {
        ...state,
        selectedMonth: resolvedMonth,
        selectedDate:
          resolvedMonth.month() !== dayjs().month() ? null : dayjs(),
        scheduleId: '',
        vertexScheduleRunsList: []
      };
    }
    case 'SET_SCHEDULE_RUN_DATA':
      return { ...state, scheduleRunsData: action.payload };
    case 'SET_SCHEDULE_RUN_ID':
      return { ...state, scheduleId: action.payload };
    case 'SET_VERTEX_RUNS':
      return { ...state, vertexScheduleRunsList: action.payload };
    case 'SET_CREATED_TIME':
      return { ...state, createTime: action.payload };
    default:
      return state;
  }
};

const initialState = {
  scheduleId: '',
  vertexScheduleRunsList: [],
  scheduleRunsData: undefined,
  selectedMonth: dayjs(),
  selectedDate: dayjs(),
  isLoading: false,
  greyListDates: [],
  redListDates: [],
  greenListDates: [],
  darkGreenListDates: [],
  projectId: '',
  createTime: ''
};

export const useExecutionHistory = (
  scheduleId: string,
  region: string,
  abortControllers: any
) => {
  const [state, dispatch] = useReducer(executionHistoryReducer, initialState);
  const selectedMonth = state.selectedMonth;

  const scheduleRunsList = async () => {
    const executionPayload = {
      region,
      scheduleId,
      selectedMonth,
      abortControllers
    };
    dispatch({ type: 'SET_LOADING', payload: true });
    const executionData =
      await VertexServices.executionHistoryServiceList(executionPayload);
    if (executionData) {
      dispatch({ type: 'SET_LOADING', payload: false });

      dispatch({
        type: 'SET_CALENDAR_DATES',
        payload: executionData.groupedDates
      });

      dispatch({
        type: 'SET_VERTEX_RUNS',
        payload: executionData.scheduleRuns
      });

      dispatch({
        type: 'SET_CREATED_TIME',
        payload:
          executionData.scheduleRuns.length > 0
            ? executionData.scheduleRuns[executionData.scheduleRuns.length - 1]
                .createTime
            : ''
      });
    }
  };

  useEffect(() => {
    if (region && scheduleId) {
      scheduleRunsList();
    }
  }, [region, scheduleId, selectedMonth]);

  useEffect(() => {
    if (scheduleId) {
      dispatch({ type: 'SET_SCHEDULE_RUN_ID', payload: scheduleId });
    }
  }, [scheduleId]);

  useEffect(() => {
    dispatch({
      type: 'SET_SELECTED_DATE',
      payload: dayjs(new Date().toLocaleDateString())
    });
  }, []);

  const handleDateSelection = useCallback(
    (selectedDate: string) =>
      dispatch({ type: 'SET_SELECTED_DATE', payload: selectedDate }),
    [dispatch]
  );

  const handleMonthChange = useCallback(
    (selectedMonth: dayjs.Dayjs | ((date: dayjs.Dayjs) => dayjs.Dayjs)) => {
      const resolvedMonth =
        typeof selectedMonth === 'function'
          ? selectedMonth(dayjs())
          : selectedMonth;
      if (resolvedMonth) {
        dispatch({ type: 'SET_MONTH', payload: resolvedMonth });
      }
    },
    [dispatch]
  );

  const handleLogs = useCallback(() => {
    if (!state.scheduleId) {
      return;
    }
    const logExplorerUrl = new URL(
      'https://console.cloud.google.com/logs/query'
    );
    logExplorerUrl.searchParams.set('query', `SEARCH("${state.scheduleId}")`);
    if (state.scheduleRunsData?.startDate) {
      logExplorerUrl.searchParams.set(
        'cursorTimestamp',
        state.scheduleRunsData.startDate
      );
    }
    logExplorerUrl.searchParams.set('project', state.projectId);
    window.open(logExplorerUrl.toString(), '_blank');
  }, [state.scheduleId, state.scheduleRunsData, state.projectId]);

  return {
    ...state,
    handleDateSelection,
    handleMonthChange,
    handleLogs,
    dispatch
  };
};
