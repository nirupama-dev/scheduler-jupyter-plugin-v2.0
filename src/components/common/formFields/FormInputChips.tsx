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
import { MuiChipsInput } from 'mui-chips-input';
import { Controller } from 'react-hook-form';
import { IFormInputChipsProps } from '../../../interfaces/FormInterface';

export const FormInputChips: React.FC<IFormInputChipsProps> = ({
  control,
  name,
  label,
  error
}) => {
  const getEmailRecipientsError = () => {
    if (!error) {
      return null; // No error
    }

    if (typeof error.message === 'string') {
      return error.message;
    }

    // 2. Check for Item-Level/Nested Array Error (e.g., invalid email format)
    // error is an array of errors when validation fails on array items

    const errorArray = Array.isArray(error) ? error : Object.values(error);
    if (errorArray.length > 0) {
      // We only need to show the first invalid email message
      const firstError = errorArray[0];
      return firstError?.message || null;
    }

    return null;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <MuiChipsInput
          {...field} // Spreads value, onChange, onBlur from RHF
          className="select-job-style"
          addOnBlur={true}
          inputProps={{ placeholder: '' }}
          label={label}
          error={!!error}
          helperText={getEmailRecipientsError()}
        />
      )}
    />
  );
};
