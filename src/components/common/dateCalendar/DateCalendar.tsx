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

import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import CustomDate from './CustomDate';

const ExecutionCalendar = ({
  createTime,
  currentDate,
  selectedDate,
  handleDateSelection,
  handleMonthChange,
  greyListDates,
  redListDates,
  greenListDates,
  darkGreenListDates,
  isLoading
}: any) => (
  <div className="execution-history-left-wrapper calender-top execution-wrapper-border-none">
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        minDate={dayjs(createTime)}
        maxDate={dayjs(currentDate)}
        referenceDate={dayjs(currentDate)}
        onChange={handleDateSelection}
        onMonthChange={handleMonthChange}
        slots={{ day: CustomDate }}
        className="date-box-shadow"
        slotProps={{
          day: {
            selectedDate,
            greyListDates,
            redListDates,
            greenListDates,
            darkGreenListDates,
            isLoading
          }
        }}
      />
    </LocalizationProvider>
  </div>
);

export default ExecutionCalendar;
