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
import { FormInputDropdown } from '../common/formFields/FormInputDropdown';
import {
  allowedPeriodsCron,
  CORN_EXP_DOC_URL,
  DEFAULT_DISK_MAX_SIZE,
  DEFAULT_DISK_MIN_SIZE,
  DEFAULT_DISK_SIZE,
  DEFAULT_MACHINE_TYPE,
  DEFAULT_NETWORK_SELECTED,
  DISK_TYPE_VALUE,
  KERNEL_VALUE,
  NETWORK_CONFIGURATION_LABEL,
  NETWORK_CONFIGURATION_LABEL_DESCRIPTION,
  NETWORK_OPTIONS,
  RUN_ON_SCHEDULE_OPTIONS,
  SCHEDULE_FORMAT_DESCRIPTION,
  SCHEDULE_MODE_OPTIONS,
  VERTEX_REGIONS
} from '../../utils/Constants';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LearnMore from '../common/links/LearnMore';
import Cron, { PeriodType } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import {
  IAcceleratorConfig,
  ICreateVertexSchedulerProps,
  ILoadingStateVertex,
  IMachineType
  // IServiceAccount
} from '../../interfaces/VertexInterface';
import { authApi } from '../common/login/Config';
import { handleErrorToast } from '../common/notificationHandling/ErrorUtils';
import { VertexServices } from '../../services/vertex/Vertex';
import { FieldErrors } from 'react-hook-form';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import z from 'zod';
import { StorageServices } from '../../services/common/Storage';
import { IamServices } from '../../services/common/Iam';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { ComputeServices } from '../../services/common/Compute';
import tzdata from 'tzdata';

export const CreateVertexSchedule: React.FC<ICreateVertexSchedulerProps> = ({
  control,
  errors,
  watch,
  setValue,
  getValues,
  trigger
}) => {
  const [machineTypeList, setMachineTypeList] = useState<IMachineType[]>([]);
  const [loadingState, setLoadingState] = useState<ILoadingStateVertex>({
    region: false,
    machineType: false,
    cloudStorageBucket: false
    // ... initialize other mandatory properties
  });
  const [cloudStorageList, setCloudStorageList] = useState<
    ILabelValue<string>[]
  >([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [hostProject, setHostProject] = useState<any>({});
  const [serviceAccountList, setServiceAccountList] = useState<
    ILabelValue<string>[]
  >([]);
  const [primaryNetworkList, setPrimaryNetworkList] = useState<
    ILabelValue<string>[]
  >([]);

  const timezones = Object.keys(tzdata.zones)
    .sort()
    .map(zones => ({
      label: zones,
      value: zones
    }));

  const [subNetworkList, setSubNetworkList] = useState<ILabelValue<string>[]>(
    []
  );

  const region = watch('region');
  const machineType = watch('machineType');
  const acceleratorType = watch('acceleratorType');
  const schedulerSelection = watch('schedulerSelection');
  const cloudStorageBucket = watch('cloudStorageBucket');
  const diskSize = watch('diskSize');
  const networkSelected = watch('networkOption');
  const scheduleMode = watch('scheduleMode');
  const internalScheduleMode = watch('internalScheduleMode');
  const primaryNetwork = watch('primaryNetworkSelected');

  // Use a type guard to narrow down the 'errors' object's type
  // because of discrimation need to use this approach for getting machine type error from zod
  // TODO DISCUSS
  const machineTypeError =
    schedulerSelection === 'vertex'
      ? (errors as FieldErrors<z.infer<typeof createVertexSchema>>).machineType
      : undefined;

  /**
   * Changing the region value and empyting the value of machineType, accelratorType and accelratorCount
   * @param {string} value selected region
   */
  const handleRegionChange = (value: React.SetStateAction<string>) => {
    setValue('machineType', '');
    setMachineTypeList([]);
    setValue('acceleratorType', '');
    setValue('acceleratorCount', '');
    trigger('region');
    trigger('machineType');
  };

  /**
   * Hosts the machine type API service
   */
  const machineTypeAPI = () => {
    VertexServices.machineTypeAPIService(
      region,
      setMachineTypeList,
      setLoadingState
      // setMachineTypeLoading,
      // setIsApiError,
      // setApiError,
      // setApiEnableUrl
    );
  };

  /**
   * Handles Acceleration Type listing
   * @param {AcceleratorConfig} acceleratorConfig acceleratorConfigs data
   */
  const getAcceleratedType = (acceleratorConfig: IAcceleratorConfig[]) => {
    return acceleratorConfig.map(
      (item: { acceleratorType: { label: string; value: string } }) => ({
        label: item.acceleratorType.value,
        value: item.acceleratorType.value
      })
    );
  };

  /**
   * Filters the cloud storage bucket options based on the user's search input.
   * If no matches are found, adds the option to create a new bucket.
   * @param {string[]} options - The list of available cloud storage buckets.
   * @param {any} state - The state object containing the search input value.
   */
  const filterOptions = (options: ILabelValue<string>[], state: any) => {
    const inputValue = state.inputValue.trim().toLowerCase();
    // If the input value is empty, return the original options
    const filteredOptions = options.filter(option =>
      option.value.toLowerCase().includes(inputValue)
    );

    // If no options match the search input, add the option to create a new bucket
    const exactMatch = options.some(
      option => option.value.toLowerCase() === inputValue
    );
    // If no exact match is found, add the option to create a new bucket
    if (!exactMatch && inputValue !== '') {
      filteredOptions.push({
        label: `Create and Select "${state.inputValue}"`,
        value: `Create and Select "${state.inputValue}"`
      });
    }

    return filteredOptions;
  };

  /**
   * Hosts the cloud storage API service
   */
  const cloudStorageAPI = () => {
    StorageServices.cloudStorageAPIService(
      setCloudStorageList
      // setCloudStorageLoading,
      // setErrorMessageBucket
    );
  };

  /**
   * To create the new cloud storage bucket API service
   */
  const newCloudStorageAPI = () => {
    StorageServices.newCloudStorageAPIService(
      searchValue,
      setLoadingState
      // setBucketError
    );
  };

  /**
   * Creates a new cloud storage bucket.
   * It calls an API to create the bucket, updates the state with the bucket name,
   * and then refetches the list of cloud storage buckets.
   */
  const createNewBucket = () => {
    if (!searchValue.trim()) {
      // If search value is empty
      return;
    }
    // calling an API to create a new cloud storage bucket here
    newCloudStorageAPI();
    // Reset the cloud storage value
    // setCloudStorage(searchValue);
    setValue('cloudStorageBucket', searchValue);
    // fetch the cloud storage API again to list down all the values with newly created bucket name
    cloudStorageAPI();
  };

  /**
   * Handles Cloud storage selection
   * @param {React.SetStateAction<string | null>} value - Selected cloud storage or "Create and Select" option.
   * @returns {void}
   */
  const handleCloudStorageSelected = () => {
    // setBucketError('');

    if (cloudStorageBucket === `Create and Select "${searchValue}"`) {
      // setNewBucketOption(true);
      createNewBucket();
      // setErrorMessageBucket('');
    } else {
      // setCloudStorage(value);
      setValue('cloudStorageBucket', cloudStorageBucket);
    }
  };

  /**
   * Handles the change in the search input value.
   * Updates the search value state based on the user's input.
   *
   * @param {React.ChangeEvent<{}>} event - The event triggered by the input field change.
   * @param {string} newValue - The new value entered by the user in the search field.
   */
  // const handleSearchChange = (
  //   event: React.ChangeEvent<object>,
  //   newValue: string
  // ) => {
  //   setSearchValue(newValue);
  // };

  /**
   * Handles changes to the Disk Size input field when it is empty.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event triggered by the input field.
   */
  const handleDefaultDiskSize = (value: string) => {
    if (value === '') {
      setValue('diskSize', DEFAULT_DISK_SIZE);
    }
  };

  /**
   * Hosts the service account API service
   */
  const serviceAccountAPI = () => {
    IamServices.serviceAccountAPIService(
      setServiceAccountList
      // setServiceAccountLoading,
      // setErrorMessageServiceAccount
    );
  };

  /**
   * Hosts the parent project API service
   */
  const hostProjectAPI = async () => {
    await ComputeServices.getParentProjectAPIService(setHostProject);
  };

  /**
   * Hosts the primary network API service
   */
  const primaryNetworkAPI = () => {
    ComputeServices.primaryNetworkAPIService(
      setPrimaryNetworkList
      // setPrimaryNetworkLoading,
      // setErrorMessagePrimaryNetwork
    );
  };

  /**
   * Hosts the sub network API service based on the primary network
   */
  const subNetworkAPI = (primaryNetwork: string | undefined) => {
    ComputeServices.subNetworkAPIService(
      region,
      primaryNetwork,
      setSubNetworkList
      // setSubNetworkLoading,
      // setErrorMessageSubnetworkNetwork
    );
  };

  useEffect(() => {
    setLoadingState(prev => ({ ...prev, region: true }));
    hostProjectAPI();
    cloudStorageAPI();
    serviceAccountAPI();
    primaryNetworkAPI();
    authApi()
      .then(credentials => {
        if (credentials?.region_id && credentials?.project_id) {
          setLoadingState(prev => ({ ...prev, region: false }));
          setValue('region', credentials.region_id);
        }
      })
      .catch(error => {
        handleErrorToast({
          error: error
        });
      });
  }, [setValue]);

  useEffect(() => {
    if (!region) {
      setMachineTypeList([]);
      setValue('machineType', '');
    } else {
      machineTypeAPI();
      subNetworkAPI(primaryNetwork);
    }
  }, [region]);

  useEffect(() => {
    handleCloudStorageSelected();
    setSearchValue(cloudStorageBucket);
  }, [cloudStorageBucket]);

  useEffect(() => {
    const machineTypeOptions = machineTypeList.map(item => item.machineType);
    const defaultSelected = machineTypeOptions.find(option => {
      if (option.value === DEFAULT_MACHINE_TYPE[0].value) {
        return option.value;
      }
    });
    setValue('machineType', defaultSelected?.value ?? '1');
  }, [machineTypeList, setValue]);

  useEffect(() => {
    if (
      Number(diskSize) >= DEFAULT_DISK_MIN_SIZE &&
      Number(diskSize) <= DEFAULT_DISK_MAX_SIZE
    ) {
      // setDiskSizeFlag(false);
    } else {
      // setDiskSizeFlag(true);
    }
  }, [diskSize]);

  return (
    <div>
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="region" // Matches schema
          control={control}
          label="Region*"
          options={VERTEX_REGIONS}
          customClass="create-scheduler-style"
          loading={loadingState.region}
          onChangeCallback={handleRegionChange}
          error={errors.region}
        />
      </div>

      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="machineType" // Matches schema
          control={control}
          label="Machine Type*"
          options={machineTypeList?.map(item => item.machineType)}
          customClass="create-scheduler-style"
          loading={loadingState.machineType}
          error={machineTypeError}
        />
      </div>

      {machineTypeList.length > 0 &&
        machineTypeList.map(item => {
          if (
            ('acceleratorConfigs' in item &&
              item.machineType.value === machineType &&
              item.acceleratorConfigs !== null) ||
            ('acceleratorConfigs' in item &&
              machineType &&
              item.machineType.value.split(' ')[0] === machineType &&
              item.acceleratorConfigs !== null)
          ) {
            return (
              <div className="execution-history-main-wrapper">
                <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                  <FormInputDropdown
                    name="acceleratorType" // Matches schema
                    control={control}
                    label="Accelerator Type*"
                    options={getAcceleratedType(item.acceleratorConfigs)}
                    customClass="create-scheduler-style create-scheduler-form-element-input-fl"
                  />
                </div>
                {item?.acceleratorConfigs?.map(
                  (element: {
                    allowedCounts: ILabelValue<number>[];
                    acceleratorType: ILabelValue<string>;
                  }) => {
                    return (
                      <>
                        {element.acceleratorType.value === acceleratorType ? (
                          <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                            <FormInputDropdown
                              name="acceleratorCount" // Matches schema
                              control={control}
                              label="Accelerator Count*"
                              options={element.allowedCounts.map(item => ({
                                label: item.label.toString(),
                                value: item.value.toString()
                              }))}
                              customClass="create-scheduler-style create-scheduler-form-element-input-fl"
                            />
                          </div>
                        ) : null}
                      </>
                    );
                  }
                )}
              </div>
            );
          }
        })}

      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="kernelName"
          control={control}
          label="Kernel*"
          options={KERNEL_VALUE}
          customClass="create-scheduler-style"
        />
      </div>

      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="cloudStorageBucket"
          control={control}
          label="Cloud Storage Bucket*"
          options={cloudStorageList}
          customClass="create-scheduler-style"
          filterOptions={filterOptions}
          loading={loadingState.cloudStorageBucket}
        />
      </div>

      <div className="execution-history-main-wrapper">
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="diskType"
            control={control}
            label="Disk Type*"
            options={DISK_TYPE_VALUE}
            customClass="create-scheduler-style"
          />
        </div>
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputText
            label="Disk size*"
            control={control}
            name="diskSize"
            onBlurCallback={handleDefaultDiskSize}
          />{' '}
        </div>
      </div>

      <div className="create-scheduler-form-element panel-margin footer-text">
        <FormInputDropdown
          name="serviceAccount"
          control={control}
          label="Service account*"
          options={serviceAccountList}
        />
      </div>

      <div className="create-job-scheduler-text-para create-job-scheduler-sub-title">
        {NETWORK_CONFIGURATION_LABEL}
      </div>

      <p>{NETWORK_CONFIGURATION_LABEL_DESCRIPTION}</p>

      <div className="create-scheduler-form-element panel-margin">
        <FormInputRadio
          name="networkOption"
          control={control}
          className="network-layout"
          options={NETWORK_OPTIONS}
          hostProject={hostProject}
        />
      </div>

      {/* Network in this project */}
      {networkSelected == DEFAULT_NETWORK_SELECTED ? (
        <div className="execution-history-main-wrapper">
          <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
            <FormInputDropdown
              name="network"
              control={control}
              label="Primary network*"
              customClass="create-scheduler-style create-scheduler-form-element-input-fl"
              options={primaryNetworkList}
            />
          </div>

          <div className="create-scheduler-form-element create-scheduler-form-element-input-fl">
            <FormInputDropdown
              name="subnetwork"
              control={control}
              label="Sub network*"
              customClass="create-scheduler-style create-scheduler-form-element-input-fl"
              options={subNetworkList}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Network shared from host project */}
          <div className="create-scheduler-form-element">
            <FormInputDropdown
              name="sharedNetworkSelected"
              control={control}
              label="Shared network*"
              options={DEFAULT_MACHINE_TYPE}
              customClass="create-scheduler-style"
            />
          </div>
        </>
      )}

      <div className="create-scheduler-label">Schedule</div>
      <div className="create-scheduler-form-element">
        <FormInputRadio
          name="scheduleMode" // Matches schema
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
        />
      </div>

      <div className="schedule-child-section">
        {scheduleMode === SCHEDULE_MODE_OPTIONS[1].value && (
          <>
            <FormInputRadio
              name="internalScheduleMode" // Matches schema
              control={control}
              className="schedule-radio-btn"
              options={RUN_ON_SCHEDULE_OPTIONS}
            />

            <div className="execution-history-main-wrapper">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                  {/* You'll need a custom FormInput component for DateTimePicker to bind it to react-hook-form */}
                  {/* For now, just a placeholder as this doesn't directly use 'name' prop on FormInput components */}
                  <DateTimePicker
                    className="create-scheduler-style create-scheduler-form-element-input-fl"
                    label="Start Date"
                    // value={startDate}
                    // onChange={newValue => handleStartDate(newValue)}
                    slots={{
                      openPickerIcon: CalendarMonthIcon
                    }}
                    slotProps={{
                      actionBar: {
                        actions: ['clear']
                      },
                      tabs: {
                        hidden: true
                      },
                      textField: {
                        error: false
                      }
                    }}
                    disablePast
                    closeOnSelect={true}
                    // viewRenderers={{
                    //   hours: renderTimeViewClock,
                    //   minutes: renderTimeViewClock,
                    //   seconds: renderTimeViewClock
                    // }}
                  />
                  {/* {isPastStartDate && (
                      <ErrorMessage
                        message="Start date should be greater than current date"
                        showIcon={false}
                      />
                    )} */}
                </div>
                <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                  {/* You'll need a custom FormInput component for DateTimePicker to bind it to react-hook-form */}
                  <DateTimePicker
                    className="create-scheduler-style create-scheduler-form-element-input-fl"
                    label="End Date"
                    // value={endDate}
                    // onChange={newValue => handleEndDate(newValue)}
                    slots={{
                      openPickerIcon: CalendarMonthIcon
                    }}
                    slotProps={{
                      actionBar: {
                        actions: ['clear']
                      },
                      field: { clearable: true },
                      tabs: {
                        hidden: true
                      },
                      textField: {
                        error: false
                      }
                    }}
                    disablePast
                    closeOnSelect={true}
                    // viewRenderers={{
                    //   hours: renderTimeViewClock,
                    //   minutes: renderTimeViewClock,
                    //   seconds: renderTimeViewClock
                    // }}
                  />
                  {/* {endDateError && (
                      <ErrorMessage
                        message="End date should be greater than Start date"
                        showIcon={false}
                      />
                    )} */}
                  {/* {isPastEndDate && (
                      <ErrorMessage
                        message="End date should be greater than current date"
                        showIcon={false}
                      />
                    )} */}
                </div>
              </LocalizationProvider>
            </div>
          </>
        )}

        {scheduleMode === SCHEDULE_MODE_OPTIONS[1].value &&
          internalScheduleMode === RUN_ON_SCHEDULE_OPTIONS[0].value && (
            <>
              {/* Schedule Input */}
              <div className="create-scheduler-form-element schedule-input-field">
                <FormInputText
                  label="Schedule*"
                  control={control}
                  name="scheduleValue"
                />
              </div>
              <div>
                <span className="tab-description tab-text-sub-cl">
                  {SCHEDULE_FORMAT_DESCRIPTION}
                </span>
                <div className="learn-more-url">
                  <LearnMore path={CORN_EXP_DOC_URL} />
                </div>
              </div>
            </>
          )}

        {scheduleMode === SCHEDULE_MODE_OPTIONS[1].value &&
          internalScheduleMode === RUN_ON_SCHEDULE_OPTIONS[1].value && (
            <div className="create-scheduler-form-element">
              <Cron
                // value=""
                setValue={() => {}}
                value="0 */3 * * *"
                // setValue={setScheduleValue}
                allowedPeriods={allowedPeriodsCron as PeriodType[] | undefined}
              />
            </div>
          )}

        {scheduleMode === SCHEDULE_MODE_OPTIONS[1].value && (
          <>
            <div className="create-scheduler-form-element">
              <FormInputDropdown
                name="timeZone"
                control={control}
                label="Time Zone*"
                options={timezones}
                customClass="create-scheduler-style"
              />
            </div>

            <div className="create-scheduler-form-element">
              <FormInputText
                label="Max runs*"
                control={control}
                name="maxRunCount"
              />{' '}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
