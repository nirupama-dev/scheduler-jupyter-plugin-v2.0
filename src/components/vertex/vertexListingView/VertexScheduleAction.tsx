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
import {
  iconDeleteAction,
  iconEditSchedule,
  iconPause,
  iconPlay,
  iconTrigger
} from '../../../utils/Icons';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import {
  IVertexListingLoadingState,
  IVertexSelectedActionProps
} from '../../../interfaces/VertexInterface';
import { ActionButton } from '../../common/button/ActionButton';

export const renderActions = (
  data: any,
  actionPerformedScheduleName: IVertexSelectedActionProps,
  loaderState: IVertexListingLoadingState,
  handleUpdateScheduler: (
    scheduleId: string,
    is_status_paused: string,
    displayName: string
  ) => void,
  handleTriggerSchedule: (scheduleId: string, displayName: string) => void,
  handleEditschedule: (scheduleName: string) => void,
  handleDeletePopUp: (scheduleId: string, displayName: string) => void
) => {
  const is_status_paused = data.status;

  return (
    <div className="actions-icon-btn">
      {/* Pause/Unpause Button */}
      {data.name === actionPerformedScheduleName.resumePauseLoading ? (
        <LoadingSpinner iconClassName="listing-spinner" />
      ) : (
        <ActionButton
          title={
            is_status_paused === 'COMPLETED'
              ? 'Completed'
              : is_status_paused === 'PAUSED'
                ? 'Resume'
                : 'Pause'
          }
          onClick={() => {
            is_status_paused !== 'COMPLETED' &&
              handleUpdateScheduler(
                data.name,
                is_status_paused,
                data.displayName
              );
          }}
          icon={
            is_status_paused === 'COMPLETED'
              ? iconPlay
              : is_status_paused === 'PAUSED'
                ? iconPlay
                : iconPause
          }
          disabled={is_status_paused === 'COMPLETED'}
        />
      )}

      {/* Trigger Button */}
      {data.name === actionPerformedScheduleName.triggerLoading ? (
        <LoadingSpinner iconClassName="listing-spinner" />
      ) : (
        <ActionButton
          title={'Trigger the job'}
          onClick={() => handleTriggerSchedule(data.name, data.displayName)}
          icon={iconTrigger}
          className={'icon-buttons-style'}
        />
      )}

      {/* Edit Schedule Button */}
      {is_status_paused === 'COMPLETED' ? (
        <ActionButton
          title="Edit Schedule"
          icon={iconEditSchedule}
          disabled={true}
        />
      ) : loaderState.editScheduleLoader ? (
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
      ) : (
        <ActionButton
          title={'Edit Schedule'}
          onClick={e => handleEditschedule(data.name)}
          icon={iconEditSchedule}
          className={'icon-buttons-style'}
        />
      )}

      {/* Delete Button */}
      <ActionButton
        title="Delete"
        onClick={() => handleDeletePopUp(data.name, data.displayName)}
        icon={iconDeleteAction}
      />
    </div>
  );
};
