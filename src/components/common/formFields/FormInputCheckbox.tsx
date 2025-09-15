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

import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Controller } from 'react-hook-form';
import { IFormInputCheckboxProps } from '../../../interfaces/FormInterface';

export const FormInputCheckbox: React.FC<IFormInputCheckboxProps> = ({
  name,
  control,
  label,
  isChecked = false,
  disabled = false,
  className
}) => {
  return (
    <FormControlLabel
      control={
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field} // Spreads onChange, onBlur, value (boolean)
              checked={isChecked || field.value} // Ensure checked prop is explicitly set by field.value
            />
          )}
        />
      }
      label={label}
      disabled={disabled}
      value={isChecked}
      sx={{
        '& .MuiTypography-root': {
          fontSize: '0.813rem' // Adjust the size as needed
        }
      }}
    />
  );
};
