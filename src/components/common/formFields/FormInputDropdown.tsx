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
  options = [],
  customClass = '',
  onChangeCallback,
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
<FormControl fullWidth error={!!error}>
<InputLabel>{label}</InputLabel>
<Controller
        render={({
          field: { onChange, value, ...fieldProps },
          fieldState: { error: fieldError }
        }) => (
<Select
            labelId={`${name}-label`}
            label={label}
            onChange={event => {
              const newValue = event.target.value as string;
              onChange(newValue);
              if (onChangeCallback) {
                onChangeCallback(newValue); // Call your custom callback
              }
            }}
            value={value || ''}
            {...fieldProps}
>
            {generateSingleOptions()}
</Select>
        )}
        control={control}
        name={name}
      />
      {error && <FormHelperText>{error.message}</FormHelperText>}{' '}
      {/* Display error message */}
</FormControl>
  );
};