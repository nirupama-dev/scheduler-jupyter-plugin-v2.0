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
// import { CircularProgress } from '@mui/material';
import {
  iconPlay,
  iconPause,
  iconTrigger,
  iconEditNotebook,
  iconDelete
} from '../../../utils/Icons';
import { VertexServices } from '../../../services/vertex/VertexServices';

export const renderActions = (data: any, region: string) => {
  const is_status_paused = data.status;

  /**
   * Handle resume and pause
   * @param {string} scheduleId unique ID for schedule
   * @param {string} is_status_paused modfied status of schedule
   * @param {string} displayName name of schedule
   */
  const handleUpdateScheduler = async (
    scheduleId: string,
    is_status_paused: string,
    displayName: string,
    newPageToken: string | null | undefined
  ) => {
    const args = {
      scheduleId,
      region,
      displayName
    };
    if (is_status_paused === 'ACTIVE') {
      await VertexServices.handleUpdateSchedulerPauseAPIService(
        args
        // setResumeLoading,
        // abortControllers
      );
    } else {
      await VertexServices.handleUpdateSchedulerResumeAPIService(
        args
        // setResumeLoading,
        // abortControllers
      );
    }
    // handleCurrentPageRefresh(null, null);
  };

  return (
    console.log('data', data),
    (
      <div className="actions-icon-btn">
        {/* {data.name === resumeLoading ? (
        <div className="icon-buttons-style">
          <CircularProgress
            size={18}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      ) : ( */}
        <div
          role="button"
          className="icon-buttons-style"
          title={
            is_status_paused === 'COMPLETED'
              ? 'Completed'
              : is_status_paused === 'PAUSED'
                ? 'Resume'
                : 'Pause'
          }
          onClick={e => {
            is_status_paused !== 'COMPLETED' &&
              handleUpdateScheduler(
                data.name,
                is_status_paused,
                data.displayName,
                null
              );
          }}
        >
          {is_status_paused === 'COMPLETED' ? (
            <iconPlay.react
              tag="div"
              className="icon-buttons-style-disable disable-complete-btn"
            />
          ) : is_status_paused === 'PAUSED' ? (
            <iconPlay.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          ) : (
            <iconPause.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          )}
        </div>
        {/* )} */}
        {/* {data.name === triggerLoading ? (
        <div className="icon-buttons-style">
          <CircularProgress
            size={18}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      ) : ( */}
        <div
          role="button"
          className="icon-buttons-style"
          title="Trigger the job"
          data-scheduleId={data.name}
          // onClick={e => handleTriggerSchedule(e, data.displayName)}
        >
          <iconTrigger.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        {/* )} */}
        {/* {is_status_paused === 'COMPLETED' ? (
        <iconEditNotebook.react
          tag="div"
          className="icon-buttons-style-disable"
        />
      ) : data.name === editScheduleLoading ? (
        <div className="icon-buttons-style">
          <CircularProgress
            size={18}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      ) : ( */}
        <div
          role="button"
          className="icon-buttons-style"
          title="Edit Schedule"
          data-jobid={data.name}
          // onClick={e => handleEditJob(e, data.displayName)}
        >
          <iconEditNotebook.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        {/* )} */}
        {/* {isPreview &&
        (data.name === editNotebookLoading ? (
          <div className="icon-buttons-style">
            <CircularProgress
              size={18}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) : (
          <div
            role="button"
            className="icon-buttons-style"
            title="Edit Notebook"
            data-scheduleId={data.name}
            // onClick={e => handleEditVertex(e)}
          >
            <iconEditDag.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ))} */}
        <div
          role="button"
          className="icon-buttons-style"
          title="Delete"
          // onClick={() => handleDeletePopUp(data.name, data.displayName)}
        >
          <iconDelete.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
      </div>
    )
  );
};
