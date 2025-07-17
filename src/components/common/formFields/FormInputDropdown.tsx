import React from 'react';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { Controller } from 'react-hook-form';
import { FormInputProps } from '../../../interfaces/FormInterface';

const defaultOptions = [
  {
    label: 'Dropdown Option 1',
    value: '1'
  },
  {
    label: 'Dropdown Option 2',
    value: '2'
  }
];

export const FormInputDropdown: React.FC<FormInputProps> = ({
  name,
  control,
  label,
  options = defaultOptions,
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
        render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
          <Select onChange={onChange} value={value ?? ''} label={label}>
            {generateSingleOptions()}
          </Select>
        )}
       
      />
      {error && <FormHelperText>{error.message}</FormHelperText>} {/* Display error message */}
    </FormControl>
  );
};
