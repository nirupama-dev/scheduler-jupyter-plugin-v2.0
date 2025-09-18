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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormInputListingDropdown } from '../../common/formFields/FormInputDropdown';
import { authApi, handleOpenLoginWidget } from '../../common/login/Config';
import { useForm } from 'react-hook-form';
import {
  IDropdownOption,
  IEnvDropDownOption
} from '../../../interfaces/FormInterface';
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
import { Box, CircularProgress } from '@mui/material';
import DeletePopup from '../../common/table/DeletePopup';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  composerEnvironmentStateList,
  GCS_PLUGIN_ID,
  POLLING_DAG_LIST_INTERVAL,
  POLLING_IMPORT_ERROR_INTERVAL
} from '../../../utils/Constants';
import { PaginationView } from '../../common/table/PaginationView';
import ImportErrorPopup from './ImportErrorPopup';
import { useNavigate } from 'react-router-dom';
import PollingTimer from '../../../utils/PollingTimer';

export const ListComposerSchedule = ({ app }: { app: JupyterFrontEnd }) => {
  const { control, setValue, watch } = useForm();
  const [regionOptions, setRegionOptions] = useState<IDropdownOption[]>([]);
  const [envOptions, setEnvOptions] = useState<IEnvDropDownOption[]>([]);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const data = dagList;
  const [loadingState, setLoadingState] =
    useState<ILoadingStateComposerListing>({
      projectId: false,
      region: false,
      environment: false,
      importErrors: false,
      dags: false,
      update: '',
      trigger: '',
      editNotebook: '',
      delete: false,
      editSchedule: ''
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
  const [importErrorData, setImportErrorData] = useState<string[]>([]);
  const [importErrorEntries, setImportErrorEntries] = useState<number>(0);
  const [importErrorPopupOpen, setImportErrorPopupOpen] =
    useState<boolean>(false);

  const navigate = useNavigate();

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
    page,
    setPageSize,
    previousPage,
    canPreviousPage,
    canNextPage,
    nextPage,
    state: { pageIndex, pageSize }
  } = useTable(
    //@ts-expect-error react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
    { columns, data, autoResetPage: false, initialState: { pageSize: 50 } },
    usePagination
  );

  const listDagInfoAPI = async (env: string) => {
    if (loadingState.dags) {
      return;
    }
    setLoadingState(prev => ({ ...prev, dags: true }));

    try {
      const { dagList, bucketName } =
        await ComposerServices.listDagInfoAPIService(
          env ?? '',
          selectedRegion,
          selectedProjectId
        );
      setDagList(dagList);
      setBucketName(bucketName);
    } catch (authenticationError) {
      handleOpenLoginWidget(app);
    } finally {
      setLoadingState(prev => ({ ...prev, dags: false }));
    }
  };

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

  const handleImportErrorPopup = async () => {
    setImportErrorPopupOpen(true);
  };
  const handleImportErrorClosed = async () => {
    setImportErrorPopupOpen(false);
  };

  const handleImportErrordata = async (env: string) => {
    if (loadingState.importErrors) {
      return;
    }
    setLoadingState(prev => ({ ...prev, importErrors: true }));

    try {
      const result = await ComposerServices.handleImportErrordataService(
        env ?? '',
        selectedProjectId,
        selectedRegion
      );

      if (result) {
        setImportErrorData(result.import_errors);
        setImportErrorEntries(result.total_entries);
      }
    } catch (authenticationError) {
      handleOpenLoginWidget(app);
    } finally {
      setLoadingState(prev => ({ ...prev, importErrors: false }));
    }
  };

  const handleDeleteImportError = async (dagId: string) => {
    try {
      const fromPage = 'importErrorPage';
      await ComposerServices.handleDeleteComposerScheduleAPIService(
        selectedEnv ?? '',
        selectedDagId,
        selectedRegion,
        selectedProjectId,
        fromPage
      );
    } catch (authenticationError) {
      handleOpenLoginWidget(app);
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
      if (!value || !selectedProjectId || !selectedRegion) {
        return;
      }

      listDagInfoAPI(value);
      handleImportErrordata(value);
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
          await handleEnvChange(selectedEnv ?? '');
        }
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
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
        await ComposerServices.triggerDagService(
          dag_id,
          selectedEnv ?? '',
          selectedProjectId,
          selectedRegion
        );
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
      } finally {
        setLoadingState(prev => ({ ...prev, trigger: '' }));
      }
    }
  };

  const handleEditNotebook = async (dag_id: string) => {
    if (dag_id !== null) {
      setLoadingState(prev => ({ ...prev, editNotebook: dag_id }));

      try {
        const response = await ComposerServices.editNotebookInScheduledJob(
          bucketName,
          dag_id
        );

        if (response?.input_filename) {
          setInputNotebookFilePath(response.input_filename);
        }
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
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
        await ComposerServices.handleDeleteComposerScheduleAPIService(
          selectedEnv ?? '',
          selectedDagId,
          selectedRegion,
          selectedProjectId
        );

      if (deleteResponse.status === 0) {
        await handleEnvChange(selectedEnv ?? ''); // Call the function to refresh the list
      }
    } catch (authenticationError) {
      handleOpenLoginWidget(app);
    } finally {
      setDeletePopupOpen(false); // Close the popup
      setLoadingState(prev => ({ ...prev, delete: false }));
    }
  };

  const handleEditSchedule = (id: string) => {
    console.log('Edit schedule clicked for id:', id);
    setLoadingState(prevState => ({
      ...prevState,
      editSchedule: id
    }));
    navigate(
      `/edit/composer/${selectedProjectId}/${selectedRegion}/${selectedEnv}/${id}`
    );
  };

  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const pollingDagList = async (
    pollingFunction: () => void,
    pollingDisable: boolean
  ) => {
    PollingTimer(
      pollingFunction,
      pollingDisable,
      POLLING_DAG_LIST_INTERVAL,
      timer
    );
  };

  const timerImportError = useRef<NodeJS.Timeout | undefined>(undefined);
  const pollingImportError = async (
    pollingFunction: () => void,
    pollingDisable: boolean
  ) => {
    PollingTimer(
      pollingFunction,
      pollingDisable,
      POLLING_IMPORT_ERROR_INTERVAL,
      timerImportError
    );
  };

  useEffect(() => {
    if (selectedEnv) {
      pollingDagList(() => listDagInfoAPI(selectedEnv), false);
      pollingImportError(() => handleImportErrordata(selectedEnv), false);
    }
    return () => {
      pollingDagList(() => listDagInfoAPI(selectedEnv), true);
      pollingImportError(() => handleImportErrordata(selectedEnv), true);
    };
  }, [selectedEnv, listDagInfoAPI, handleImportErrordata]);

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
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
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
          <td
            {...cell.getCellProps()}
            className="scheduler-table-data table-cell-overflow"
          >
            {renderActions(
              cell.row.original,
              isGCSPluginInstalled,
              loadingState,
              handleUpdateScheduler,
              handleTriggerDag,
              handleEditNotebook,
              handleDeletePopUp,
              handleEditSchedule
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
              getOptionDisabled={option =>
                !composerEnvironmentStateList.includes(option.state as string)
              }
              renderOption={(props: any, option: any) => {
                const { key, ...optionProps } = props;
                return (
                  <Box key={key} component="li" {...optionProps}>
                    {composerEnvironmentStateList.includes(
                      option.state as string
                    ) ? (
                      <div>{option.value}</div>
                    ) : (
                      <div className="env-option-row">
                        <div>{option.value}</div>
                        <div>{option.state}</div>
                      </div>
                    )}
                  </Box>
                );
              }}
              //   error={errors.environment}
            />
          </div>
        </div>
        {importErrorEntries > 0 && selectedProjectId && selectedRegion && (
          <div className="import-error-parent">
            <div
              className="accordion-button"
              role="button"
              aria-label="Show Import Errors"
              title="Show Import Errors"
              onClick={handleImportErrorPopup}
            >
              Show Schedule Errors ({importErrorEntries})
            </div>
            {importErrorPopupOpen && (
              <ImportErrorPopup
                importErrorData={importErrorData}
                importErrorEntries={importErrorEntries}
                importErrorPopupOpen={importErrorPopupOpen}
                onClose={handleImportErrorClosed}
                onDelete={(dagId: string) => handleDeleteImportError(dagId)}
              />
            )}
          </div>
        )}
      </div>
      {dagList.length > 0 ? (
        <div className="notebook-templates-list-tabl e-parent table-cell-flow table-space-around scroll-list">
          <TableData
            getTableProps={getTableProps}
            headerGroups={headerGroups}
            getTableBodyProps={getTableBodyProps}
            isLoading={!dagList && loadingState.dags}
            rows={rows}
            page={page}
            prepareRow={prepareRow}
            tableDataCondition={tableDataCondition}
            fromPage="Notebook Schedulers"
          />
          {dagList.length > 50 && (
            <PaginationView
              pageSize={pageSize}
              setPageSize={setPageSize}
              pageIndex={pageIndex}
              allData={dagList}
              previousPage={previousPage}
              nextPage={nextPage}
              canPreviousPage={canPreviousPage}
              canNextPage={canNextPage}
            />
          )}
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
