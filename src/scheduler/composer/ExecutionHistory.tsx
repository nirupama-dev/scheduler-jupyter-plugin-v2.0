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

import React, { useEffect, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickersDayProps, PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs, { Dayjs } from 'dayjs';
import ListDagRuns from './ListDagRuns';
import { LabIcon } from '@jupyterlab/ui-components';
import LeftArrowIcon from '../../../style/icons/left_arrow_icon.svg';
import ListDagTaskInstances from './ListDagTaskInstances';
import { Box, LinearProgress } from '@mui/material';
import { handleDebounce } from '../../utils/Config';
import {
  IconFailedCircle,
  IconGreyCircle,
  IconOrangeCircle,
  IconSuccessCircle
} from '../../utils/Icons';

const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});

const ExecutionHistory = ({
  composerName,
  dagId,
  handleBackButton,
  bucketName,
  setExecutionPageFlag
}: {
  composerName: string;
  dagId: string;
  handleBackButton: () => void;
  bucketName: string;
  setExecutionPageFlag: (value: boolean) => void;
}): JSX.Element => {
  const [dagRunId, setDagRunId] = useState('');
  const currentDate = new Date().toLocaleDateString();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [greyListDates, setGreyListDates] = useState<string[]>([]);
  const [orangeListDates, setOrangeListDates] = useState<string[]>([]);
  const [redListDates, setRedListDates] = useState<string[]>([]);
  const [greenListDates, setGreenListDates] = useState<string[]>([]);
  const [darkGreenListDates, setDarkGreenListDates] = useState<string[]>([]);

  const [height, setHeight] = useState(window.innerHeight - 145);

  function handleUpdateHeight() {
    const updateHeight = window.innerHeight - 145;
    setHeight(updateHeight);
  }

  // Debounce the handleUpdateHeight function
  const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

  // Add event listener for window resize using useEffect
  useEffect(() => {
    window.addEventListener('resize', debouncedHandleUpdateHeight);

    // Cleanup function to remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', debouncedHandleUpdateHeight);
    };
  }, []);

  const handleDateSelection = (selectedValue: any) => {
    setDagRunId('');
    setSelectedDate(selectedValue);
  };

  /**
   * Checks if the given day is included in the provided date list.
   * @param {string[]} dateList - List of dates in any valid date string/format.
   * @param {string | number | Date | dayjs.Dayjs | null | undefined} day - The date to format and check.
   * @returns {boolean} - Whether the formatted day exists in the date list.
   */
  const getFormattedDate = (
    dateList: string[],
    day: string | number | Date | dayjs.Dayjs | null | undefined
  ) => {
    const formattedDay = dayjs(day).format('YYYY-MM-DD');
    const date_list = dateList
      .map(
        (dateStr: string | number | Date) =>
          new Date(dateStr).toISOString().split('T')[0]
      )
      .includes(formattedDay);
    return date_list;
  };

  const CustomDay = (props: PickersDayProps<Dayjs>) => {
    const { day, isFirstVisibleCell, isLastVisibleCell, disabled } = props;
    if (isFirstVisibleCell) {
      setStartDate(new Date(day.toDate()).toISOString());
    }
    if (isLastVisibleCell) {
      const nextDate = new Date(day.toDate());
      nextDate.setDate(day.toDate().getDate() + 1);
      setEndDate(nextDate.toISOString());
    }

    // Format day into a string that matches the date strings in the lists
    const isSelectedExecution = selectedDate
      ? selectedDate.date() === day.date() &&
        selectedDate.month() === day.month()
      : false;

    const dateSelected = selectedDate
      ? new Date(selectedDate.toDate()).toDateString().split(' ')[2]
      : null;

    // Check if the date matches the respective statuses
    const isGreyExecution = getFormattedDate(greyListDates, day);
    const isOrangeExecution = getFormattedDate(orangeListDates, day);
    console.log('isOrangeExecution', isOrangeExecution);
    const isRedExecution = getFormattedDate(redListDates, day);
    const isGreenExecution = getFormattedDate(greenListDates, day);
    const isDarkGreenExecution = getFormattedDate(darkGreenListDates, day);

    // Check if the day is today
    const isToday = day.isSame(new Date(), 'day');

    // Background and text color based on conditions
    let backgroundColor = 'transparent'; // Default transparent
    let borderColor = 'none';
    let textColor = 'inherit';
    let opacity = 1;
    day;
    let fontWeight = 'normal';

    // Case 1: If today is selected
    if (isToday && isSelectedExecution) {
      textColor = '#0C67DF';
      fontWeight = 'bold';

      // Set background and border colors based on execution status
      if (isGreyExecution) {
        backgroundColor = '#7474740F';
        borderColor = '2px solid #747474';
      } else if (isGreenExecution && isRedExecution) {
        backgroundColor = '#E374000F';
        borderColor = '2px solid #E37400';
      } else if (isGreenExecution && !isRedExecution) {
        backgroundColor = '#1880380F';
        borderColor = '2px solid #188038';
      } else if (isRedExecution && !isGreenExecution) {
        backgroundColor = '#B3261E0F';
        borderColor = '2px solid #B3261E';
      }
    }
    // Case 2: If today is not selected but it's today
    else if (isToday) {
      textColor = '#0C67DF';
      fontWeight = 'bold';
    }

    // Case 3: If selected date has a background color (blue, green, etc.)
    else if (isDarkGreenExecution) {
      textColor = '#454746';
      backgroundColor = '#1880380F';
      borderColor = '2px solid #188038';
    } else if (isGreyExecution && isSelectedExecution) {
      textColor = '#454746';
      backgroundColor = '#7474740F';
      borderColor = '2px solid #747474';
    } else if (isGreenExecution && isRedExecution && isSelectedExecution) {
      textColor = '#454746';
      backgroundColor = '#E374000F';
      borderColor = '2px solid #E37400';
    } else if (isGreenExecution && isSelectedExecution) {
      textColor = '#454746';
      backgroundColor = '#1880380F';
      borderColor = '2px solid #188038';
    } else if (isRedExecution && isSelectedExecution) {
      textColor = '#454746';
      backgroundColor = '#B3261E0F';
      borderColor = '2px solid #B3261E';
    }

    // Case 4: If the day is selected but without a background color (i.e., transparent background)
    if (isSelectedExecution && backgroundColor === 'transparent') {
      backgroundColor = 'transparent';
      borderColor = '2px solid #3B78E7';
    }

    // Reduce opacity for past and future dates
    if (disabled) {
      opacity = 0.5;
    }

    return (
      <div className="calender-date-time-wrapper">
        <PickersDay
          {...props}
          style={{
            color: textColor,
            border: borderColor,
            borderRadius:
              backgroundColor !== 'transparent' ||
              isSelectedExecution ||
              isToday
                ? '50%'
                : 'none',
            opacity: opacity,
            backgroundColor: backgroundColor,
            fontWeight: fontWeight,
            transition: 'border 0.3s ease-out'
          }}
          sx={{
            // Reset PickersDay's default hover styles if they conflict
            '&:hover': {
              backgroundColor: !isSelectedExecution
                ? '#1F1F1F0F !important'
                : 'transparent !important', // Suppress default PickersDay hover
              borderRadius: '50%'
            },
            // Reset selected hover if needed
            '&.Mui-selected:hover': {
              backgroundColor: 'transparent !important'
            },
            // Ensure its text color is managed by the parent div
            color: 'inherit', // Inherit color from parent div
            // Remove its own background so wrapper can control it
            backgroundColor: 'transparent',
            transition: 'none'
          }}
        />

        {/* Render status icons based on conditions */}

        {(isGreyExecution && !isSelectedExecution) ||
        (isGreyExecution && isToday && !isSelectedExecution) ? (
          <div
            className={
              dateSelected && dateSelected[0] === '0'
                ? 'calender-status-icon'
                : 'calender-status-icon calendar-status-icon-double'
            }
          >
            <IconGreyCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ) : (!isSelectedExecution && isRedExecution && isGreenExecution) ||
          (isGreenExecution &&
            isRedExecution &&
            isToday &&
            !isSelectedExecution) ? (
          <div
            className={
              dateSelected && dateSelected[0] === '0'
                ? 'calender-status-icon'
                : 'calender-status-icon calendar-status-icon-double'
            }
          >
            <IconOrangeCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ) : (!isSelectedExecution && isRedExecution && !isGreenExecution) ||
          (!isGreenExecution &&
            isRedExecution &&
            isToday &&
            !isSelectedExecution) ? (
          <div
            className={
              dateSelected && dateSelected[0] === '0'
                ? 'calender-status-icon'
                : 'calender-status-icon calendar-status-icon-double'
            }
          >
            <IconFailedCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ) : (!isSelectedExecution && isGreenExecution && !isRedExecution) ||
          (isGreenExecution &&
            !isRedExecution &&
            isToday &&
            !isSelectedExecution) ? (
          <div
            className={
              dateSelected && dateSelected[0] === '0'
                ? 'calender-status-icon'
                : 'calender-status-icon calendar-status-icon-double'
            }
          >
            <IconSuccessCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        ) : (
          ((isDarkGreenExecution && !isSelectedExecution) ||
            (isDarkGreenExecution && isToday && !isSelectedExecution)) && (
            <div
              className={
                dateSelected && dateSelected[0] === '0'
                  ? 'calender-status-icon'
                  : 'calender-status-icon calendar-status-icon-double'
              }
            >
              <IconSuccessCircle.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          )
        )}
      </div>
    );
  };

  useEffect(() => {
    setSelectedDate(dayjs(currentDate));
    setExecutionPageFlag(false);
  }, []);

  return (
    <>
      <>
        <div className="execution-history-header">
          <div
            role="button"
            className="scheduler-back-arrow-icon"
            onClick={() => handleBackButton()}
          >
            <iconLeftArrow.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
          <div className="create-job-scheduler-title">
            Execution History: {dagId}
          </div>
        </div>
        <div
          className="execution-history-main-wrapper"
          style={{ height: height }}
        >
          <div className="execution-history-left-wrapper">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {isLoading ? (
                <div className="spin-loader-main-execution-history">
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                  </Box>
                </div>
              ) : (
                <div
                  className="spin-loader-main-execution-history"
                  style={{ height: '4px' }}
                ></div>
              )}
              <DateCalendar
                minDate={dayjs().year(2024).startOf('year')}
                maxDate={dayjs(currentDate)}
                referenceDate={dayjs(currentDate)}
                onChange={newValue => handleDateSelection(newValue)}
                slots={{
                  day: CustomDay
                }}
              />
            </LocalizationProvider>
            {startDate !== '' && endDate !== '' && (
              <ListDagRuns
                composerName={composerName}
                dagId={dagId}
                startDate={startDate}
                endDate={endDate}
                setDagRunId={setDagRunId}
                selectedDate={selectedDate}
                setGreyListDates={setGreyListDates}
                setOrangeListDates={setOrangeListDates}
                setRedListDates={setRedListDates}
                setGreenListDates={setGreenListDates}
                setDarkGreenListDates={setDarkGreenListDates}
                bucketName={bucketName}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            )}
          </div>
          <div className="execution-history-right-wrapper">
            {dagRunId !== '' && (
              <ListDagTaskInstances
                composerName={composerName}
                dagId={dagId}
                dagRunId={dagRunId}
              />
            )}
          </div>
        </div>
      </>
    </>
  );
};

export default ExecutionHistory;
