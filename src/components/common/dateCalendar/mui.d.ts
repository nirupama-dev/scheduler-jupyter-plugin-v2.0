/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DayCalendarProps } from '@mui/x-date-pickers/internals';

declare module '@mui/x-date-pickers/DateCalendar/DateCalendar' {
  interface DayCalendarProps<TDate> {
    selectedDate?: TDate | null;
    greyListDates?: string[];
    redListDates?: string[];
    greenListDates?: string[];
    darkGreenListDates?: string[];
  }
}

declare module '@mui/x-date-pickers/PickersDay' {
  interface PickersDayProps<TDate> {
    selectedDate?: TDate | null;
    greyListDates?: string[];
    redListDates?: string[];
    greenListDates?: string[];
    darkGreenListDates?: string[];
  }
}
