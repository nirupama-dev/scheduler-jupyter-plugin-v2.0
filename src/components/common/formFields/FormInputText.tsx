/**
 * @license
 * Copyright 2026 Google LLC
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
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import { IFormInputProps } from '../../../interfaces/FormInterface';

export const FormInputText = ({
  name,
  control,
  label,
  error,
  type,
  onBlurCallback,
  disabled,
  onChangeCallback,
  isClearable = false
}: IFormInputProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error: fieldError }, // eslint-disable-next-line @typescript-eslint/no-unused-vars
        formState
      }) => (
        <TextField
          helperText={fieldError ? fieldError.message : null}
          size="small"
          error={!!fieldError}
          onChange={event => {
            const rawValue = event.target.value;
            let valueToRHF = rawValue;
            const isNumberType = type === 'number';

            if (isNumberType) {
              // 1. If the user clears the input completely
              if (rawValue === '') {
                // If isClearable is false, we default to '0', otherwise allow empty string
                valueToRHF = isClearable ? '' : '0'; // Value to react-hook-form
              }
              // 2. If the user is typing and there is a leading zero
              else if (
                valueToRHF.length > 1 &&
                valueToRHF.startsWith('0') &&
                !valueToRHF.startsWith('0.')
              ) {
                // Use a regex that only strips zeros IF followed by other digits
                // This prevents '0' from becoming '' when you type a second zero
                valueToRHF = valueToRHF.replace(/^0+(?!$)/, '');
              }
            }
            onChange(valueToRHF);
            if (onChangeCallback) {
              onChangeCallback(rawValue);
            }
          }}
          value={value ?? ''}
          fullWidth
          label={label}
          variant="outlined"
          type={type || 'text'}
          onBlur={event => {
            onBlur();

            if (onBlurCallback) {
              onBlurCallback(value);
            }
          }}
          disabled={disabled}
          FormHelperTextProps={{
            style: { fontSize: '0.688rem' } // You can adjust this value
          }}
        />
      )}
    />
  );
};
