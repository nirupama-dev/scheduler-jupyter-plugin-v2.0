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

import React, { FC } from 'react';
// import { CircularProgress } from '@mui/material';
import {
  iconDeleteAction,
  iconEditNotebook,
  iconPause,
  iconPlay,
  iconTrigger
} from '../../../utils/Icons';
import { LabIcon } from '@jupyterlab/ui-components';
import { LabIconComponent } from '../../common/table/LabIcon';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import {
  IVertexListingLoadingState,
  IVertexSelectedActionProps
} from '../../../interfaces/VertexInterface';

interface ActionButtonProps {
  title: string;
  icon: LabIcon;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

const ActionButton: FC<ActionButtonProps> = ({
  title,
  onClick,
  icon,
  disabled = false,
  className = 'icon-buttons-style'
}) => {
  return (
    <div
      role="button"
      className={disabled ? 'icon-buttons-style-disable' : className}
      title={title}
      onClick={e => {
        if (!disabled) {
          onClick?.(e);
        }
      }}
    >
      <LabIconComponent
        icon={icon}
        className="icon-white logo-alignment-style"
        tag="div"
      />
    </div>
  );
};

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
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
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
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
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
          icon={iconEditNotebook}
          disabled={true}
        />
      ) : loaderState.editScheduleLoader ? (
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
      ) : (
        <ActionButton
          title={'Edit Schedule'}
          onClick={e => handleEditschedule(data.name)}
          icon={iconEditNotebook}
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
