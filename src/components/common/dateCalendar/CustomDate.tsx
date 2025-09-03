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
import React, { useMemo } from 'react';
import { PickersDay } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  IconFailedCircle,
  IconGreyCircle,
  IconOrangeCircle,
  IconSuccessCircle
} from '../../../utils/Icons';
import { ICustomDateProps } from '../../../interfaces/VertexInterface';

export default function CustomDate(props: ICustomDateProps) {
  const {
    selectedDate,
    greyListDates,
    redListDates,
    greenListDates,
    darkGreenListDates,
    isLoading,
    ...dateProps
  } = props;
  const { day, disabled } = dateProps;

  const { greyDates, redDates, greenDates, darkGreenDates } = useMemo(() => {
    const formatDate = (date: string | dayjs.Dayjs) =>
      dayjs(date).format('YYYY-MM-DD');
    return {
      greyDates: new Set(greyListDates?.map(formatDate)),
      redDates: new Set(redListDates?.map(formatDate)),
      greenDates: new Set(greenListDates?.map(formatDate)),
      darkGreenDates: new Set(darkGreenListDates?.map(formatDate))
    };
  }, [greyListDates, redListDates, greenListDates, darkGreenListDates]);

  const dateInfo = useMemo(() => {
    const formattedDay = day.format('YYYY-MM-DD');
    const isSelected = selectedDate ? selectedDate.isSame(day, 'day') : false;
    const isToday = day.isSame(dayjs(), 'day');

    const isGrey = greyDates.has(formattedDay);
    const isRed = redDates.has(formattedDay);
    const isGreen = greenDates.has(formattedDay);
    const isDarkGreen = darkGreenDates.has(formattedDay);

    const style = {
      backgroundColor: 'transparent',
      borderColor: 'none',
      textColor: 'inherit',
      fontWeight: 'normal'
    };
    let StatusIcon = null;

    if (isGrey) {
      if (!isSelected) {
        StatusIcon = IconGreyCircle;
      } else {
        style.backgroundColor = '#7474740F';
        style.borderColor = '2px solid #747474';
      }
    }
    if (isGreen && isRed) {
      if (!isSelected) {
        StatusIcon = IconOrangeCircle;
      } else {
        style.backgroundColor = '#E374000F';
        style.borderColor = '2px solid #E37400';
      }
    } else if (isRed) {
      if (!isSelected) {
        StatusIcon = IconFailedCircle;
      } else {
        style.backgroundColor = '#B3261E0F';
        style.borderColor = '2px solid #B3261E';
      }
    } else if (isGreen || isDarkGreen) {
      if (!isSelected) {
        StatusIcon = IconSuccessCircle;
      } else {
        style.backgroundColor = '#1880380F';
        style.borderColor = '2px solid #188038';
      }
    }

    if (isSelected) {
      if (style.backgroundColor === 'transparent') {
        style.borderColor = '2px solid #3B78E7';
      }
    }

    if (isToday) {
      style.textColor = '#0C67DF';
      style.fontWeight = 'bold';
    } else if (isSelected) {
      style.textColor = '#454746';
    }

    const opacity = disabled ? 0.5 : 1;

    return {
      ...style,
      opacity,
      StatusIcon,
      isSelected,
      isToday
    };
  }, [
    day,
    selectedDate,
    greyDates,
    redDates,
    greenDates,
    darkGreenDates,
    disabled
  ]);

  return (
    <div className="calender-date-time-wrapper">
      <PickersDay
        {...dateProps}
        style={{
          color: dateInfo.textColor,
          border: dateInfo.borderColor,
          borderRadius:
            dateInfo.backgroundColor !== 'transparent' ||
            dateInfo.isSelected ||
            dateInfo.isToday
              ? '50%'
              : 'none',
          opacity: dateInfo.opacity,
          backgroundColor: dateInfo.backgroundColor,
          fontWeight: dateInfo.fontWeight,
          transition: 'border 0.3s ease-out'
        }}
        sx={{
          '&:hover': {
            backgroundColor: !dateInfo.isSelected
              ? '#1F1F1F0F !important'
              : 'transparent !important',
            borderRadius: '50%'
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'transparent !important'
          },
          color: 'inherit',
          backgroundColor: 'transparent',
          transition: 'none'
        }}
      />
      {dateInfo.StatusIcon && !dateInfo.isSelected && !isLoading && (
        <div
          className={
            day.date() > 9
              ? 'calender-status-icon'
              : 'calender-status-icon calendar-status-icon-double'
          }
        >
          <dateInfo.StatusIcon.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
      )}
    </div>
  );
}
