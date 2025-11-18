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
import dayjs from 'dayjs';
import { IVertexCellProps } from '../../../interfaces/VertexInterface';
import {
  iconDash,
  iconSuccess,
  iconFailed,
  iconPending,
  iconActive,
  iconListPause,
  iconListCompleteWithError
} from '../../../utils/Icons';
import { CircularProgress } from '@mui/material';

export const rowDataList = (
  cell: IVertexCellProps,
  handleScheduleIdSelection: (schedulerData: any, scheduleName: string) => void
) => {
  if (cell.column.Header === 'Schedule Name') {
    return (
      <td
        {...cell.getCellProps()}
        className="scheduler-table-data table-cell-overflow"
      >
        <span
          onClick={() =>
            handleScheduleIdSelection(cell.row.original, cell.value)
          }
        >
          {cell.value}
        </span>
      </td>
    );
  } else if (cell.column.Header === 'Created') {
    return (
      <td
        {...cell.getCellProps()}
        className="scheduler-table-data table-cell-overflow"
      >
        {dayjs(cell.row.original.createTime).format('MMM DD, YYYY h:mm A')}
      </td>
    );
  } else if (cell.column.Header === 'Next Run Date') {
    return (
      <td
        {...cell.getCellProps()}
        className="scheduler-table-data table-cell-overflow"
      >
        {cell.row.original.status === 'COMPLETED' ||
        cell.row.original.status === 'PAUSED' ? (
          <iconDash.react tag="div" />
        ) : (
          dayjs(cell.row.original.nextRunTime).format('lll')
        )}
      </td>
    );
  } else if (cell.column.Header === 'Latest Execution Jobs') {
    return (
      <td
        {...cell.getCellProps()}
        className="scheduler-table-data table-cell-overflow"
      >
        {cell.row.original.jobState ? (
          cell.row.original.jobState.length > 0 ? (
            <div className="horizontal-element-wrapper">
              {cell.row.original.jobState.map(job => {
                return (
                  <>
                    {job === 'JOB_STATE_SUCCEEDED' ? (
                      <iconSuccess.react
                        tag="div"
                        title={job}
                        className="icon-white logo-alignment-style success_icon icon-size icon-completed"
                      />
                    ) : job === 'JOB_STATE_FAILED' ||
                      job === 'JOB_STATE_EXPIRED' ||
                      job === 'JOB_STATE_PARTIALLY_SUCCEEDED' ? (
                      <iconFailed.react
                        tag="div"
                        title={job}
                        className="logo-alignment-style success_icon icon-size icon-completed"
                      />
                    ) : (
                      <iconPending.react
                        tag="div"
                        title={job}
                        className="logo-alignment-style success_icon icon-size icon-completed"
                      />
                    )}
                  </>
                );
              })}
            </div>
          ) : null
        ) : (
          <CircularProgress
            className="spin-loader-custom-style"
            size={18}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        )}
      </td>
    );
  } else {
    const alignIcon =
      cell.row.original.status === 'ACTIVE' ||
      cell.row.original.status === 'PAUSED' ||
      cell.row.original.status === 'COMPLETED';

    const { status, lastScheduledRunResponse } = cell.row.original;
    const runResponse = lastScheduledRunResponse
      ? lastScheduledRunResponse.runResponse
      : '';

    const getStatusIcon = () => {
      type StatusKey = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
      const allowedStatuses: ReadonlyArray<StatusKey> = [
        'ACTIVE',
        'PAUSED',
        'COMPLETED'
      ];
      const iconMap: {
        [key in StatusKey | 'default']: () => React.ReactElement;
      } = {
        ACTIVE: () => (
          <iconActive.react
            tag="div"
            title="ACTIVE"
            className="icon-white logo-alignment-style success_icon icon-size-status"
          />
        ),
        PAUSED: () => (
          <iconListPause.react
            tag="div"
            title="PAUSE"
            className="icon-white logo-alignment-style success_icon icon-size"
          />
        ),
        COMPLETED: () => {
          if (!lastScheduledRunResponse) {
            return (
              <div>
                <iconSuccess.react
                  tag="div"
                  title="COMPLETED"
                  className="icon-white logo-alignment-style success_icon icon-size icon-completed"
                />
              </div>
            );
          }
          if (runResponse !== 'OK') {
            return (
              <div>
                <iconListCompleteWithError.react
                  tag="div"
                  title={runResponse}
                  className="icon-white logo-alignment-style success_icon icon-size-status"
                />
              </div>
            );
          }
          return (
            <div>
              <iconSuccess.react
                tag="div"
                title="COMPLETED"
                className="icon-white logo-alignment-style success_icon icon-size icon-completed"
              />
            </div>
          );
        },
        default: () => (
          <div>
            <iconFailed.react
              tag="div"
              title={!lastScheduledRunResponse ? 'Not started' : runResponse}
              className="icon-white logo-alignment-style success_icon icon-size"
            />
          </div>
        )
      };

      return allowedStatuses.includes(status as StatusKey)
        ? iconMap[status as StatusKey]()
        : iconMap.default();
    };

    return (
      <td
        {...cell.getCellProps()}
        className={
          cell.column.Header === 'Schedule'
            ? 'scheduler-table-data table-cell-overflow'
            : 'scheduler-table-data'
        }
      >
        {cell.column.Header === 'Status' ? (
          <>
            <div className="horizontal-element-wrapper">
              {getStatusIcon()}
              <div className={alignIcon ? 'text-icon' : ''}>
                {cell.render('Cell')}
              </div>
            </div>
          </>
        ) : (
          <div className="cell-width-listing">{cell.render('Cell')}</div>
        )}
      </td>
    );
  }
};
