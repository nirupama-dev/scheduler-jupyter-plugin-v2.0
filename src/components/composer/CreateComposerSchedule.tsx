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
import { SchedulerService } from '../../services/composer/SchedulerServices';
import { authApi } from '../common/login/Config';
import { DropdownOption } from '../../interfaces/FormInterface';
import { handleErrorToast } from '../common/notificationHandling/ErrorUtils';
// import { EXECUTION_MODE_OPTIONS } from '../../utils/Constants';
import { ICreateComposerSchedulerProps } from '../../interfaces/ComposerInterface';
import { SCHEDULE_MODE_OPTIONS } from '../../utils/Constants';
import { FormGroup } from '@mui/material';

export const CreateComposerSchedule: React.FC<
  ICreateComposerSchedulerProps
> = ({ control, errors, setValue, watch }) => {
  const [regionOptions, setRegionOptions] = useState<DropdownOption[]>([]);
  const [envOptions, setEnvOptions] = useState<DropdownOption[]>([]);
  const [emailList, setEmailList] = useState<string[]>([]);

  const timezones = Object.keys(tzdata.zones).sort();
  const timeZoneOptions: DropdownOption[] = timezones.map(zone => ({
    label: zone,
    value: zone
  }));

  // Watch for changes in form fields
  const selectedProjectId = watch('projectId');
  const selectedRegion = watch('region');
  const scheduleMode = watch('scheduleMode');
  const emailOnFailure = watch('emailOnFailure');
  const emailOnRetry = watch('emailOnRetry');
  const emailOnSuccess = watch('emailOnSuccess');

  /**
   * Effect to fetch the project ID and region from the auth API
   */
  useEffect(() => {
    const loadInitialCredentials = async () => {
      try {
        const credentials = await authApi();
        if (credentials?.project_id) {
          setValue('projectId', credentials.project_id);
          // Region will be handled by the subsequent useEffect and state updates.
        }
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
    if (selectedProjectId) {
      ComputeServices.regionAPIService(selectedProjectId, setRegionOptions);
    } else {
      setRegionOptions([]); // Clear regions if no project is selected
    }
    // Always clear environment when project_id changes
    setValue('environment', '');
  }, [selectedProjectId, setValue]);

  // --- Logic to Pre-fill Region from Credentials (after regionOptions are updated) ---
  // useEffect(() => {
  //   if (selectedProjectId && regionOptions.length > 0) {
  //     // Only run if project is selected and regions are fetched
  //     authApi()
  //       .then(credentials => {
  //         if (credentials?.region_id) {
  //           // Check if the credential's region exists in the *currently available* regionOptions
  //           const regionExists = regionOptions.find(
  //             opt => opt.value === credentials.region_id
  //           );
  //           if (regionExists) {
  //             // Only set if the form field for region is currently empty or not matching the prefilled value
  //             if (selectedRegion === '') {
  //               setValue('region', credentials.region_id);
  //             }
  //           }
  //         }
  //       })
  //       .catch(err => console.error('Error checking authApi for region:', err));
  //   }
  // }, [regionOptions, selectedRegion, setValue]);

  useEffect(() => {
    if (selectedProjectId && selectedRegion) {
      SchedulerService.listComposersAPIService(
        setEnvOptions,
        selectedProjectId,
        selectedRegion
      );
    } else {
      setEnvOptions([]);
    }
  }, [selectedRegion, setValue]);

  // Handle Project ID change: Clear Region and Environment
  const handleProjectIdChange = useCallback(
    (value: string) => {
      setValue('projectId', value);
      // setValue('region', '');
      setRegionOptions([]);
      setEnvOptions([]);
    },
    [setValue]
  );

  // Handle Region change: Clear Environment
  const handleRegionChange = useCallback(
    (value: string) => {
      console.log('Region changed to:', value);
      setValue('region', value);
      setEnvOptions([]);
    },
    [setValue]
  );

  const handleEmailList = (data: string[]) => {
    // const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // let invalidEmail = false;
    // data.forEach(email => {
    //   if (!emailPattern.test(email)) {
    //     invalidEmail = true;
    //     setEmailError(true);
    //   }
    // });
    // if (invalidEmail === false) {
    //   setEmailError(false);
    // }
    setEmailList(data);
  };

  return (
    <div className="common-fields">
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="projectId"
          label="Project ID"
          control={control}
          setValue={setValue}
          options={[{ label: selectedProjectId, value: selectedProjectId }]}
          customClass="create-scheduler-style"
          onChangeCallback={handleProjectIdChange}
        />
      </div>
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="region"
          label="Region"
          control={control}
          setValue={setValue}
          options={regionOptions}
          customClass="create-scheduler-style"
          onChangeCallback={handleRegionChange}
        />
      </div>
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="environment"
          label="Environment"
          control={control}
          setValue={setValue}
          options={envOptions}
          customClass="create-scheduler-style"
        />
      </div>
      <div className="create-scheduler-label block-seperation">
        Output formats
      </div>
      <div className="create-scheduler-form-element">
        <FormInputCheckbox
          name="outputFormats"
          label="Notebook"
          control={control}
          isChecked={true}
          disabled={true}
        />
      </div>
      <div className="create-scheduler-label block-seperation">Parameters</div>
      {/* <div className="create-scheduler-form-element sub-para"> */}
      {/* <FormInputRadio
          name="executionMode"
          control={control}
          className="schedule-radio-btn"
          options={EXECUTION_MODE_OPTIONS}
        />
      </div>
      {/* <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="cluster"
          label="Cluster*"
          control={control}
          options={[]}
          customClass="create-scheduler-style"
        />
      </div>
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="serverless"
          label="Serverless"
          control={control}
          options={[]}
          customClass="create-scheduler-style"
        />
      </div> */}
      {/* <div className="create-scheduler-form-element">
        <FormInputMultiCheckbox
          name="stopClusterAfterExecution"
          control={control}
          setValue={setValue}
          options={[
            {
              label: 'Stop the cluster after notebook execution',
              value: ''
            }
          ]}
        />
      </div> */}
      <div className="create-scheduler-form-element block-seperation">
        <FormInputText
          label="Retry count"
          control={control}
          name="retryCount"
          type="number"
          className="create-scheduler-style"
        />
      </div>
      <div className="create-scheduler-form-element">
        <FormInputText
          label="Retry delay (minutes)"
          control={control}
          name="retryDelay"
          type="number"
          className="create-scheduler-style"
        />
      </div>
      <div className="create-scheduler-form-element">
        <FormGroup row={true}>
          <FormInputCheckbox
            name="emailOnFailure"
            label="Email on failure"
            control={control}
            className="create-scheduler-label-style"
          />
          <FormInputCheckbox
            name="emailOnRetry"
            label="Email on retry"
            control={control}
            className="create-scheduler-label-style"
          />
          <FormInputCheckbox
            name="emailOnSuccess"
            label="Email on success"
            control={control}
            className="create-scheduler-label-style"
          />
        </FormGroup>
      </div>
      {(emailOnFailure || emailOnRetry || emailOnSuccess) && (
        <div className="create-scheduler-form-element">
          <MuiChipsInput
            name="emailRecipients"
            className="select-job-style"
            onChange={e => handleEmailList(e)}
            addOnBlur={true}
            value={emailList}
            inputProps={{ placeholder: '' }}
            label="Email recipients"
          />
        </div>
      )}
      <div className="create-scheduler-label block-seperation">Schedule</div>
      <div className="create-scheduler-form-element">
        <FormInputRadio
          name="scheduleMode"
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
        />
      </div>
      {scheduleMode === 'runSchedule' && (
        <div>
          <div className="create-scheduler-form-element">
            <Cron value={''} setValue={() => {}} />
          </div>
          <div className="create-scheduler-form-element">
            <FormInputDropdown
              name="timeZone"
              label="Time Zone"
              control={control}
              setValue={setValue}
              options={timeZoneOptions}
              customClass="create-scheduler-style"
            />
          </div>
        </div>
      )}
    </div>
  );
};
