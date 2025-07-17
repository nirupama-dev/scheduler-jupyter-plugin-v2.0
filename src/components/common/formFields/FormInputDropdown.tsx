import React from 'react';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { FormInputDropdownProps } from '../../../interfaces/FormInterface';

export const FormInputDropdown: React.FC<FormInputDropdownProps> = ({
  name,
  control,
  label,
  customClass = '',
  options = [],
  error
}) => {
  const generateSingleOptions = () => {
    return options.map((option: any) => {
      return (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      );
    });
  };

  return (
    <FormControl size={'small'} fullWidth error={!!error}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        render={({
          field: { onChange, value },
          fieldState: { error: fieldError }
        }) => (
          <Select
            labelId={`${name}-label`}
            // onChange={onChange} value={value}
          >
            {generateSingleOptions()}
          </Select>
        )}
      />
      {error && <FormHelperText>{error.message}</FormHelperText>}{' '}
      {/* Display error message */}
    </FormControl>
  );
};
