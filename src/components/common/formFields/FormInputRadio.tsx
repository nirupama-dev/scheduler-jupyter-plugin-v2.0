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
  Typography,
  FormHelperText
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { IFormInputProps } from '../../../interfaces/FormInterface';
import {
  DEFAULT_HOST_PROJECT_NETWORK,
  NETWORK_OPTIONS,
  SHARED_NETWORK_DESCRIPTION,
  SHARED_NETWORK_DOC_URL
} from '../../../utils/Constants';
import LearnMore from '../links/LearnMore';

export const FormInputRadio: React.FC<IFormInputProps> = ({
  name,
  control,
  className = '',
  options = [],
  error,
  hostProject
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  const hasHostProject =
    hostProject &&
    typeof hostProject === 'object' &&
    Object.keys(hostProject).length !== 0;

  const generateRadioOptions = () => {
    return safeOptions.map(singleOption => (
      <>
        <FormControlLabel
          key={singleOption.value}
          value={singleOption.value}
          label={
            <Typography sx={{ fontSize: 13 }}>
              <>
                {singleOption.label}
                {singleOption.value === DEFAULT_HOST_PROJECT_NETWORK
                  ? ` ${hasHostProject ? `"${hostProject?.name}"` : ''}`
                  : null}
              </>
            </Typography>
          }
          control={<Radio size="small" />}
          className="scheduler-label-font"
        />
        {singleOption.label === NETWORK_OPTIONS[1].label && (
          <>
            <span className="sub-para tab-text-sub-cl">
              {SHARED_NETWORK_DESCRIPTION}
            </span>
            <div className="learn-more-a-tag learn-more-url">
              <LearnMore path={SHARED_NETWORK_DOC_URL} />
            </div>
          </>
        )}
      </>
    ));
  };

  return (
    <FormControl component="fieldset" error={!!error}>
      <Controller
        name={name}
        control={control}
        render={({
          field: { onChange, value },
          fieldState: { error: fieldError }, // eslint-disable-line @typescript-eslint/no-unused-vars
          formState
        }) => (
          <RadioGroup value={value} onChange={onChange} className={className}>
            {generateRadioOptions()}
          </RadioGroup>
        )}
      />
      {error && <FormHelperText>{error.message}</FormHelperText>}{' '}
      {/* Display error message */}
    </FormControl>
  );
};
