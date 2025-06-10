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
import { Box, LinearProgress } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { authApi } from '../../utils/Config';
import VertexJobRuns from './VertexJobRuns';
import {
  iconLeftArrow,
  iconCreateCluster,
  IconSuccessCircle,
  IconFailedCircle,
  IconOrangeCircle,
  IconGreyCircle
} from '../../utils/Icons';
import {
  IActivePaginationVariables,
  ISchedulerData,
  IVertexScheduleRunList
} from './VertexInterfaces';
import { LOG_EXPLORER_BASE_URL, VIEW_CLOUD_LOGS } from '../../utils/Const';
import { toast } from 'react-toastify';

const VertexExecutionHistory = ({
  region,
  setRegion,
  schedulerData,
  scheduleName,
  handleBackButton,
  setExecutionPageFlag,
  setExecutionPageListFlag,
  abortControllers,
  abortApiCall,
  activePaginationVariables
}: {
  region: string;
  setRegion: (value: string) => void;
  schedulerData: ISchedulerData | undefined;
  scheduleName: string;
  handleBackButton: (
    value: IActivePaginationVariables | undefined | null,
    region: string
  ) => void;
  setExecutionPageFlag: (value: boolean) => void;
  setExecutionPageListFlag: (value: boolean) => void;
  abortControllers: any;
  abortApiCall: () => void;
  activePaginationVariables: IActivePaginationVariables | null | undefined;
}): JSX.Element => {
  const today = dayjs();

  const [jobRunId, setJobRunId] = useState<string>('');
  const [vertexScheduleRunsList, setVertexScheduleRunsList] = useState<
    IVertexScheduleRunList[]
  >([]);
  const [jobRunsData, setJobRunsData] = useState<
    IVertexScheduleRunList | undefined
  >();
  const currentDate = new Date().toLocaleDateString();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [greyListDates, setGreyListDates] = useState<string[]>([]);
  const [orangeListDates, setOrangeListDates] = useState<string[]>([]);
  const [redListDates, setRedListDates] = useState<string[]>([]);
  const [greenListDates, setGreenListDates] = useState<string[]>([]);
  const [darkGreenListDates, setDarkGreenListDates] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    authApi()
      .then(credentials => {
        if (credentials && credentials?.region_id && credentials.project_id) {
          region ? null : setRegion(credentials.region_id);
        }
      })
      .catch(error => {
        console.error(error);
      });
    setSelectedMonth(dayjs(currentDate));
    setSelectedDate(dayjs(currentDate));
    setExecutionPageFlag(false);
    setExecutionPageListFlag(true);

    return () => {
      setExecutionPageListFlag(false);
      abortApiCall();
    };
  }, []);

  /**
   * Handles Date selection
   * @param {React.SetStateAction<dayjs.Dayjs | null>} selectedValue selected kernel
   */
  const handleDateSelection = (
    selectedValue: React.SetStateAction<dayjs.Dayjs | null>
  ) => {
    setJobRunId('');
    setSelectedDate(selectedValue);
  };

  /**
   * Handles Month selection
   * @param {React.SetStateAction<dayjs.Dayjs | null>} newMonth selected kernel
   */
  const handleMonthChange = (
    newMonth: React.SetStateAction<dayjs.Dayjs | null>
  ) => {
    const resolvedMonth =
      typeof newMonth === 'function' ? newMonth(today) : newMonth;

    if (!resolvedMonth) {
      setSelectedDate(null);
      setSelectedMonth(null);
      return;
    }

    if (resolvedMonth.month() !== today.month()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(today);
    }
    setJobRunId('');
    setVertexScheduleRunsList([]);
    setSelectedMonth(resolvedMonth);
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

  /**
   * CustomDay component for rendering a styled day in a date picker.
   * @param {PickersDayProps<Dayjs>} props
   * @returns JSX.Element
   */
  const CustomDay = (props: PickersDayProps<Dayjs>) => {
    const { day, disabled } = props;

    // Format day into a string that matches the date strings in the lists
    const isSelectedExecution = selectedDate
      ? selectedDate.date() === day.date() &&
        selectedDate.month() === day.month()
      : false;

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
                  borderRadius: '50%',
            },
            // Reset selected hover if needed
            '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
            },
            // Ensure its text color is managed by the parent div
            color: 'inherit', // Inherit color from parent div
            // Remove its own background so wrapper can control it
            backgroundColor: 'transparent',
            transition: 'none'
          }}
        />

        {/* Render status icons based on conditions */}

        {((isDarkGreenExecution && !isSelectedExecution) ||
          (isDarkGreenExecution && isToday && !isSelectedExecution)) && (
          <div className="calender-status-icon">
            <IconSuccessCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}

        {((isGreyExecution && !isSelectedExecution) ||
          (isGreyExecution && isToday && !isSelectedExecution)) && (
          <div className="calender-status-icon">
            <IconGreyCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}

        {((!isSelectedExecution && isGreenExecution && !isRedExecution) ||
          (isGreenExecution &&
            !isRedExecution &&
            isToday &&
            !isSelectedExecution)) && (
          <div className="calender-status-icon">
            <IconSuccessCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}

        {((!isSelectedExecution && isRedExecution && !isGreenExecution) ||
          (!isGreenExecution &&
            isRedExecution &&
            isToday &&
            !isSelectedExecution)) && (
          <div className="calender-status-icon">
            <IconFailedCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}

        {((!isSelectedExecution && isRedExecution && isGreenExecution) ||
          (isGreenExecution &&
            isRedExecution &&
            isToday &&
            !isSelectedExecution)) && (
          <div className="calender-status-icon">
            <IconOrangeCircle.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}
      </div>
    );
  };

  /**
   *  Redirect to pantheon cloud logs
   */
  const handleLogs = async () => {
    const logExplorerUrl = new URL(LOG_EXPLORER_BASE_URL);
    logExplorerUrl.searchParams.set('query', jobRunId);
    if (jobRunsData?.startDate) {
      logExplorerUrl.searchParams.set('cursorTimestamp', jobRunsData.startDate);
    }
    logExplorerUrl.searchParams.set('project', projectId);
    try {
      window.open(logExplorerUrl.toString());
    } catch (error) {
      console.error('Failed to open Log Explorer window:', error);
    }
  };

  useEffect(() => {
    authApi()
      .then(credentials => {
        if (credentials && credentials?.region_id && credentials.project_id) {
          setProjectId(credentials.project_id);
        }
      })
      .catch(error => {
        toast.error(error);
      });
  }, [projectId]);

  return (
    <>
      <div className="execution-history-main-wrapper">
        <div className="execution-history-header">
          <div
            role="button"
            className="scheduler-back-arrow-icon"
            onClick={() => handleBackButton(activePaginationVariables, region)}
          >
            <iconLeftArrow.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
          <div className="create-job-scheduler-title">
            Execution History: {scheduleName}
          </div>
        </div>
        <div className="log-btn right-panel-wrapper">
          <div
            className="execution-history-main-wrapper"
            role="button"
            onClick={handleLogs}
          >
            <div className="create-icon log-icon cursor-icon">
              <iconCreateCluster.react
                tag="div"
                className="logo-alignment-style"
              />
            </div>
            <div className="create-text cursor-icon">{VIEW_CLOUD_LOGS}</div>
          </div>
        </div>
      </div>

      <div className="execution-history-main-full-wrapper execution-top-border">
        <div className="execution-history-full-wrapper execution-wrapper-border-none">
          {isLoading ? (
            <div className="spin-loader-main-execution-history">
              <Box sx={{ width: '100%', height: '1px' }}>
                <LinearProgress />
              </Box>
            </div>
          ) : (
            <div
              className="spin-loader-main-execution-history"
              style={{ height: '4px' }}
            ></div>
          )}
        </div>
        <div className="execution-history-main-wrapper">
          <div
            className={
              'execution-history-left-wrapper calender-top execution-wrapper-border-none'
            }
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                minDate={dayjs(schedulerData?.createTime)}
                maxDate={dayjs(currentDate)}
                referenceDate={today}
                onChange={newValue => handleDateSelection(newValue)}
                onMonthChange={handleMonthChange}
                slots={{
                  day: CustomDay
                }}
                className="date-box-shadow"
              />
            </LocalizationProvider>
          </div>
          <div className="execution-history-right-wrapper execution-history-right-wrapper-scroll execution-wrapper-border-none success-message-top">
            <VertexJobRuns
              region={region}
              schedulerData={schedulerData}
              scheduleName={scheduleName}
              setJobRunsData={setJobRunsData}
              setJobRunId={setJobRunId}
              selectedMonth={selectedMonth}
              selectedDate={selectedDate}
              setGreyListDates={setGreyListDates}
              setOrangeListDates={setOrangeListDates}
              setRedListDates={setRedListDates}
              setGreenListDates={setGreenListDates}
              setDarkGreenListDates={setDarkGreenListDates}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              vertexScheduleRunsList={vertexScheduleRunsList}
              setVertexScheduleRunsList={setVertexScheduleRunsList}
              abortControllers={abortControllers}
              abortApiCall={abortApiCall}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default VertexExecutionHistory;
