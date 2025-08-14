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

import {
  Autocomplete,
  Button,
  CircularProgress,
  TextField
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
// import { Notification } from '@jupyterlab/apputils';
import {
  LISTING_SCREEN_HEADING,
  LOADER_CONTENT_VERTEX_LISTING_SCREEN,
  SCHEDULE_LABEL_VERTEX,
  VERTEX_REGIONS
} from '../../../utils/Constants';
import { ILabelValue } from '../../../interfaces/CommonInterface';
import { authApi } from '../../common/login/Config';
import {
  ErrorMessage,
  handleErrorToast
} from '../../common/notificationHandling/ErrorUtils';
import { usePagination, useTable } from 'react-table';
import { VertexServices } from '../../../services/vertex/VertexServices';
import {
  ISheduleToDelete,
  IVertexCellProps,
  IVertexListingLoadingState,
  IVertexScheduleList,
  IVertexSelectedActionProps
} from '../../../interfaces/VertexInterface';
import Loader from '../../common/loader/LoadingSpinner';
import TableData from '../../common/table/TableData';
import { renderActions } from './VertexScheduleAction';
import { rowDataList } from './VertexListRow';
import { useNavigate } from 'react-router-dom';
import DeletePopup from '../../common/table/DeletePopup';
import { abortApiCall } from '../../../utils/Config';

const ListVertexSchedule = ({
  abortControllers
}: {
  abortControllers: any;
}) => {
  const navigate = useNavigate();
  const [region, setRegion] = useState<string>('');
  const [regionDisable, setRegionDisable] = useState<boolean>(false);
  const [vertexScheduleList, setVertexScheduleList] = useState<
    IVertexScheduleList[]
  >([]);
  const [loaderState, setLoaderState] = useState<IVertexListingLoadingState>({
    initialLoading: true,
    isLoading: false,
    isLoadingTableContent: false,
    regionLoader: false,
    editScheduleLoader: false
  });

  const [actionPerformedScheduleName, setActionPerformedScheduleName] =
    useState<IVertexSelectedActionProps>({
      resumePauseLoading: '',
      triggerLoading: '',
      editScheduleLoading: '',
      deleteLoading: ''
    });

  const [deletingScheduleDetails, setDeletingScheduleDetails] =
    useState<ISheduleToDelete>({
      scheduleId: '',
      displayName: '',
      deletePopUpShow: false,
      deletingStatus: false
    });

  const data = vertexScheduleList;

  const columns = useMemo(() => LISTING_SCREEN_HEADING, []);
  const [
    scheduleListPageLength
    //setScheduleListPageLength
  ] = useState<number>(25); // size of each page with pagination

  /**
   * Handles the selection of region
   */
  const handleRegion = (regionSelected: ILabelValue<string> | null) => {
    // Abort previous APIs
    abortApiCall(abortControllers);
    if (regionSelected) {
      setRegion(regionSelected.value);
    } else {
      setRegion('');
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

  /**
   * Get list of schedules
   */
  const listVertexScheduleInfoAPI = async () =>
    // nextToken: string | null | undefined
    {
      setLoaderState(prevState => ({
        ...prevState,
        isLoading: true,
        isLoadingTableContent: true
      }));
      setRegionDisable(true);
      const listVertexPayload = {
        region,
        abortControllers
      };
      const scheduleApiData = await VertexServices.listVertexSchedules(
        listVertexPayload
        // setIsLoading,
        // setIsApiError,
        // setApiError,
        // setNextPageToken,
        // nextToken,
        // setCanNextPage,
        // setApiEnableUrl,
        // scheduleListPageLength,
        // abortControllers
      );
      if (scheduleApiData && Array.isArray(scheduleApiData.schedulesList)) {
        setVertexScheduleList(scheduleApiData.schedulesList);
        setLoaderState(prevState => ({
          ...prevState,
          initialLoading: false,
          isLoading: false,
          isLoadingTableContent: false
        }));
        // Fetch last five run status for all schedules in parallel
        scheduleApiData.schedulesList.forEach(schedule => {
          VertexServices.fetchLastFiveRunStatus(
            schedule,
            region,
            abortControllers
          ).then(lastFiveRun => {
            setVertexScheduleList(prevList =>
              prevList.map(item =>
                item.displayName === schedule.displayName
                  ? {
                      ...item,
                      jobState: Array.isArray(lastFiveRun) ? lastFiveRun : []
                    }
                  : item
              )
            );
          });
        });
      }

      setRegionDisable(false);
    };

  /**
   * Function that redirects to Job Execution History
   * @param {any} schedulerData schedule data to be retrieved
   * @param {string} scheduleName name of the schedule
   * @param paginationVariables current page details (to be restored when user clicks back to Schedule Listing)
   */
  const handleScheduleIdSelection = (
    schedulerData: any,
    scheduleName: string
  ) => {
    // Abort previous APIs
    abortApiCall(abortControllers);

    // Converts the slashes and other special characters into a safe format that React Router will treat as a single string
    const scheduleId = encodeURIComponent(schedulerData?.name.split('/').pop());
    navigate(`/execution-vertex-history/${scheduleId}`);
  };

  /**
   *
   * @param pageTokenListToLoad available only in case navigating  back from another screen
   * @param nextPageTokenToLoad available only in case navigating back from another screen
   */
  const handleCurrentPageRefresh = async () =>
    // pageTokenListToLoad: string[] | undefined | null,
    // nextPageTokenToLoad: string | null | undefined
    {
      setRegionDisable(true);
      // Abort previous APIs
      abortApiCall(abortControllers);
      // abortApiCall(); //Abort last run execution api call
      // setResetToCurrentPage(true);
      // //fetching the current page token from token list: on the last page its the last element, null if on first page, 2nd last element on other pages.
      // let currentPageToken = null;
      // if (pageTokenListToLoad) {
      //   // if navigating back, load the same page.
      //   currentPageToken = nextPageTokenToLoad
      //     ? pageTokenListToLoad.length > 1
      //       ? pageTokenListToLoad[pageTokenListToLoad.length - 2]
      //       : null
      //     : pageTokenListToLoad.length > 0
      //       ? pageTokenListToLoad[pageTokenListToLoad.length - 1]
      //       : null;
      // } else {
      //   // in case of a simple same page refresh.
      //   currentPageToken = nextPageToken
      //     ? pageTokenList.length > 1
      //       ? pageTokenList[pageTokenList.length - 2]
      //       : null
      //     : pageTokenList.length > 0
      //       ? pageTokenList[pageTokenList.length - 1]
      //       : null;
      // }
      setLoaderState(prevState => ({ ...prevState, isLoading: true }));
      listVertexScheduleInfoAPI();
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
    displayName: string
    // newPageToken: string | null | undefined
  ) => {
    // Abort previous APIs
    abortApiCall(abortControllers);
    setActionPerformedScheduleName(prevState => ({
      ...prevState,
      resumePauseLoading: scheduleId
    }));
    const activatePayload = {
      scheduleId,
      region,
      displayName,
      abortControllers
    };
    if (is_status_paused === 'ACTIVE') {
      await VertexServices.handleUpdateSchedulerPauseAPIService(
        activatePayload
      );
    } else {
      await VertexServices.handleUpdateSchedulerResumeAPIService(
        activatePayload
      );
    }
    setActionPerformedScheduleName(prevState => ({
      ...prevState,
      resumePauseLoading: ''
    }));
    handleCurrentPageRefresh();
  };

  /**
   * Trigger a job immediately
   * @param {string} scheduleId - Id of schedule
   * @param {string} displayName name of schedule
   */
  const handleTriggerSchedule = async (
    scheduleId: string,
    displayName: string
  ) => {
    // Abort previous APIs
    abortApiCall(abortControllers);
    if (scheduleId !== null) {
      setActionPerformedScheduleName(prevState => ({
        ...prevState,
        triggerLoading: scheduleId
      }));
      const triggerPayload = {
        scheduleId,
        region,
        displayName,
        abortControllers
      };

      await VertexServices.triggerSchedule(triggerPayload);
      setActionPerformedScheduleName(prevState => ({
        ...prevState,
        triggerLoading: ''
      }));
      handleCurrentPageRefresh();
    }
  };

  /**
   * Edit a schedule
   * @param {string} scheduleId - Id of schedule
   */
  const handleEditschedule = (scheduleId: string) => {
    // Abort previous APIs
    abortApiCall(abortControllers);
    setLoaderState(prevState => ({ ...prevState, editScheduleLoader: true }));
    const encodedScheduleId = encodeURIComponent(scheduleId);
    navigate(
      `/edit/${SCHEDULE_LABEL_VERTEX.toLocaleLowerCase()}/${encodedScheduleId}`
    );
    setLoaderState(prevState => ({ ...prevState, editScheduleLoader: false }));
  };

  /**
   * Delete pop up
   * @param {string} schedule_id Id of schedule
   * @param {string} displayName name of schedule
   */
  const handleDeletePopUp = (scheduleId: string, displayName: string) => {
    setDeletingScheduleDetails({
      scheduleId: scheduleId,
      displayName: displayName,
      deletePopUpShow: true
    });
  };

  /**
   * Cancel delete pop up
   */
  const handleCancelDelete = () => {
    setDeletingScheduleDetails(prevState => ({
      ...prevState,
      deletePopUpShow: false
    }));
  };

  /**
   * Handles the deletion of a scheduler by invoking the API service to delete it.
   */
  const handleDeleteScheduler = async (
    newPageToken: string | null | undefined
  ) => {
    setDeletingScheduleDetails(prevState => ({
      ...prevState,
      deletingStatus: true
    }));
    // resetPaginationVariables(true); // Reset pagination variables to fetch the first page after deletion

    // Abort previous APIs
    abortApiCall(abortControllers);

    const deletePayload = {
      region: region,
      uniqueScheduleId: deletingScheduleDetails.scheduleId,
      scheduleDisplayName: deletingScheduleDetails.displayName,
      listVertexScheduleInfoAPI: listVertexScheduleInfoAPI
    };
    // const deleteResponse =
    await VertexServices.handleDeleteSchedulerAPIService(deletePayload);

    setDeletingScheduleDetails(prevState => ({
      ...prevState,
      deletePopUpShow: false,
      deletingStatus: false
    }));
  };

  const tableDataCondition = (cell: IVertexCellProps) => {
    if (cell.column.Header === 'Actions') {
      return (
        <td
          {...cell.getCellProps()}
          className="scheduler-table-data table-cell-overflow"
        >
          {renderActions(
            cell.row.original,
            actionPerformedScheduleName,
            loaderState,
            handleUpdateScheduler,
            handleTriggerSchedule,
            handleEditschedule,
            handleDeletePopUp
          )}
        </td>
      );
    } else {
      return <>{rowDataList(cell, handleScheduleIdSelection)}</>;
    }
  };

  useEffect(() => {
    setLoaderState(prevState => ({ ...prevState, regionLoader: true }));
    authApi()
      .then(credentials => {
        if (credentials?.region_id && credentials?.project_id) {
          setLoaderState(prevState => ({ ...prevState, regionLoader: false }));
          setRegion(credentials.region_id);
        }
      })
      .catch(error => {
        handleErrorToast({
          error: error
        });
      });
  }, []);

  useEffect(() => {
    if (region) {
      listVertexScheduleInfoAPI();
    }
  }, [region]);

  return (
    <>
      <div className="select-text-overlay-scheduler">
        <div className="enable-text-label">
          <div className="scheduler-form-element-container">
            <Autocomplete
              className="scheduler-tag-style"
              options={VERTEX_REGIONS}
              value={
                VERTEX_REGIONS.find(option => option.value === region) || null
              }
              getOptionLabel={option => option.label}
              onChange={(_event, val) => handleRegion(val)}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Region*"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loaderState.regionLoader ? (
                          <CircularProgress
                            aria-label="Loading Spinner"
                            data-testid="loader"
                            size={18}
                          />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              clearIcon={false}
              loading={loaderState.regionLoader}
              disabled={regionDisable}
            />
            {!loaderState.isLoading && !region && (
              <ErrorMessage message="Region is required" showIcon={false} />
            )}
          </div>
        </div>

        <div className="btn-refresh">
          <Button
            disabled={loaderState.isLoading}
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

      {vertexScheduleList.length > 0 ? (
        <>
          <div className="notebook-templates-list-tabl e-parent vertex-list-table-parent table-space-around scroll-list">
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              isLoading={loaderState.isLoadingTableContent}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="vertex"
            />
            {/* {vertexScheduleList.length > 0 && (
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
          )}*/}
            {deletingScheduleDetails?.deletePopUpShow && (
              <DeletePopup
                onCancel={() => handleCancelDelete()}
                onDelete={() => handleDeleteScheduler(null)}
                deletePopupOpen={
                  deletingScheduleDetails?.deletePopUpShow ?? false
                }
                DeleteMsg={`This will delete ${deletingScheduleDetails.displayName} and cannot be undone.`}
                deletingSchedule={deletingScheduleDetails.deletingStatus}
              />
            )}
          </div>
        </>
      ) : (
        <>
          {!loaderState.initialLoading && !loaderState.isLoading && (
            <div className="no-data-style">No schedules available</div>
          )}
          {loaderState.isLoading && (
            <Loader
              message={LOADER_CONTENT_VERTEX_LISTING_SCREEN}
              iconClassName="spin-loader-custom-style"
              parentTagClassName="spin-loader-main spin-loader-listing"
            />
          )}
        </>
      )}
    </>
  );
};

export default ListVertexSchedule;
