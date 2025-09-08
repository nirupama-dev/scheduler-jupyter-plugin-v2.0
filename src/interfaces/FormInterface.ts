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

import { Control, FieldError, Path } from 'react-hook-form';
import { CombinedCreateFormValues } from '../schemas/CreateScheduleCombinedSchema';
import { ILabelValue } from './CommonInterface';

export interface IFormInputProps {
  name: Path<CombinedCreateFormValues>;
  control: Control<CombinedCreateFormValues>;
  label?: string;
  setValue?: any;
  className?: string;
  options?: Array<{ label: string; value: string }>;
  error?: FieldError;
  [key: string]: any; // Allow additional props
  type?: string;
  hostProject?: any;
  disabled?: boolean;
}

export interface IFormInput {
  textValue: string;
  radioValue: string;
  checkboxValue: string[];
  dateValue: Date;
  dropdownValue: string;
  type?: string;
}

// Define the specific option type
export interface IDropdownOption {
  label: string;
  value: string;
}

export interface IEnvDropDownOption extends IDropdownOption {
  state: string;
}

export interface IFormInputDropdownProps<OptionType = ILabelValue<string>> {
  name: Path<CombinedCreateFormValues>;
  control: Control<CombinedCreateFormValues>;
  options: Array<{ label: string; value: any }> | [];
  label?: string;
  setValue?: any;
  className?: string;
  customClass?: string;
  error?: FieldError;
  onChangeCallback?: (value: any) => void;
  loading?: boolean;
  filterOptions?: any;
  getOptionLabel?: any;
  isOptionEqualToValue?: (
    option: OptionType,
    value: string | any | null | undefined
  ) => boolean;
  getOptionValue?: any;
  disabled?: boolean;
  getOptionDisabled?: (option: OptionType) => boolean;
  renderOption?: any;
}

export interface IFormInputListingDropdownProps<
  OptionType = ILabelValue<string>
> {
  name: Path<any>;
  control: Control<any>;
  options: Array<{ label: string; value: any; state?: string }> | [];
  label?: string;
  setValue?: any;
  className?: string;
  customClass?: string;
  error?: FieldError;
  onChangeCallback?: (value: any) => void;
  loading?: boolean;
  filterOptions?: any;
  getOptionLabel?: any;
  isOptionEqualToValue?: (option: OptionType, value: any) => boolean;
  getOptionValue?: any;
  disabled?: boolean;
  getOptionDisabled?: (option: OptionType) => boolean;
  renderOption?: any;
}

// Define the shape of a single option
export interface IOption {
  label: string;
  value: any;
  disabled?: boolean; // Add a disabled property
  defaultChecked?: boolean; // Add a defaultChecked property for initial state
}

// Define the props for the FormInputMultiCheckbox component
export interface IFormInputCheckboxProps {
  name: string;
  control: any; // Type from react-hook-form's useForm hook
  label?: string;
  isChecked?: boolean; // Optional prop to control the checked state
  disabled?: boolean; // Optional prop to disable the checkbox
  className?: string; // Optional prop for additional styling
}

export interface IErrorMessageProps {
  message: string | FieldError | undefined;
  showIcon?: boolean; // Optional prop to show/hide an icon
  errorWidth?: boolean; // Optional prop to control width
}
