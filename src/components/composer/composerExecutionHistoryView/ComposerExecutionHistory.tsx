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
import { useNavigate, useParams } from 'react-router-dom';
import ListDagRuns from './ListDagRuns';
import { iconLeftArrow } from '../../../utils/Icons';
import ListDagTaskInstances from './ListDagTaskInstances';

const ComposerExecutionHistory = (): JSX.Element => {
  const { dagId, projectId, region, composerName, bucketName } = useParams();
  const navigate = useNavigate();
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
    dagRunsList,
    handleDateSelection,
    handleMonthChange,
    handleLogs,
    height,
    filteredDagRunsList,
    handleDagRunClick,
    dagRunId
  } = useComposerExecutionHistory(
    dagId ?? '',
    projectId ?? '',
    region ?? '',
    composerName ?? ''
  );

  console.log('dagRunId', dagRunId);
  console.log('dagRunsList', dagRunsList);

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
    handleLogs
  };

  const handleBackButton = () => {
    navigate('/list');
  };

  return (
    <>
      <div className="execution-history-header">
        <button
          className="scheduler-back-arrow-icon"
          onClick={handleBackButton}
        >
          <iconLeftArrow.react
            tag="div"
            className="icon-white logo-alignment-style cursor-icon"
          />
        </button>
        <div className="create-job-scheduler-title">
          Execution History: {dagId}
        </div>
      </div>
      <div
        className="execution-history-main-wrapper"
        style={{ height: height }}
      >
        <div className="execution-history-left-wrapper">
          <ExecutionCalendar {...calendarProps} />
          {startDate !== '' && endDate !== '' && (
            <ListDagRuns
              composerName={composerName || ''}
              dagId={dagId || ''}
              handleDagRunClick={handleDagRunClick}
              selectedDate={selectedDate}
              bucketName={bucketName || ''}
              projectId={projectId || ''}
              region={region || ''}
              dagRunsList={filteredDagRunsList}
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
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ComposerExecutionHistory;
