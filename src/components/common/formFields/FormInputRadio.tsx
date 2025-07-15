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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { FormInputProps } from '../../../interfaces/FormInterface';

const options = [
  {
    label: 'Radio Option 1',
    value: '1'
  },
  {
    label: 'Radio Option 2',
    value: '2'
  }
];

export const FormInputRadio: React.FC<FormInputProps> = ({
  name,
  control,
  className = '',
  options = []
}) => {
  const generateRadioOptions = () => {
    return options.map(singleOption => (
      <FormControlLabel
        value={singleOption.value}
        label={
          <Typography sx={{ fontSize: 13 }}>{singleOption.label}</Typography>
        }
        control={<Radio size="small" />}
        className="create-scheduler-label-style"
      />
    ));
  };

  return (
    <FormControl component="fieldset">
      <Controller
        name={name}
        control={control}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState
        }) => (
          <RadioGroup value={value} onChange={onChange} className={className}>
            {generateRadioOptions()}
          </RadioGroup>
        )}
      />
    </FormControl>
  );
};
