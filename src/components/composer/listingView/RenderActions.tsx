// Imports at the top of your file
import React, { FC } from 'react';
import { CircularProgress } from '@mui/material';
import {
  iconDelete,
  iconEditDag,
  iconEditNotebook,
  iconPause,
  iconPlay,
  iconTrigger
} from '../../../utils/Icons';

const LoadingSpinner: FC = () => (
  <div className="icon-buttons-style">
    <CircularProgress
      size={18}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
);

interface ActionButtonProps {
  title: string;
  icon: any;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

const ActionButton: FC<ActionButtonProps> = ({
  title,
  onClick,
  icon: IconComponent,
  disabled = false,
  className = 'icon-buttons-style'
}) => (
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
    <IconComponent tag="div" className="icon-white logo-alignment-style" />
  </div>
);

// Pass all dependencies as parameters to make the function pure and testable.
export const renderActions = (
  data: any,
  isGCSPluginInstalled?: boolean
  // updateLoading?: string | null,
  // triggerLoading?: string | null,
  // editDagLoading?: string | null,
  // editNotebookLoading?: string | null,
  // handleUpdateScheduler?: (jobid: string, isPaused: boolean) => void,
  // handleTriggerDag?: (e: React.MouseEvent) => void,
  // handleEditDags?: (e: React.MouseEvent) => void,
  // handleEditNotebook?: (e: React.MouseEvent) => void,
  // handleDeletePopUp?: (jobid: string) => void
) => {
  const isPaused = data.status === 'Paused';
  const isUpdateLoading = data.jobid === false;
  const isTriggerLoading = data.jobid === false;
  const isEditDagLoading = data.jobid === false;
  const isEditNotebookLoading = data.jobid === false;

  return (
    <div className="actions-icon-btn">
      {/* Pause/Unpause Button */}
      {isUpdateLoading ? (
        <LoadingSpinner />
      ) : (
        <ActionButton
          title={isPaused ? 'Unpause' : 'Pause'}
          // onClick={() => handleUpdateScheduler(data.jobid, isPaused)}
          icon={isPaused ? iconPlay : iconPause}
        />
      )}

      {/* Trigger Button */}
      {isTriggerLoading ? (
        <LoadingSpinner />
      ) : (
        <ActionButton
          title={isPaused ? "Can't Trigger Paused job" : 'Trigger the job'}
          // onClick={handleTriggerDag}
          icon={iconTrigger}
          disabled={isPaused}
          className={
            !isPaused ? 'icon-buttons-style' : 'icon-buttons-style-disable'
          }
        />
      )}

      {/* Edit Schedule Button */}
      {isEditDagLoading ? (
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
        isEditNotebookLoading ? (
          <LoadingSpinner />
        ) : (
          <ActionButton
            title="Edit Notebook"
            // onClick={handleEditNotebook}
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
        // onClick={() => handleDeletePopUp(data.jobid)}
        icon={iconDelete}
      />
    </div>
  );
};
