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
import {
  LISTING_SCREEN_HEADING,
  LOADER_CONTENT_VERTEX_LISTING_SCREEN,
  VERTEX_REGIONS
} from '../../../utils/Constants';
import { ILabelValue } from '../../../interfaces/CommonInterface';
import { authApi } from '../../common/login/Config';
import { handleErrorToast } from '../../common/notificationHandling/ErrorUtils';
import TableData from '../../../utils/TableData';
import { usePagination, useTable } from 'react-table';
import { VertexServices } from '../../../services/vertex/VertexServices';
import {
  IVertexListingLoadingState,
  IVertexScheduleList
} from '../../../interfaces/VertexInterface';
import Loader from '../../common/loader/Loader';

const ListVertexSchedule = () => {
  const [region, setRegion] = useState<string>('');
  // const [regionLoader, serRegionLoader] = useState<boolean>(false);
  const [regionDisable, setRegionDisable] = useState<boolean>(false);
  const [vertexScheduleList, setVertexScheduleList] = useState<
    IVertexScheduleList[]
  >([]);
  const [loaderState, setLoaderState] = useState<IVertexListingLoadingState>({
    isLoading: false,
    regionLoader: false
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
      setRegionDisable(true);
      // setIsLoading(true);

      const scheduleApiData = await VertexServices.listVertexSchedules(
        region
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
      if (scheduleApiData) {
        setVertexScheduleList(scheduleApiData?.schedulesList);
        setLoaderState(prevState => ({ ...prevState, isLoading: false }));
      }

      setRegionDisable(false);

      // setIsLoading(false);
    };

  // useEffect(() => {
  //   if (vertexScheduleList.length > 0) {
  //     vertexScheduleList.forEach((schedule: IVertexScheduleList) => {
  //       // Triggering fetch asynchronously
  //       const lastFiveRun = VertexServices.fetchLastFiveRunStatus(
  //         schedule,
  //         region
  //         // abortControllers
  //       );
  //       console.log('lastFiveRun', lastFiveRun);
  //       if (Array.isArray(lastFiveRun)) {
  //         setVertexScheduleList((prevItems: IVertexScheduleList[]) =>
  //           prevItems.map(prevItem =>
  //             prevItem.displayName === schedule.displayName
  //               ? { ...prevItem, jobState: lastFiveRun }
  //               : prevItem
  //           )
  //         );
  //       }
  //     });
  //   }
  // }, [vertexScheduleList]);

  /**
   * Function that redirects to Job Execution History
   * @param schedulerData schedule data to be retrieved
   * @param scheduleName name of the schedule
   * @param paginationVariables current page details (to be restored when user clicks back to Schedule Listing)
   * @param region selected region for the job (to be reatianed when user clicks back to Schedule Listing)
   */
  // const handleScheduleIdSelectionFromList = (
  //   schedulerData: any,
  //   scheduleName: string
  // ) => {

  //   // abortApiCall();
  //   // handleScheduleIdSelection(
  //   //   schedulerData,
  //   //   scheduleName,
  //   //   // saveActivePaginationVariables(),
  //   //   region
  //   // );
  // };

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
      listVertexScheduleInfoAPI();
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
          <div className="create-scheduler-form-element">
            <Autocomplete
              className="create-scheduler-style"
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
          </div>
        </div>

        <div className="btn-refresh">
          <Button
            // disabled={isLoading}
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
              // isLoading={isLoading}
              rows={rows}
              page={page}
              prepareRow={prepareRow}
              // tableDataCondition={tableDataCondition}
              fromPage="Vertex schedulers"
              region={region}
              // handleScheduleIdSelectionFromList={handleScheduleIdSelectionFromList}
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
          )}
          {deletePopupOpen && (
            <DeletePopup
              onCancel={() => handleCancelDelete()}
              onDelete={() => handleDeleteScheduler(null)}
              deletePopupOpen={deletePopupOpen}
              DeleteMsg={`This will delete ${scheduleDisplayName} and cannot be undone.`}
              deletingSchedule={deletingSchedule}
            />
          )} */}
          </div>
        </>
      ) : (
        // vertexScheduleList.length === 0 ? (
        //   <div className="no-data-style">No schedules available</div>
        // ) :
        <Loader message={LOADER_CONTENT_VERTEX_LISTING_SCREEN} />
      )}
    </>
  );
};

export default ListVertexSchedule;
