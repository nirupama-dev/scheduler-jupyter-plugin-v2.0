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
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { Dayjs } from 'dayjs';
import TableData from '../../common/table/TableData';
import { PaginationView } from '../../common/table/PaginationView';
import { handleDebounce } from '../../../utils/Config';
import { ICellProps } from '../../common/table/Utils';
import { ComposerServices } from '../../../services/composer/ComposerServices';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import { ActionButton } from '../../common/button/ActionButton';
import { iconDownload } from '../../../utils/Icons';

interface IDagRunList {
  dagRunId: string;
  filteredDate: Date;
  state: string;
  date: Date;
  time: string;
}

const ListDagRuns = ({
  composerName,
  dagId,
  handleDagRunClick,
  selectedDate,
  bucketName,
  projectId,
  region,
  dagRunsList
}: {
  composerName: string;
  dagId: string;
  handleDagRunClick: (value: string) => void;
  selectedDate: Dayjs | null;
  bucketName: string;
  projectId: string;
  region: string;
  dagRunsList: IDagRunList[];
}): JSX.Element => {
  const [downloadOutputDagRunId, setDownloadOutputDagRunId] = useState('');
  const [listDagRunHeight, setListDagRunHeight] = useState(
    window.innerHeight - 485
  );

  function handleUpdateHeight() {
    const updateHeight = window.innerHeight - 485;
    setListDagRunHeight(updateHeight);
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

  const data = dagRunsList;
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
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    setPageSize,
    // gotoPage,
    state: { pageIndex, pageSize }
  } = useTable(
    //@ts-expect-error react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
    { columns, data, autoResetPage: false, initialState: { pageSize: 50 } },
    useGlobalFilter,
    usePagination
  );

  const tableDataCondition = (cell: ICellProps) => {
    if (cell.column.Header === 'Actions') {
      return (
        <td {...cell.getCellProps()} className="scheduler-table-data">
          {renderActions(cell.row.original)}
        </td>
      );
    } else if (cell.column.Header === 'State') {
      if (cell.value === 'success') {
        return (
          <div className="dag-run-state-parent">
            <td
              {...cell.getCellProps()}
              className="dag-runs-table-data-state-success"
              onClick={() => handleDagRunStateClick(cell.row.original)}
            >
              {cell.render('Cell')}
            </td>
          </div>
        );
      } else if (cell.value === 'failed') {
        return (
          <div className="dag-run-state-parent">
            <td
              {...cell.getCellProps()}
              className="dag-runs-table-data-state-failure"
              onClick={() => handleDagRunStateClick(cell.row.original)}
            >
              {cell.render('Cell')}
            </td>
          </div>
        );
      } else if (cell.value === 'running') {
        return (
          <div className="dag-run-state-parent">
            <td
              {...cell.getCellProps()}
              className="dag-runs-table-data-state-running"
              onClick={() => handleDagRunStateClick(cell.row.original)}
            >
              {cell.render('Cell')}
            </td>
          </div>
        );
      } else if (cell.value === 'queued') {
        return (
          <div className="dag-run-state-parent">
            <td
              {...cell.getCellProps()}
              className="dag-runs-table-data-state-queued"
              onClick={() => handleDagRunStateClick(cell.row.original)}
            >
              {cell.render('Cell')}
            </td>
          </div>
        );
      }
    }
    return (
      <td {...cell.getCellProps()} className="notebook-template-table-data">
        {cell.render('Cell')}
      </td>
    );
  };

  const handleDagRunStateClick = (rowData: any) => {
    handleDagRunClick(rowData.dagRunId);
  };

  const handleDownloadOutput = async (event: React.MouseEvent) => {
    const dagRunId = event.currentTarget.getAttribute('data-dag-run-id')!;
    await ComposerServices.handleDownloadOutputNotebookAPIService(
      composerName,
      dagRunId,
      bucketName,
      dagId,
      setDownloadOutputDagRunId,
      projectId,
      region
    );
  };

  const renderActions = (data: any) => {
    return (
      <div className="actions-icon">
        {data.dagRunId === downloadOutputDagRunId ? (
          <LoadingSpinner iconClassName="spin-loader-custom-style" />
        ) : (
          <ActionButton
            title="Download Output"
            onClick={
              data.state === 'success'
                ? e => handleDownloadOutput(e)
                : undefined
            }
            icon={iconDownload}
            className={
              data.state === 'success'
                ? 'icon-buttons-style'
                : 'icon-buttons-style-disable'
            }
          />
        )}
      </div>
    );
  };

  return (
    <div>
      {data.length > 0 ? (
        <div>
          <div
            className="dag-runs-list-table-parent"
            style={{ maxHeight: listDagRunHeight }}
          >
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="Dag Runs"
            />
          </div>
          {data.length > 50 && (
            <PaginationView
              pageSize={pageSize}
              setPageSize={setPageSize}
              pageIndex={pageIndex}
              allData={data}
              previousPage={previousPage}
              nextPage={nextPage}
              canPreviousPage={canPreviousPage}
              canNextPage={canNextPage}
            />
          )}
        </div>
      ) : (
        <div>
          <div className="no-data-style">No rows to display</div>
        </div>
      )}
    </div>
  );
};

export default ListDagRuns;
