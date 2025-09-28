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
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { ComposerServices } from '../services/composer/ComposerServices';
import { handleDebounce } from '../utils/Config';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { AuthenticationError } from '../exceptions/AuthenticationException';
import { handleOpenLoginWidget } from '../components/common/login/Config';

const executionHistoryReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
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
    case 'SET_DAG_RUNS_LIST':
      return { ...state, dagRunsList: action.payload };
    case 'SET_HEIGHT':
      return { ...state, height: action.payload };
    case 'SET_DAG_RUN_ID':
      return { ...state, dagRunId: action.payload };
    case 'SET_TASK_INSTANCE_LOADING':
      return { ...state, isTaskInstanceLoading: action.payload };
    case 'SET_DAG_TASK_INSTANCES':
      return { ...state, dagRunTaskInstancesList: action.payload };
    case 'SET_DAG_TASK_LOGS':
      return { ...state, dagRunTaskLogs: action.payload };
    case 'SET_TASK_LOGS_LOADING':
      return { ...state, isTaskLogsLoading: action.payload };
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
  height: window.innerHeight - 145,
  dagRunTaskInstancesList: [],
  isTaskInstanceLoading: false,
  dagRunTaskLogs: '',
  isTaskLogsLoading: false
};

export const useComposerExecutionHistory = (
  dagId: string,
  projectId: string,
  region: string,
  composerEnv: string,
  app: JupyterFrontEnd,
  abortControllers: any
) => {
  const [state, dispatch] = useReducer(executionHistoryReducer, initialState);
  const { startDate, endDate, dagRunsList, selectedDate, dagRunId } = state;
  const previousDagRunIdRef = useRef<string>('');

  const handleUpdateHeight = () => {
    const updateHeight = window.innerHeight - 145;
    dispatch({ type: 'SET_HEIGHT', payload: updateHeight });
  };

  const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

  useEffect(() => {
    window.addEventListener('resize', debouncedHandleUpdateHeight);
    return () => {
      window.removeEventListener('resize', debouncedHandleUpdateHeight);
    };
  }, []);

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
          dagId,
          startDate,
          endDate,
          projectId,
          region,
          offset: currentOffset,
          abortControllers
        });

        const allData = [...allDagRunsData, ...(data?.dag_runs ?? [])];

        if (allData.length < data?.total_entries) {
          return fetchDagRuns(allData.length, allData);
        }

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
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [composerEnv, dagId, startDate, endDate, projectId, region]
  );

  const fetchDagRunTaskInstances = useCallback(async () => {
    try {
      dispatch({ type: 'SET_TASK_INSTANCE_LOADING', payload: true });
      const listDagTaskInstances =
        await ComposerServices.listDagTaskInstancesListService(
          composerEnv,
          dagId,
          dagRunId,
          projectId,
          region,
          abortControllers
        );
      dispatch({
        type: 'SET_DAG_TASK_INSTANCES',
        payload: listDagTaskInstances
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }
    } finally {
      dispatch({ type: 'SET_TASK_INSTANCE_LOADING', payload: false });
    }
  }, [dagRunId]);

  const fetchDagRunTaskLogs = useCallback(
    async (dagTaskInstancesList: any, index: string, tryNumber: number) => {
      try {
        dispatch({ type: 'SET_TASK_LOGS_LOADING', payload: true });
        const logs = await ComposerServices.listDagTaskLogsListService(
          composerEnv,
          dagId,
          dagRunId,
          dagTaskInstancesList[index].taskId,
          tryNumber,
          projectId,
          region,
          abortControllers
        );
        dispatch({ type: 'SET_DAG_TASK_LOGS', payload: logs });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }
      } finally {
        dispatch({ type: 'SET_TASK_LOGS_LOADING', payload: false });
      }
    },
    [dagRunId]
  );

  useEffect(() => {
    if (region && dagId && startDate && endDate) {
      fetchDagRuns();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (region && dagId && dagRunId) {
      fetchDagRunTaskInstances();
    }
  }, [dagRunId]);

  useEffect(() => {
    dispatch({
      type: 'SET_SELECTED_DATE',
      payload: dayjs(new Date().toLocaleDateString())
    });

    const startOfMonth = dayjs().startOf('month').toISOString();
    const endOfMonth = dayjs().endOf('month').toISOString();
    dispatch({ type: 'SET_START_DATE', payload: startOfMonth });
    dispatch({ type: 'SET_END_DATE', payload: endOfMonth });
  }, [dispatch]);

  const filteredDagRunsList = dagRunsList.filter((dagRun: any) => {
    const currentDate = selectedDate
      ? new Date(selectedDate.toDate()).toDateString()
      : null;
    return dagRun.date === currentDate;
  });

  // Use a ref to prevent unnecessary dispatches
  useEffect(() => {
    const newDagRunId =
      filteredDagRunsList.length > 0
        ? filteredDagRunsList[filteredDagRunsList.length - 1].dagRunId
        : '';

    if (newDagRunId !== previousDagRunIdRef.current) {
      dispatch({ type: 'SET_DAG_RUN_ID', payload: newDagRunId });
    }
    previousDagRunIdRef.current = newDagRunId;
  }, [filteredDagRunsList, dispatch]);

  const handleDateSelection = useCallback(
    (newDate: Dayjs) => {
      dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
      // When a new date is selected, we clear the previous dagRunId to trigger a new fetch/render if needed.
      dispatch({ type: 'SET_DAG_RUN_ID', payload: '' });
    },
    [dispatch]
  );

  const handleMonthChange = useCallback(
    (newMonth: dayjs.Dayjs) => {
      const startOfMonth = newMonth.startOf('month').toISOString();
      const endOfMonth = newMonth.endOf('month').toISOString();
      dispatch({ type: 'SET_START_DATE', payload: startOfMonth });
      dispatch({ type: 'SET_END_DATE', payload: endOfMonth });
    },
    [dispatch]
  );

  const handleDagRunClick = useCallback(
    (id: string) => {
      dispatch({ type: 'SET_DAG_RUN_ID', payload: id });
    },
    [dispatch]
  );

  return {
    ...state,
    filteredDagRunsList,
    fetchDagRunTaskLogs,
    handleDateSelection,
    handleMonthChange,
    handleDagRunClick
  };
};
