import React from 'react';
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import { FormInputProps } from '../../../interfaces/FormInterface';

export const FormInputText = ({ name, control, label, error }: FormInputProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, value },
        fieldState: { error: fieldError },// eslint-disable-next-line @typescript-eslint/no-unused-vars
        formState
      }) => (
        <TextField
          helperText={fieldError ? fieldError.message : null}
          size="small"
          error={!!fieldError}
          onChange={onChange}
          value={value ?? ''}
          fullWidth
          label={label}
          variant="outlined"
        />
      )}
    />
  );
};
