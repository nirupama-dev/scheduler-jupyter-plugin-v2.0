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

import React, { useCallback, useEffect, useState } from 'react';
import { FormInputDropdown } from '../../common/formFields/FormInputDropdown';
import { authApi } from '../../common/login/Config';
import { useForm } from 'react-hook-form';
import { DropdownOption } from '../../../interfaces/FormInterface';
import { ComputeServices } from '../../../services/common/Compute';
import {
  IDagList,
  ILoadingStateComposerListing
} from '../../../interfaces/ComposerInterface';
import { SchedulerService } from '../../../services/composer/SchedulerServices';
import { Notification } from '@jupyterlab/apputils';
import TableData from '../../common/table/TableData';
import { usePagination, useTable } from 'react-table';
import { ICellProps } from '../../common/table/Utils';
import { renderActions } from './RenderActions';
// import { GCS_PLUGIN_ID } from '../../../utils/Constants';

export const ListComposerSchedule = () => {
  const { control, setValue, watch } = useForm();
  const [regionOptions, setRegionOptions] = useState<DropdownOption[]>([]);
  const [envOptions, setEnvOptions] = useState<DropdownOption[]>([]);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const data = dagList;
  const [loadingState, setLoadingState] =
    useState<ILoadingStateComposerListing>({
      projectId: false,
      region: false,
      environment: false,
      dags: false
      // ... initialize other mandatory properties
    });
  const [isGCSPluginInstalled, setIsGCSPluginInstalled] =
    useState<boolean>(false);

  const selectedProjectId = watch('projectId');
  const selectedRegion = watch('composerRegion');

  const columns = React.useMemo(
    () => [
      {
        Header: 'Job Name',
        accessor: 'jobid'
      },
      {
        Header: 'Schedule',
        accessor: 'schedule'
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page
    // state: { pageIndex, pageSize }
  } = useTable(
    //@ts-expect-error react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
    { columns, data, autoResetPage: false, initialState: { pageSize: 50 } },
    usePagination
  );

  /**
   * Check if GCS plugin is installed
   * If installed, set isGCSPluginInstalled to true
   * Else set it to false
   */
  const checkGCSPluginAvailability = async () => {
    try {
      // const isPluginInstalled = app.hasPlugin(GCS_PLUGIN_ID);
      const isPluginInstalled = false;
      setIsGCSPluginInstalled(isPluginInstalled);
    } catch (error) {
      Notification.error('Could not check GCS plugin availability', {
        autoClose: false
      });
    }
  };

  useEffect(() => {
    checkGCSPluginAvailability();
  }, []);

  useEffect(() => {
    const loadInitialCredentials = async () => {
      try {
        setLoadingState(prev => ({ ...prev, projectId: true }));
        const credentials = await authApi();
        if (credentials?.project_id) {
          setValue('projectId', credentials.project_id);
          // Region will be handled by the subsequent useEffect and state updates.
        }
        setLoadingState(prev => ({ ...prev, projectId: false }));
      } catch (error) {
        console.error('Failed to load initial auth credentials:', error);
      }
    };
    loadInitialCredentials();
  }, [setValue]);

  // --- Fetch Regions based on selected Project ID ---
  useEffect(() => {
    if (selectedProjectId) {
      ComputeServices.regionAPIService(
        selectedProjectId,
        setRegionOptions,
        setLoadingState
      );
    } else {
      setRegionOptions([]); // Clear regions if no project is selected
    }
    // Always clear environment when project_id changes
    setValue('environment', '');
  }, [selectedProjectId, setValue]);

  useEffect(() => {
    if (selectedProjectId && selectedRegion) {
      SchedulerService.listComposersAPIService(
        setEnvOptions,
        selectedProjectId,
        selectedRegion,
        setLoadingState
      );
    } else {
      setEnvOptions([]);
    }
    setDagList([]);
  }, [selectedProjectId, selectedRegion, setValue]);

  const handleEnvChange = useCallback(
    async (value: string) => {
      console.log('value', value);
      setValue('environment', value);
      setDagList([]);
      if (value) {
        if (selectedProjectId && selectedRegion) {
          await SchedulerService.listDagInfoAPIService(
            setDagList,
            setLoadingState,
            value,
            selectedRegion,
            selectedProjectId
          );
        }
      }
    },
    [selectedProjectId, selectedRegion, setValue]
  );

  const tableDataCondition = useCallback(
    (cell: ICellProps) => {
      if (cell.column.Header === 'Actions') {
        return (
          <td {...cell.getCellProps()} className="clusters-table-data">
            {renderActions(cell.row.original, isGCSPluginInstalled)}
          </td>
        );
      } else if (cell.column.Header === 'Job Name') {
        return (
          <td {...cell.getCellProps()} className="clusters-table-data">
            <span
            // onClick={() => {
            //   if (composerEnvSelected) {
            //     handleDagIdSelection(composerEnvSelected, cell.value);
            //   }
            // }}
            >
              {cell.value}
            </span>
          </td>
        );
      } else {
        return (
          <td {...cell.getCellProps()} className="clusters-table-data">
            {cell.render('Cell')}
          </td>
        );
      }
    },
    // The dependency array is crucial.
    // Include any values from the component's scope that the function uses.
    [renderActions]
  );

  console.log(dagList);

  return (
    <div>
      <div className="select-text-overlay-scheduler">
        <div className="select-panel-list">
          <div className="create-scheduler-form-element select-panel-list-view-lay table-right-space">
            <FormInputDropdown
              name="projectId"
              label="Project ID"
              control={control}
              options={[{ label: selectedProjectId, value: selectedProjectId }]}
              setValue={setValue}
              loading={loadingState.projectId}
              //   onChangeCallback={handleProjectIdChange}
              disabled={true}
            />
          </div>
          <div className="create-scheduler-form-element select-panel-list-view-lay table-right-space">
            <FormInputDropdown
              name="composerRegion"
              label="Region"
              control={control}
              options={regionOptions}
              setValue={setValue}
              loading={loadingState.region}
              //   onChangeCallback={handleRegionChange}
              //   error={errors.composerRegion}
            />
          </div>
          <div className="create-scheduler-form-element select-panel-list-view-lay">
            <FormInputDropdown
              name="environment"
              label="Environment"
              control={control}
              options={envOptions}
              setValue={setValue}
              loading={loadingState.environment}
              onChangeCallback={handleEnvChange}
              //   error={errors.environment}
            />
          </div>
        </div>
      </div>
      <div className="table-space-around">
        <TableData
          getTableProps={getTableProps}
          headerGroups={headerGroups}
          getTableBodyProps={getTableBodyProps}
          isLoading={loadingState.dags}
          rows={rows}
          page={page}
          prepareRow={prepareRow}
          tableDataCondition={tableDataCondition}
          fromPage="Notebook Schedulers"
        />
      </div>
    </div>
  );
};
