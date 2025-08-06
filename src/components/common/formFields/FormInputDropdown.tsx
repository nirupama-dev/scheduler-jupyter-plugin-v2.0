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
  FormHelperText,
  CircularProgress, // Import for loader
  TextField, // Used internally by Autocomplete for the input area
  Autocomplete
} from '@mui/material';
// For Material-UI v4, it might be directly from '@mui/material/Autocomplete' or '@material-ui/lab/Autocomplete'
import { Controller } from 'react-hook-form';
import { FormInputDropdownProps, FormInputListingDropdownProps } from '../../../interfaces/FormInterface'; // Adjust path if needed

export const FormInputDropdown: React.FC<FormInputDropdownProps> = ({
  name,
  control,
  label,
  options = [],
  customClass = '',
  onChangeCallback,
  error,
  loading = false, // Default to false
  disabled = false, // Default to false
  filterOptions
  // onSearchInputChange,
  // freeSolo = false, // Default to false
  // placeholder = '',
}) => {
  return (
    <FormControl fullWidth error={!!error} className={customClass}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <Autocomplete
            {...fieldProps}
            options={options}
            disabled={disabled}
            getOptionLabel={(option) => option.label} // How to get the label from an option object
            // isOptionEqualToValue={(option, val) => option.value === val} // Essential for matching selected value
            value={options.find(option => option.value === value) || null} // Set value based on full option object
            onChange={(_, newValue) => {
              const selectedValue = newValue ? newValue.value : '';
              onChange(selectedValue); // react-hook-form update
              if (onChangeCallback) {
                onChangeCallback(selectedValue); // Custom callback with reason
              }
            }}
            
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                error={!!error}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
            
            renderOption={(props, option) => {
                // Custom rendering for the "Create new bucket" option
                if (option.value === 'Create and Select' && name === 'cloudStorageBucket') {
                  return (
                    <li {...props} className="custom-add-bucket">
                      {option.label}
                    </li>
                  );
                }

                return (<li {...props}>{option.label}</li>);
              }}
              filterOptions={filterOptions}
          />
        )}
      />
      <div>{error && <FormHelperText>{error.message}</FormHelperText>}</div>
    </FormControl>
  );
};

export const FormInputListingDropdown: React.FC<FormInputListingDropdownProps> = ({
  name,
  control,
  label,
  options = [],
  customClass = '',
  onChangeCallback,
  error,
  loading = false, // Default to false
  disabled = false, // Default to false
  filterOptions
}) => {
  return (
    <FormControl fullWidth error={!!error} className={customClass}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, ...fieldProps } }) => (
          <Autocomplete
            {...fieldProps}
            options={options}
            disabled={disabled}
            getOptionLabel={(option) => option.label} // How to get the label from an option object
            value={options.find(option => option.value === value) || null} // Set value based on full option object
            onChange={(_, newValue) => {
              const selectedValue = newValue ? newValue.value : '';
              onChange(selectedValue); // react-hook-form update
              if (onChangeCallback) {
                onChangeCallback(selectedValue); // Custom callback with reason
              }
            }}
            
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                error={!!error}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
            
            renderOption={(props, option) => {
              
                return (<li {...props}>{option.label}</li>);
              }}
              filterOptions={filterOptions}
          />
        )}
      />
      <div>{error && <FormHelperText>{error.message}</FormHelperText>}</div>
    </FormControl>
  );
};