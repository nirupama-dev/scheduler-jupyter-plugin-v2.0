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

/**
 * Initialization data for the scheduler-jupyter-plugin extension.
 * Parent component for createVertexSchedule.tsx and CreateComposerSchedule.tsx
 */

import React, { FC } from 'react';
import { LabIcon } from '@jupyterlab/ui-components';
import { LabIconComponent } from '../table/LabIcon';
import IconButton from '@mui/material/IconButton';

interface IActionButtonProps {
  /**
   * The icon to be displayed on the button.
   */
  icon: LabIcon;
  /**
   * The title for the button, displayed as a tooltip.
   */
  title: string;
  /**
   * The function to call when the button is clicked.
   */
  onClick?: (e: React.MouseEvent) => void;
  /**
   * A CSS class to apply to the button for custom styling.
   */
  className?: string;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
}

export const ActionButton: FC<IActionButtonProps> = ({
  title,
  onClick,
  icon,
  disabled = false,
  className = 'icon-buttons-style'
}) => {
  return (
    <IconButton
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={disabled ? 'icon-buttons-style-disable' : className}
    >
      <LabIconComponent
        icon={icon}
        className="icon-white logo-alignment-style"
        tag="div"
      />
    </IconButton>
  );
};
