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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormInputDropdown } from '../common/formFields/FormInputDropdown';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import LearnMore from '../common/links/LearnMore';

// Utilities & Services
import {
  ErrorMessage,
  handleErrorToast
} from '../common/notificationHandling/ErrorUtils';
import { VertexServices } from '../../services/vertex/VertexServices'; // Assuming VertexServices is correctly path'd
import { StorageServices } from '../../services/common/Storage';
import { IamServices } from '../../services/common/Iam';
import { ComputeServices } from '../../services/common/Compute'; // Ensure this is imported
import { authApi } from '../common/login/Config';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import { z } from 'zod';
import { Controller, FieldErrors } from 'react-hook-form';
import dayjs from 'dayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import Cron, { PeriodType } from 'react-js-cron';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import tzdata from 'tzdata';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';

// Constants
import {
  allowedPeriodsCron,
  CORN_EXP_DOC_URL,
  DEFAULT_NETWORK_SELECTED,
  DISK_TYPE_VALUE,
  KERNEL_VALUE,
  NETWORK_CONFIGURATION_LABEL,
  NETWORK_CONFIGURATION_LABEL_DESCRIPTION,
  NETWORK_OPTIONS,
  RUN_ON_SCHEDULE_OPTIONS,
  SCHEDULE_FORMAT_DESCRIPTION,
  SCHEDULE_MODE_OPTIONS,
  VERTEX_REGIONS,
  DEFAULT_MACHINE_TYPE,
  DEFAULT_CLOUD_STORAGE_BUCKET,
  DEFAULT_SERVICE_ACCOUNT,
  DEFAULT_DISK_SIZE,
  SHARED_NETWORK_DOC_URL,
  EVERY_MINUTE_CRON
} from '../../utils/Constants';

// Interfaces & Schemas
import {
  IAcceleratorConfig,
  ICreateVertexSchedulerProps,
  ILoadingStateVertex,
  IMachineType,
  ISharedNetwork
} from '../../interfaces/VertexInterface';

export const CreateVertexSchedule: React.FC<ICreateVertexSchedulerProps> = ({
  control,
  errors,
  watch,
  setValue,
  getValues,
  trigger,
  // sessionContext,
  editModeData
  // ... other props
}) => {
  // Local state for dropdown options (fetched dynamically)
  const [machineTypeList, setMachineTypeList] = useState<IMachineType[]>([]);
  const [cloudStorageList, setCloudStorageList] = useState<
    ILabelValue<string>[]
  >([]);
  const [newBucketCreated, setNewBucketCreated] = useState<string | null>(null);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [serviceAccountList, setServiceAccountList] = useState<
    ILabelValue<string>[]
  >([]);
  const [primaryNetworkList, setPrimaryNetworkList] = useState<
    ILabelValue<string>[]
  >([]);
  const [subNetworkList, setSubNetworkList] = useState<ILabelValue<string>[]>(
    []
  );
  const [sharedNetworkList, setSharedNetworkList] = useState<
    ILabelValue<string, ISharedNetwork>[]
  >([]);
  const [hostProject, setHostProject] = useState<any | null>(null);

  // Consolidated loading state for all API calls initiated by this component
  const [loadingState, setLoadingState] = useState<ILoadingStateVertex>(
    {
      region: false,
      machineType: false,
      cloudStorageBucket: false,
      serviceAccount: false,
      primaryNetwork: false,
      subNetwork: false,
      sharedNetwork: false,
      hostProject: false // Initialized
      // createOperation: false
    }
  );

  // Timezones for dropdown
  const timezones: ILabelValue<string>[] = useMemo(
    () =>
      Object.keys(tzdata.zones)
        .sort()
        .map(zone => ({
          label: zone,
          value: zone
        })),
    []
  );

  //  const selectedMachineType = machineTypeList.find(
  //     item => item.machineType.value === currentMachineType
  //   );
  // Watch form values for conditional rendering and API dependencies
  const currentRegion = watch('vertexRegion');
  const currentMachineType = watch('machineType');
  const currentAcceleratorType = watch('acceleratorType');
  const currentDiskType = watch('diskType');
  const currentNetworkOption = watch('networkOption');
  const currentScheduleMode = watch('scheduleMode');
  const currentInternalScheduleMode = watch('internalScheduleMode');
  const currentPrimaryNetwork = watch('primaryNetwork');
  const currentSchedulerSelection = watch('schedulerSelection');

  const isVertexForm = currentSchedulerSelection === 'vertex';
  const vertexErrors = isVertexForm
    ? (errors as FieldErrors<z.infer<typeof createVertexSchema>>)
    : {};

  // Find selected machine type to get accelerator configs
  const selectedMachineType = useMemo(
    () =>
      machineTypeList.find(
        item => item.machineType.value === currentMachineType
      ),
    [machineTypeList, currentMachineType]
  );

  // --- Data Fetching Callbacks (Calling Services & Managing Component State) ---

  const fetchRegion = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, region: true }));
    try {
      const credentials = await authApi(); // Assuming authApi returns { region_id: string }
      if (credentials?.region_id) {
        if (!editModeData || !getValues('vertexRegion')) {
          setValue('vertexRegion', credentials.region_id);
        }
      }
    } catch (error) {
      handleErrorToast({ error: 'Failed to fetch default region.' });
      setValue('vertexRegion', ''); // Clear region on error
    } finally {
      setLoadingState(prev => ({ ...prev, region: false }));
    }
  }, [setValue, getValues, editModeData]);

  const fetchMachineTypes = useCallback(
    async (region: string) => {
      if (!region) {
        setMachineTypeList([]);
        if (isVertexForm) {
          setValue('machineType', '');
          setValue('acceleratorType', '');
          setValue('acceleratorCount', '');
        }
        return;
      }
      setLoadingState(prev => ({ ...prev, machineType: true }));
      try {
        const fetchedMachines =
          await VertexServices.machineTypeAPIService(region);
        setMachineTypeList(fetchedMachines);

        // Set default or existing value if valid, otherwise reset
        const currentMachineTypeValue = getValues('machineType');
        const isValidExisting = fetchedMachines.some(
          m => m.machineType.value === currentMachineTypeValue
        );

        if (
          !editModeData?.editMode ||
          !currentMachineTypeValue ||
          !isValidExisting
        ) {
          const defaultSelected = fetchedMachines.find(
            item => item.machineType.value === DEFAULT_MACHINE_TYPE.value
          );
          console.log('Default selected machine type:', defaultSelected);
          if (defaultSelected) {
            setValue('machineType', defaultSelected.machineType.value);
          } else if (fetchedMachines.length > 0) {
            setValue('machineType', fetchedMachines[0].machineType.value);
            console.log(
              'Setting machine type to first available:',
              fetchedMachines[0].machineType.value
            );
          } else {
            setValue('machineType', '');
          }
          // Always reset accelerators when machine type changes or is set
          setValue('acceleratorType', '');
          setValue('acceleratorCount', '');
        }
      } catch (error) {
        setMachineTypeList([]);
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
      } finally {
        setLoadingState(prev => ({ ...prev, machineType: false }));
      }
    },
    [setValue, getValues, setMachineTypeList, editModeData]
  );

  const fetchCloudStorageBuckets = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, cloudStorageBucket: true }));
    try {
      const fetchedBuckets =
        await StorageServices.cloudStorageAPIServiceForVertex();
      setCloudStorageList(fetchedBuckets);
      const currentBucketValue = getValues('cloudStorageBucket');
      const isValidExisting = fetchedBuckets.some(
        b => b.value === currentBucketValue
      );

      if (!editModeData?.editMode || !currentBucketValue || !isValidExisting) {
        const defaultSelected = fetchedBuckets.find(
          option => option.value === DEFAULT_CLOUD_STORAGE_BUCKET.value
        );
        if (defaultSelected) {
          setValue('cloudStorageBucket', defaultSelected.value);
        } else if (fetchedBuckets.length > 0) {
          setValue('cloudStorageBucket', fetchedBuckets[0].value);
        } else {
          setValue('cloudStorageBucket', '');
        }
      }
    } catch (error) {
      setCloudStorageList([]);
      if (isVertexForm) {
        setValue('cloudStorageBucket', '');
      }
    } finally {
      setLoadingState(prev => ({ ...prev, cloudStorageBucket: false }));
    }
  }, [setValue, getValues, editModeData]);

  const fetchServiceAccounts = useCallback(async () => {
    console.log('Fetching service accounts...');
    setLoadingState(prev => ({ ...prev, serviceAccount: true }));
    try {
      const response = await IamServices.serviceAccountAPIService();
      setServiceAccountList(response);
      console.log('Service accounts fetched:', response);
      // Set default or existing value if valid, otherwise reset
      const currentServiceAccountValue = getValues('serviceAccount');
      const isValidExisting = response.some(
        sa => sa.value === currentServiceAccountValue
      );

      if (
        !editModeData?.editMode ||
        !currentServiceAccountValue ||
        !isValidExisting
      ) {
        const defaultSelected = response.find(
          item => item.value === DEFAULT_SERVICE_ACCOUNT
        );
        if (defaultSelected) {
          setValue('serviceAccount', defaultSelected.value);
        } else if (response.length > 0) {
          setValue('serviceAccount', response[0].value);
        } else {
          setValue('serviceAccount', '');
        }
      }
    } catch (error) {
      setServiceAccountList([]);
      setValue('serviceAccount', '');
    } finally {
      setLoadingState(prev => ({ ...prev, serviceAccount: false }));
    }
  }, [setValue, getValues, editModeData]);

  const fetchHostProject = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, hostProject: true })); // Manage loading locally
    try {
      const response = await ComputeServices.getParentProjectAPIService(); // Service handles its own error/notification
      setHostProject(response);
    } catch (error) {
      setHostProject(null); // Set to null on error
    } finally {
      setLoadingState(prev => ({ ...prev, hostProject: false }));
    }
  }, []);

  const fetchPrimaryNetworks = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, primaryNetwork: true }));
    try {
      const response = await ComputeServices.primaryNetworkAPIService();
      setPrimaryNetworkList(response);

      // Set default or existing value if valid, otherwise reset
      const currentPrimaryNetworkValue = getValues('primaryNetwork');
      const isValidExisting = response.some(
        n => n.value === currentPrimaryNetworkValue
      );

      if (
        !editModeData?.editMode ||
        !currentPrimaryNetworkValue ||
        !isValidExisting
      ) {
        if (response.length > 0) {
          setValue('primaryNetwork', response[0].value);
        } else {
          setValue('primaryNetwork', '');
        }
      }
    } catch (error) {
      setPrimaryNetworkList([]);
      setValue('primaryNetwork', '');
      handleErrorToast({ error: 'Failed to fetch primary networks.' });
    } finally {
      setLoadingState(prev => ({ ...prev, primaryNetwork: false }));
    }
  }, [setValue, getValues, editModeData]);

  const fetchSubNetworks = useCallback(
    async (region: string, primaryNetworkValue: string) => {
      if (!region || !primaryNetworkValue) {
        setSubNetworkList([]);
        setValue('subNetwork', '');
        return;
      }
      setLoadingState(prev => ({ ...prev, subNetwork: true }));
      try {
        const response = await ComputeServices.subNetworkAPIService(
          region,
          primaryNetworkValue
        );
        setSubNetworkList(response);

        // Set default or existing value if valid, otherwise reset
        const currentSubnetworkValue = getValues('subNetwork');
        const isValidExisting = response.some(
          sn => sn.value === currentSubnetworkValue
        );

        if (
          !editModeData?.editMode ||
          !currentSubnetworkValue ||
          !isValidExisting
        ) {
          if (response.length > 0) {
            setValue('subNetwork', response[0].value); // Sync with 'subNetwork' field
          } else {
            setValue('subNetwork', '');
          }
        }
      } catch (error) {
        setSubNetworkList([]);
        setValue('subNetwork', '');
        handleErrorToast({ error: 'Failed to fetch subNetworks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, subNetwork: false }));
      }
    },
    [setValue, getValues, editModeData]
  );

  const fetchSharedNetworks = useCallback(
    async (hostProjectName: string, region: string) => {
      if (!hostProjectName || !region) {
        setSharedNetworkList([]);
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        return;
      }
      setLoadingState(prev => ({ ...prev, sharedNetwork: true }));
      try {
        const sharedNetworkDetails: ISharedNetwork[] =
          await ComputeServices.sharedNetworkAPIService(
            hostProjectName,
            region
          );
        setSharedNetworkList(
          sharedNetworkDetails.map(sharedNetwork => ({
            label: `${sharedNetwork.network}/${sharedNetwork.subnetwork}`, // Combine for display
            value: sharedNetwork // Store the full object as value
          }))
        );
        // If in edit mode and a shared network was previously selected, try to re-select it
        if (editModeData?.editMode) {
          const currentSharedNetwork = getValues('sharedNetwork');
          const found = sharedNetworkDetails.find(
            sn =>
              sn.network === currentSharedNetwork?.network &&
              sn.subnetwork === currentSharedNetwork?.subnetwork
          );
          if (!found) {
            // If previously selected network is no longer available, clear it
            setValue('sharedNetwork', { network: '', subnetwork: '' });
          }
        }
      } catch (error) {
        setSharedNetworkList([]);
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        handleErrorToast({ error: 'Failed to fetch shared networks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, sharedNetwork: false }));
      }
    },
    [setValue, getValues, editModeData]
  );

  // --- useEffects for Initial Data Fetching and Dynamic Form Updates ---

  // Initial API calls for static/independent dropdowns and default region
  useEffect(() => {
    // Set non-API dependent defaults if not in edit mode or values are empty
    if (!editModeData?.editMode || !getValues('startTime'))
      setValue('startTime', dayjs().toISOString());
    if (!editModeData?.editMode || !getValues('endTime'))
      setValue('endTime', dayjs().add(1, 'day').toISOString());
    if (!editModeData?.editMode || !getValues('scheduleField'))
      setValue('scheduleField', '');
    if (!editModeData?.editMode || !getValues('scheduleValue'))
      setValue('scheduleValue', EVERY_MINUTE_CRON);
    if (!editModeData?.editMode || !getValues('timeZone'))
      setValue('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!editModeData?.editMode || !getValues('networkOption'))
      setValue('networkOption', DEFAULT_NETWORK_SELECTED);

    // Initial data fetches
    fetchRegion();
    fetchCloudStorageBuckets();
    fetchServiceAccounts();
    fetchPrimaryNetworks();
    fetchHostProject();
  }, [
    setValue,
    getValues,
    editModeData,
    fetchRegion,
    fetchCloudStorageBuckets,
    fetchServiceAccounts,
    fetchPrimaryNetworks,
    fetchHostProject
  ]);

  // Effect for Machine Types dependent on Region
  useEffect(() => {
    console.log('Fetching machine types for region:', currentRegion);
    fetchMachineTypes(currentRegion);
  }, [currentRegion, fetchMachineTypes]);

  // Effect for Subnetworks dependent on Primary Network and Region
  useEffect(() => {
    if (currentNetworkOption === 'networkInThisProject') {
      fetchSubNetworks(currentRegion, currentPrimaryNetwork || '');
    } else {
      setSubNetworkList([]);
      setValue('subNetwork', '');
    }
  }, [
    currentNetworkOption,
    currentPrimaryNetwork,
    currentRegion,
    fetchSubNetworks,
    setValue
  ]);

  // Effect for Shared Networks dependent on Host Project and Region
  useEffect(() => {
    if (currentNetworkOption === 'networkSharedFromHostProject') {
      fetchSharedNetworks(hostProject?.name || '', currentRegion);
    } else {
      setSharedNetworkList([]);
      setValue('sharedNetwork', { network: '', subnetwork: '' });
    }
  }, [
    currentNetworkOption,
    hostProject,
    currentRegion,
    fetchSharedNetworks,
    setValue
  ]);

  // --- Callbacks for Form Field Interactions ---

  const handleRegionChange = useCallback(
    (optionSelected: string | null, reason?: string) => {
      console.log('Region changed:', optionSelected, reason);
      if (optionSelected) {
        setValue('vertexRegion', optionSelected);
        // Reset machine type and dependent fields when region changes
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('primaryNetwork', '');
        setValue('subNetwork', ''); // Clear the actual subNetwork field
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        // Trigger validation for these fields to show errors if they become invalid
        trigger([
          'machineType',
          'acceleratorType',
          'acceleratorCount',
          'primaryNetwork',
          'subNetwork',
          'sharedNetwork'
        ]);
      } else if (reason === 'clear') {
        setValue('vertexRegion', ''); // Clear region if cleared
        // Reset machine type and dependent fields when region is cleared
        setValue('machineType', '');
        // Reset all dependent fields and their values
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('primaryNetwork', '');
        setValue('subNetwork', ''); // Clear the actual subNetwork field
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        // Trigger validation for these fields to show errors if they become invalid
        trigger([
          'machineType',
          'acceleratorType',
          'acceleratorCount',
          'primaryNetwork',
          'subNetwork',
          'sharedNetwork'
        ]);
      }
    },
    [setValue, trigger]
  );

  const handleDiskSizeBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      // If disk size is blurred and is empty, set to default IF disk type is selected
      if (event.target.value === '' && currentDiskType) {
        setValue('diskSize', DEFAULT_DISK_SIZE);
      }
      trigger('diskSize'); // Trigger validation on blur
    },
    [setValue, currentDiskType, trigger]
  );

  const getAcceleratedTypeOptions = useCallback(
    (acceleratorConfigs: IAcceleratorConfig[]): ILabelValue<string>[] => {
      return acceleratorConfigs.map(item => ({
        label: item.acceleratorType.value,
        value: item.acceleratorType.value
      }));
    },
    []
  );

  const filterCloudStorageOptions = useCallback(
    (
      options: ILabelValue<string>[],
      state: { inputValue: string }
    ): ILabelValue<string>[] => {
      const inputValue = state.inputValue.trim().toLowerCase();
      const filteredOptions = options.filter(option =>
        option.value.toLowerCase().includes(inputValue)
      );
      const exactMatch = options.some(
        option => option.value.toLowerCase() === inputValue
      );
      if (!exactMatch && inputValue !== '') {
        // Add "Create and Select" option with a unique prefix
        filteredOptions.push({
          label: `Create and Select "${state.inputValue}"`,
          value: `CREATE_NEW_BUCKET::${state.inputValue}`
        });
      }
      return filteredOptions;
    },
    []
  );

  const handleCloudStorageDropdownChange = useCallback(
    async (selectedOption: any | null) => {
      console.log('Selected cloud storage option:', selectedOption);
      if (selectedOption && selectedOption.startsWith('CREATE_NEW_BUCKET::')) {
        const newBucketName = selectedOption.replace('CREATE_NEW_BUCKET::', '');
        if (newBucketName.trim() !== '') {
          setNewBucketCreated(newBucketName);
          setIsCreatingBucket(true);
          console.log('Creating new bucket:', newBucketName);
          setLoadingState(prev => ({ ...prev, cloudStorageBucket: true }));
          try {
            await StorageServices.newCloudStorageAPIServiceForVertex(
              newBucketName
            );
            // Re-fetch buckets to include the newly created one and set it
            const updatedBucketList =
              await StorageServices.cloudStorageAPIServiceForVertex();
            setCloudStorageList(updatedBucketList);
            setValue('cloudStorageBucket', newBucketName);
          } catch (error) {
            setValue('cloudStorageBucket', ''); // Clear selection on failure
          } finally {
            setLoadingState(prev => ({ ...prev, cloudStorageBucket: false }));
            setIsCreatingBucket(false);
            setNewBucketCreated(null);
          }
        }
      } else {
        setValue('cloudStorageBucket', selectedOption ? selectedOption : '');
      }
    },
    [setValue, setCloudStorageList]
  );

  // Error message for shared network if host project is missing or no networks
  const showSharedNetworkError = useMemo(() => {
    if (currentNetworkOption === 'networkSharedFromHostProject') {
      if (loadingState.hostProject) return null; // Don't show error while loading host project
      if (!hostProject || Object.keys(hostProject).length === 0) {
        return 'No host project configured or accessible. Please ensure a host project is set up for shared VPC networks.';
      }
      if (sharedNetworkList.length === 0 && !loadingState.sharedNetwork) {
        return 'No shared subNetworks are available in this region for the host project.';
      }
    }
    return null;
  }, [
    currentNetworkOption,
    hostProject,
    sharedNetworkList,
    loadingState.sharedNetwork,
    loadingState.hostProject
  ]);

  // --- Render Component UI ---
  return (
    <div>
      {/* Region Dropdown */}
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="vertexRegion"
          control={control}
          label="Region*"
          options={VERTEX_REGIONS}
          customClass="create-scheduler-style"
          loading={loadingState.region}
          onChangeCallback={handleRegionChange}
          error={vertexErrors.vertexRegion}
        />
      </div>

      {/* Machine Type Dropdown */}
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="machineType"
          control={control}
          label="Machine Type*"
          options={machineTypeList.map(item => item.machineType)}
          customClass="create-scheduler-style"
          loading={loadingState.machineType}
          error={vertexErrors.machineType}
          disabled={
            !currentRegion ||
            loadingState.machineType ||
            machineTypeList.length === 0
          }
          onChangeCallback={selectedMachineType => {
            setValue('machineType', selectedMachineType);
            setValue('acceleratorType', '');
            setValue('acceleratorCount', '');
            trigger(['machineType', 'acceleratorType', 'acceleratorCount']);
          }}
        />
      </div>

      {/* Accelerator Type and Count (conditionally rendered) */}
      {currentMachineType &&
        selectedMachineType?.acceleratorConfigs &&
        selectedMachineType.acceleratorConfigs.length > 0 && (
          <div className="execution-history-main-wrapper">
            <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
              <FormInputDropdown
                name="acceleratorType"
                control={control}
                label="Accelerator Type"
                options={getAcceleratedTypeOptions(
                  selectedMachineType.acceleratorConfigs
                )}
                customClass="create-scheduler-style create-scheduler-form-element-input-fl"
                error={vertexErrors.acceleratorType}
                disabled={!currentMachineType || loadingState.machineType}
                onChangeCallback={() => {
                  setValue('acceleratorCount', '');
                  trigger('acceleratorCount');
                }}
              />
            </div>

            {currentAcceleratorType &&
              selectedMachineType.acceleratorConfigs.map(accelConfig =>
                accelConfig.acceleratorType.value === currentAcceleratorType &&
                accelConfig.allowedCounts.length > 0 ? (
                  <div
                    className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr"
                    key={accelConfig.acceleratorType.value}
                  >
                    <FormInputDropdown
                      name="acceleratorCount"
                      control={control}
                      label="Accelerator Count*"
                      options={accelConfig.allowedCounts.map(count => ({
                        label: count.value.toString(),
                        value: count.value.toString()
                      }))}
                      customClass="create-scheduler-style create-scheduler-form-element-input-fl"
                      error={vertexErrors.acceleratorCount}
                      disabled={!currentAcceleratorType}
                    />
                  </div>
                ) : null
              )}
          </div>
        )}

      {/* Kernel Dropdown */}
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="kernelName"
          control={control}
          label="Kernel*"
          options={KERNEL_VALUE}
          customClass="create-scheduler-style"
          error={vertexErrors.kernelName}
        />
      </div>

      {/* Cloud Storage Bucket Dropdown */}
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="cloudStorageBucket"
          control={control}
          label="Cloud Storage Bucket*"
          options={cloudStorageList}
          customClass="create-scheduler-style"
          filterOptions={filterCloudStorageOptions}
          loading={loadingState.cloudStorageBucket}
          error={vertexErrors.cloudStorageBucket}
          onChangeCallback={handleCloudStorageDropdownChange}
          disabled={isCreatingBucket}
        />
        {isCreatingBucket && newBucketCreated && (
          <div style={{ color: '#1976d2', marginTop: 4 }}>
            Creating new bucket <b>{newBucketCreated}</b>...
          </div>
        )}
      </div>

      {/* Disk Type and Size */}
      <div className="execution-history-main-wrapper">
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="diskType"
            control={control}
            label="Disk Type*"
            options={DISK_TYPE_VALUE}
            customClass="create-scheduler-style"
            error={vertexErrors.diskType}
            onChangeCallback={() => {
              setValue('diskSize', ''); // Clear disk size when disk type changes
              trigger('diskSize');
            }}
          />
        </div>
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputText
            label="Disk size*"
            control={control}
            name="diskSize"
            onBlurCallback={handleDiskSizeBlur}
            error={vertexErrors.diskSize}
            type="number"
            disabled={!currentDiskType}
          />
        </div>
      </div>

      {/* Service Account Dropdown */}
      <div className="create-scheduler-form-element panel-margin footer-text">
        <FormInputDropdown
          name="serviceAccount"
          control={control}
          label="Service account*"
          options={serviceAccountList}
          loading={loadingState.serviceAccount}
          error={vertexErrors.serviceAccount}
        />
      </div>

      {/* Network Configuration Section */}
      <div className="create-job-scheduler-text-para create-job-scheduler-sub-title">
        {NETWORK_CONFIGURATION_LABEL}
      </div>
      <p>{NETWORK_CONFIGURATION_LABEL_DESCRIPTION}</p>

      <div className="create-scheduler-form-element panel-margin">
        <FormInputRadio
          name="networkOption"
          control={control}
          className="network-layout"
          options={NETWORK_OPTIONS.map(option => ({
            label:
              option.value === 'networkSharedFromHostProject' &&
              hostProject?.name
                ? `${option.label} "${hostProject.name}"`
                : option.label,
            value: option.value
          }))}
          error={vertexErrors.networkOption}
          onChange={() => {
            // Clear all network-related fields when network option changes
            setValue('primaryNetwork', '');
            setValue('subNetwork', '');
            setValue('sharedNetwork', { network: '', subnetwork: '' });
            trigger(['primaryNetwork', 'subNetwork', 'sharedNetwork']);
          }}
        />
        <span className="sub-para tab-text-sub-cl">
          Choose a shared VPC network from the project that is different from
          the clusters project
        </span>
        <div className="learn-more-a-tag learn-more-url">
          <LearnMore path={SHARED_NETWORK_DOC_URL} />
        </div>
      </div>

      {/* Conditional Network Fields */}
      {currentNetworkOption === DEFAULT_NETWORK_SELECTED ? ( // 'networkInThisProject'
        <div className="execution-history-main-wrapper">
          <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
            <FormInputDropdown
              name="primaryNetwork"
              control={control}
              label="Primary network"
              customClass="create-scheduler-style create-scheduler-form-element-input-fl"
              options={primaryNetworkList}
              loading={loadingState.primaryNetwork}
              error={vertexErrors.primaryNetwork}
              disabled={!currentRegion || loadingState.primaryNetwork}
              onChangeCallback={selected => {
                setValue('primaryNetwork', selected ? selected.value : '');
                setValue('subNetwork', ''); // Clear subnetwork when primary changes
                trigger(['subNetwork']); // Trigger validation for subnetwork
              }}
            />
          </div>

          <div className="create-scheduler-form-element create-scheduler-form-element-input-fl">
            <FormInputDropdown
              name="subNetwork"
              control={control}
              label="Sub network"
              customClass="create-scheduler-style create-scheduler-form-element-input-fl"
              options={subNetworkList}
              loading={loadingState.subNetwork}
              error={vertexErrors.subNetwork}
              disabled={
                !currentRegion ||
                !currentPrimaryNetwork ||
                loadingState.subNetwork
              }
              onChangeCallback={selected => {
                setValue('subNetwork', selected ? selected.value : '');
              }}
            />
          </div>
        </div>
      ) : (
        // 'networkSharedFromHostProject'
        <>
          <div className="create-scheduler-form-element">
            <FormInputDropdown
              name="sharedNetwork"
              control={control}
              label="Shared subnetwork*"
              options={sharedNetworkList}
              customClass="create-scheduler-style"
              loading={loadingState.sharedNetwork}
              error={
                vertexErrors.sharedNetwork &&
                'message' in vertexErrors.sharedNetwork
                  ? (vertexErrors.sharedNetwork as import('react-hook-form').FieldError)
                  : undefined
              }
              disabled={
                !hostProject ||
                Object.keys(hostProject).length === 0 ||
                loadingState.sharedNetwork
              }
              onChangeCallback={selectedOption => {
                const selectedSharedNetwork = selectedOption?.value as
                  | ISharedNetwork
                  | undefined;
                if (selectedSharedNetwork) {
                  setValue(
                    'sharedNetwork.network',
                    selectedSharedNetwork.network
                  );
                  setValue(
                    'sharedNetwork.subnetwork',
                    selectedSharedNetwork.subnetwork
                  );
                } else {
                  setValue('sharedNetwork.network', '');
                  setValue('sharedNetwork.subnetwork', '');
                }
                trigger(['sharedNetwork.network', 'sharedNetwork.subnetwork']);
              }}
            />
          </div>
          {showSharedNetworkError && (
            <ErrorMessage message={showSharedNetworkError} showIcon={false} />
          )}
        </>
      )}

      {/* Schedule Section */}
      <div className="create-scheduler-label">Schedule</div>
      <div className="create-scheduler-form-element">
        <FormInputRadio
          name="scheduleMode"
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
          error={vertexErrors.scheduleMode}
          onChange={() => {
            if (watch('scheduleMode') === 'runNow') {
              setValue('internalScheduleMode', undefined);
              setValue('scheduleField', '');
              setValue('scheduleValue', '');
              setValue('startTime', '');
              setValue('endTime', '');
              setValue('maxRunCount', '');
              setValue('timeZone', '');
            } else {
              if (!getValues('internalScheduleMode'))
                setValue('internalScheduleMode', 'userFriendly');
              if (!getValues('scheduleValue'))
                setValue('scheduleValue', EVERY_MINUTE_CRON);
              if (!getValues('startTime'))
                setValue('startTime', dayjs().toISOString());
              if (!getValues('endTime'))
                setValue('endTime', dayjs().add(1, 'day').toISOString());
              if (!getValues('timeZone'))
                setValue(
                  'timeZone',
                  Intl.DateTimeFormat().resolvedOptions().timeZone
                );
            }
            trigger([
              'internalScheduleMode',
              'scheduleField',
              'scheduleValue',
              'startTime',
              'endTime',
              'maxRunCount',
              'timeZone'
            ]);
          }}
        />
      </div>

      <div className="schedule-child-section">
        {currentScheduleMode === 'runSchedule' && (
          <>
            <FormInputRadio
              name="internalScheduleMode"
              control={control}
              className="schedule-radio-btn"
              options={RUN_ON_SCHEDULE_OPTIONS}
              error={vertexErrors.internalScheduleMode}
              onChange={() => {
                if (watch('internalScheduleMode') === 'cronFormat') {
                  setValue('scheduleValue', EVERY_MINUTE_CRON);
                  setValue('scheduleField', '');
                } else {
                  setValue('scheduleField', '');
                  setValue('scheduleValue', EVERY_MINUTE_CRON);
                }
                trigger(['scheduleField', 'scheduleValue']);
              }}
            />

            <div className="execution-history-main-wrapper">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        className="create-scheduler-style create-scheduler-form-element-input-fl"
                        label="Start Date*"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={newValue => {
                          field.onChange(
                            newValue ? newValue.toISOString() : null
                          );
                          trigger(['startTime', 'endTime']);
                        }}
                        slots={{ openPickerIcon: CalendarMonthIcon }}
                        slotProps={{
                          actionBar: { actions: ['clear'] },
                          tabs: { hidden: true },
                          textField: {
                            error: !!vertexErrors.startTime,
                            helperText: vertexErrors.startTime?.message
                          }
                        }}
                        disablePast
                        closeOnSelect={true}
                      />
                    )}
                  />
                </div>
                <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        className="create-scheduler-style create-scheduler-form-element-input-fl"
                        label="End Date*"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={newValue => {
                          field.onChange(
                            newValue ? newValue.toISOString() : null
                          );
                          trigger('endTime');
                        }}
                        slots={{ openPickerIcon: CalendarMonthIcon }}
                        slotProps={{
                          actionBar: { actions: ['clear'] },
                          field: { clearable: true },
                          tabs: { hidden: true },
                          textField: {
                            error: !!vertexErrors.endTime,
                            helperText: vertexErrors.endTime?.message
                          }
                        }}
                        disablePast
                        closeOnSelect={true}
                      />
                    )}
                  />
                </div>
              </LocalizationProvider>
            </div>
          </>
        )}

        {currentScheduleMode === 'runSchedule' &&
          currentInternalScheduleMode === 'cronFormat' && (
            <>
              <div className="create-scheduler-form-element schedule-input-field">
                <FormInputText
                  label="Schedule*"
                  control={control}
                  name="scheduleField"
                  error={vertexErrors.scheduleField}
                  onChangeCallback={() => trigger('scheduleField')}
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

        {currentScheduleMode === 'runSchedule' &&
          currentInternalScheduleMode === 'userFriendly' && (
            <div className="create-scheduler-form-element">
              <Controller
                name="scheduleValue"
                control={control}
                render={({ field }) => (
                  <Cron
                    value={field.value || ''}
                    setValue={(newValue: string) => {
                      field.onChange(newValue);
                      trigger('scheduleValue');
                    }}
                    allowedPeriods={
                      allowedPeriodsCron as PeriodType[] | undefined
                    }
                  />
                )}
              />
              {vertexErrors.scheduleValue && (
                <ErrorMessage
                  message={
                    vertexErrors.scheduleValue.message || 'Schedule is required'
                  }
                  showIcon={false}
                />
              )}
            </div>
          )}

        {currentScheduleMode === 'runSchedule' && (
          <>
            <div className="create-scheduler-form-element">
              <FormInputDropdown
                name="timeZone"
                control={control}
                label="Time Zone*"
                options={timezones}
                customClass="create-scheduler-style"
                error={vertexErrors.timeZone}
              />
            </div>

            <div className="create-scheduler-form-element">
              <FormInputText
                label="Max runs"
                control={control}
                name="maxRunCount"
                error={vertexErrors.maxRunCount}
                type="number"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
