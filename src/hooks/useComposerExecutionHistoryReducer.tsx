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

import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useReducer } from 'react';
import { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { ComposerServices } from '../services/composer/ComposerServices';
import { handleDebounce } from '../utils/Config';

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
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    case 'SET_END_DATE':
      return { ...state, endDate: action.payload };
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_DAG_RUNS_LIST':
      return { ...state, dagRunsList: action.payload };
    case 'SET_HEIGHT':
      return { ...state, height: action.payload };
    case 'SET_DAG_RUN_ID':
      return { ...state, dagRunId: action.payload };
    default:
      return state;
  }
};

const initialState = {
  currentDate: new Date().toLocaleDateString(),
  selectedDate: dayjs(),
  startDate: '',
  endDate: '',
  isLoading: false,
  greyListDates: [],
  redListDates: [],
  greenListDates: [],
  darkGreenListDates: [],
  projectId: '',
  dagRunsList: [],
  dagRunId: '',
  height: window.innerHeight - 145
};

export const useComposerExecutionHistory = (
  scheduleId: string,
  projectId: string,
  region: string,
  composerEnv: string
) => {
  const [state, dispatch] = useReducer(executionHistoryReducer, initialState);
  const { startDate, endDate, dagRunsList, selectedDate } = state;

  const handleUpdateHeight = useCallback(() => {
    const updateHeight = window.innerHeight - 145;
    dispatch({ type: 'SET_HEIGHT', payload: updateHeight });
  }, [dispatch]);

  const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

  useEffect(() => {
    handleUpdateHeight();
    window.addEventListener('resize', debouncedHandleUpdateHeight);

    return () => {
      window.removeEventListener('resize', debouncedHandleUpdateHeight);
    };
  }, [debouncedHandleUpdateHeight, handleUpdateHeight]);

  const fetchDagRuns = useCallback(
    async (
      currentOffset: number = 0,
      allDagRunsData: any[] = []
    ): Promise<void> => {
      if (currentOffset === 0) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      try {
        const data = await ComposerServices.listDagRunsListService({
          composerName: composerEnv,
          dagId: scheduleId,
          startDate,
          endDate,
          projectId,
          region,
          offset: currentOffset
        });

        // Combine existing and new data
        const allData = [...allDagRunsData, ...(data?.dag_runs ?? [])];

        // If there are more pages, recursively call this function again
        if (allData.length < data?.total_entries) {
          return fetchDagRuns(allData.length, allData);
        }

        // Data transformation and grouping (now in the hook)
        const transformedList = allData.map((dagRun: any) => ({
          dagRunId: dagRun.dag_run_id,
          filteredDate: new Date(dagRun.start_date),
          state: dagRun.state,
          date: new Date(dagRun.start_date).toDateString(),
          time: new Date(dagRun.start_date).toTimeString().split(' ')[0]
        }));

        const groupedDataByDateStatus = transformedList.reduce(
          (result: any, item: any) => {
            const date = item.filteredDate;
            const status = item.state;
            result[date] ??= {};
            result[date][status] ??= [];
            result[date][status].push(item);
            return result;
          },
          {}
        );

        const greyList: string[] = [];
        const redList: string[] = [];
        const greenList: string[] = [];
        const darkGreenList: string[] = [];

        Object.keys(groupedDataByDateStatus).forEach(dateValue => {
          if (
            groupedDataByDateStatus[dateValue].running ||
            groupedDataByDateStatus[dateValue].queued
          ) {
            greyList.push(dateValue);
          } else if (groupedDataByDateStatus[dateValue].failed) {
            redList.push(dateValue);
          } else if (
            groupedDataByDateStatus[dateValue].success &&
            groupedDataByDateStatus[dateValue].success.length === 1
          ) {
            greenList.push(dateValue);
          } else {
            // This condition implies multiple successful runs or a mix of states not
            // caught by the previous conditions.
            darkGreenList.push(dateValue);
          }
        });

        dispatch({
          type: 'SET_CALENDAR_DATES',
          payload: {
            grey: greyList,
            red: redList,
            green: greenList,
            darkGreen: darkGreenList
          }
        });
        dispatch({ type: 'SET_DAG_RUNS_LIST', payload: transformedList });
        if (transformedList.length > 0) {
          const lastRunId =
            transformedList[transformedList.length - 1].dagRunId;
          dispatch({ type: 'SET_DAG_RUN_ID', payload: lastRunId });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [composerEnv, scheduleId, startDate, endDate, projectId, region]
  );

  useEffect(() => {
    if (region && scheduleId && startDate && endDate) {
      fetchDagRuns();
    }
  }, [region, scheduleId, startDate, endDate, fetchDagRuns]);

  useEffect(() => {
    dispatch({
      type: 'SET_SELECTED_DATE',
      payload: dayjs(new Date().toLocaleDateString())
    });

    const props = {} as PickersDayProps<Dayjs>;
    const { day, isFirstVisibleCell, isLastVisibleCell } = props;
    if (isFirstVisibleCell) {
      dispatch({
        type: 'SET_START_DATE',
        payload: new Date(day.toDate()).toISOString()
      });
    }
    if (isLastVisibleCell) {
      dispatch({ type: 'SET_END_DATE', payload: day.toDate().toISOString() });
    }
  }, []);

  const filteredDagRunsList = dagRunsList.filter((dagRun: any) => {
    const currentDate = selectedDate
      ? new Date(selectedDate.toDate()).toDateString()
      : null;
    return dagRun.date === currentDate;
  });

  const handleDateSelection = useCallback(
    (selectedDate: Dayjs | string) => {
      // Set the selected date
      dispatch({ type: 'SET_SELECTED_DATE', payload: selectedDate });

      const currentDate = dayjs(selectedDate).toDate().toDateString();
      const filteredList = dagRunsList.filter(
        (dagRun: any) => dagRun.date === currentDate
      );
      if (filteredList.length > 0) {
        const lastRunId = filteredList[filteredList.length - 1].dagRunId;
        dispatch({ type: 'SET_DAG_RUN_ID', payload: lastRunId });
      } else {
        dispatch({ type: 'SET_DAG_RUN_ID', payload: '' });
      }
    },
    [dispatch, dagRunsList]
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

  const handleDagRunClick = useCallback(
    (id: string) => {
      dispatch({ type: 'SET_DAG_RUN_ID', payload: id });
    },
    [dispatch]
  );

  return {
    ...state,
    filteredDagRunsList,
    handleDateSelection,
    handleMonthChange,
    handleLogs,
    handleDagRunClick,
    dispatch
  };
};
