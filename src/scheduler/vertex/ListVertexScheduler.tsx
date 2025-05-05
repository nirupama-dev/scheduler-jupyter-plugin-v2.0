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

import React, { useState, useEffect, useMemo } from 'react';
import { useTable, usePagination } from 'react-table';
import TableData from '../../utils/TableData';
import { PaginationComponent } from '../../utils/PaginationComponent';
import { IVertexCellProps } from '../../utils/Config';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CircularProgress, Button } from '@mui/material';
import DeletePopup from '../../utils/DeletePopup';
import { scheduleMode, VERTEX_REGIONS } from '../../utils/Const';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { RegionDropdown } from '../../controls/RegionDropdown';
import { iconDash } from '../../utils/Icons';
import { authApi } from '../../utils/Config';
import {
  iconActive,
  iconDelete,
  iconEditDag,
  iconEditNotebook,
  iconFailed,
  iconListCompleteWithError,
  iconListPause,
  iconPause,
  iconPlay,
  iconSuccess,
  iconTrigger,
  iconPending
} from '../../utils/Icons';
import { VertexServices } from '../../services/Vertex';
import { IVertexScheduleList } from './VertexInterfaces';
import dayjs from 'dayjs';
import ErrorMessage from '../common/ErrorMessage';

function ListVertexScheduler({
  region,
  setRegion,
  app,
  setJobId,
  settingRegistry,
  createCompleted,
  setCreateCompleted,
  setInputFileSelected,
  setMachineTypeSelected,
  setAcceleratedCount,
  setAcceleratorType,
  setKernelSelected,
  setCloudStorage,
  setDiskTypeSelected,
  setDiskSize,
  setParameterDetail,
  setParameterDetailUpdated,
  setServiceAccountSelected,
  setPrimaryNetworkSelected,
  setSubNetworkSelected,
  setSubNetworkList,
  setSharedNetworkSelected,
  setScheduleMode,
  setScheduleField,
  setStartDate,
  setEndDate,
  setMaxRuns,
  setEditMode,
  setJobNameSelected,
  setGcsPath,
  handleDagIdSelection,
  setIsApiError,
  setApiError,
  abortControllers,
  abortApiCall
}: {
  region: string;
  setRegion: (value: string) => void;
  app: JupyterFrontEnd;
  setJobId: (value: string) => void;
  settingRegistry: ISettingRegistry;
  createCompleted?: boolean;
  setCreateCompleted: (value: boolean) => void;
  setInputFileSelected: (value: string) => void;
  setMachineTypeSelected: (value: string | null) => void;
  setAcceleratedCount: (value: string | null) => void;
  setAcceleratorType: (value: string | null) => void;
  setKernelSelected: (value: string | null) => void;
  setCloudStorage: (value: string | null) => void;
  setDiskTypeSelected: (value: string | null) => void;
  setDiskSize: (value: string) => void;
  setParameterDetail: (value: string[]) => void;
  setParameterDetailUpdated: (value: string[]) => void;
  setServiceAccountSelected: (
    value: { displayName: string; email: string } | null
  ) => void;
  setPrimaryNetworkSelected: (
    value: { name: string; link: string } | null
  ) => void;
  setSubNetworkSelected: (value: { name: string; link: string } | null) => void;
  setSubNetworkList: (value: { name: string; link: string }[]) => void;
  setSharedNetworkSelected: (
    value: { name: string; network: string; subnetwork: string } | null
  ) => void;
  setScheduleMode: (value: scheduleMode) => void;
  setScheduleField: (value: string) => void;
  setStartDate: (value: dayjs.Dayjs | null) => void;
  setEndDate: (value: dayjs.Dayjs | null) => void;
  setMaxRuns: (value: string) => void;
  setEditMode: (value: boolean) => void;
  setJobNameSelected: (value: string) => void;
  setGcsPath: (value: string) => void;
  handleDagIdSelection: (scheduleId: any, scheduleName: string) => void;
  setIsApiError: (value: boolean) => void;
  setApiError: (value: string) => void;
  abortControllers: any;
  abortApiCall: () => void;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [vertexScheduleList, setScheduleList] = useState<IVertexScheduleList[]>(
    []
  );
  const data = vertexScheduleList;
  const [deletePopupOpen, setDeletePopupOpen] = useState<boolean>(false);
  const [editDagLoading, setEditDagLoading] = useState('');
  const [triggerLoading, setTriggerLoading] = useState('');
  const [resumeLoading, setResumeLoading] = useState('');
  const [inputNotebookFilePath, setInputNotebookFilePath] =
    useState<string>('');
  const [editNotebookLoading, setEditNotebookLoading] = useState<string>('');
  const [deletingSchedule, setDeletingSchedule] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('');
  const [uniqueScheduleId, setUniqueScheduleId] = useState<string>('');
  const [scheduleDisplayName, setScheduleDisplayName] = useState<string>('');
  const isPreview = false;

  const [scheduleListPageLength] = useState<number>(25); // size of each page with pagination
  const [currentStartIndex, setCurrentStartIndex] = useState<number>(1); // Track current page start index
  const [currentLastIndex, setCurrentLastIndex] = useState<number>(
    scheduleListPageLength
  ); // Track current page last index
  const [totalCount, setTotalCount] = useState<number>(0); // size of each page with pagination
  const [pageTokenList, setPageTokenList] = useState<string[]>([]);
  const [canNextPage, setCanNextPage] = useState<boolean>(false);
  const [canPreviousPage, setCanPreviousPage] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [fetchPreviousPage, setFetchPreviousPage] = useState<boolean>(false);
  const [fetchCurrentPage, setFetchCurrentPage] = useState<boolean>(false);

  const columns = useMemo(
    () => [
      {
        Header: 'Schedule Name',
        accessor: 'displayName'
      },
      {
        Header: 'Frequency',
        accessor: 'schedule'
      },
      {
        Header: 'Next Run Date',
        accessor: 'nextRunTime'
      },
      {
        Header: 'Created',
        accessor: 'createTime'
      },
      {
        Header: 'Latest Execution Jobs',
        accessor: 'jobState'
      },
      {
        Header: 'Status',
        accessor: 'status'
      },
      {
        Header: 'Actions',
        accessor: 'actions'
      }
    ],
    []
  );

  /**
   * Get list of schedules
   */
  const listVertexScheduleInfoAPI = async (
    nextToken: string | null | undefined
  ) => {
    setIsLoading(true);

    await VertexServices.listVertexSchedules(
      setScheduleList,
      region,
      setIsLoading,
      setIsApiError,
      setApiError,
      setNextPageToken,
      nextToken,
      scheduleListPageLength,
      setCanNextPage,
      abortControllers
    );

    setIsLoading(false);
  };

  /**
   * For applying pagination
   */
  useEffect(() => {
    setPaginationVariables(); // Recalculate pagination when vertexScheduleList or pageLength changes
  }, [vertexScheduleList, scheduleListPageLength]);

  /**
   * Pagination variables
   */
  const setPaginationVariables = async () => {
    let updatedPageTokenList = [...pageTokenList];
    if (fetchPreviousPage) {
      // True only in case of clicking for previous page
      if (updatedPageTokenList.length > 0) {
        if (nextPageToken) {
          updatedPageTokenList.pop(); // Remove the next page's token if not in last page
        }
        if (updatedPageTokenList.length > 0) {
          updatedPageTokenList = updatedPageTokenList.slice(0, -1); // Remove the token for accessing current page
          setCanPreviousPage(updatedPageTokenList.length > 1); // Enable/disable based on final list length
        } else {
          // In case pagination reached back to first page.
          setCanPreviousPage(false);
        }
      } else {
        // When there are no tokens available during Previous call (last one removed and awaiting API response)
        setCanPreviousPage(false);
      }
      setFetchPreviousPage(false);
    } else if (fetchCurrentPage) {
      // Logic to refresh current page. In case of Actions/ refresh
      if (updatedPageTokenList.length > 0) {
        //  let updatedTokenList: string[] = finalTokenList;
        if (nextPageToken) {
          updatedPageTokenList = updatedPageTokenList.slice(0, -1); // remove nextpage's token if not in last page
        }
      }
      setFetchCurrentPage(false); // to make sure ttoken list is not refreshed again.
    }

    const hasPreviousPage =
      pageTokenList.length > 1 && updatedPageTokenList.length > 0; // true only if not in first page
    setCanPreviousPage(hasPreviousPage); // false only on first page

    if (nextPageToken) {
      // add new token after getting paginated token list and has set Previous flag.
      if (!updatedPageTokenList.includes(nextPageToken)) {
        // to make sure the token is added only once.
        setPageTokenList([...updatedPageTokenList, nextPageToken]); // set paginated token list and the new token list.
      }
      setCanNextPage(true); // enable next page icon
    } else {
      // there are no more data available to fetch.
      setPageTokenList([...updatedPageTokenList]); // set the updated token list after pagination
      setCanNextPage(false); // disable nextPage icon if no nextToken is available
    }

    let startIndex = 1;
    if (canPreviousPage) {
      // change start index if navigating to next page and remains as 1 if on the 1st page.
      startIndex = canNextPage
        ? (pageTokenList.length - 1) * scheduleListPageLength + 1
        : pageTokenList.length * scheduleListPageLength + 1;
    }

    const endIndex =
      vertexScheduleList.length > 0
        ? startIndex + vertexScheduleList.length - 1
        : startIndex;
    setCurrentStartIndex(startIndex);
    setCurrentLastIndex(endIndex);

    if (
      vertexScheduleList.length > 0 &&
      vertexScheduleList.length < scheduleListPageLength
    ) {
      setTotalCount(
        pageTokenList.length * scheduleListPageLength +
          vertexScheduleList.length
      ); // Total count is found when we reach the final page
    }
  };

  /**
   * Handles next page navigation
   */
  const handleNextPage = async () => {
    abortApiCall(); //Abort last run execution api call
    const nextTokenToFetch =
      pageTokenList.length > 0 ? pageTokenList[pageTokenList.length - 1] : null;
    setNextPageToken(nextTokenToFetch);
    if (nextTokenToFetch) {
      setCanPreviousPage(true);
    }
    await listVertexScheduleInfoAPI(nextTokenToFetch); // call API with the last item in token list.
  };

  /**
   * Handles previous page navigation
   */
  const handlePreviousPage = async () => {
    abortApiCall(); //Abort last run execution api call
    setFetchPreviousPage(true);
    if (pageTokenList.length > 0) {
      setIsLoading(true); // Indicate loading during page transition
      let updatedTokens = [...pageTokenList];
      if (nextPageToken) {
        updatedTokens = pageTokenList.slice(0, -1); // removing next page's token if available
      }
      if (updatedTokens.length > 0) {
        updatedTokens = updatedTokens.slice(0, -1); // removing current page's token
        const nextTokenTofetch = updatedTokens[updatedTokens.length - 1]; //Reading last element (previous page's token) for fetching
        await listVertexScheduleInfoAPI(nextTokenTofetch); // Step 3 API call
      } else {
        await listVertexScheduleInfoAPI(null); // In case there are no more tokens after popping, fetch first page.
        setCanPreviousPage(false);
      }
      setCanNextPage(true); // Re-enable next if we went back
    } else {
      // when there is no more tokens and should fetch first page.
      await listVertexScheduleInfoAPI(null);
      setCanPreviousPage(false);
    }
  };

  // API call for refresh
  const handleCurrentPageRefresh = async () => {
    setFetchCurrentPage(true);
    const currentPageToken =
      pageTokenList.length > 1 ? pageTokenList[pageTokenList.length - 2] : null;
    listVertexScheduleInfoAPI(currentPageToken);
  };
  /**
   * Handle resume and pause
   * @param {string} scheduleId unique ID for schedule
   * @param {string} is_status_paused modfied status of schedule
   * @param {string} displayName name of schedule
   */
  const handleUpdateScheduler = async (
    scheduleId: string,
    is_status_paused: string,
    displayName: string,
    newPageToken: string | null | undefined
  ) => {
    if (is_status_paused === 'ACTIVE') {
      await VertexServices.handleUpdateSchedulerPauseAPIService(
        scheduleId,
        region,
        displayName,
        setResumeLoading,
        abortControllers
      );
    } else {
      await VertexServices.handleUpdateSchedulerResumeAPIService(
        scheduleId,
        region,
        displayName,
        setResumeLoading,
        abortControllers
      );
    }
    handleCurrentPageRefresh();
  };

  /**
   * Trigger a job immediately
   * @param {React.ChangeEvent<HTMLInputElement>} e - event triggered by the trigger button.
   * @param {string} displayName name of schedule
   */
  const handleTriggerSchedule = async (
    event: React.MouseEvent,
    displayName: string
  ) => {
    const scheduleId = event.currentTarget.getAttribute('data-scheduleId');
    if (scheduleId !== null) {
      await VertexServices.triggerSchedule(
        region,
        scheduleId,
        displayName,
        setTriggerLoading,
        abortControllers
      );
    }

    handleCurrentPageRefresh();
  };

  /**
   * Delete pop up
   * @param {string} schedule_id Id of schedule
   * @param {string} displayName name of schedule
   */
  const handleDeletePopUp = (schedule_id: string, displayName: string) => {
    setUniqueScheduleId(schedule_id);
    setScheduleDisplayName(displayName);
    setDeletePopupOpen(true);
  };

  /**
   * Cancel delete pop up
   */
  const handleCancelDelete = () => {
    setDeletePopupOpen(false);
  };

  /**
   * Handles the deletion of a scheduler by invoking the API service to delete it.
   */
  const handleDeleteScheduler = async (
    newPageToken: string | null | undefined
  ) => {
    setDeletingSchedule(true);
    await VertexServices.handleDeleteSchedulerAPIService(
      region,
      uniqueScheduleId,
      scheduleDisplayName,
      setScheduleList,
      setIsLoading,
      setIsApiError,
      setApiError,
      setNextPageToken,
      newPageToken,
      scheduleListPageLength,
      setCanNextPage
    );
    setDeletePopupOpen(false);
    setDeletingSchedule(false);
  };

  /**
   * Handles the editing of a vertex by triggering the editVertexSchedulerService.
   * @param {React.ChangeEvent<HTMLInputElement>} event - event triggered by the edit vertex button.
   */
  const handleEditVertex = async (event: React.MouseEvent) => {
    const scheduleId = event.currentTarget.getAttribute('data-scheduleId');
    if (scheduleId !== null) {
      await VertexServices.editVertexSchedulerService(
        scheduleId,
        region,
        setInputNotebookFilePath,
        setEditNotebookLoading
      );
    }
  };

  /**
   * Edit job
   * @param {React.ChangeEvent<HTMLInputElement>} e - event triggered by the edit job button.
   */
  const handleEditJob = async (
    event: React.MouseEvent,
    displayName: string
  ) => {
    abortApiCall();
    const job_id = event.currentTarget.getAttribute('data-jobid');
    if (job_id) {
      setJobId(job_id);
    }
    if (job_id !== null) {
      await VertexServices.editVertexSJobService(
        job_id,
        region,
        setEditDagLoading,
        setCreateCompleted,
        setInputFileSelected,
        setRegion,
        setMachineTypeSelected,
        setAcceleratedCount,
        setAcceleratorType,
        setKernelSelected,
        setCloudStorage,
        setDiskTypeSelected,
        setDiskSize,
        setParameterDetail,
        setParameterDetailUpdated,
        setServiceAccountSelected,
        setPrimaryNetworkSelected,
        setSubNetworkSelected,
        setSubNetworkList,
        setScheduleMode,
        setScheduleField,
        setStartDate,
        setEndDate,
        setMaxRuns,
        setEditMode,
        setJobNameSelected,
        setGcsPath,
        abortControllers
      );
    }
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page
  } = useTable(
    {
      //@ts-expect-error react-table 'columns' which is declared here on type 'TableOptions<IDagList>'
      columns,
      data,
      autoResetPage: false,
      initialState: { pageSize: scheduleListPageLength },
      manualPagination: true
    },
    usePagination
  );

  const renderActions = (data: any) => {
    const is_status_paused = data.status;
    return (
      <div className="actions-icon-btn">
        {data.name === resumeLoading ? (
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
            className="icon-buttons-style"
            title={
              is_status_paused === 'COMPLETED'
                ? 'Completed'
                : is_status_paused === 'PAUSED'
                  ? 'Resume'
                  : 'Pause'
            }
            onClick={e => {
              is_status_paused !== 'COMPLETED' &&
                handleUpdateScheduler(
                  data.name,
                  is_status_paused,
                  data.displayName,
                  null
                );
            }}
          >
            {is_status_paused === 'COMPLETED' ? (
              <iconPlay.react
                tag="div"
                className="icon-buttons-style-disable disable-complete-btn"
              />
            ) : is_status_paused === 'PAUSED' ? (
              <iconPlay.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            ) : (
              <iconPause.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            )}
          </div>
        )}
        {data.name === triggerLoading ? (
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
            className="icon-buttons-style"
            title="Trigger the job"
            data-scheduleId={data.name}
            onClick={e => handleTriggerSchedule(e, data.displayName)}
          >
            <iconTrigger.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}
        {is_status_paused === 'COMPLETED' ? (
          <iconEditNotebook.react
            tag="div"
            className="icon-buttons-style-disable"
          />
        ) : data.name === editDagLoading ? (
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
            className="icon-buttons-style"
            title="Edit Schedule"
            data-jobid={data.name}
            onClick={e => handleEditJob(e, data.displayName)}
          >
            <iconEditNotebook.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )}
        {isPreview &&
          (data.name === editNotebookLoading ? (
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
              className="icon-buttons-style"
              title="Edit Notebook"
              data-scheduleId={data.name}
              onClick={e => handleEditVertex(e)}
            >
              <iconEditDag.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          ))}
        <div
          role="button"
          className="icon-buttons-style"
          title="Delete"
          onClick={() => handleDeletePopUp(data.name, data.displayName)}
        >
          <iconDelete.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
      </div>
    );
  };

  const tableDataCondition = (cell: IVertexCellProps) => {
    if (cell.column.Header === 'Actions') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data table-cell-overflow"
        >
          {renderActions(cell.row.original)}
        </td>
      );
    } else if (cell.column.Header === 'Schedule Name') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data table-cell-overflow"
        >
          <span
            onClick={() => handleDagIdSelection(cell.row.original, cell.value)}
          >
            {cell.value}
          </span>
        </td>
      );
    } else if (cell.column.Header === 'Created') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data table-cell-overflow"
        >
          {dayjs(cell.row.original.createTime).format('lll')}
        </td>
      );
    } else if (cell.column.Header === 'Next Run Date') {
      return (
        <td
          {...cell.getCellProps()}
          className="clusters-table-data table-cell-overflow"
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
          className="clusters-table-data table-cell-overflow"
        >
          {cell.row.original.jobState ? (
            cell.row.original.jobState.length > 0 ? (
              <div className="execution-history-main-wrapper">
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
            ) : (
              <iconPending.react
                tag="div"
                title="No Job State Found"
                className="logo-alignment-style success_icon icon-size icon-completed"
              />
            )
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
              ? 'clusters-table-data table-cell-overflow'
              : 'clusters-table-data'
          }
        >
          {cell.column.Header === 'Status' ? (
            <>
              <div className="execution-history-main-wrapper">
                {getStatusIcon()}
                <div className={alignIcon ? 'text-icon' : ''}>
                  {cell.render('Cell')}
                </div>
              </div>
            </>
          ) : (
            <>{cell.render('Cell')}</>
          )}
        </td>
      );
    }
  };

  const openEditVertexNotebookFile = async () => {
    const filePath = inputNotebookFilePath.replace('gs://', 'gs:');
    const openNotebookFile = await app.commands.execute('docmanager:open', {
      path: filePath
    });
    setInputNotebookFilePath('');
    if (openNotebookFile) {
      setEditNotebookLoading('');
    }
  };

  useEffect(() => {
    if (inputNotebookFilePath !== '') {
      openEditVertexNotebookFile();
    }
  }, [inputNotebookFilePath]);

  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      abortApiCall(); // Abort any ongoing requests on component unmount
    };
  }, []);

  useEffect(() => {
    if (region !== '') {
      resetPaginationVariables();
      listVertexScheduleInfoAPI(null);
    }
  }, [region]);

  useEffect(() => {
    authApi()
      .then(credentials => {
        if (credentials && credentials?.region_id && credentials.project_id) {
          if (!createCompleted) {
            setRegion(credentials.region_id);
          }
          setProjectId(credentials.project_id);
        }
      })
      .catch(error => {
        console.error(error);
      });
  }, [projectId]);

  return (
    <div>
      <div className="select-text-overlay-scheduler">
        <div className="enable-text-label">
          <div className="create-scheduler-form-element content-pd-space ">
            <RegionDropdown
              projectId={projectId}
              region={region}
              onRegionChange={region => setRegion(region)}
              regionsList={VERTEX_REGIONS}
            />
            {!isLoading && !region && (
              <ErrorMessage message="Region is required" />
            )}
          </div>
        </div>

        <div className="btn-refresh">
          <Button
            disabled={isLoading}
            className="btn-refresh-text"
            variant="outlined"
            aria-label="cancel Batch"
            onClick={() => {
              handleCurrentPageRefresh();
            }}
          >
            <div>REFRESH</div>
          </Button>
        </div>
      </div>

      {vertexScheduleList.length > 0 || nextPageToken ? (
        <>
          <div className="notebook-templates-list-tabl e-parent clusters-list-table-parent">
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              isLoading={isLoading}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="Vertex schedulers"
            />
            {vertexScheduleList.length > 0 && (
              <PaginationComponent
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                currentStartIndex={currentStartIndex}
                currentLastIndex={currentLastIndex}
                handleNextPage={handleNextPage}
                handlePreviousPage={handlePreviousPage}
                isLoading={isLoading}
                totalCount={totalCount}
              />
            )}
            {deletePopupOpen && (
              <DeletePopup
                onCancel={() => handleCancelDelete()}
                onDelete={() => handleDeleteScheduler(null)}
                deletePopupOpen={deletePopupOpen}
                DeleteMsg={`This will delete ${scheduleDisplayName} and cannot be undone.`}
                deletingSchedule={deletingSchedule}
              />
            )}
          </div>
        </>
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
              Loading Vertex Schedules
            </div>
          )}
          {!isLoading && (
            <div className="no-data-style">No schedules available</div>
          )}
        </div>
      )}
    </div>
  );

  function resetPaginationVariables() {
    setIsLoading(true);
    setCanPreviousPage(false);
    setCanNextPage(false);
    setTotalCount(0);
    setPageTokenList([]);
    setNextPageToken(null);
  }
}

export default ListVertexScheduler;
