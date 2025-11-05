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

import React, { useCallback, useMemo } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import dayjs from 'dayjs';
import TableData from '../../common/table/TableData';
import { iconDash } from '../../../utils/Icons';
import VertexExecutionHistoryActions from './VertexExecutionHistoryActions';
import {
  IVertexExecutionHistoryCellProps,
  IScheduleRunFiltered
} from '../../../interfaces/VertexInterface';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import {
  EXECUTION_DATE_SELECTION_HELPER_TEXT,
  EXECUTION_DATE_WITH_NO_DATA,
  NO_EXECUTION_FOUND,
  VERTEX_EXECUTION_HISTORY_SCHEDULE_RUN_LOADER_TEXT,
  VERTEX_EXECUTION_HISTORY_TABLE_HEADER
} from '../../../utils/Constants';

const VertexJobRuns = ({
  vertexScheduleRunsList,
  isLoading,
  selectedDate,
  dispatch,
  scheduleName,
  fileExists,
  hasScheduleExecutions,
  app
}: any) => {
  const filteredData = useMemo(() => {
    if (selectedDate) {
      const selectedDateString = selectedDate.toDate().toDateString();
      return vertexScheduleRunsList.filter(
        (scheduleRun: IScheduleRunFiltered) =>
          new Date(scheduleRun.date).toDateString() === selectedDateString
      );
    }
    return [];
  }, [vertexScheduleRunsList, selectedDate]);

  const columns = useMemo(() => VERTEX_EXECUTION_HISTORY_TABLE_HEADER, []);

  const tableInstance = useTable(
    {
      columns,
      data: filteredData,
      autoResetPage: false,
      initialState: { pageSize: filteredData.length }
    },
    useGlobalFilter
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page
  } = tableInstance;

  const tableDataCondition = useCallback(
    (cell: IVertexExecutionHistoryCellProps) => {
      switch (cell.column.Header) {
        case 'Actions':
          return (
            <td {...cell.getCellProps()} className="scheduler-table-data">
              <VertexExecutionHistoryActions
                data={cell.row.original}
                scheduleName={scheduleName}
                fileExists={fileExists}
                app={app}
              />
            </td>
          );
        case 'State': {
          const stateClasses = {
            succeeded: 'schedule-runs-table-data-state-success',
            failed: 'schedule-runs-table-data-state-failure',
            running: 'schedule-runs-table-data-state-running',
            queued: 'schedule-runs-table-data-state-queued table-right-space'
          };
          const className =
            stateClasses[cell.value as keyof typeof stateClasses] || '';
          return (
            <td
              {...cell.getCellProps()}
              className="scheduler-table-data padding-zero"
            >
              <div className={`${className} execution-state`}>
                {cell.render('Cell')}
              </div>
            </td>
          );
        }
        case 'Code':
        case 'Status Message':
          return (
            <td
              {...cell.getCellProps()}
              className={
                cell.column.Header === 'Code'
                  ? 'scheduler-table-data table-row-element-pad'
                  : 'scheduler-table-data table-col-status-align'
              }
            >
              {cell.value === '-' ? (
                <iconDash.react tag="div" />
              ) : (
                cell.render('Cell')
              )}
            </td>
          );
        case 'Date':
          return (
            <td
              {...cell.getCellProps()}
              className="scheduler-table-data table-cell-overflow"
            >
              {dayjs(cell.value).format('lll')}
            </td>
          );
        default:
          return (
            <td {...cell.getCellProps()} className="scheduler-table-data">
              {cell.render('Cell')}
            </td>
          );
      }
    },
    [
      scheduleName
      //abortControllers
    ]
  );

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner
          message={VERTEX_EXECUTION_HISTORY_SCHEDULE_RUN_LOADER_TEXT}
          messageClassName="element-space-sm"
          parentTagClassName="spin-loader-main"
        />
      ) : filteredData && filteredData.length > 0 ? (
        <div className="table-right-space">
          <div className="table-cell-flow table-execution-history-vertex">
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="vertexTaskLog"
            />
          </div>
        </div>
      ) : hasScheduleExecutions && !selectedDate ? (
        <div className="no-data-style">
          {EXECUTION_DATE_SELECTION_HELPER_TEXT}
        </div>
      ) : hasScheduleExecutions && selectedDate ? (
        <div className="no-data-style">
          {EXECUTION_DATE_WITH_NO_DATA}{' '}
          {dayjs(selectedDate).format('MMM D, YYYY')}
        </div>
      ) : (
        <div className="no-data-style">{NO_EXECUTION_FOUND}</div>
      )}
    </div>
  );
};

export default VertexJobRuns;
