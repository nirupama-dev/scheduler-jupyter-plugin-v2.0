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
import { FormInputListingDropdown } from '../../common/formFields/FormInputDropdown';
import { authApi } from '../../common/login/Config';
import { useForm } from 'react-hook-form';
import { DropdownOption } from '../../../interfaces/FormInterface';
import { ComputeServices } from '../../../services/common/Compute';
import {
  IDagList,
  ILoadingStateComposerListing
} from '../../../interfaces/ComposerInterface';
import { ComposerServices } from '../../../services/composer/ComposerServices';
import { Notification } from '@jupyterlab/apputils';
import TableData from '../../common/table/TableData';
import { usePagination, useTable } from 'react-table';
import { ICellProps } from '../../common/table/Utils';
import { renderActions } from './RenderActions';
import { handleErrorToast } from '../../common/notificationHandling/ErrorUtils';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import {
  LOG_LEVEL,
  SchedulerLoggingService
} from '../../../services/common/LoggingService';
import DeletePopup from '../../common/table/DeletePopup';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { GCS_PLUGIN_ID } from '../../../utils/Constants';

export const ListComposerSchedule = ({ app }: { app: JupyterFrontEnd }) => {
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
      dags: false,
      update: '',
      trigger: '',
      editNotebook: '',
      editDag: '',
      delete: false
      // ... initialize other mandatory properties
    });
  const [isGCSPluginInstalled, setIsGCSPluginInstalled] =
    useState<boolean>(false);
  const [defaultRegionFromAuth, setDefaultRegionFromAuth] = useState<
    string | null
  >(null);
  const [deletePopupOpen, setDeletePopupOpen] = useState<boolean>(false);
  const [selectedDagId, setSelectedDagId] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [inputNotebookFilePath, setInputNotebookFilePath] = useState('');

  const selectedProjectId = watch('projectId');
  const selectedRegion = watch('composerRegion');
  const selectedEnv = watch('environment');

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
      const isPluginInstalled = app.hasPlugin(GCS_PLUGIN_ID);
      setIsGCSPluginInstalled(isPluginInstalled);
    } catch (error) {
      Notification.error('Could not check GCS plugin availability', {
        autoClose: false
      });
    }
  };

  const handleCancelDelete = () => {
    setDeletePopupOpen(false);
  };

  const openEditDagNotebookFile = async () => {
    const filePath = inputNotebookFilePath.replace('gs://', 'gs:');
    const openNotebookFile: any = await app.commands.execute(
      'docmanager:open',
      {
        path: filePath
      }
    );
    setInputNotebookFilePath('');
    if (openNotebookFile) {
      setLoadingState(prev => ({ ...prev, editNotebook: '' }));
    }
  };

  const handleEnvChange = useCallback(
    async (value: string) => {
      setValue('environment', value);
      setDagList([]);
      if (!value || !selectedProjectId || !selectedRegion) return;

      try {
        setLoadingState(prev => ({ ...prev, dags: true }));
        const { dagList, bucketName } =
          await ComposerServices.listDagInfoAPIService(
            value,
            selectedRegion,
            selectedProjectId
          );
        setDagList(dagList);
        setBucketName(bucketName);
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

  const handleUpdateScheduler = useCallback(
    async (dag_id: string, is_status_paused: boolean) => {
      setLoadingState(prev => ({ ...prev, update: dag_id }));

      try {
        const response = await ComposerServices.handleUpdateSchedulerAPIService(
          selectedEnv,
          dag_id,
          is_status_paused,
          selectedRegion,
          selectedProjectId
        );

        if (response?.status === 0) {
          Notification.success(`Scheduler ${dag_id} updated successfully`, {
            autoClose: false
          });

          await handleEnvChange(selectedEnv ?? '');
        } else {
          const errorResponse = `Error in updating the schedule: ${response?.error}`;
          handleErrorToast({
            error: errorResponse
          });
        }
      } catch (error) {
        SchedulerLoggingService.log('Error in Update API', LOG_LEVEL.ERROR);
        const errorResponse = `Error in updating the schedule: ${error}`;
        handleErrorToast({
          error: errorResponse
        });
      } finally {
        setLoadingState(prev => ({ ...prev, update: '' }));
      }
    },
    [
      selectedProjectId,
      selectedRegion,
      selectedEnv,
      setLoadingState,
      handleEnvChange
    ]
  );

  const handleTriggerDag = async (dag_id: string) => {
    if (dag_id !== null) {
      setLoadingState(prev => ({ ...prev, trigger: dag_id }));

      try {
        const response = await ComposerServices.triggerDagService(
          dag_id,
          selectedEnv ?? '',
          selectedProjectId,
          selectedRegion
        );

        // Check for success or different types of errors
        if (response?.error) {
          if (response.length > 0) {
            // This condition checks the response from checkRequiredPackages
            Notification.error(
              `Failed to trigger ${dag_id} : required packages are not installed`,
              { autoClose: false }
            );
          } else {
            Notification.error(
              `Failed to trigger ${dag_id} : ${response?.error}`,
              {
                autoClose: false
              }
            );
          }
        } else {
          // Success case
          Notification.success(`${dag_id} triggered successfully `, {
            autoClose: false
          });
        }
      } catch (reason) {
        // Catch network or unexpected errors
        Notification.error(`Failed to trigger ${dag_id} : ${reason}`, {
          autoClose: false
        });
      } finally {
        setLoadingState(prev => ({ ...prev, trigger: '' }));
      }
    }
  };

  const handleEditNotebook = async (dag_id: string) => {
    if (dag_id !== null) {
      setLoadingState(prev => ({ ...prev, editNotebook: dag_id }));

      try {
        const response = await ComposerServices.editNotebookSchedulerService(
          bucketName,
          dag_id
        );

        if (response?.input_filename) {
          setInputNotebookFilePath(response.input_filename);
        } else {
          handleErrorToast({
            error: `Error in fetching filename for ${dag_id}`
          });
        }
      } catch (reason) {
        const errorResponse = `Error on POST: ${reason}`;
        handleErrorToast({
          error: errorResponse
        });
      } finally {
        // Always reset the loading state
        setLoadingState(prev => ({ ...prev, editNotebook: '' }));
      }
    }
  };

  const handleDeletePopUp = (dag_id: string) => {
    setSelectedDagId(dag_id);
    setDeletePopupOpen(true);
  };

  const handleDeleteScheduler = async () => {
    setLoadingState(prev => ({ ...prev, delete: true }));

    try {
      const deleteResponse =
        await ComposerServices.handleDeleteSchedulerAPIService(
          selectedEnv ?? '',
          selectedDagId,
          selectedRegion,
          selectedProjectId
        );

      if (deleteResponse.status === 0) {
        // Success: show notification and refresh the list
        Notification.success(
          `Deleted job ${selectedDagId}. It might take a few minutes for it to be deleted from the list of jobs.`,
          { autoClose: false }
        );
        await handleEnvChange(selectedEnv ?? ''); // Call the function to refresh the list
      } else {
        // Failure: show error notification
        Notification.error(`Failed to delete the ${selectedDagId}`, {
          autoClose: false
        });
      }
    } catch (error) {
      // Handle network or unexpected errors
      SchedulerLoggingService.log('Error in Delete api', LOG_LEVEL.ERROR);
      Notification.error(`Failed to delete the ${selectedDagId} : ${error}`, {
        autoClose: false
      });
    } finally {
      setDeletePopupOpen(false); // Close the popup
      setLoadingState(prev => ({ ...prev, delete: false }));
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
        const options = await ComposerServices.listComposersAPIService(
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

  useEffect(() => {
    if (inputNotebookFilePath !== '') {
      openEditDagNotebookFile();
    }
  }, [inputNotebookFilePath]);

  const tableDataCondition = useCallback(
    (cell: ICellProps) => {
      if (cell.column.Header === 'Actions') {
        return (
          <td {...cell.getCellProps()} className="scheduler-table-data">
            {renderActions(
              cell.row.original,
              isGCSPluginInstalled,
              loadingState,
              handleUpdateScheduler,
              handleTriggerDag,
              handleEditNotebook,
              handleDeletePopUp
            )}
          </td>
        );
      } else if (cell.column.Header === 'Job Name') {
        return (
          <td {...cell.getCellProps()} className="scheduler-table-data">
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
          <td {...cell.getCellProps()} className="scheduler-table-data">
            {cell.render('Cell')}
          </td>
        );
      }
    },
    [
      renderActions,
      isGCSPluginInstalled,
      selectedProjectId,
      selectedRegion,
      selectedEnv,
      loadingState,
      bucketName,
      inputNotebookFilePath,
      handleUpdateScheduler,
      handleTriggerDag,
      handleDeletePopUp
    ]
  );

  return (
    <div>
      <div className="select-text-overlay-scheduler">
        <div className="select-panel-list">
          <div className="scheduler-form-element-container select-panel-list-view-lay table-right-space">
            <FormInputListingDropdown
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
          <div className="scheduler-form-element-container select-panel-list-view-lay table-right-space">
            <FormInputListingDropdown
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
          <div className="scheduler-form-element-container select-panel-list-view-lay">
            <FormInputListingDropdown
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
      {dagList.length > 0 ? (
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
          {deletePopupOpen && (
            <DeletePopup
              onCancel={() => handleCancelDelete()}
              onDelete={() => handleDeleteScheduler()}
              deletePopupOpen={deletePopupOpen}
              DeleteMsg={`This will delete ${selectedDagId} and cannot be undone.`}
              deletingNotebook={loadingState.delete}
            />
          )}
        </div>
      ) : (
        <div>
          {loadingState.dags && (
            <div className="spin-loader-main">
              <CircularProgress
                className="spin-loader-custom-style"
                size={18}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
              Loading Notebook Schedulers
            </div>
          )}
          {!loadingState.dags && (
            <div className="no-data-style">No rows to display</div>
          )}
        </div>
      )}
    </div>
  );
};
export default ListComposerSchedule;
