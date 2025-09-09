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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  LISTING_SCREEN_HEADING,
  LOADER_CONTENT_VERTEX_LISTING_SCREEN,
  SCHEDULE_LABEL_VERTEX
} from '../../../utils/Constants';
import { ILabelValue } from '../../../interfaces/CommonInterface';
import { authApi } from '../../common/login/Config';
import { handleErrorToast } from '../../common/notificationHandling/ErrorUtils';
import { usePagination, useTable } from 'react-table';
import { VertexServices } from '../../../services/vertex/VertexServices';
import {
  IActivePaginationVariables,
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
import { useNavigate, useParams } from 'react-router-dom';
import DeletePopup from '../../common/table/DeletePopup';
import { abortApiCall } from '../../../utils/Config';
import { PaginationComponent } from '../../common/customPagination/PaginationComponent';
import VertexListingInputLayout from './VertexListingInput';
import { useVertexContext } from '../../../context/vertex/VertexListContext';

const ListVertexSchedule = ({
  abortControllers
}: {
  abortControllers: any;
}) => {
  const { region: regionParam } = useParams<{ region: string }>();
  const [region, setRegion] = useState<string>(regionParam || '');// assign from param if available
  const navigate = useNavigate();

  // Consume the context value
  const vertexContext = useVertexContext();
  const activePaginationVariables = vertexContext?.activePaginationVariables;
  const setActivePaginationVariables =
    vertexContext?.setActivePaginationVariables;

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

  // pagination variables
  const [scheduleListPageLength, setScheduleListPageLength] =
    useState<number>(25); // size of each page with pagination
  const [totalCount, setTotalCount] = useState<number>(0); // size of each page with pagination
  const [pageTokenList, setPageTokenList] = useState<string[]>([]);
  const [canNextPage, setCanNextPage] = useState<boolean>(true);
  const [canPreviousPage, setCanPreviousPage] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [fetchPreviousPage, setFetchPreviousPage] = useState<boolean>(false);
  const [resetToCurrentPage, setResetToCurrentPage] = useState<boolean>(false);
  const previousScheduleList = useRef(vertexScheduleList);
  const previousNextPageToken = useRef(nextPageToken);
  const [pageNumber, setPageNumber] = useState<number>(1); // Track current page number
  const [fetchNextPage, setFetchNextPage] = useState<boolean>(false);

  /**
   * Handles the selection of region
   * @param {string | null} region selected
   */
  const handleRegion = useCallback(
    (regionSelected: ILabelValue<string> | null) => {
      // Abort previous APIs
      abortApiCall(abortControllers);
      if (regionSelected) {
        setRegion(regionSelected.value);
      } else {
        setRegion('');
      }
    },
    [region, abortControllers]
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
   * @param {string} nextToken: token for next page
   */
  const listVertexScheduleInfoAPI = useCallback(
    async (nextToken: string | null | undefined) => {
      setLoaderState(prevState => ({
        ...prevState,
        isLoading: true,
        isLoadingTableContent: true
      }));
      setRegionDisable(true);
      const listVertexPayload = {
        region,
        nextToken,
        scheduleListPageLength,
        abortControllers
      };
      const scheduleApiData =
        await VertexServices.listVertexSchedules(listVertexPayload);
      if (scheduleApiData && Array.isArray(scheduleApiData.schedulesList)) {
        setVertexScheduleList(scheduleApiData.schedulesList);
        setLoaderState(prevState => ({
          ...prevState,
          initialLoading: false,
          isLoading: false,
          isLoadingTableContent: false
        }));

        setNextPageToken(scheduleApiData.nextPageToken);

        setRegionDisable(false);
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
    },
    [region, scheduleListPageLength, abortControllers]
  );

  /**
   * For applying pagination
   */
  useEffect(() => {
    const hasListChanged = previousScheduleList.current !== vertexScheduleList;
    const hasNextPageTokenChanged =
      previousNextPageToken.current !== nextPageToken;

    // Reset pagination variables only if the list has changed or next page token has changed
    // or if the resetToCurrentPage is true.
    if (resetToCurrentPage || (hasListChanged && hasNextPageTokenChanged)) {
      setPaginationVariables();

      if (hasListChanged && hasNextPageTokenChanged) {
        previousScheduleList.current = vertexScheduleList;
        previousNextPageToken.current = nextPageToken;
      }
    }
  }, [nextPageToken, vertexScheduleList, scheduleListPageLength]);

  /**
   * Pagination variables
   */
  const setPaginationVariables = () => {
    let updatedPageTokenList = [...pageTokenList];
    let currentPageNumber = pageNumber;
    let resetFlag = resetToCurrentPage;
    if (fetchPreviousPage) {
      // True only in case of clicking for previous page
      if (updatedPageTokenList.length > 0) {
        updatedPageTokenList = updatedPageTokenList.slice(0, -1); // Remove the token for accessing current page
      }
      setFetchPreviousPage(false);
      currentPageNumber = Math.max(1, currentPageNumber - 1);
    } else if (resetToCurrentPage) {
      //Logic to refresh or reset current page. In case of Actions/ refresh
      if (updatedPageTokenList.length > 0 && nextPageToken) {
        updatedPageTokenList = updatedPageTokenList.slice(0, -1); // remove nextpage's token if not in last page
      }
      setResetToCurrentPage(false); // to make sure ttoken list is not refreshed again.
      resetFlag = false;
    } else if (fetchNextPage) {
      //only if incrementing to next page
      currentPageNumber += 1;
      setFetchNextPage(false);
    }

    let hasNextPage = false;

    if (nextPageToken) {
      hasNextPage = true;
      // add new token after getting paginated token list; and has set Previous flag.; if new nextPageToken is available
      if (
        !updatedPageTokenList.includes(nextPageToken) &&
        previousNextPageToken.current !== nextPageToken &&
        !resetFlag
      ) {
        // to make sure the token is added only once and is not the one deleted during refresh.
        updatedPageTokenList = [...updatedPageTokenList, nextPageToken]; // set paginated token list and the new token list.
      }
    }
    setCanNextPage(hasNextPage);
    const hasPreviousPage = hasNextPage
      ? updatedPageTokenList.length > 1
      : updatedPageTokenList.length > 0; // hasPreviousPage is true if there are more than 1 tokens in the list, which means there is a previous page available.
    setCanPreviousPage(hasPreviousPage); // false only on first page
    setPageTokenList([...updatedPageTokenList]); // set the updated token list after pagination

    setPageNumber(currentPageNumber);
    if (!hasNextPage) {
      setTotalCount(currentPageNumber); // Total count is found when we reach the final page
    }
  };

  /**
   * Handles next page navigation
   */
  const handleNextPage = async () => {
    abortApiCall(abortControllers); //Abort last run execution api call
    setFetchNextPage(true);
    const nextTokenToFetch =
      pageTokenList.length > 0 ? pageTokenList[pageTokenList.length - 1] : null;

    await listVertexScheduleInfoAPI(nextTokenToFetch); // call API with the last item in token list.
  };

  /**
   * Handles previous page navigation
   */
  const handlePreviousPage = async () => {
    abortApiCall(abortControllers); //Abort last run execution api call
    setFetchPreviousPage(true);
    if (pageTokenList.length > 0) {
      setLoaderState(prevState => ({ ...prevState, isLoading: true })); // Indicate loading during page transition

      let updatedTokens = [...pageTokenList];
      if (nextPageToken) {
        updatedTokens = updatedTokens.slice(0, -1); // removing next page's token if available
        setPageTokenList(updatedTokens);
      }
      if (updatedTokens.length > 0) {
        updatedTokens = updatedTokens.slice(0, -1); // removing current page's token
        const nextTokenToFetch = updatedTokens[updatedTokens.length - 1]; //Reading last element (previous page's token to fetch) for fetching
        await listVertexScheduleInfoAPI(nextTokenToFetch); // Step 3 API call
      } else {
        await listVertexScheduleInfoAPI(null); // In case there are no more tokens after popping, fetch first page.
      }
    } else {
      // when there is no more tokens and should fetch first page.
      await listVertexScheduleInfoAPI(null);
    }
  };

  /**
   * Function that redirects to Job Execution History
   * @param {any} schedulerData schedule data to be retrieved
   * @param paginationVariables current page details (to be restored when user clicks back to Schedule Listing)
   */
  const handleScheduleIdSelection = (schedulerData: any) => {
    // Abort previous APIs
    abortApiCall(abortControllers);

    if (setActivePaginationVariables) {
      setActivePaginationVariables(saveActivePaginationVariables());
    }

    // Converts the slashes and other special characters into a safe format that React Router will treat as a single string
    const scheduleId = encodeURIComponent(schedulerData?.name.split('/').pop());
    const selectedScheduleName = encodeURIComponent(schedulerData?.displayName);
    navigate(
      `/execution-vertex-history/${scheduleId}/${region}/${selectedScheduleName}`
    );
  };

  /**
   * Refresh the current page
   * @param {string[] | undefined | null} pageTokenListToLoad available only in case navigating  back from another screen
   * @param {string | null | undefined} nextPageTokenToLoad available only in case navigating back from another screen
   */
  const handleCurrentPageRefresh = async (
    pageTokenListToLoad: string[] | undefined | null,
    nextPageTokenToLoad: string | null | undefined
  ) => {
    setRegionDisable(true);

    // Abort previous APIs
    abortApiCall(abortControllers);

    setResetToCurrentPage(true);

    //fetching the current page token from token list: on the last page its the last element, null if on first page, 2nd last element on other pages.
    let currentPageToken = null;
    if (pageTokenListToLoad) {
      // if navigating back, load the same page.
      currentPageToken = nextPageTokenToLoad
        ? pageTokenListToLoad.length > 1
          ? pageTokenListToLoad[pageTokenListToLoad.length - 2]
          : null
        : pageTokenListToLoad.length > 0
          ? pageTokenListToLoad[pageTokenListToLoad.length - 1]
          : null;
    } else {
      // in case of a simple same page refresh.
      currentPageToken = nextPageToken
        ? pageTokenList.length > 1
          ? pageTokenList[pageTokenList.length - 2]
          : null
        : pageTokenList.length > 0
          ? pageTokenList[pageTokenList.length - 1]
          : null;
    }
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
    handleCurrentPageRefresh(null, null);
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
      handleCurrentPageRefresh(null, null);
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
      `/edit/${SCHEDULE_LABEL_VERTEX.toLocaleLowerCase()}/${encodedScheduleId}/${region}`
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
   * @param {string | null | undefined} newPageToken - Token for next page
   */
  const handleDeleteScheduler = async (
    newPageToken: string | null | undefined
  ) => {
    setDeletingScheduleDetails(prevState => ({
      ...prevState,
      deletingStatus: true
    }));
    resetPaginationVariables(true); // Reset pagination variables to fetch the first page after deletion

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

  /**
   * Function that stores all paginationtion related data for future restoration.
   */
  const saveActivePaginationVariables = () => {
    const currentPaginationVariables: IActivePaginationVariables | undefined = {
      scheduleListPageLength: scheduleListPageLength,
      totalCount: totalCount,
      pageTokenList: pageTokenList,
      nextPageToken: nextPageToken,
      pageNumber: pageNumber
    };
    return currentPaginationVariables;
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
    if (!region) {
      setLoaderState(prevState => ({ ...prevState, regionLoader: true }));
      authApi()
        .then(credentials => {
          if (credentials?.region_id && credentials?.project_id) {
            setLoaderState(prevState => ({
              ...prevState,
              regionLoader: false
            }));
            setRegion(credentials.region_id);
          }
        })
        .catch(error => {
          handleErrorToast({
            error: error
          });
        });
    }
  }, []);

  /**
   * Setting back pagination variables.
   */
  const setBackPaginationVariables = () => {
    setScheduleListPageLength(
      activePaginationVariables?.scheduleListPageLength ??
        scheduleListPageLength
    );
    setTotalCount(activePaginationVariables?.totalCount ?? totalCount);
    setPageTokenList(activePaginationVariables?.pageTokenList ?? pageTokenList);
    setNextPageToken(activePaginationVariables?.nextPageToken ?? nextPageToken);
    setPageNumber(activePaginationVariables?.pageNumber ?? pageNumber);
    previousNextPageToken.current =
      activePaginationVariables?.nextPageToken ?? nextPageToken;
  };

  /**
   * Function resets all variables except nextPageToken
   * which would be automatically taken care during rendering.
   * @param {boolean} reloadPagination parameter specifies if the page has to refresh.
   */
  const resetPaginationVariables = (reloadPagination: boolean) => {
    if (setActivePaginationVariables) {
      setActivePaginationVariables(null);
    }

    setLoaderState(prevState => ({ ...prevState, isLoading: true }));
    setResetToCurrentPage(reloadPagination);
    setCanPreviousPage(false);
    setCanNextPage(false);
    setPageNumber(1);
    setTotalCount(0);
    setPageTokenList([]);
  };

  useEffect(() => {
    if (region !== '') {
      if (activePaginationVariables) {
        setBackPaginationVariables();
      } else {
        resetPaginationVariables(true);
      }
      handleCurrentPageRefresh(
        activePaginationVariables?.pageTokenList,
        activePaginationVariables?.nextPageToken
      );
    }
  }, [region]);

  return (
    <>
      <VertexListingInputLayout
        region={region}
        handleRegion={handleRegion}
        loaderState={loaderState}
        regionDisable={regionDisable}
        handleCurrentPageRefresh={() => handleCurrentPageRefresh(null, null)}
      />

      {vertexScheduleList.length > 0 ? (
        <>
          <div className="notebook-templates-list-tabl e-parent table-cell-flow table-space-around scroll-list">
            <TableData
              getTableProps={getTableProps}
              headerGroups={headerGroups}
              getTableBodyProps={getTableBodyProps}
              isLoading={loaderState.isLoadingTableContent}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              tableDataCondition={tableDataCondition}
              fromPage="Vertex"
            />
            {vertexScheduleList.length > 0 && (
              <PaginationComponent
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                pageNumber={pageNumber}
                handleNextPage={handleNextPage}
                handlePreviousPage={handlePreviousPage}
                isLoading={loaderState.isLoading}
                totalCount={totalCount}
              />
            )}
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
