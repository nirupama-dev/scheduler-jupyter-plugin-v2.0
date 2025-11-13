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
import { IParameter } from '../../interfaces/CommonInterface';
import { CombinedCreateFormValues } from '../../schemas/CreateScheduleCombinedSchema';

interface IAddParametersProps {
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
      !Object.hasOwn(current, pathArray[i])
    ) {
      return defaultValue;
    }
    current = current[pathArray[i]];
  }
  return current === undefined ? defaultValue : current;
};

export const AddParameters: FC<IAddParametersProps> = ({ control, errors }) => {
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
        mt: 3,
        mb: 2,
        width: '512px',
        boxSizing: 'border-box'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Parameters
      </Typography>

      {fields.map((item, index) => (
        <Box
          key={item.id}
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}
        >
          {/* Key Input Field */}
          <TextField
            {...control.register(`parameters.${index}.key` as const)}
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
            {...control.register(`parameters.${index}.value` as const)}
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
        variant="outlined"
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => append({ key: '', value: '' } as IParameter)}
        disabled={isAddButtonDisabled}
        sx={{ mt: 1 }}
      >
        Add Parameter
      </Button>
    </Box>
  );
};
