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

import React from 'react';
import { useComposerExecutionHistory } from '../../../hooks/useComposerExecutionHistoryReducer';
import ExecutionCalendar from '../../common/dateCalendar/DateCalendar';
import { useLocation, useNavigate } from 'react-router-dom';
import ListDagRuns from './ListDagRuns';
import ListDagTaskInstances from './ListDagTaskInstances';
import { SCHEDULE_LABEL_COMPOSER } from '../../../utils/Constants';
import ExecutionHistoryHeader from '../../vertex/vertexExecutionHistoryView/VertexExecutionHistoryHeader';
import { Box, LinearProgress } from '@mui/material';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { abortApiCall } from '../../../utils/Config';

const ComposerExecutionHistory = ({
  abortControllers,
  app
}: {
  abortControllers: any;
  app: JupyterFrontEnd;
}): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dagId, projectId, region, composerName, bucketName } = location.state;

  const {
    startDate,
    endDate,
    createTime,
    currentDate,
    selectedDate,
    greyListDates,
    redListDates,
    greenListDates,
    darkGreenListDates,
    filteredDagRunsList,
    handleDateSelection,
    handleMonthChange,
    height,
    handleDagRunClick,
    dagRunId,
    isLoading
  } = useComposerExecutionHistory(
    dagId ?? '',
    projectId ?? '',
    region ?? '',
    composerName ?? '',
    app
  );

  const calendarProps = {
    createTime,
    currentDate,
    selectedDate,
    greyListDates,
    redListDates,
    greenListDates,
    darkGreenListDates,
    handleDateSelection,
    handleMonthChange,
    fromPage: SCHEDULE_LABEL_COMPOSER
  };

  const handleBackButton = () => {
    abortApiCall(abortControllers);
    navigate('/list/composer');
  };

  return (
    <>
      <div className="execution-history-main-wrapper">
        <ExecutionHistoryHeader
          scheduleName={dagId ?? ''}
          handleBackButton={handleBackButton}
          fromPage={SCHEDULE_LABEL_COMPOSER}
        />
      </div>
      <div className="horizontal-element-wrapper" style={{ height: height }}>
        <div className="execution-history-left-wrapper">
          <div className="element-bottom">
            {isLoading ? (
              <div className="spin-loader-main-execution-history">
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                </Box>
              </div>
            ) : (
              <div
                className="spin-loader-main-execution-history"
                style={{ height: '4px' }}
              ></div>
            )}
            <ExecutionCalendar {...calendarProps} />
          </div>
          {startDate !== '' && endDate !== '' && (
            <ListDagRuns
              composerName={composerName || ''}
              dagId={dagId || ''}
              handleDagRunClick={handleDagRunClick}
              bucketName={bucketName || ''}
              projectId={projectId || ''}
              region={region || ''}
              dagRunsList={filteredDagRunsList}
              app={app}
            />
          )}
        </div>
        <div className="execution-history-right-wrapper">
          {dagRunId !== '' && (
            <ListDagTaskInstances
              composerName={composerName || ''}
              dagId={dagId || ''}
              dagRunId={dagRunId}
              projectId={projectId || ''}
              region={region || ''}
              app={app}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ComposerExecutionHistory;
