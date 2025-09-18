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
import { MuiChipsInput } from 'mui-chips-input';
import { FormInputDropdown } from '../common/formFields/FormInputDropdown';
import { FormInputCheckbox } from '../common/formFields/FormInputCheckbox';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import Cron from 'react-js-cron';
import tzdata from 'tzdata';
import { ComputeServices } from '../../services/common/Compute';
import { ComposerServices } from '../../services/composer/ComposerServices';
import { authApi } from '../common/login/Config';
import { handleErrorToast } from '../common/notificationHandling/ErrorUtils';
import {
  IComposerEnvAPIResponse,
  ICreateComposerSchedulerProps,
  ILoadingStateComposer
} from '../../interfaces/ComposerInterface';
import {
  composerEnvironmentStateListForCreate,
  EXECUTION_MODE_OPTIONS,
  PACKAGES,
  SCHEDULE_MODE_OPTIONS
} from '../../utils/Constants';
import { Box, FormGroup } from '@mui/material';
import { AddParameters } from './AddParameters';
import { ILabelValue } from '../../interfaces/CommonInterface';

export const CreateComposerSchedule: React.FC<
  ICreateComposerSchedulerProps
> = ({ control, errors, setValue, watch, setError }) => {
  const [regionOptions, setRegionOptions] = useState<ILabelValue<string>[]>([]);
  const [envOptions, setEnvOptions] = useState<ILabelValue<string>[]>([]);
  const [composerEnvData, setComposerEnvData] = useState<
    IComposerEnvAPIResponse[]
  >([]);
  const [clusterOptions, setClusterOptions] = useState<ILabelValue<string>[]>(
    []
  );
  const [serverlessOptions, setServerlessOptions] = useState<
    ILabelValue<string>[]
  >([]);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState<ILoadingStateComposer>({
    projectId: false,
    region: false,
    environment: false,
    cluster: false,
    serverless: false
    // ... initialize other mandatory properties
  });

  const timezones = Object.keys(tzdata.zones).sort();
  const timeZoneOptions: ILabelValue<string>[] = timezones.map(zone => ({
    label: zone,
    value: zone
  }));

  // Watch for changes in form fields
  const selectedProjectId = watch('projectId');
  const selectedRegion = watch('composerRegion');
  const scheduleMode = watch('scheduleMode');
  const emailOnFailure = watch('emailOnFailure');
  const emailOnRetry = watch('emailOnRetry');
  const emailOnSuccess = watch('emailOnSuccess');
  const executionMode = watch('executionMode');

  /**
   * Effect to fetch the project ID and region from the auth API
   */
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
        handleErrorToast({
          error: `Failed to load initial credentials: ${error}`
        });
      }
    };
    loadInitialCredentials();
  }, [setValue]);

  // --- Fetch Regions based on selected Project ID ---
  useEffect(() => {
    // if (selectedProjectId) {
    //   const regionList: ILabelValue<string>[] = ComputeServices.regionAPIService(
    //     selectedProjectId,
    //   );

    //   if (regionList) {
    //     setRegionOptions(regionList);
    //   }
    // } else {
    //   setRegionOptions([]); // Clear regions if no project is selected
    // }
    const fetchRegions = async () => {
      if (selectedProjectId) {
        setValue('composerRegion', '');

        try {
          setLoadingState(prev => ({ ...prev, region: true }));
          const options =
            await ComputeServices.regionAPIService(selectedProjectId);
          setRegionOptions(options);
        } finally {
          setLoadingState(prev => ({ ...prev, region: false }));
        }
      } else {
        setRegionOptions([]); // Clear regions if no project is selected
      }
    };
    fetchRegions();
    // Clear subsequent fields when project_id changes
    setValue('environment', '');
  }, [selectedProjectId, setValue]);

  useEffect(() => {
    // Fetch environments based on selected project and region
    const fetchEnvironments = async () => {
      if (selectedProjectId || selectedRegion) {
        try {
          setLoadingState(prev => ({ ...prev, environment: true }));
          const options = await ComposerServices.listComposersAPIService(
            selectedProjectId,
            selectedRegion
          );
          setEnvOptions(options);
        } finally {
          setLoadingState(prev => ({ ...prev, environment: false }));
        }
      } else {
        setEnvOptions([]);
        setComposerEnvData([]);
      }
    };
    // Fetch environments when project and region are selected

    fetchEnvironments();
  }, [selectedRegion, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      if (executionMode === 'cluster') {
        setValue('serverless', '');
        const clusterOptionsFromAPI =
          await ComposerServices.listClustersAPIService();
        setClusterOptions(clusterOptionsFromAPI);
      } else if (executionMode === 'serverless') {
        setValue('cluster', '');
        const serverlessOptionsFromAPI =
          await ComposerServices.listSessionTemplatesAPIService();
        setServerlessOptions(serverlessOptionsFromAPI);
      } else {
        setClusterOptions([]);
        setServerlessOptions([]);
      }
    };

    fetchData();
  }, [executionMode, setValue]);

  // Handle Project ID change: Clear Region and Environment
  const handleProjectIdChange = useCallback(
    (value: string) => {
      setValue('projectId', value);
      setRegionOptions([]);
      setEnvOptions([]);
      setComposerEnvData([]);
    },
    [setValue]
  );

  // Handle Region change: Clear Environment
  const handleRegionChange = useCallback(
    (value: string) => {
      setValue('composerRegion', value);
      setEnvOptions([]);
      setComposerEnvData([]);
    },
    [setValue]
  );

  const findEnvironmentSelected = (
    selectedEnvironment?: string,
    composerEnvData?: IComposerEnvAPIResponse[]
  ) => {
    return composerEnvData?.find(
      environment => environment.name === selectedEnvironment
    );
  };

  const checkRequiredPackages = (env: IComposerEnvAPIResponse) => {
    const packages_from_env = env?.pypi_packages;
    const missingPackages = packages_from_env
      ? PACKAGES.filter(
          pkg => !Object.prototype.hasOwnProperty.call(packages_from_env, pkg)
        )
      : PACKAGES.slice(); // If packages_from_env is falsy, all are missing

    console.log(`Missing packages: ${missingPackages.join(', ')}`);
    // Here you can handle the missing packages

    if (missingPackages.length === 0) {
      setError('environment', {
        message: 'Required packages are already installed'
      });
    } else {
      const message =
        missingPackages.join(', ') +
        ' will get installed on creation of schedule';
      setError('environment', { message: message });
      // setPackageInstalledList(missingPackages);
    }
  };

  const handleEnvChange = useCallback(
    (value: string) => {
      setValue('environment', value);
      if (value) {
        const selectedEnvironment = findEnvironmentSelected(
          value,
          composerEnvData
        );
        console.log('exec', executionMode);
        if (selectedEnvironment) {
          if (executionMode === 'local') {
            checkRequiredPackages(selectedEnvironment);
          }
        }
      }
    },
    [setValue, composerEnvData]
  );

  return (
    <div>
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="projectId"
          label="Project ID"
          control={control}
          setValue={setValue}
          options={[{ label: selectedProjectId, value: selectedProjectId }]}
          loading={loadingState.projectId}
          customClass="scheduler-tag-style "
          onChangeCallback={handleProjectIdChange}
          disabled={true}
        />
      </div>
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="composerRegion"
          label="Region"
          control={control}
          setValue={setValue}
          options={regionOptions}
          loading={loadingState.region}
          customClass="scheduler-tag-style "
          onChangeCallback={handleRegionChange}
          error={errors.composerRegion}
        />
      </div>
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="environment"
          label="Environment"
          control={control}
          setValue={setValue}
          options={envOptions}
          loading={loadingState.environment}
          customClass="scheduler-tag-style "
          onChangeCallback={handleEnvChange}
          error={errors.environment}
          getOptionDisabled={option =>
            composerEnvironmentStateListForCreate !== option.state
          }
          renderOption={(props: any, option: any) => {
            const { key, ...optionProps } = props;
            return (
              <Box key={key} component="li" {...optionProps}>
                {composerEnvironmentStateListForCreate === option.state ? (
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
        />
      </div>
      <div className="create-scheduler-label block-seperation">
        Output formats
      </div>
      <div className="scheduler-form-element-container">
        <FormInputCheckbox
          name="outputFormats"
          label="Notebook"
          control={control}
          isChecked={true}
          disabled={true}
        />
      </div>
      <AddParameters control={control} errors={errors} />
      {executionMode !== 'local' && (
        <div>
          <div className="scheduler-form-element-container sub-para">
            <FormInputRadio
              name="executionMode"
              control={control}
              className="schedule-radio-btn"
              options={EXECUTION_MODE_OPTIONS}
              error={errors.executionMode}
            />
          </div>
          {executionMode === 'cluster' && (
            <div className="scheduler-form-element-container">
              <FormInputDropdown
                name="cluster"
                label="Cluster*"
                control={control}
                setValue={setValue}
                options={clusterOptions}
                loading={loadingState.cluster}
                customClass="scheduler-tag-style "
                error={errors.cluster}
              />
            </div>
          )}
          {executionMode === 'serverless' && (
            <div className="scheduler-form-element-container">
              <FormInputDropdown
                name="serverless"
                label="Serverless"
                control={control}
                setValue={setValue}
                options={serverlessOptions}
                loading={loadingState.serverless}
                customClass="scheduler-tag-style "
                error={errors.serverless}
              />
            </div>
          )}
          {executionMode === 'cluster' && (
            <div className="scheduler-form-element-container">
              <FormInputCheckbox
                name="stopClusterAfterExecution"
                control={control}
                label="Stop cluster after execution"
                className="scheduler-label-font"
              />
            </div>
          )}
        </div>
      )}
      <div className="scheduler-form-element-container block-seperation">
        <FormInputText
          label="Retry count"
          control={control}
          name="retryCount"
          type="number"
          className="scheduler-tag-style "
          error={errors.retryCount}
        />
      </div>
      <div className="scheduler-form-element-container">
        <FormInputText
          label="Retry delay (minutes)"
          control={control}
          name="retryDelay"
          type="number"
          className="scheduler-tag-style "
          error={errors.retryDelay}
        />
      </div>
      <div className="scheduler-form-element-container">
        <FormGroup row={true}>
          <FormInputCheckbox
            name="emailOnFailure"
            label="Email on failure"
            control={control}
            className="scheduler-label-font"
          />
          <FormInputCheckbox
            name="emailOnRetry"
            label="Email on retry"
            control={control}
            className="scheduler-label-font"
          />
          <FormInputCheckbox
            name="emailOnSuccess"
            label="Email on success"
            control={control}
            className="scheduler-label-font"
          />
        </FormGroup>
      </div>
      {(emailOnFailure || emailOnRetry || emailOnSuccess) && (
        <div className="scheduler-form-element-container">
          <MuiChipsInput
            name="emailRecipients"
            className="select-job-style"
            onChange={e => setEmailList(e)}
            addOnBlur={true}
            value={emailList}
            inputProps={{ placeholder: '' }}
            label="Email recipients"
            // error={errors.email_recipients}
          />
        </div>
      )}
      <div className="create-scheduler-label block-seperation">Schedule</div>
      <div className="scheduler-form-element-container">
        <FormInputRadio
          name="scheduleMode"
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
        />
      </div>
      {scheduleMode === 'runSchedule' && (
        <div>
          <div className="scheduler-form-element-container">
            <Cron value={''} setValue={() => {}} />
          </div>
          <div className="scheduler-form-element-container">
            <FormInputDropdown
              name="timeZone"
              label="Time Zone"
              control={control}
              setValue={setValue}
              options={timeZoneOptions}
              customClass="scheduler-tag-style "
              error={errors.timeZone}
            />
          </div>
        </div>
      )}
    </div>
  );
};
