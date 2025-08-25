/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useCallback } from 'react';
import { iconDownload } from '../../../utils/Icons';
import { VertexServices } from '../../../services/vertex/VertexServices';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import { IVertexExecutionHistoryActionsProps } from '../../../interfaces/VertexInterface';

const VertexExecutionHistoryActions = ({
  data,
  scheduleName,
  fileExists
}: IVertexExecutionHistoryActionsProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Handles the download of a job's output.
   */
  const handleDownloadOutput = useCallback(async () => {
    if (!data.gcsUrl || !data.fileName || !data.scheduleRunId) {
      return;
    }

    const downloadPayload = {
      gcsUrl: data.gcsUrl,
      fileName: data.fileName,
      scheduleRunId: data.scheduleRunId,
      scheduleName
    };

    setIsDownloading(true);
    await VertexServices.downloadJobAPIService(downloadPayload);
    setIsDownloading(false);
  }, [data, scheduleName]);

  const canDownload = data.state === 'succeeded' || fileExists;

  if (isDownloading) {
    return (
      <div className="action-btn-execution">
        <LoadingSpinner iconClassName="icon-buttons-style" />
      </div>
    );
  }

  return (
    <div className="action-btn-execution">
      <div
        role="button"
        className={
          canDownload
            ? 'icon-buttons-style sub-title-heading'
            : 'icon-buttons-style-disable sub-title-heading'
        }
        title="Download Output"
        onClick={canDownload ? handleDownloadOutput : undefined}
      >
        <iconDownload.react tag="div" />
      </div>
    </div>
  );
};

export default VertexExecutionHistoryActions;
