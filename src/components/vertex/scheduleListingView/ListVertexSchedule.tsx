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
import { LISTING_SCREEN_HEADING, VERTEX_REGIONS } from '../../../utils/Constants';
import { ILabelValue } from '../../../interfaces/CommonInterface';
import { authApi } from '../../common/login/Config';
import { handleErrorToast } from '../../common/notificationHandling/ErrorUtils';
import TableData from '../../../utils/TableData';
import { usePagination, useTable } from 'react-table';
import { VertexServices } from '../../../services/vertex/Vertex';
import { IVertexScheduleList } from '../../../interfaces/VertexInterface';

export const ListVertexSchedule = () => {
  const [region, setRegion] = useState<string>('');
  const [regionLoader, serRegionLoader] = useState<boolean>(false);
  // const [loadingState, setLoadingState] = useState<IVertexScheduleListing>({
    
  // });
  const [vertexScheduleList, setScheduleList] = useState<IVertexScheduleList[]>(
    []
  );
  const data = vertexScheduleList;

  const columns = useMemo(() => LISTING_SCREEN_HEADING, []);
  const [scheduleListPageLength, 
    //setScheduleListPageLength
    ] =
      useState<number>(25); // size of each page with pagination

  /**
   * Handles the selection of region
   */
  const handleRegion = (region: ILabelValue<string> | null) => {
    if (region) {
      setRegion(region.value);
    }
    setRegion('');
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
  const listVertexScheduleInfoAPI = async (
    nextToken: string | null | undefined
  ) => {
    // setIsLoading(true);

    await VertexServices.listVertexSchedules(
      setScheduleList,
      region,
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
    // setRegionDisable(false);
    // setIsLoading(false);
  };

  useEffect(() => {
    serRegionLoader(true);
    authApi()
      .then(credentials => {
        if (credentials?.region_id && credentials?.project_id) {
          serRegionLoader(false);
          setRegion(credentials.region_id);
        }
      })
      .catch(error => {
        handleErrorToast({
          error: error
        });
      });

      listVertexScheduleInfoAPI(null);
  }, []);

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
                        {regionLoader ? (
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
              loading={regionLoader}
              // disabled={!region}
            />
          </div>

          <div className="btn-refresh">
            <Button
              // disabled={isLoading}
              className="btn-refresh-text"
              variant="outlined"
              aria-label="cancel Batch"
              // onClick={() => {
              //   handleCurrentPageRefresh(null, null);
              // }}
            >
              <div>REFRESH</div>
            </Button>
          </div>
        </div>
      </div>

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
    </>
  );
};
