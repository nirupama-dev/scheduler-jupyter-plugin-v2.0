// Imports at the top of your file
import React from 'react';
import {
  iconDeleteAction,
  iconEditDag,
  iconEditNotebook,
  iconPause,
  iconPlay,
  iconTrigger
} from '../../../utils/Icons';
import { ILoadingStateComposerListing } from '../../../interfaces/ComposerInterface';
import { ActionButton } from '../../common/button/ActionButton';
import LoadingSpinner from '../../common/loader/LoadingSpinner';

export const renderActions = (
  data: any,
  isGCSPluginInstalled: boolean,
  loadingState: ILoadingStateComposerListing,
  handleUpdateScheduler: (jobid: string, isPaused: boolean) => void,
  handleTriggerDag: (jobid: string) => void,
  handleEditNotebook: (jobid: string) => void,
  handleDeletePopUp: (jobid: string) => void,
  handleEditSchedule: (jobid: string) => void
) => {
  const isPaused = data.status === 'Paused';

  return (
    <div className="actions-icon-btn">
      {/* Pause/Unpause Button */}
      {data.jobid === loadingState.update ? (
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
      ) : (
        <ActionButton
          title={isPaused ? 'Unpause' : 'Pause'}
          onClick={() => handleUpdateScheduler(data.jobid, isPaused)}
          icon={isPaused ? iconPlay : iconPause}
        />
      )}

      {/* Trigger Button */}
      {data.jobid === loadingState.trigger ? (
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
      ) : (
        <ActionButton
          title={isPaused ? "Can't Trigger Paused job" : 'Trigger the job'}
          onClick={() => handleTriggerDag(data.jobid)}
          icon={iconTrigger}
          disabled={isPaused}
          className={
            !isPaused ? 'icon-buttons-style' : 'icon-buttons-style-disable'
          }
        />
      )}

      {/* Edit Schedule Button */}
      {data.jobid === loadingState.editSchedule ? (
        <LoadingSpinner iconClassName="spin-loader-custom-style" />
      ) : (
        <ActionButton
          title="Edit Schedule"
          onClick={() => handleEditSchedule(data.jobid)}
          icon={iconEditDag}
        />
      )}

      {/* Edit Notebook Button (Conditional on GCS Plugin) */}
      {isGCSPluginInstalled ? (
        data.jobid === loadingState.editNotebook ? (
          <LoadingSpinner iconClassName="spin-loader-custom-style" />
        ) : (
          <ActionButton
            title="Edit Notebook"
            onClick={() => handleEditNotebook(data.jobid)}
            icon={iconEditNotebook}
          />
        )
      ) : (
        <ActionButton
          title="Install GCS Plugin to enable notebook editing"
          icon={iconEditNotebook}
          className="edit-icon-buttons-display"
          disabled={true}
        />
      )}

      {/* Delete Button */}
      <ActionButton
        title="Delete"
        onClick={() => handleDeletePopUp(data.jobid)}
        icon={iconDeleteAction}
      />
    </div>
  );
};
