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
import { iconLeftArrow, iconCreateCluster } from '../../../utils/Icons';
import { VIEW_CLOUD_LOGS } from '../../../utils/Constants';
import LoadingSpinner from '../../common/loader/LoadingSpinner';

const ExecutionHistoryHeader = ({
  scheduleName,
  handleBackButton,
  handleLogs
}: {
  scheduleName: string;
  handleBackButton: () => void;
  handleLogs: () => void;
}) => (
  <div className="execution-history-header">
    <button className="scheduler-back-arrow-icon" onClick={handleBackButton}>
      <iconLeftArrow.react
        tag="div"
        className="icon-white logo-alignment-style cursor-icon"
      />
    </button>
    <div className="scheduler-page-title execution-header-wrap-arrow">
      Execution History:{' '}
      {!scheduleName ? (
        <LoadingSpinner iconClassName="spinner-schedule-title" />
      ) : (
        scheduleName
      )}
    </div>
    <div className="log-btn right-panel-wrapper">
      <button
        className="horizontal-element-wrapper log-btn-element"
        onClick={handleLogs}
      >
        <div className="create-icon log-icon cursor-icon">
          <iconCreateCluster.react tag="div" className="logo-alignment-style" />
        </div>
        <div className="create-text cursor-icon">{VIEW_CLOUD_LOGS}</div>
      </button>
    </div>
  </div>
);

export default ExecutionHistoryHeader;
