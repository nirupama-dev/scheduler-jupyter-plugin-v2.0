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

import { UseFormSetValue } from 'react-hook-form';

export interface FormInputProps {
  name: string;
  control: any;
  label?: string;
  setValue?: any;
  className?: string;
  options?: Array<{ label: string; value: string }>;
  type?: string;
}

export interface FormInputDropdownProps {
  name: string;
  control: any;
  options: Array<{ label: string; value: string }>;
  label?: string;
  setValue?: any;
  className?: string;
}

// Define the shape of a single option
export interface Option {
  label: string;
  value: any;
  disabled?: boolean; // Add a disabled property
  defaultChecked?: boolean; // Add a defaultChecked property for initial state
}

// Define the props for the FormInputMultiCheckbox component
export interface FormInputCheckboxProps {
  name: string;
  control: any; // Type from react-hook-form's useForm hook
  setValue: UseFormSetValue<any>; // Type from react-hook-form's useForm hook
  options: Option[]; // Use the new Option interface
  label?: string;
}
