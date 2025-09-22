/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
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
import { VertexServices } from '../../services/vertex/VertexServices';
import { StorageServices } from '../../services/common/Storage';
import { IamServices } from '../../services/common/Iam';
import { ComputeServices } from '../../services/common/Compute';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import { z } from 'zod';
import { Controller, FieldErrors } from 'react-hook-form';
import dayjs from 'dayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import Cron, { PeriodType } from 'react-js-cron';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import tzdata from 'tzdata';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
  EVERY_MINUTE_CRON,
  DEFAULT_KERNEL
} from '../../utils/Constants';

// Interfaces & Schemas
import {
  IAcceleratorConfig,
  ICreateVertexSchedulerProps,
  ILoadingStateVertex,
  IMachineType,
  ISharedNetwork
} from '../../interfaces/VertexInterface';
import { handleOpenLoginWidget } from '../common/login/Config';

export const CreateVertexSchedule: React.FC<ICreateVertexSchedulerProps> = ({
  app,
  control,
  errors,
  watch,
  setValue,
  getValues,
  trigger,
  credentials,
  editScheduleData
}) => {
  // Separate states for data lists
  const [machineTypeList, setMachineTypeList] = useState<IMachineType[]>([]);
  const [cloudStorageList, setCloudStorageList] = useState<
    ILabelValue<string>[]
  >([]);
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

  // Consolidated loading state as requested
  const [loadingState, setLoadingState] = useState<ILoadingStateVertex>({
    region: false,
    machineType: false,
    cloudStorageBucket: false,
    serviceAccount: false,
    primaryNetwork: false,
    subNetwork: false,
    sharedNetwork: false,
    hostProject: false
  });

  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [newBucketCreated, setNewBucketCreated] = useState<string | null>(null);

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

  // --- REFACTORED: CONSOLIDATED DATA FETCHING CALLBACKS ---
  const fetchAllInitialData = useCallback(async () => {
    setLoadingState(prev => ({
      ...prev,
      cloudStorageBucket: true,
      serviceAccount: true,
      primaryNetwork: true,
      hostProject: true
    }));
    // Fetching independent dropdowns
    const [
      cloudStorageList,
      serviceAccountList,
      primaryNetworkList,
      hostProjectList
    ] = await Promise.allSettled([
      StorageServices.cloudStorageAPIService(),
      IamServices.serviceAccountAPIService(),
      ComputeServices.primaryNetworkAPIService(),
      ComputeServices.getParentProjectAPIService()
    ]);

    if (cloudStorageList.status === 'fulfilled') {
      setCloudStorageList(cloudStorageList.value as ILabelValue<string>[]);
    } else {
      setCloudStorageList([]);
      handleErrorToast({ error: 'Failed to fetch cloud storage buckets.' });
    }

    if (serviceAccountList.status === 'fulfilled') {
      setServiceAccountList(serviceAccountList.value as ILabelValue<string>[]);
    } else {
      setServiceAccountList([]);
      handleErrorToast({ error: 'Failed to fetch service accounts.' });
    }

    if (primaryNetworkList.status === 'fulfilled') {
      setPrimaryNetworkList(primaryNetworkList.value as ILabelValue<string>[]);
    } else {
      setPrimaryNetworkList([]);
      handleErrorToast({ error: 'Failed to fetch primary networks.' });
    }

    if (hostProjectList.status === 'fulfilled') {
      setHostProject(hostProjectList.value);
    } else {
      setHostProject(null);
      handleErrorToast({ error: 'Failed to fetch host project.' });
    }

    setLoadingState(prev => ({
      ...prev,
      cloudStorageBucket: false,
      serviceAccount: false,
      primaryNetwork: false,
      hostProject: false
    }));
  }, [isVertexForm, credentials]);

  // Dependent fetch for machine types
  const fetchMachineTypes = useCallback(async (region: string) => {
    if (!region) {
      setMachineTypeList([]);
      return;
    }
    setLoadingState(prev => ({ ...prev, machineType: true }));
    try {
      const fetchedMachines =
        await VertexServices.machineTypeAPIService(region);
      setMachineTypeList(fetchedMachines);
    } catch (error) {
      setMachineTypeList([]);
      handleErrorToast({ error: 'Failed to fetch machine types.' });
    } finally {
      setLoadingState(prev => ({ ...prev, machineType: false }));
    }
  }, []);

  // Dependent fetch for sub-networks
  const fetchSubNetworks = useCallback(
    async (region: string, primaryNetworkValue: string) => {
      if (!region || !primaryNetworkValue) {
        setSubNetworkList([]);
        return;
      }
      setLoadingState(prev => ({ ...prev, subNetwork: true }));
      try {
        const response = await ComputeServices.subNetworkAPIService(
          region,
          primaryNetworkValue
        );
        setSubNetworkList(response);
      } catch (error) {
        setSubNetworkList([]);
        handleErrorToast({ error: 'Failed to fetch sub-networks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, subNetwork: false }));
      }
    },
    []
  );

  // Dependent fetch for shared networks
  const fetchSharedNetworks = useCallback(
    async (hostProjectName: string, region: string) => {
      if (!hostProjectName || !region) {
        setSharedNetworkList([]);
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
            label: `${sharedNetwork.network}/${sharedNetwork.subnetwork}`,
            value: sharedNetwork
          }))
        );
      } catch (error) {
        setSharedNetworkList([]);
        handleErrorToast({ error: 'Failed to fetch shared networks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, sharedNetwork: false }));
      }
    },
    []
  );

  // A single effect for initial data fetching and setting defaults
  // The fetchAllInitialData function is now called here.
  useEffect(() => {
    if (!isVertexForm || !credentials) {
      return;
    }

    // Fetch all static data concurrently
    fetchAllInitialData();

    // Set non-API dependent defaults
    if (!editScheduleData?.editMode || !getValues('diskType')) {
      setValue('diskType', DISK_TYPE_VALUE[0].value);
    }
    if (!editScheduleData?.editMode || !getValues('diskSize')) {
      setValue('diskSize', DEFAULT_DISK_SIZE);
    }
    if (!editScheduleData?.editMode || !getValues('networkOption')) {
      setValue('networkOption', DEFAULT_NETWORK_SELECTED);
    }
    if (!editScheduleData?.editMode || !getValues('scheduleMode')) {
      setValue('scheduleMode', 'runNow');
    }
    if (!editScheduleData?.editMode || !getValues('internalScheduleMode')) {
      setValue('internalScheduleMode', 'userFriendly');
    }
    if (!editScheduleData?.editMode || !getValues('timeZone')) {
      setValue('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    if (!editScheduleData?.editMode || !getValues('startTime')) {
      setValue('startTime', dayjs().toISOString());
    }
    if (!editScheduleData?.editMode || !getValues('endTime')) {
      setValue('endTime', dayjs().add(1, 'day').toISOString());
    }
    if (!editScheduleData?.editMode || !getValues('kernelName')) {
      setValue('kernelName', DEFAULT_KERNEL);
    }
  }, [
    isVertexForm,
    credentials,
    editScheduleData,
    fetchAllInitialData,
    setValue,
    getValues
  ]);

  // Effect for setting region and its dependent data
  useEffect(() => {
    if (isVertexForm && credentials?.region_id) {
      // Set default region from credentials if not in edit mode or not set
      if (!editScheduleData?.editMode || !getValues('vertexRegion')) {
        setValue('vertexRegion', credentials.region_id);
      }
    }
  }, [isVertexForm, credentials, editScheduleData, setValue, getValues]);

  // Effects for setting default values on fetched lists
  useEffect(() => {
    // Set Machine Type default if not already set or invalid
    const currentMachineTypeValue = getValues('machineType');
    if (
      currentMachineTypeValue &&
      !machineTypeList.some(
        m => m.machineType.value === currentMachineTypeValue
      )
    ) {
      setValue('machineType', '');
    } else if (!currentMachineTypeValue && machineTypeList.length > 0) {
      const defaultSelected = machineTypeList.find(
        item => item.machineType.value === DEFAULT_MACHINE_TYPE.value
      );
      setValue(
        'machineType',
        defaultSelected?.machineType.value ||
          machineTypeList[0].machineType.value
      );
    }
  }, [machineTypeList, getValues, setValue]);

  useEffect(() => {
    // Set Cloud Storage default if not already set or invalid
    const currentBucketValue = getValues('cloudStorageBucket');
    if (
      currentBucketValue &&
      !cloudStorageList.some(b => b.value === currentBucketValue)
    ) {
      setValue('cloudStorageBucket', '');
    } else if (!currentBucketValue && cloudStorageList.length > 0) {
      const defaultSelected = cloudStorageList.find(
        option => option.value === DEFAULT_CLOUD_STORAGE_BUCKET.value
      );
      setValue(
        'cloudStorageBucket',
        defaultSelected?.value || cloudStorageList[0].value
      );
    }
  }, [cloudStorageList, getValues, setValue]);

  useEffect(() => {
    // Set Service Account default if not already set or invalid
    const currentServiceAccountValue = getValues('serviceAccount');
    if (
      currentServiceAccountValue &&
      !serviceAccountList.some(sa => sa.value === currentServiceAccountValue)
    ) {
      setValue('serviceAccount', '');
    } else if (!currentServiceAccountValue && serviceAccountList.length > 0) {
      const defaultSelected = serviceAccountList.find(
        item => item.value === DEFAULT_SERVICE_ACCOUNT
      );
      setValue(
        'serviceAccount',
        defaultSelected?.value || serviceAccountList[0].value
      );
    }
  }, [serviceAccountList, getValues, setValue]);

  // Effects for dynamic form updates (dependent fetches)
  useEffect(() => {
    if (isVertexForm && currentRegion) {
      fetchMachineTypes(currentRegion);
    }
  }, [isVertexForm, currentRegion, fetchMachineTypes]);

  useEffect(() => {
    if (
      currentNetworkOption === 'networkInThisProject' &&
      currentPrimaryNetwork
    ) {
      fetchSubNetworks(currentRegion, currentPrimaryNetwork);
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

  // --- Callback handlers and memoized values (rest of the code is unchanged) ---
  const handleRegionChange = useCallback(
    (optionSelected: string | null, reason?: string) => {
      if (optionSelected) {
        setValue('vertexRegion', optionSelected);
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('networkOption', DEFAULT_NETWORK_SELECTED);
        setValue('primaryNetwork', '');
        setValue('subNetwork', '');
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        trigger([
          'machineType',
          'acceleratorType',
          'acceleratorCount',
          'primaryNetwork',
          'subNetwork',
          'sharedNetwork'
        ]);
      } else if (reason === 'clear') {
        setValue('vertexRegion', '');
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('networkOption', DEFAULT_NETWORK_SELECTED);
        setValue('primaryNetwork', '');
        setValue('subNetwork', '');
        setValue('sharedNetwork', { network: '', subnetwork: '' });
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

  const handleDiskSizeBlur = useCallback(() => {
    const diskSizeValue = getValues('diskSize');
    if (diskSizeValue === '' && currentDiskType) {
      setValue('diskSize', DEFAULT_DISK_SIZE);
    }
    trigger('diskSize');
  }, [setValue, currentDiskType, trigger, getValues]);

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
      if (selectedOption && selectedOption.startsWith('CREATE_NEW_BUCKET::')) {
        const newBucketName = selectedOption.replace('CREATE_NEW_BUCKET::', '');
        if (newBucketName.trim() !== '') {
          setIsCreatingBucket(true);
          setNewBucketCreated(newBucketName);
          setLoadingState(prev => ({ ...prev, cloudStorageBucket: true }));
          try {
            await StorageServices.newCloudStorageAPIService(newBucketName);
            const updatedBucketList =
              await StorageServices.cloudStorageAPIService();
            setCloudStorageList(updatedBucketList);
            setValue('cloudStorageBucket', newBucketName);
          } catch (error) {
            handleOpenLoginWidget(app);
            setValue('cloudStorageBucket', '');
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
    [setValue]
  );

  const showSharedNetworkError = useMemo(() => {
    if (currentNetworkOption === 'networkSharedFromHostProject') {
      if (loadingState.hostProject) {
        return null;
      }
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

  return (
    <div>
      {/* Region Dropdown */}
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="vertexRegion"
          control={control}
          label="Region*"
          options={VERTEX_REGIONS}
          customClass="scheduler-tag-style"
          loading={loadingState.region}
          onChangeCallback={handleRegionChange}
          error={vertexErrors.vertexRegion}
        />
      </div>

      {/* Machine Type Dropdown */}
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="machineType"
          control={control}
          label="Machine Type*"
          options={machineTypeList.map(item => item.machineType)}
          customClass="scheduler-tag-style"
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
          <div className="horizontal-element-wrapper">
            <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
              <FormInputDropdown
                name="acceleratorType"
                control={control}
                label="Accelerator Type"
                options={getAcceleratedTypeOptions(
                  selectedMachineType.acceleratorConfigs
                )}
                customClass="scheduler-tag-style create-scheduler-form-element-input-fl"
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
                    className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr"
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
                      customClass="scheduler-tag-style create-scheduler-form-element-input-fl"
                      error={vertexErrors.acceleratorCount}
                      disabled={!currentAcceleratorType}
                    />
                  </div>
                ) : null
              )}
          </div>
        )}

      {/* Kernel Dropdown */}
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="kernelName"
          control={control}
          label="Kernel*"
          options={KERNEL_VALUE}
          customClass="scheduler-tag-style"
          error={vertexErrors.kernelName}
        />
      </div>

      {/* Cloud Storage Bucket Dropdown */}
      <div className="scheduler-form-element-container">
        <FormInputDropdown
          name="cloudStorageBucket"
          control={control}
          label="Cloud Storage Bucket*"
          options={cloudStorageList}
          customClass="scheduler-tag-style"
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
      <div className="horizontal-element-wrapper">
        <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="diskType"
            control={control}
            label="Disk Type*"
            options={DISK_TYPE_VALUE}
            customClass="scheduler-tag-style"
            error={vertexErrors.diskType}
            onChangeCallback={() => {
              setValue('diskSize', '');
              trigger('diskSize');
            }}
          />
        </div>
        <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
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
      <div className="scheduler-form-element-container panel-margin footer-text">
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

      <div className="scheduler-form-element-container panel-margin">
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
      {currentNetworkOption === 'networkInThisProject' ? (
        <div className="execution-history-main-wrapper">
          <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
            <FormInputDropdown
              name="primaryNetwork"
              control={control}
              label="Primary network"
              customClass="scheduler-tag-style create-scheduler-form-element-input-fl"
              options={primaryNetworkList}
              loading={loadingState.primaryNetwork}
              error={vertexErrors.primaryNetwork}
              disabled={!currentRegion || loadingState.primaryNetwork}
              onChangeCallback={selected => {
                setValue('primaryNetwork', selected ? selected.value : '');
                setValue('subNetwork', '');
                trigger(['subNetwork']);
              }}
            />
          </div>
          <div className="scheduler-form-element-container create-scheduler-form-element-input-fl">
            <FormInputDropdown
              name="subNetwork"
              control={control}
              label="Sub network"
              customClass="scheduler-tag-style create-scheduler-form-element-input-fl"
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
        <>
          <div className="scheduler-form-element-container">
            <FormInputDropdown
              name="sharedNetwork"
              control={control}
              label="Shared subnetwork*"
              options={sharedNetworkList}
              customClass="scheduler-tag-style"
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
      <div className="scheduler-form-element-container">
        <FormInputRadio
          name="scheduleMode"
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
          error={vertexErrors.scheduleMode}
          onChange={() => {
            if (watch('scheduleMode') === 'runNow') {
              setValue('internalScheduleMode', undefined);
              setValue('scheduleFieldCronFormat', '');
              setValue('scheduleValueUserFriendly', '');
              setValue('startTime', '');
              setValue('endTime', '');
              setValue('maxRunCount', '');
              setValue('timeZone', '');
            } else {
              if (!getValues('internalScheduleMode')) {
                setValue('internalScheduleMode', 'userFriendly');
              }
              if (!getValues('scheduleValueUserFriendly')) {
                setValue('scheduleValueUserFriendly', EVERY_MINUTE_CRON);
              }
              if (!getValues('startTime')) {
                setValue('startTime', dayjs().toISOString());
              }
              if (!getValues('endTime')) {
                setValue('endTime', dayjs().add(1, 'day').toISOString());
              }
              if (!getValues('timeZone')) {
                setValue(
                  'timeZone',
                  Intl.DateTimeFormat().resolvedOptions().timeZone
                );
              }
            }
            trigger([
              'internalScheduleMode',
              'scheduleFieldCronFormat',
              'scheduleValueUserFriendly',
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
                  setValue('scheduleValueUserFriendly', EVERY_MINUTE_CRON);
                  setValue('scheduleFieldCronFormat', '');
                } else {
                  setValue('scheduleFieldCronFormat', '');
                  setValue('scheduleValueUserFriendly', EVERY_MINUTE_CRON);
                }
                trigger([
                  'scheduleFieldCronFormat',
                  'scheduleValueUserFriendly'
                ]);
              }}
            />

            <div className="horizontal-element-wrapper">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="cscheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        className="scheduler-tag-style create-scheduler-form-element-input-fl"
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
                <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        {...field}
                        className="scheduler-tag-style create-scheduler-form-element-input-fl"
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
              <div className="scheduler-form-element-container schedule-input-field">
                <FormInputText
                  label="Schedule*"
                  control={control}
                  name="scheduleFieldCronFormat"
                  error={vertexErrors.scheduleFieldCronFormat}
                  onChangeCallback={() => trigger('scheduleFieldCronFormat')}
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
            <div className="scheduler-form-element-container">
              <Controller
                name="scheduleValueUserFriendly"
                control={control}
                render={({ field }) => (
                  <Cron
                    value={field.value || ''}
                    setValue={(newValue: string) => {
                      field.onChange(newValue);
                      trigger('scheduleValueUserFriendly');
                    }}
                    allowedPeriods={
                      allowedPeriodsCron as PeriodType[] | undefined
                    }
                  />
                )}
              />
              {vertexErrors.scheduleValueUserFriendly && (
                <ErrorMessage
                  message={
                    vertexErrors.scheduleValueUserFriendly.message ||
                    'Schedule is required'
                  }
                  showIcon={false}
                />
              )}
            </div>
          )}

        {currentScheduleMode === 'runSchedule' && (
          <>
            <div className="scheduler-form-element-container">
              <FormInputDropdown
                name="timeZone"
                control={control}
                label="Time Zone*"
                options={timezones}
                customClass="scheduler-tag-style"
                error={vertexErrors.timeZone}
              />
            </div>

            <div className="scheduler-form-element-container">
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
