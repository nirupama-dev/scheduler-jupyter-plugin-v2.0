// Imports at the top of your file
import React, { FC } from 'react';
import { CircularProgress } from '@mui/material';
import {
  iconDeleteAction,
  iconEditDag,
  iconEditNotebook,
  iconPause,
  iconPlay,
  iconTrigger
} from '../../../utils/Icons';
import { LabIcon } from '@jupyterlab/ui-components';
import { LabIconComponent } from '../../common/table/LabIcon';
import { ILoadingStateComposerListing } from '../../../interfaces/ComposerInterface';

const LoadingSpinner: FC = () => (
  <div className="icon-buttons-style">
    <CircularProgress
      size={18}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
);

interface IActionButtonProps {
  title: string;
  icon: LabIcon;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

const ActionButton: FC<IActionButtonProps> = ({
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
  isGCSPluginInstalled: boolean,
  loadingState: ILoadingStateComposerListing,
  handleUpdateScheduler: (jobid: string, isPaused: boolean) => void,
  handleTriggerDag: (jobid: string) => void,
  handleEditNotebook: (jobid: string) => void,
  handleDeletePopUp: (jobid: string) => void
  // handleEditDags?: (e: React.MouseEvent) => void,
) => {
  const isPaused = data.status === 'Paused';

  return (
    <div className="actions-icon-btn">
      {/* Pause/Unpause Button */}
      {loadingState.update ? (
        <LoadingSpinner />
      ) : (
        <ActionButton
          title={isPaused ? 'Unpause' : 'Pause'}
          onClick={() => handleUpdateScheduler(data.jobid, isPaused)}
          icon={isPaused ? iconPlay : iconPause}
        />
      )}

      {/* Trigger Button */}
      {loadingState.trigger ? (
        <LoadingSpinner />
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
      {loadingState.editDag ? (
        <LoadingSpinner />
      ) : (
        <ActionButton
          title="Edit Schedule"
          // onClick={handleEditDags}
          icon={iconEditDag}
        />
      )}

      {/* Edit Notebook Button (Conditional on GCS Plugin) */}
      {isGCSPluginInstalled ? (
        loadingState.editNotebook ? (
          <LoadingSpinner />
        ) : (
          <ActionButton
            title="Edit Notebook"
            onClick={event => handleEditNotebook(data.jobid)}
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
