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
 * Unless required by applicable law or agreed to in writing,
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useEffect, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { CircularProgress } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import TableData from '../../utils/TableData';
import { ICellProps } from '../../utils/Config';
import { iconDownload } from '../../utils/Icons';
import { IVertexScheduleRunList, ISchedulerData } from './VertexInterfaces';
import { VertexServices } from '../../services/Vertex';
import { StorageServices } from '../../services/Storage';
import { iconDash } from '../../utils/Icons';

const VertexJobRuns = ({
  region,
  schedulerData,
  scheduleName,
  setJobRunsData,
  setJobRunId,
  selectedMonth,
  selectedDate,
  setBlueListDates,
  setGreyListDates,
  setOrangeListDates,
  setRedListDates,
  setGreenListDates,
  setDarkGreenListDates,
  setIsLoading,
  isLoading,
  vertexScheduleRunsList,
  setVertexScheduleRunsList,
  abortControllers,
  abortApiCall
}: {
  region: string;
  schedulerData: ISchedulerData | undefined;
  scheduleName: string;
  setJobRunsData: React.Dispatch<
    React.SetStateAction<IVertexScheduleRunList | undefined>
  >;
  setJobRunId: (value: string) => void;
  selectedMonth: Dayjs | null;
  selectedDate: Dayjs | null;
  setBlueListDates: (value: string[]) => void;
  setGreyListDates: (value: string[]) => void;
  setOrangeListDates: (value: string[]) => void;
  setRedListDates: (value: string[]) => void;
  setGreenListDates: (value: string[]) => void;
  setDarkGreenListDates: (value: string[]) => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  vertexScheduleRunsList: IVertexScheduleRunList[];
  setVertexScheduleRunsList: (value: IVertexScheduleRunList[]) => void;
  abortControllers: any;
  abortApiCall: () => void;
}): JSX.Element => {
  const [jobDownloadLoading, setJobDownloadLoading] = useState(false);
  const [
    downloadOutputVertexScheduleRunId,
    setDownloadOutputVertexScheduleRunId
  ] = useState<string | undefined>('');

  /**
   * Filters vertex schedule runs list based on the selected date.
   */
  const filteredData = React.useMemo(() => {
    if (selectedDate) {
      const selectedDateString = selectedDate.toDate().toDateString(); // Only date, ignoring time
      return vertexScheduleRunsList.filter(scheduleRun => {
        return new Date(scheduleRun.date).toDateString() === selectedDateString;
      });
    }
    return [];
  }, [vertexScheduleRunsList, selectedDate]);

  // Sync filtered data with the parent component's state
  useEffect(() => {
    if (filteredData.length > 0) {
      setJobRunsData(filteredData[0]);
      setJobRunId(filteredData[0].jobRunId);
    }
  }, [filteredData, setJobRunsData]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'State',
        accessor: 'state'
      },
      {
        Header: 'Date',
        accessor: 'date'
      },
      {
        Header: 'Time',
        accessor: 'time'
      },
      {
        Header: 'Code',
        accessor: 'code'
      },
      {
        Header: 'Status Message',
        accessor: 'statusMessage'
      },
      {
        Header: 'Actions',
        accessor: 'actions'
      }
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page
  } = useTable(
    {
      //@ts-expect-error react-table 'columns' which is declared here on type 'TableOptions<IVertexScheduleRunList>'
      columns,
      data: filteredData,
      autoResetPage: false,
      initialState: { pageSize: filteredData.length }
    },
    useGlobalFilter
  );

  const tableDataCondition = (cell: ICellProps) => {
    if (cell.column.Header === 'Actions') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data sub-title-heading"
        >
          {renderActions(cell.row.original)}
        </td>
      );
    } else if (cell.column.Header === 'State') {
      if (cell.value === 'succeeded') {
        return (
          <td
            {...cell.getCellProps()}
            className="notebook-template-table-data"
            onClick={() => handleVertexScheduleRunStateClick(cell.row.original)}
          >
            <div className="dag-runs-table-data-state-success execution-state">
              {cell.render('Cell')}
            </div>
          </td>
        );
      } else if (cell.value === 'failed') {
        return (
          <td
            {...cell.getCellProps()}
            className="notebook-template-table-data"
            onClick={() => handleVertexScheduleRunStateClick(cell.row.original)}
          >
            <div className="dag-runs-table-data-state-failure execution-state">
              {cell.render('Cell')}
            </div>
          </td>
        );
      } else if (cell.value === 'running') {
        return (
          <div>
            <td
              {...cell.getCellProps()}
              className="notebook-template-table-data"
              onClick={() =>
                handleVertexScheduleRunStateClick(cell.row.original)
              }
            >
              <div className="dag-runs-table-data-state-running execution-state">
                {cell.render('Cell')}
              </div>
            </td>
          </div>
        );
      } else if (cell.value === 'queued') {
        return (
          <div>
            <td
              {...cell.getCellProps()}
              className="notebook-template-table-data"
              onClick={() =>
                handleVertexScheduleRunStateClick(cell.row.original)
              }
            >
              <div className="dag-runs-table-data-state-queued execution-state table-right-space">
                {cell.render('Cell')}
              </div>
            </td>
          </div>
        );
      }
    } else if (
      cell.column.Header === 'Code' ||
      cell.column.Header === 'Status Message'
    ) {
      if (cell.value === '-') {
        return (
          <td {...cell.getCellProps()} className="notebook-template-table-data">
            <iconDash.react tag="div" />
          </td>
        );
      } else {
        <td {...cell.getCellProps()} className="notebook-template-table-data">
          {cell.render('Cell')}
        </td>;
      }
    } else if (cell.column.Header === 'Date') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data table-cell-overflow"
        >
          {dayjs(cell.value).format('lll')}
        </td>
      );
    }
    return (
      <td {...cell.getCellProps()} className="notebook-template-table-data">
        {cell.render('Cell')}
      </td>
    );
  };

  /**
   * @param {Object} data - The data object containing information about the Vertex Schedule run.
   * @param {string} data.id - The optional ID of the Vertex Schedule run.
   * @param {string} data.status - The optional status of the Vertex Schedule run.
   * @param {string} data.jobRunId - The optional jobRunId of the Vertex Schedule run.
   *
   * @description Updates the jobRunId state if a jobRunId is provided in the data object.
   * Triggered when a Vertex Schedule run state is clicked.
   */
  const handleVertexScheduleRunStateClick = (data: {
    id?: string;
    status?: string;
    jobRunId?: string;
  }) => {
    if (data.jobRunId) {
      setJobRunId(data.jobRunId);
    }
  };
  /**
   * Handles the download of a job's output by triggering the download API service.
   * @param {Object} data - The data related to the job run and output.
   * @param {string} data.id - The optional ID of the job run.
   * @param {string} data.status - The optional status of the job run.
   * @param {string} data.jobRunId - The optional job run ID associated with the job output.
   * @param {string} data.state - The optional state of the job run.
   * @param {string} data.gcsUrl - The URL of the output file in Google Cloud Storage (GCS).
   * @param {string} data.fileName - The name of the file to be downloaded.
   */
  const handleDownloadOutput = async (data: {
    id?: string;
    status?: string;
    jobRunId?: string;
    state?: string;
    gcsUrl?: string;
    fileName?: string;
  }) => {
    setDownloadOutputVertexScheduleRunId(data.jobRunId);
    await StorageServices.downloadJobAPIService(
      data.gcsUrl,
      data.fileName,
      data.jobRunId,
      setJobDownloadLoading,
      scheduleName
    );
  };

  const renderActions = (data: {
    id?: string;
    status?: string;
    jobRunId?: string;
    state?: string;
    gcsUrl?: string;
    fileName?: string;
  }) => {
    const [isLoading, setIsLoading] = useState<boolean>(
      data.state === 'failed' ? true : false
    );
    const [fileExists, setFileExists] = useState<boolean>(false);
    const bucketName = data.gcsUrl?.split('//')[1];
    const outPutFileExistsApi = async () => {
      await VertexServices.outputFileExists(
        bucketName,
        data.jobRunId,
        data.fileName,
        setIsLoading,
        setFileExists,
        abortControllers
      );
    };

    useEffect(() => {
      if (data.state === 'failed') {
        outPutFileExistsApi();
      }
    }, []);

    return (
      <div className="action-btn-execution">
        {isLoading ||
        (jobDownloadLoading &&
          data.jobRunId === downloadOutputVertexScheduleRunId) ? (
          <div className="icon-buttons-style">
            <CircularProgress
              size={18}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) : (
          <div
            role="button"
            className={
              data.state === 'succeeded' || fileExists
                ? 'icon-buttons-style sub-title-heading'
                : 'icon-buttons-style-disable sub-title-heading'
            }
            title="Download Output"
            data-dag-run-id={data}
            onClick={
              data.state === 'succeeded' || fileExists
                ? e => handleDownloadOutput(data)
                : undefined
            }
          >
            <iconDownload.react tag="div" />
          </div>
        )}
      </div>
    );
  };

  const scheduleRunsList = async () => {
    await VertexServices.executionHistoryServiceList(
      region,
      schedulerData,
      selectedMonth,
      setIsLoading,
      setVertexScheduleRunsList,
      setBlueListDates,
      setGreyListDates,
      setOrangeListDates,
      setRedListDates,
      setGreenListDates,
      setDarkGreenListDates,
      abortControllers
    );
  };

  useEffect(() => {
    if (selectedMonth !== null) {
      scheduleRunsList();
    }
  }, [selectedMonth]);

  useEffect(() => {
    return () => {
      abortApiCall();
    };
  }, [])

  return (
    <div>
      <>
        {!isLoading && filteredData && filteredData.length > 0 ? (
          <div>
            <div className="dag-runs-list-table-parent">
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
        ) : (
          <div>
            {isLoading && (
              <div className="spin-loader-main">
                <CircularProgress
                  className="spin-loader-custom-style"
                  size={18}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
                Loading History
              </div>
            )}
            {!isLoading && filteredData.length === 0 && (
              <div className="no-data-style">No rows to display</div>
            )}
          </div>
        )}
      </>
    </div>
  );
};

export default VertexJobRuns;
