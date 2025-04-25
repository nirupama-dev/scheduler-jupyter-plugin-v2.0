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
import { Input } from '../../controls/MuiWrappedInput';
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import { MuiChipsInput } from 'mui-chips-input';
import { IThemeManager } from '@jupyterlab/apputils';
import { JupyterLab } from '@jupyterlab/application';
import LabelProperties from '../../jobs/LabelProperties';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import { KernelSpecAPI } from '@jupyterlab/services';
import tzdata from 'tzdata';
import { SchedulerService } from '../../services/SchedulerServices';
import NotebookJobComponent from './NotebookJobs';
import { Button } from '@mui/material';
import { scheduleMode } from '../../utils/Const';
import { scheduleValueExpression } from '../../utils/Const';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import ErrorMessage from '../common/ErrorMessage';
import { IDagList } from '../common/SchedulerInteface';
import { DynamicDropdown } from '../../controls/DynamicDropdown';
import { projectListAPI } from '../../services/ProjectService';
import { RegionDropdown } from '../../controls/RegionDropdown';
import { authApi } from '../../utils/Config';
import { iconSuccess, iconWarning } from '../../utils/Icons';
import { ProgressPopUp } from '../../utils/ProgressPopUp';
import { toast } from 'react-toastify';

const CreateNotebookScheduler = ({
  themeManager,
  app,
  context,
  settingRegistry,
  createCompleted,
  setCreateCompleted,
  jobNameSelected,
  setJobNameSelected,
  inputFileSelected,
  setInputFileSelected,
  editMode,
  setEditMode,
  jobNameValidation,
  jobNameSpecialValidation,
  jobNameUniqueValidation,
  setJobNameUniqueValidation,
  setIsApiError,
  setApiError,
  setExecutionPageFlag,
  isLocalKernel,
  setIsLocalKernel,
  packageEditFlag,
  setPackageEditFlag,
  setSchedulerBtnDisable,
  abortControllerRef
}: {
  themeManager: IThemeManager;
  app: JupyterLab;
  context: any;
  settingRegistry: ISettingRegistry;
  createCompleted: boolean;
  setCreateCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  jobNameSelected: string;
  setJobNameSelected: React.Dispatch<React.SetStateAction<string>>;
  inputFileSelected: string;
  setInputFileSelected: React.Dispatch<React.SetStateAction<string>>;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  jobNameValidation: boolean;
  jobNameSpecialValidation: boolean;
  jobNameUniqueValidation: boolean;
  setJobNameUniqueValidation: React.Dispatch<React.SetStateAction<boolean>>;
  setIsApiError: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string>>;
  setExecutionPageFlag: React.Dispatch<React.SetStateAction<boolean>>;
  isLocalKernel: boolean;
  setIsLocalKernel: React.Dispatch<React.SetStateAction<boolean>>;
  packageEditFlag: boolean;
  setPackageEditFlag: React.Dispatch<React.SetStateAction<boolean>>;
  setSchedulerBtnDisable: React.Dispatch<React.SetStateAction<boolean>>;
  abortControllerRef: any;
}): JSX.Element => {
  const [composerList, setComposerList] = useState<string[]>([]);
  const [composerSelected, setComposerSelected] = useState<string>('');

  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);

  const [selectedMode, setSelectedMode] = useState('cluster');
  const [clusterList, setClusterList] = useState<string[]>([]);
  const [serverlessList, setServerlessList] = useState<string[]>([]);
  const [serverlessDataList, setServerlessDataList] = useState<string[]>([]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [serverlessDataSelected, setServerlessDataSelected] = useState({});
  const [stopCluster, setStopCluster] = useState(false);

  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [emailOnFailure, setEmailOnFailure] = useState(false);
  const [emailOnRetry, setEmailonRetry] = useState(false);
  const [emailOnSuccess, setEmailOnSuccess] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<boolean>(false);

  const [scheduleMode, setScheduleMode] = useState<scheduleMode>('runNow');
  const [scheduleValue, setScheduleValue] = useState(scheduleValueExpression);
  const [timeZoneSelected, setTimeZoneSelected] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const timezones = Object.keys(tzdata.zones).sort();

  const [creatingScheduler, setCreatingScheduler] = useState(false);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const [dagListCall, setDagListCall] = useState(false);
  const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [region, setRegion] = useState<string>('');
  const [packageInstallationMessage, setPackageInstallationMessage] =
    useState<string>('');
  const [packageInstalledList, setPackageInstalledList] = useState<string[]>(
    []
  );
  const [packageListFlag, setPackageListFlag] = useState<boolean>(false);
  const [apiErrorMessage, setapiErrorMessage] = useState<string>('');
  const [
    checkRequiredPackagesInstalledFlag,
    setCheckRequiredPackagesInstalledFlag
  ] = useState<boolean>(false);
  const [disableEnvLocal, setDisabaleEnvLocal] = useState<boolean>(false);
  const [clusterFlag, setClusterFlag] = useState<boolean>(false);
  const [envApiFlag, setEnvApiFlag] = useState<boolean>(false);
  const [loaderRegion, setLoaderRegion] = useState<boolean>(false);
  const [loaderProjectId, setLoaderProjectId] = useState<boolean>(false);

  const listClustersAPI = async () => {
    await SchedulerService.listClustersAPIService(
      setClusterList,
      setIsLoadingKernelDetail
    );
  };

  const listSessionTemplatesAPI = async () => {
    await SchedulerService.listSessionTemplatesAPIService(
      setServerlessDataList,
      setServerlessList,
      setIsLoadingKernelDetail
    );
  };

  const listComposersAPI = async () => {
    await SchedulerService.listComposersAPIService(
      setComposerList,
      projectId,
      region,
      setIsApiError,
      setApiError,
      setEnvApiFlag
    );
  };

  const handleComposerSelected = async (data: string | null) => {
    setPackageListFlag(false);
    setPackageInstalledList([]);
    setapiErrorMessage('');

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (data) {
      const selectedComposer = data.toString();
      setComposerSelected(selectedComposer);
      if (selectedComposer) {
        const unique = getDaglist(selectedComposer);
        if (!unique) {
          setJobNameUniqueValidation(true);
        }

        if (isLocalKernel) {
          setDisabaleEnvLocal(true);
          await SchedulerService.checkRequiredPackagesInstalled(
            selectedComposer,
            setPackageInstallationMessage,
            setPackageInstalledList,
            setPackageListFlag,
            setapiErrorMessage,
            setCheckRequiredPackagesInstalledFlag,
            setDisabaleEnvLocal,
            signal,
            abortControllerRef
          );
        }
      }
    }
  };
  const getDaglist = async (composer: string) => {
    setDagListCall(true);
    try {
      await SchedulerService.listDagInfoAPIServiceForCreateNotebook(
        setDagList,
        composer
      );
      setDagListCall(false);
      return true;
    } catch (error) {
      setDagListCall(false);
      console.error('Error checking job name uniqueness:', error);
      return false;
    }
  };

  const handleSelectedModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if ((event.target as HTMLInputElement).value === 'cluster') {
      setClusterFlag(true);
    }
    setSelectedMode((event.target as HTMLInputElement).value);
  };

  const handleSchedulerModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = (event.target as HTMLInputElement).value;
    setScheduleMode(newValue as scheduleMode);
    if (newValue === 'runSchedule' && scheduleValue === '') {
      setScheduleValue(scheduleValueExpression);
    }
  };

  const handleClusterSelected = (data: string | null) => {
    if (data) {
      const selectedCluster = data.toString();
      setClusterSelected(selectedCluster);
    }
  };

  const handleTimeZoneSelected = (data: string | null) => {
    if (data) {
      const selectedTimeZone = data.toString();
      setTimeZoneSelected(selectedTimeZone);
    }
  };

  const handleServerlessSelected = (data: string | null) => {
    if (data) {
      const selectedServerless = data.toString();
      const selectedData: any = serverlessDataList.filter((serverless: any) => {
        return serverless.serverlessName === selectedServerless;
      });
      setServerlessDataSelected(selectedData[0].serverlessData);
      setServerlessSelected(selectedServerless);
    }
  };

  const handleStopCluster = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStopCluster(event.target.checked);
  };

  const handleRetryCount = (data: number) => {
    if (data >= 0) {
      setRetryCount(data);
    }
  };

  const handleRetryDelay = (data: number) => {
    if (data >= 0) {
      setRetryDelay(data);
    }
  };

  const handleFailureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOnFailure(event.target.checked);
    if (!event.target.checked) {
      setEmailError(false);
      setEmailList([]);
    }
  };

  const handleRetryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailonRetry(event.target.checked);
    if (!event.target.checked) {
      setEmailError(false);
      setEmailList([]);
    }
  };

  const handleSuccessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOnSuccess(event.target.checked);
    if (!event.target.checked) {
      setEmailError(false);
      setEmailList([]);
    }
  };

  const handleEmailList = (data: string[]) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let invalidEmail = false;
    data.forEach(email => {
      if (!emailPattern.test(email)) {
        invalidEmail = true;
        setEmailError(true);
      }
    });
    if (invalidEmail === false) {
      setEmailError(false);
    }
    setEmailList(data);
  };

  const handleCreateJobScheduler = async () => {
    const outputFormats = [];
    outputFormats.push('ipynb');

    const randomDagId = uuidv4();
    const payload = {
      input_filename: inputFileSelected,
      composer_environment_name: composerSelected,
      output_formats: outputFormats,
      parameters: parameterDetailUpdated,
      local_kernel: isLocalKernel,
      mode_selected: isLocalKernel ? '' : selectedMode,
      retry_count: retryCount,
      retry_delay: retryDelay,
      email_failure: emailOnFailure,
      email_delay: emailOnRetry,
      email_success: emailOnSuccess,
      email: emailList,
      name: jobNameSelected,
      schedule_value: scheduleMode === 'runNow' ? '' : scheduleValue,
      stop_cluster: stopCluster,
      dag_id: randomDagId,
      time_zone: scheduleMode !== 'runNow' ? timeZoneSelected : '',
      [selectedMode === 'cluster' ? 'cluster_name' : 'serverless_name']:
        selectedMode === 'cluster' ? clusterSelected : serverlessDataSelected
    };

    if (packageInstalledList.length > 0 && isLocalKernel) {
      payload['packages_to_install'] = packageInstalledList;
      {
        toast(ProgressPopUp, {
          autoClose: false,
          closeButton: true,
          data: {
            message:
              'Installing packages taking longer than usual. Scheduled job starts post installation. Please wait....'
          }
        });
      }
    }

    await SchedulerService.createJobSchedulerService(
      payload,
      app,
      setCreateCompleted,
      setCreatingScheduler,
      editMode,
      projectId,
      region,
      selectedMode,
      packageInstalledList,
      setPackageEditFlag
    );
    setEditMode(false);
  };

  const isSaveDisabled = () => {
    return (
      emailError ||
      dagListCall ||
      creatingScheduler ||
      (!checkRequiredPackagesInstalledFlag && isLocalKernel) ||
      jobNameSelected === '' ||
      (!jobNameValidation && !editMode) ||
      (jobNameSpecialValidation && !editMode) ||
      (!jobNameUniqueValidation && !editMode) ||
      inputFileSelected === '' ||
      parameterDetailUpdated.some(
        item =>
          item.length === 1 ||
          (item.split(':')[0]?.length > 0 &&
            item.split(':')[1]?.length === 0) ||
          (item.split(':')[0]?.length === 0 && item.split(':')[1]?.length > 0)
      ) ||
      composerSelected === '' ||
      (selectedMode === 'cluster' &&
        clusterSelected === '' &&
        !isLocalKernel) ||
      (selectedMode === 'serverless' &&
        serverlessSelected === '' &&
        !isLocalKernel) ||
      ((emailOnFailure || emailOnRetry || emailOnSuccess) &&
        emailList.length === 0)
    );
  };

  const handleCancel = async () => {
    if (!editMode) {
      setCreateCompleted(false);
      app.shell.activeWidget?.close();
    } else {
      setCreateCompleted(true);
      setEditMode(false);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const getKernelDetail = async () => {
    const kernelSpecs: any = await KernelSpecAPI.getSpecs();
    const kernels = kernelSpecs.kernelspecs;

    if (kernels && context.sessionContext.kernelPreference.name) {
      if (
        kernels[context.sessionContext.kernelPreference.name].resources
          .endpointParentResource
      ) {
        if (
          kernels[
            context.sessionContext.kernelPreference.name
          ].resources.endpointParentResource.includes('/sessions')
        ) {
          if (!clusterFlag) {
            setSelectedMode('serverless');
          }

          const selectedData: any = serverlessDataList.filter(
            (serverless: any) => {
              return context.sessionContext.kernelDisplayName.includes(
                serverless.serverlessName
              );
            }
          );
          if (selectedData.length > 0) {
            setServerlessDataSelected(selectedData[0].serverlessData);
            setServerlessSelected(selectedData[0].serverlessName);
          } else {
            setServerlessDataSelected({});
            setServerlessSelected('');
          }
        } else {
          const selectedData: any = clusterList.filter((cluster: string) => {
            return context.sessionContext.kernelDisplayName.includes(cluster);
          });
          if (selectedData.length > 0) {
            setClusterSelected(selectedData[0]);
          } else {
            setClusterSelected('');
          }
        }
      }
    }
  };

  useEffect(() => {
    if (context !== '') {
      setInputFileSelected(context.path);
    }
    setJobNameSelected('');
    if (!editMode) {
      setParameterDetail([]);
      setParameterDetailUpdated([]);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (projectId && region) {
      listComposersAPI();
    }

    if (!region) {
      setComposerList([]);
      setComposerSelected('');
      setapiErrorMessage('');
      setPackageInstallationMessage('');
      setPackageListFlag(false);
    }
  }, [projectId, region]);

  useEffect(() => {
    if (composerSelected !== '' && dagList.length > 0) {
      const isUnique = !dagList.some(
        dag => dag.notebookname === jobNameSelected
      );
      setJobNameUniqueValidation(isUnique);
    }
  }, [dagList, jobNameSelected, composerSelected]);

  useEffect(() => {
    if (context !== '') {
      getKernelDetail();
    }
  }, [serverlessDataList, clusterList]);

  useEffect(() => {
    if (selectedMode === 'cluster') {
      listClustersAPI();
    } else {
      listSessionTemplatesAPI();
    }
  }, [selectedMode]);

  /**
   * Changing the region value and empyting the value of machineType, accelratorType and accelratorCount
   * @param {string} value selected region
   */
  const handleRegionChange = (value: React.SetStateAction<string>) => {
    setRegion(value);
  };

  useEffect(() => {
    setLoaderRegion(true);
    setLoaderProjectId(true);
    authApi().then(credentials => {
      if (credentials && credentials.project_id && credentials.region_id) {
        setLoaderProjectId(false);
        setProjectId(credentials.project_id);
        setLoaderRegion(false);
        setRegion(credentials.region_id);
      }
    });
    if (!projectId) {
      setRegion('');
      setComposerSelected('');
      setComposerList([]);
      setapiErrorMessage('');
      setPackageInstallationMessage('');
      setPackageListFlag(false);
    }
  }, [projectId]);

  useEffect(() => {
    const checkRequiredPackageApiService = async () => {
      setPackageListFlag(false);
      setPackageInstalledList([]);
      setapiErrorMessage('');

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      await SchedulerService.checkRequiredPackagesInstalled(
        composerSelected,
        setPackageInstallationMessage,
        setPackageInstalledList,
        setPackageListFlag,
        setapiErrorMessage,
        setCheckRequiredPackagesInstalledFlag,
        setDisabaleEnvLocal,
        signal,
        abortControllerRef
      );
    };

    if (isLocalKernel && editMode) {
      checkRequiredPackageApiService();
    }
  }, [packageEditFlag]);

  return (
    <>
      {createCompleted ? (
        <NotebookJobComponent
          app={app}
          themeManager={themeManager}
          settingRegistry={settingRegistry}
          setCreateCompleted={setCreateCompleted}
          setJobNameSelected={setJobNameSelected}
          setComposerSelected={setComposerSelected}
          setScheduleMode={setScheduleMode}
          setScheduleValue={setScheduleValue}
          setInputFileSelected={setInputFileSelected}
          setParameterDetail={setParameterDetail}
          setParameterDetailUpdated={setParameterDetailUpdated}
          setSelectedMode={setSelectedMode}
          setClusterSelected={setClusterSelected}
          setServerlessSelected={setServerlessSelected}
          setServerlessDataSelected={setServerlessDataSelected}
          serverlessDataList={serverlessDataList}
          setServerlessDataList={setServerlessDataList}
          setServerlessList={setServerlessList}
          setRetryCount={setRetryCount}
          setRetryDelay={setRetryDelay}
          setEmailOnFailure={setEmailOnFailure}
          setEmailonRetry={setEmailonRetry}
          setEmailOnSuccess={setEmailOnSuccess}
          setEmailList={setEmailList}
          setStopCluster={setStopCluster}
          setTimeZoneSelected={setTimeZoneSelected}
          setEditMode={setEditMode}
          setIsLoadingKernelDetail={setIsLoadingKernelDetail}
          setIsApiError={setIsApiError}
          setApiError={setApiError}
          setExecutionPageFlag={setExecutionPageFlag}
          setIsLocalKernel={setIsLocalKernel}
          setPackageEditFlag={setPackageEditFlag}
          setSchedulerBtnDisable={setSchedulerBtnDisable}
          composerSelected={composerSelected}
        />
      ) : (
        <div>
          <div className="submit-job-container">
            <div className="create-scheduler-form-element">
              <DynamicDropdown
                value={projectId}
                onChange={(_, projectId: string | null) =>
                  setProjectId(projectId ?? '')
                }
                fetchFunc={projectListAPI}
                label="Project ID*"
                // Always show the clear indicator and hide the dropdown arrow
                // make it very clear that this is an autocomplete.
                sx={{
                  '& .MuiAutocomplete-clearIndicator': {
                    visibility: 'visible'
                  }
                }}
                popupIcon={null}
                className={disableEnvLocal || editMode ? 'disable-item' : ''}
                loaderProjectId={loaderProjectId}
              />
            </div>
            {!projectId && <ErrorMessage message="Project ID is required" />}

            <div className="create-scheduler-form-element scheduler-region-top">
              <RegionDropdown
                projectId={projectId}
                region={region}
                onRegionChange={region => handleRegionChange(region)}
                editMode={disableEnvLocal || editMode}
                loaderRegion={loaderRegion}
              />
            </div>
            {!region && <ErrorMessage message="Region is required" />}

            <div className="create-scheduler-form-element block-level-seperation ">
              <Autocomplete
                className="create-scheduler-style"
                options={composerList}
                value={composerSelected}
                onChange={(_event, val) => handleComposerSelected(val)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Environment*"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {!(composerList.length > 0) &&
                            region &&
                            envApiFlag && (
                              <CircularProgress
                                aria-label="Loading Spinner"
                                data-testid="loader"
                                size={18}
                              />
                            )}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                disabled={editMode || disableEnvLocal || envApiFlag}
                disableClearable={!projectId || !region}
              />
            </div>
            {!composerSelected && (
              <ErrorMessage message="Environment is required field" />
            )}
            {apiErrorMessage && isLocalKernel && (
              <ErrorMessage message={apiErrorMessage} />
            )}
            {packageInstallationMessage && isLocalKernel && (
              <>
                {packageInstalledList.length > 0 ? (
                  <div className="success-message-package success-message-top">
                    <iconWarning.react
                      tag="div"
                      className="icon-white logo-alignment-style success_icon icon-size-status"
                    />
                    <div className="success-message-pack warning-font success-message-cl-package warning-message">
                      {packageInstallationMessage}
                    </div>
                  </div>
                ) : (
                  !apiErrorMessage && (
                    <div className="success-message-package success-message-top">
                      <CircularProgress
                        size={18}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                      />
                      <div className="success-message-pack warning-font success-message-cl-package enable-error-text-label">
                        {packageInstallationMessage}
                      </div>
                    </div>
                  )
                )}
              </>
            )}
            {packageListFlag && isLocalKernel && (
              <div className="success-message-package log-icon">
                <iconSuccess.react
                  tag="div"
                  title="Done !"
                  className="icon-white logo-alignment-style success_icon icon-size icon-completed"
                />
                <div className="warning-success-message">
                  Required packages are already installed
                </div>
              </div>
            )}
            <div className="create-scheduler-label block-seperation">
              Output formats
            </div>
            <div className="create-scheduler-form-element block-level-seperation ">
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      readOnly
                      checked={true}
                      defaultChecked={true}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>Notebook</Typography>
                  }
                />
              </FormGroup>
            </div>
            <div className="create-scheduler-label block-seperation">
              Parameters
            </div>
            <>
              <LabelProperties
                labelDetail={parameterDetail}
                setLabelDetail={setParameterDetail}
                labelDetailUpdated={parameterDetailUpdated}
                setLabelDetailUpdated={setParameterDetailUpdated}
                buttonText="ADD PARAMETER"
                keyValidation={keyValidation}
                setKeyValidation={setKeyValidation}
                valueValidation={valueValidation}
                setValueValidation={setValueValidation}
                duplicateKeyError={duplicateKeyError}
                setDuplicateKeyError={setDuplicateKeyError}
                fromPage="scheduler"
              />
            </>
            {!isLocalKernel && (
              <>
                <div className="create-scheduler-form-element block-seperation">
                  <FormControl>
                    <RadioGroup
                      aria-labelledby="demo-controlled-radio-buttons-group"
                      name="controlled-radio-buttons-group"
                      value={selectedMode}
                      onChange={handleSelectedModeChange}
                      row={true}
                    >
                      <FormControlLabel
                        value="cluster"
                        control={<Radio size="small" />}
                        label={
                          <Typography sx={{ fontSize: 13 }}>Cluster</Typography>
                        }
                      />
                      <FormControlLabel
                        value="serverless"
                        className="create-scheduler-label-style"
                        control={<Radio size="small" />}
                        label={
                          <Typography sx={{ fontSize: 13 }}>
                            Serverless
                          </Typography>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </div>
                <div className="create-scheduler-form-element">
                  {isLoadingKernelDetail && selectedMode !== 'local' && (
                    <CircularProgress
                      size={18}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  )}
                  {selectedMode === 'cluster' && !isLoadingKernelDetail && (
                    <>
                      <Autocomplete
                        className="create-scheduler-style"
                        options={clusterList}
                        value={clusterSelected}
                        onChange={(_event, val) => handleClusterSelected(val)}
                        renderInput={params => (
                          <TextField {...params} label="Cluster*" />
                        )}
                      />
                      {!clusterSelected && (
                        <ErrorMessage message="Cluster is required field" />
                      )}
                    </>
                  )}

                  {selectedMode === 'serverless' && !isLoadingKernelDetail && (
                    <>
                      <Autocomplete
                        className="create-scheduler-style"
                        options={serverlessList}
                        value={serverlessSelected}
                        onChange={(_event, val) =>
                          handleServerlessSelected(val)
                        }
                        renderInput={params => (
                          <TextField {...params} label="Serverless*" />
                        )}
                      />
                      {!serverlessSelected && (
                        <ErrorMessage message="Serverless is required field" />
                      )}
                    </>
                  )}
                </div>
                {selectedMode === 'cluster' && (
                  <div className="create-scheduler-form-element input-sub-action">
                    <FormGroup row={true}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={stopCluster}
                            onChange={handleStopCluster}
                          />
                        }
                        className="create-scheduler-label-style"
                        label={
                          <Typography
                            sx={{ fontSize: 13 }}
                            title="Stopping cluster abruptly will impact if any other job is running on the cluster at the moment"
                          >
                            Stop the cluster after notebook execution
                          </Typography>
                        }
                      />
                    </FormGroup>
                  </div>
                )}
              </>
            )}
            <div className="create-scheduler-form-element block-seperation">
              <Input
                className="create-scheduler-style"
                onChange={e => handleRetryCount(Number(e.target.value))}
                value={retryCount}
                Label="Retry count"
                type="number"
              />
            </div>
            <div className="create-scheduler-form-element">
              <Input
                className="create-scheduler-style"
                onChange={e => handleRetryDelay(Number(e.target.value))}
                value={retryDelay}
                Label="Retry delay (minutes)"
                type="number"
              />
            </div>
            <div className="create-scheduler-form-element block-level-seperation">
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={emailOnFailure}
                      onChange={handleFailureChange}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      Email on failure
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={emailOnRetry}
                      onChange={handleRetryChange}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      Email on retry
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={emailOnSuccess}
                      onChange={handleSuccessChange}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      Email on success
                    </Typography>
                  }
                />
              </FormGroup>
            </div>
            {(emailOnFailure || emailOnRetry || emailOnSuccess) && (
              <div className="create-scheduler-form-element">
                <MuiChipsInput
                  className="select-job-style"
                  onChange={e => handleEmailList(e)}
                  addOnBlur={true}
                  value={emailList}
                  inputProps={{ placeholder: '' }}
                  label="Email recipients"
                />
              </div>
            )}
            {(emailOnFailure || emailOnRetry || emailOnSuccess) &&
              !emailList.length && (
                <ErrorMessage message="Email recipients is required field" />
              )}
            {(emailOnFailure || emailOnRetry || emailOnSuccess) &&
              emailError && (
                <ErrorMessage message="Please enter a valid email address. E.g username@domain.com" />
              )}
            <div className="create-scheduler-label block-seperation">
              Schedule
            </div>
            <div className="create-scheduler-form-element">
              <FormControl>
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={scheduleMode}
                  onChange={handleSchedulerModeChange}
                >
                  <FormControlLabel
                    value="runNow"
                    className="create-scheduler-label-style"
                    control={<Radio size="small" />}
                    label={
                      <Typography sx={{ fontSize: 13 }}>Run now</Typography>
                    }
                  />
                  <FormControlLabel
                    value="runSchedule"
                    className="create-scheduler-label-style"
                    control={<Radio size="small" />}
                    label={
                      <Typography sx={{ fontSize: 13 }}>
                        Run on a schedule
                      </Typography>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </div>
            {scheduleMode === 'runSchedule' && (
              <>
                <div className="create-scheduler-form-element">
                  <Cron value={scheduleValue} setValue={setScheduleValue} />
                </div>
                <div className="create-scheduler-form-element">
                  <Autocomplete
                    className="create-scheduler-style"
                    options={timezones}
                    value={timeZoneSelected}
                    onChange={(_event, val) => handleTimeZoneSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Time Zone" />
                    )}
                  />
                </div>
              </>
            )}
            <div className="save-overlay">
              <Button
                onClick={() => {
                  if (!isSaveDisabled()) {
                    handleCreateJobScheduler();
                  }
                }}
                variant="contained"
                disabled={isSaveDisabled()}
                aria-label={editMode ? ' Update Schedule' : 'Create Schedule'}
              >
                <div>
                  {editMode
                    ? creatingScheduler
                      ? 'UPDATING'
                      : 'UPDATE'
                    : creatingScheduler
                      ? 'CREATING'
                      : 'CREATE'}
                </div>
              </Button>
              <Button
                variant="outlined"
                disabled={creatingScheduler}
                aria-label="cancel Batch"
                onClick={!creatingScheduler ? handleCancel : undefined}
              >
                <div>CANCEL</div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateNotebookScheduler;
