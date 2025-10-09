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
import Cron, { PeriodType } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import tzdata from 'tzdata';
import { ComputeServices } from '../../services/common/Compute';
import { ComposerServices } from '../../services/composer/ComposerServices';
import { handleOpenLoginWidget } from '../common/login/Config';
import {
  IComposerEnvAPIResponse,
  ICreateComposerSchedulerProps,
  ILoadingStateComposer
} from '../../interfaces/ComposerInterface';
import {
  allowedPeriodsCron,
  composerEnvironmentStateListForCreate,
  EXECUTION_MODE_OPTIONS,
  PACKAGES,
  SCHEDULE_MODE_OPTIONS
} from '../../utils/Constants';
import { Box, FormGroup } from '@mui/material';
import { AddParameters } from './AddParameters';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { Controller } from 'react-hook-form';
import { createComposerSchema } from '../../schemas/CreateComposerSchema';
import { FieldErrors } from 'react-hook-form';
import z from 'zod';

export const CreateComposerSchedule: React.FC<
  ICreateComposerSchedulerProps
> = ({
  control,
  errors,
  setValue,
  getValues,
  watch,
  setError, app,
  trigger,
  isValid,
  credentials,
  initialSchedulerDataContext
}) => {
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
  const currentSchedulerSelection = watch('schedulerSelection');
  const isComposerForm = currentSchedulerSelection === 'composer';
  const composerErrors = isComposerForm
    ? (errors as FieldErrors<z.infer<typeof createComposerSchema>>)
    : {};
  console.log('is valid', isValid);
  console.log('composerErrors', composerErrors);
  console.log('getValues', getValues());

  // --- Fetch Regions based on selected Project ID ---

    const fetchRegions = async () => {
      if (selectedProjectId) {
        setValue('composerRegion', '');

        try {
          setLoadingState(prev => ({ ...prev, region: true }));
          const options =
            await ComputeServices.regionAPIService(selectedProjectId);
          setRegionOptions(options);
          let currentRegionValue = getValues('composerRegion');

          // If no value is currently set, try to use the default from credentials.
          if (!currentRegionValue && credentials?.region_id) {
            currentRegionValue = credentials.region_id;
          }

          // Validate the determined regionToSet against the list of valid regions.
          const isRegionValid = options.some(
            region => region.value === currentRegionValue
          );
          // If the region is valid, set it; otherwise, clear the field.
          if (!isRegionValid) {
            setValue('composerRegion', '');
          } else {
            setValue('composerRegion', currentRegionValue);
          }
        } catch (authenticationError) {
          handleOpenLoginWidget(app);
        } finally {
          setLoadingState(prev => ({ ...prev, region: false }));
        }
      }
    };

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, environment: true }));
      const options = await ComposerServices.listComposersAPIService(
        selectedProjectId,
        selectedRegion
      );
      setEnvOptions(options);
        } catch (authenticationError) {
          handleOpenLoginWidget(app);
    } finally {
      setLoadingState(prev => ({ ...prev, environment: false }));
    }
  }, [selectedProjectId, selectedRegion]);

  const fetchRemoteKernelData = useCallback(async () => {
      try {
        if (executionMode === 'cluster') {
          setValue('serverless', '');
          const clusterOptionsFromAPI =
            await ComposerServices.listClustersAPIService();
          setClusterOptions(clusterOptionsFromAPI);
          const selectedClusterName = clusterOptionsFromAPI.find((clusterOption: ILabelValue<string>) =>
            initialSchedulerDataContext?.initialDefaults?.kernelDetails?.kernelDisplayName.includes(clusterOption.value)
          );
          setValue('cluster', selectedClusterName? selectedClusterName.value : '');
        } else if (executionMode === 'serverless') {
          setValue('cluster', '');
          const serverlessOptionsFromAPI =
            await ComposerServices.listSessionTemplatesAPIService();
          setServerlessOptions(serverlessOptionsFromAPI);
          const selectedServerlessName = serverlessOptionsFromAPI.find((serverlessOption: ILabelValue<string>) =>
            initialSchedulerDataContext?.initialDefaults?.kernelDetails?.kernelDisplayName.includes(serverlessOption.value)
          );
          setValue('serverless', selectedServerlessName ? selectedServerlessName.value : '');
        } else {
          setClusterOptions([]);
          setServerlessOptions([]);
        }
      } catch (authenticationError) {
        handleOpenLoginWidget(app);
      }finally {
        trigger(['cluster', 'serverless']);
      }
    },[executionMode, setValue, initialSchedulerDataContext]);

  /**
   * Effect to fetch the project ID auth API, Remote kernel data if applicable
   * This effect runs once on component mount.
   */
  useEffect(() => {
    setLoadingState(prev => ({ ...prev, projectId: true }));
    if (!selectedProjectId && credentials?.project_id) {
      console.log("settingValue");
      setValue('projectId', credentials.project_id);
    }
    console.log('project Id:', selectedProjectId, getValues('projectId'));
    console.log('Credentials:', credentials);
    setLoadingState(prev => ({ ...prev, projectId: false }));

    if(initialSchedulerDataContext && initialSchedulerDataContext?.initialDefaults?.kernelDetails?.executionMode!= 'local'){
      fetchRemoteKernelData();
    }
  }, []);

  
  /**
   * Effect to fetch regions when project ID changes, and  reset environments when region changes.
   */
  useEffect(() => {
    if (selectedProjectId) {
      fetchRegions();
    } else {
      setRegionOptions([]); // Clear regions if no project is selected
      setValue('composerRegion', '');
      setEnvOptions([]);
      setComposerEnvData([]);
      setValue('environment', '');
    }

    // Clear subsequent fields when project_id changes
  }, [selectedProjectId, setValue]);

  /**
   * Effect to fetch environments when region changes.
   */
  useEffect(() => {
    if (selectedRegion) {
      fetchEnvironments();
    } else {
      setEnvOptions([]);
      setComposerEnvData([]);
      setValue('environment', '');
    }
  }, [selectedRegion, setValue]);

  /**
   * Effect to fetch Cluster/ Serverless data when execution mode changes.
   */
  useEffect(() => {
    if (executionMode !== 'local') {
      fetchRemoteKernelData();
    }
  }, [executionMode, setValue]);

  // Handle Project ID change: Clear Region and Environment
  const handleProjectIdChange = useCallback(
    (projectValue: string) => {
      setValue('projectId', projectValue);
      setRegionOptions([]);
      setEnvOptions([]);
      setComposerEnvData([]);
      trigger(['composerRegion', 'environment', 'projectId']);
    },
    [setValue]
  );

  // Handle Region change: Clear Environment
  const handleRegionChange = useCallback(
    (regionValue: string) => {
      setValue('composerRegion', regionValue);
      setEnvOptions([]);
      setComposerEnvData([]);
      trigger(['environment', 'composerRegion']);
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
    (environmentValue: string) => {
      setValue('environment', environmentValue);
      if (environmentValue) {
        const selectedEnvironment = findEnvironmentSelected(
          environmentValue,
          composerEnvData
        );
        console.log('exec', executionMode);
        if (selectedEnvironment) {
          if (executionMode === 'local') {
            checkRequiredPackages(selectedEnvironment);
          }
        }
      }
      trigger('environment');
    },
    [setValue, composerEnvData]
  );

  const handleCronExpression = useCallback(
    (value: string) => {
      setValue('scheduleValue', value);
    },
    [setValue]
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
          error={composerErrors.projectId}
          disabled={true}
        />
      </div>
      <div className="scheduler-form-element-container scheduler-input-top">
        <FormInputDropdown
          name="composerRegion"
          label="Region"
          control={control}
          setValue={setValue}
          options={regionOptions}
          loading={loadingState.region}
          customClass="scheduler-tag-style "
          onChangeCallback={handleRegionChange}
          error={composerErrors.composerRegion}
        />
      </div>
      <div
        className={
          errors.composerRegion
            ? 'scheduler-form-element-container scheduler-input-top error-input'
            : 'scheduler-form-element-container scheduler-input-top'
        }
      >
        <FormInputDropdown
          name="environment"
          label="Environment"
          control={control}
          setValue={setValue}
          options={envOptions}
          loading={loadingState.environment}
          disabled={!selectedRegion}
          customClass="scheduler-tag-style "
          onChangeCallback={handleEnvChange}
          error={composerErrors.environment}
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
              error={composerErrors.executionMode}
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
                error={composerErrors.cluster}
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
                error={composerErrors.serverless}
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
          error={composerErrors.retryCount}
        />
      </div>
      <div className="scheduler-form-element-container scheduler-input-top">
        <FormInputText
          label="Retry delay (minutes)"
          control={control}
          name="retryDelay"
          type="number"
          className="scheduler-tag-style "
          error={composerErrors.retryDelay}
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
            //error={composerErrors.emailRecipients}
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
          <div className="scheduler-input-top">
            <Controller
              name="scheduleValue"
              control={control}
              render={({ field }) => (
                <Cron
                  value={field.value || ''}
                  setValue={(newValue: string) => {
                    field.onChange(newValue);
                    handleCronExpression(newValue);
                  }}
                  allowedPeriods={
                    allowedPeriodsCron as PeriodType[] | undefined
                  }
                />
              )}
            />
          </div>
          <div className="scheduler-form-element-container">
            <FormInputDropdown
              name="timeZone"
              label="Time Zone"
              control={control}
              setValue={setValue}
              options={timeZoneOptions}
              customClass="scheduler-tag-style "
              error={composerErrors.timeZone}
            />
          </div>
        </div>
      )}
    </div>
  );
};
