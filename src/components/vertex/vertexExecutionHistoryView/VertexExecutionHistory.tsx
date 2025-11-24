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

import React, { useCallback, useEffect, useState } from 'react';
import ExecutionHistoryHeader from './VertexExecutionHistoryHeader';
import { Box, LinearProgress } from '@mui/material';
import { useExecutionHistory } from '../../../hooks/useVertexExecutionHistoryReducer';
import ExecutionCalendar from '../../common/dateCalendar/DateCalendar';
import VertexScheduleRuns from '../vertexExecutionHistoryView/VertexScheduleRuns';
import { VertexServices } from '../../../services/vertex/VertexServices';
import { IScheduleRun } from '../../../interfaces/VertexInterface';
import { useLocation, useNavigate } from 'react-router-dom';
import { abortApiCall } from '../../../utils/Config';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { handleOpenLoginWidget } from '../../common/login/Config';
import { SCHEDULE_LABEL_VERTEX } from '../../../utils/Constants';
import dayjs from 'dayjs';

const VertexExecutionHistory = ({
  abortControllers,
  app
}: {
  abortControllers: any;
  app: JupyterFrontEnd;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scheduleId, region, scheduleName, createTime } = location.state;
  const currentDate = dayjs(new Date().toLocaleDateString());
  const [fileExists, setFileExists] = useState<object>({});

  const {
    vertexScheduleRunsList,
    selectedDate,
    selectedMonth,
    initialDisplayDate,
    isLoading,
    greyListDates,
    redListDates,
    greenListDates,
    darkGreenListDates,
    handleDateSelection,
    handleMonthChange,
    hasScheduleExecutions,
    handleLogs,
    dispatch
  }: any = useExecutionHistory(
    scheduleId ?? '',
    region ?? '',
    abortControllers,
    app
  );

  const calendarProps = {
    createTime,
    currentDate,
    selectedDate,
    selectedMonth,
    initialDisplayDate,
    greyListDates,
    redListDates,
    greenListDates,
    darkGreenListDates,
    handleDateSelection,
    handleMonthChange,
    isLoading,
    fromPage: SCHEDULE_LABEL_VERTEX
  };

  const vertexScheduleRunProps = {
    vertexScheduleRunsList,
    isLoading,
    selectedDate,
    dispatch,
    scheduleName,
    fileExists,
    hasScheduleExecutions,
    app
  };

  const checkFileExistence = useCallback(async (scheduleRun: IScheduleRun) => {
    if (
      scheduleRun.state === 'failed' &&
      scheduleRun.gcsUrl &&
      scheduleRun.scheduleRunId
    ) {
      const bucketName = scheduleRun.gcsUrl.split('//')[1];
      const outputFileExistsPayload = {
        bucketName,
        scheduleRunId: scheduleRun.scheduleRunId,
        fileName: scheduleRun.fileName,
        abortControllers
      };
      try {
        const result = await VertexServices.outputFileExists(
          outputFileExistsPayload
        );
        setFileExists(prev => ({
          ...prev,
          [scheduleRun.scheduleRunId]: result
        }));
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
      }
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(vertexScheduleRunsList)) {
      vertexScheduleRunsList.forEach(scheduleRun => {
        checkFileExistence(scheduleRun);
      });
    }
  }, [vertexScheduleRunsList, checkFileExistence]);

  const handleBackButton = () => {
    abortApiCall(abortControllers);
    navigate('/list');
  };

  const executionHeaderProps = {
    scheduleName: scheduleName ?? '',
    handleBackButton,
    handleLogs,
    fromPage: SCHEDULE_LABEL_VERTEX,
    vertexScheduleRunsList
  };

  return (
    <>
      <div className="execution-history-main-wrapper">
        <ExecutionHistoryHeader {...executionHeaderProps} />
      </div>
      <div className="execution-history-main-full-wrapper execution-top-border">
        <div className="execution-history-full-wrapper execution-wrapper-border-none">
          {isLoading ? (
            <div className="spin-loader-main-execution-history">
              <Box sx={{ width: '100%', height: '1px' }}>
                <LinearProgress />
              </Box>
            </div>
          ) : (
            <div
              className="spin-loader-main-execution-history"
              style={{ height: '4px' }}
            ></div>
          )}
        </div>
        <div className="horizontal-element-wrapper">
          <ExecutionCalendar {...calendarProps} />

          <div className="execution-history-right-wrapper execution-history-right-wrapper-scroll execution-wrapper-border-none success-message-top">
            <VertexScheduleRuns {...vertexScheduleRunProps} />
          </div>
        </div>
      </div>
    </>
  );
};

export default VertexExecutionHistory;
