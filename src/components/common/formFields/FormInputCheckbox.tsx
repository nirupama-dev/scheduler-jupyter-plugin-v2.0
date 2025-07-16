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

/**
 * Initialization data for the scheduler-jupyter-plugin extension.
 * Parent component for createVertexSchedule.tsx and CreateComposerSchedule.tsx
 */

import React, { useEffect, useState } from 'react';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import { Controller } from 'react-hook-form';
import {
  FormInputCheckboxProps,
  Option
} from '../../../interfaces/FormInterface';

// const options = [
//   {
//     label: "Checkbox Option 1",
//     value: "1",
//   },
//   {
//     label: "Checkbox Option 2",
//     value: "2",
//   },
// ];

export const FormInputMultiCheckbox: React.FC<FormInputCheckboxProps> = ({
  name,
  control,
  setValue,
  options = [],
  label
}) => {
  const [selectedItems, setSelectedItems] = useState<any[]>(() => {
    // Initialize selectedItems with values that are defaultChecked
    return options
      .filter(option => option.defaultChecked)
      .map(option => option.value);
  });

  // Effect to set the form value when selectedItems changes
  useEffect(() => {
    setValue(name, selectedItems);
  }, [name, selectedItems, setValue]);

  // Handle selection manually (only for non-disabled items)
  const handleSelect = (value: any, isDisabled: boolean) => {
    if (isDisabled) {
      return; // Do nothing if the checkbox is disabled
    }

    const isPresent = selectedItems.includes(value);
    if (isPresent) {
      const remaining = selectedItems.filter((item: any) => item !== value);
      setSelectedItems(remaining);
    } else {
      setSelectedItems((prevItems: any[]) => [...prevItems, value]);
    }
  };

  return (
    <FormControl size={'small'} variant={'outlined'}>
      <FormLabel component="legend">{label}</FormLabel>

      <div>
        {options.map((option: Option) => {
          const isChecked = selectedItems.includes(option.value);
          const isDisabled = option.disabled || false; // Ensure isDisabled is boolean

          return (
            <FormControlLabel
              control={
                <Controller
                  name={name}
                  render={({ field }) => {
                    // We're manually managing checked state and onChange here,
                    // so `field.value` and `field.onChange` are less critical
                    // for the individual checkbox, but `field.name` and `field.onBlur`
                    // are still handled by Controller if needed.
                    return (
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleSelect(option.value, isDisabled)}
                        disabled={isDisabled} // Apply disabled prop here
                      />
                    );
                  }}
                  control={control}
                />
              }
              label={option.label}
              key={option.value}
              disabled={isDisabled} // Also disable the label visually
            />
          );
        })}
      </div>
    </FormControl>
  );
};
