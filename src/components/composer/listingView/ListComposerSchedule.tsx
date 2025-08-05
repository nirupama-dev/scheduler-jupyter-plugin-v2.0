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
import { handleErrorToast } from '../../common/notificationHandling/ErrorUtils';
import { toast } from 'react-toastify';
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
  const [defaultRegionFromAuth, setDefaultRegionFromAuth] = useState<
    string | null
  >(null);

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

  const handleEnvChange = useCallback(
    async (value: string) => {
      console.log('value', value);
      setValue('environment', value);
      setDagList([]);
      if (!value || !selectedProjectId || !selectedRegion) return;

      try {
        setLoadingState(prev => ({ ...prev, dags: true }));
        const dags = await SchedulerService.listDagInfoAPIService(
          value,
          selectedRegion,
          selectedProjectId
        );
        setDagList(dags);
      } catch (error) {
        if (!toast.isActive('dagListError')) {
          const errorMessage =
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : 'Unknown error';

          toast.error(`Failed to fetch schedule list: ${errorMessage}`, {
            toastId: 'dagListError'
          });
        }
      } finally {
        setLoadingState(prev => ({ ...prev, dags: false }));
      }
    },
    [selectedProjectId, selectedRegion, setValue]
  );

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
          if (credentials.region_id) {
            setDefaultRegionFromAuth(credentials.region_id);
          }
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
    const fetchRegions = async () => {
      if (!selectedProjectId) {
        setRegionOptions([]);
        setValue('composerRegion', '');
        return;
      }
      try {
        setLoadingState(prev => ({ ...prev, region: true }));
        const options =
          await ComputeServices.regionAPIService(selectedProjectId);
        setRegionOptions(options);

        // Set the default region after options are fetched
        if (options.length > 0) {
          const defaultRegion = defaultRegionFromAuth
            ? options.find(opt => opt.value === defaultRegionFromAuth)
            : options[0];
          if (defaultRegion) {
            setValue('composerRegion', defaultRegion.value);
          }
        }
      } catch (error) {
        // Handle error from the service call
        const errorResponse = `Failed to fetch region list : ${error}`;
        handleErrorToast({
          error: errorResponse
        });
      } finally {
        setLoadingState(prev => ({ ...prev, region: false }));
      }
    };

    fetchRegions();
    // Clear subsequent fields when project_id changes
    setValue('environment', '');
    setDagList([]);
  }, [selectedProjectId, defaultRegionFromAuth, setValue]);

  useEffect(() => {
    const fetchEnvironments = async () => {
      if (!selectedProjectId || !selectedRegion) {
        setEnvOptions([]);
        setValue('environment', '');
        return;
      }
      try {
        setLoadingState(prev => ({ ...prev, environment: true }));
        const options = await SchedulerService.listComposersAPIService(
          selectedProjectId,
          selectedRegion
        );
        setEnvOptions(options);
        if (options.length > 0) {
          await handleEnvChange(options[0].value);
        } else {
          setValue('environment', '');
          setDagList([]);
        }
      } catch (error) {
        const errorResponse = `Failed to fetch composer environment list : ${error}`;
        handleErrorToast({
          error: errorResponse
        });
      } finally {
        setLoadingState(prev => ({ ...prev, environment: false }));
      }
    };

    fetchEnvironments();
  }, [selectedProjectId, selectedRegion, setValue, handleEnvChange]);

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
