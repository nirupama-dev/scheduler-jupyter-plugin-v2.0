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

import React, { FC, useMemo } from 'react';
import { useFieldArray, Control, useWatch, FieldErrors } from 'react-hook-form';
import { Button, TextField, IconButton, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { ComposerSchedulerFormValues } from '../../schemas/CreateComposerSchema';
import { Parameter } from '../../interfaces/CommonInterface';
import { CombinedCreateFormValues } from '../../schemas/CreateScheduleCombinedSchema';

interface AddParametersProps {
  control: Control<CombinedCreateFormValues>;
  errors: FieldErrors<ComposerSchedulerFormValues>; // Pass the errors object from useForm
}

// Simple utility to safely get nested properties (similar to lodash.get)
const getNestedProperty = (
  obj: any,
  path: string | string[],
  defaultValue?: any
) => {
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;
  for (let i = 0; i < pathArray.length; i++) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !current.hasOwnProperty(pathArray[i])
    ) {
      return defaultValue;
    }
    current = current[pathArray[i]];
  }
  return current === undefined ? defaultValue : current;
};

export const AddParameters: FC<AddParametersProps> = ({ control, errors }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parameters' // This must match the field name in your Zod schema
  });

  // Use useWatch to get a reactive version of the parameters array
  const watchedParameters = useWatch({
    control,
    name: 'parameters',
    defaultValue: [] // Provide a default empty array for initial render
  });

  // Determine if the "Add Parameter" button should be disabled
  const isAddButtonDisabled = useMemo(() => {
    if (fields.length === 0) {
      return false; // Always enabled if no parameters are added yet
    }

    const lastIndex = fields.length - 1;
    const lastParam: any = watchedParameters?.[lastIndex];

    // Check if the last added parameter's key or value is empty
    if (!lastParam?.key || !lastParam?.value) {
      return true;
    }

    // Check for validation errors on the last added parameter
    const lastKeyError = getNestedProperty(
      errors,
      `parameters.${lastIndex}.key`
    );
    const lastValueError = getNestedProperty(
      errors,
      `parameters.${lastIndex}.value`
    );

    if (lastKeyError || lastValueError) {
      return true;
    }

    return false;
  }, [fields, watchedParameters, errors]);

  return (
    <Box
      sx={{
        p: 2,
        // border: '1px solid #e0e0e0',
        // borderRadius: '8px',
        mt: 3,
        mb: 2
      }}
    >
      <Typography variant="h6" gutterBottom>
        Parameters
      </Typography>

      {/* {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click "Add Parameter" to define custom key-value pairs.
        </Typography>
      )} */}

      {fields.map((item, index) => (
        <Box
          key={item.id}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
        >
          {/* Key Input Field */}
          <TextField
            {...control.register(`parameters.${index}.key` as const)} // Type assertion for react-hook-form
            label="Key"
            variant="outlined"
            size="small"
            fullWidth
            error={!!getNestedProperty(errors, `parameters.${index}.key`)}
            helperText={getNestedProperty(
              errors,
              `parameters.${index}.key.message`
            )}
          />

          {/* Value Input Field */}
          <TextField
            {...control.register(`parameters.${index}.value` as const)} // Type assertion
            label="Value"
            variant="outlined"
            size="small"
            fullWidth
            error={!!getNestedProperty(errors, `parameters.${index}.value`)}
            helperText={getNestedProperty(
              errors,
              `parameters.${index}.value.message`
            )}
          />

          {/* Delete Button */}
          <IconButton
            onClick={() => remove(index)}
            color="error"
            aria-label={`delete parameter ${index + 1}`}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      {/* Add Parameter Button */}
      <Button
        variant="contained"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => append({ key: '', value: '' } as Parameter)} // Append a new empty parameter
        disabled={isAddButtonDisabled}
        sx={{ mt: 1 }}
      >
        Add Parameter
      </Button>
    </Box>
  );
};
