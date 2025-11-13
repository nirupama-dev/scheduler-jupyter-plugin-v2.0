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
import { ILabelValue } from '../../interfaces/CommonInterface';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import { z } from 'zod';
import { Controller, FieldErrors } from 'react-hook-form';
import dayjs from 'dayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import Cron, { PeriodType } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
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
  EVERY_MINUTE_CRON,
  NETWORK_IN_THIS_PROJECT_VALUE,
  NETWORK_SHARED_FROM_HOST_PROJECT_VALUE,
  ENCRYPTION_TEXT,
  ENCRYPTION_OPTIONS,
  CUSTOMER_ENCRYPTION,
  PREDEFINED_CMEK,
  CUSTOMER_MANAGED_RADIO_OPTIONS,
  MANUAL_CMEK,
  DEFAULT_ENCRYPTION_SELECTED
} from '../../utils/Constants';

// Interfaces & Schemas
import {
  IAcceleratorConfig,
  ICreateVertexSchedulerProps,
  ILoadingStateVertex,
  IMachineType,
  ISharedNetwork
} from '../../interfaces/VertexInterface';
import { RadioOption } from '../../types/CommonSchedulerTypes';
import { handleOpenLoginWidget } from '../common/login/Config';
import { AuthenticationError } from '../../exceptions/AuthenticationException';
import { CombinedCreateFormValues } from '../../schemas/CreateScheduleCombinedSchema';

export const CreateVertexSchedule: React.FC<ICreateVertexSchedulerProps> = ({
  control,
  errors,
  watch,
  setValue,
  getValues,
  trigger,
  isValid,
  credentials,
  editScheduleData,
  clearErrors,
  app
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
  const [loadingState, setLoadingState] = useState<ILoadingStateVertex>({
    region: false,
    machineType: false,
    cloudStorageBucket: false,
    serviceAccount: false,
    primaryNetwork: false,
    subNetwork: false,
    sharedNetwork: false,
    hostProject: false,
    keyRings: false,
    cryptoKeys: false
  });

  //Encryption states
  const [keyRingList, setKeyRingList] = useState<ILabelValue<string>[]>([]);
  const [cryptoKeyList, setCryptoKeyList] = useState<ILabelValue<string>[]>([]);
  const [defaultFormValues, setDefaultFormValues] =
    useState<CombinedCreateFormValues>({} as CombinedCreateFormValues);

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
  const currentRegion = watch('vertexRegion');
  const currentMachineType = watch('machineType');
  const currentAcceleratorType = watch('acceleratorType');
  const currentDiskType = watch('diskType');
  const currentNetworkOption = watch('networkOption');
  const currentScheduleMode = watch('scheduleMode');
  const currentInternalScheduleMode = watch('internalScheduleMode');
  const currentPrimaryNetwork = watch('primaryNetwork');
  const currentSchedulerSelection = watch('schedulerSelection');
  const encryptionSelected = watch('encryptionOption');
  const customerEncryptionType = watch('customerEncryptionType');
  const keyRingSelected = watch('keyRing');
  const cryptoKeySelected = watch('cryptoKey');

  //
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

  /**
   * Fetches the default region for the Vertex scheduler.
   */
  const fetchRegion = useCallback(async () => {
    console.log('fetchRegion');
    setLoadingState(prev => ({ ...prev, region: true }));

    let currentRegionValue = getValues('vertexRegion');

    // If no value is currently set, try to use the default from credentials.
    if (!currentRegionValue && credentials?.region_id) {
      currentRegionValue = credentials.region_id;
    }
    console.log('Current Region Value:', currentRegionValue);

    // Validate the determined regionToSet against the list of valid regions.
    const isRegionValid = VERTEX_REGIONS.some(
      region => region.value === currentRegionValue
    );
    console.log('Is Region Valid:', isRegionValid);
    // If the region is valid, set it; otherwise, clear the field.
    if (!isRegionValid) {
      setValue('vertexRegion', '');
    }
    setLoadingState(prev => ({ ...prev, region: false }));
    trigger([
      'vertexRegion',
      'machineType',
      'acceleratorType',
      'acceleratorCount'
    ]);
  }, [setValue, getValues, editScheduleData]);

  /**
   * Fetches the available machine types for the selected region.
   * @param region The selected region.
   */
  const fetchMachineTypes = useCallback(
    async (region: string) => {
      console.log('fetchMachineTypes');
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

        const currentMachineTypeValue = getValues('machineType');
        // Check if the current value is already valid.
        const isCurrentValueValid = fetchedMachines.some(
          m => m.machineType.value === currentMachineTypeValue
        );

        // Only set a new value if the current value is NOT valid, and if the form is in creation mode
        if (!isCurrentValueValid && !editScheduleData?.editMode) {
          let machineTypeToSet = '';

          // Prioritize default value if it exists in the fetched list.
          const defaultMachine = fetchedMachines.find(
            item => item.machineType.value === DEFAULT_MACHINE_TYPE.value
          );

          if (defaultMachine) {
            machineTypeToSet = defaultMachine.machineType.value;
          } else if (fetchedMachines.length > 0) {
            // Fallback to the first available machine type.
            machineTypeToSet = fetchedMachines[0].machineType.value;
          }

          setValue('machineType', machineTypeToSet);

          // Reset accelerators whenever the machine type changes.
          setValue('acceleratorType', '');
          setValue('acceleratorCount', '');
        }
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }

        // Handle all errors in one place.
        setMachineTypeList([]);
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
      } finally {
        // Ensure loading state and triggers are consistent.
        setLoadingState(prev => ({ ...prev, machineType: false }));
        trigger(['machineType', 'acceleratorType', 'acceleratorCount']);
      }
    },
    [setValue, getValues, editScheduleData]
  );

  /**
   * Fetches the available cloud storage buckets.
   */
  const fetchCloudStorageBuckets = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, cloudStorageBucket: true }));
    console.log('fetchCloudStorageBuckets');
    try {
      const fetchedBuckets = await StorageServices.cloudStorageAPIService();
      setCloudStorageList(fetchedBuckets);
      const currentBucketValue = getValues('cloudStorageBucket');
      const isValidExisting = fetchedBuckets.some(
        b => b.value === currentBucketValue
      );

      if (
        !editScheduleData?.editMode ||
        !currentBucketValue ||
        !isValidExisting
      ) {
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
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }

      setCloudStorageList([]);
      if (isVertexForm) {
        setValue('cloudStorageBucket', '');
      }
    } finally {
      setLoadingState(prev => ({ ...prev, cloudStorageBucket: false }));
    }
  }, [setValue, getValues, editScheduleData]);

  /**
   * Fetches the available service accounts.
   */
  const fetchServiceAccounts = useCallback(async () => {
    console.log('Fetching service accounts...');
    setLoadingState(prev => ({ ...prev, serviceAccount: true }));
    try {
      const response = await IamServices.serviceAccountAPIService();
      setServiceAccountList(response);
      // Set default or existing value if valid, otherwise reset
      const currentServiceAccountValue = getValues('serviceAccount');
      const isValidExisting = response.some(
        sa => sa.value === currentServiceAccountValue
      );

      if (
        !editScheduleData?.editMode ||
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
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }

      setServiceAccountList([]);
      setValue('serviceAccount', '');
    } finally {
      setLoadingState(prev => ({ ...prev, serviceAccount: false }));
      trigger(['serviceAccount']);
    }
  }, [setValue, getValues, editScheduleData]);

  /**
   * Fetches the host project information.
   */
  const fetchHostProject = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, hostProject: true })); // Manage loading locally
    console.log('fetchHostProject');
    try {
      const parentProject = await ComputeServices.getParentProjectAPIService(); // Service handles its own error/notification
      console.log('Host project:', parentProject);
      if (parentProject) {
        setHostProject(parentProject);
      } else {
        setHostProject(null); // Set to null if response is falsy
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }

      setHostProject(null); // Set to null on error
    } finally {
      setLoadingState(prev => ({ ...prev, hostProject: false }));
    }
  }, []);

  /**
   * Fetches the available primary networks.
   */
  const fetchPrimaryNetworks = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, primaryNetwork: true }));
    console.log('fetchPrimaryNetworks');
    try {
      const response = await ComputeServices.primaryNetworkAPIService();
      setPrimaryNetworkList(response);

      // Set default or existing value if valid, otherwise reset
      const currentPrimaryNetworkValue = getValues('primaryNetwork');
      const isValidExisting = response.some(
        n => n.value === currentPrimaryNetworkValue
      );

      if (!isValidExisting) {
        setValue('primaryNetwork', ''); //primary network is optional and by default empty. it will reset to blank value if editmode had some invalid bvalue as well.
        console.log(
          'Resetting primary network to empty as existing value is invalid.'
        );
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }

      setPrimaryNetworkList([]);
      setValue('primaryNetwork', '');
      handleErrorToast({ error: 'Failed to fetch primary networks.' });
    } finally {
      setLoadingState(prev => ({ ...prev, primaryNetwork: false }));
      trigger('primaryNetwork');
    }
  }, [setValue, getValues, editScheduleData]);

  /**
   * Fetches the available sub-networks for the selected region and primary network.
   * @param region The selected region.
   * @param primaryNetworkValue The selected primary network.
   */
  const fetchSubNetworks = useCallback(
    async (region: string, primaryNetworkValue: string) => {
      console.log('fetchSubNetworks');
      console.log(
        'Fetching subnetworks for region:',
        region,
        'and primary network:',
        primaryNetworkValue
      );

      if (!region || !primaryNetworkValue) {
        setSubNetworkList([]);
        setValue('subNetwork', '');
        return;
      }
      setLoadingState(prev => ({ ...prev, subNetwork: true }));
      try {
        const primaryNetworkLabel = primaryNetworkList.find(
          n => n.value === primaryNetworkValue
        )?.label;
        console.log('Primary network label:', primaryNetworkLabel);
        const subNetworkListResp = await ComputeServices.subNetworkAPIService(
          region,
          primaryNetworkLabel
        );
        setSubNetworkList(subNetworkListResp);
        console.log('Fetched subnetworks:', subNetworkListResp);
        // Set default or existing value if valid, otherwise reset
        const currentSubnetworkValue = getValues('subNetwork');
        const isValidExisting = subNetworkListResp.some(
          sn => sn.value === currentSubnetworkValue
        );

        if (!isValidExisting) {
          setValue('subNetwork', ''); //sub network is optional and by default empty. It will reset to blank value if editmode had some invalid value as well.
        }
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }

        setSubNetworkList([]);
        setValue('subNetwork', '');
        handleErrorToast({ error: 'Failed to fetch subNetworks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, subNetwork: false }));
        trigger('subNetwork');
        trigger('primaryNetwork'); // Ensure primary network validation is updated
      }
    },
    [
      setValue,
      getValues,
      editScheduleData,
      currentNetworkOption,
      currentPrimaryNetwork
    ]
  );

  /**
   * Fetches the available shared networks for the selected host project and region.
   * @param hostProjectName The selected host project.
   * @param region The selected region.
   */

  const fetchSharedNetworks = useCallback(
    async (hostProjectName: string, region: string) => {
      console.log('fetchSharedNetworks');
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
        if (editScheduleData?.editMode) {
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
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }

        setSharedNetworkList([]);
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        handleErrorToast({ error: 'Failed to fetch shared networks.' });
      } finally {
        setLoadingState(prev => ({ ...prev, sharedNetwork: false }));
        trigger('sharedNetwork');
      }
    },
    [setValue, getValues, editScheduleData]
  );

  // --- useEffects for Initial Data Fetching and Dynamic Form Updates ---

  // Initial API calls for static/independent dropdowns and default region
  useEffect(() => {
    // Initial data fetches
    fetchRegion();
    fetchCloudStorageBuckets();
    fetchServiceAccounts();
    fetchPrimaryNetworks();
    fetchHostProject();
  }, [
    setValue,
    getValues,
    editScheduleData,
    fetchRegion,
    fetchCloudStorageBuckets,
    fetchServiceAccounts,
    fetchPrimaryNetworks,
    fetchHostProject
  ]);

  // Effect for Machine Types dependent on Region
  useEffect(() => {
    console.log(
      'Use Effect: Fetching machine types for region:',
      getValues('vertexRegion')
    );
    fetchMachineTypes(getValues('vertexRegion'));
    trigger('machineType');
  }, [currentRegion, fetchMachineTypes, trigger]);

  // Effect for Subnetworks dependent on Primary Network and Region
  useEffect(() => {
    const networkOption = getValues('networkOption');

    if (networkOption === NETWORK_SHARED_FROM_HOST_PROJECT_VALUE) {
      // Logic for shared networks
      fetchSharedNetworks(hostProject?.name || '', getValues('vertexRegion'));
      // Ensure sub-network state is cleared
      setValue('primaryNetwork', '');
      setValue('subNetwork', '');
    } else {
      getValues('networkOption') ||
        setValue('networkOption', NETWORK_IN_THIS_PROJECT_VALUE); //set default value if nothing is selected.
      console.log('network option:', getValues('networkOption'));
      fetchSubNetworks(currentRegion, currentPrimaryNetwork || '');
      // Ensure shared network state is cleared
      setValue('sharedNetwork', { network: '', subnetwork: '' });
    }
  }, [
    currentRegion,
    currentNetworkOption,
    currentPrimaryNetwork,
    hostProject,
    getValues,
    fetchSubNetworks,
    fetchSharedNetworks,
    setValue
  ]);
  // --- Callbacks for Form Field Interactions ---

  const handleRegionChange = useCallback(
    (optionSelected: string | null, reason?: string) => {
      console.log('Handle Region changed:', optionSelected, reason);

      if (optionSelected) {
        setValue('vertexRegion', optionSelected);
        // Reset machine type and dependent fields when region changes
        setValue('machineType', '');
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('networkOption', DEFAULT_NETWORK_SELECTED);
        setValue('primaryNetwork', '');
        setValue('subNetwork', ''); // Clear the actual subNetwork field
        setValue('sharedNetwork', { network: '', subnetwork: '' });
        setValue('keyRing', '');
        setKeyRingList([]);
        setValue('cryptoKey', '');
        setCryptoKeyList([]);
        // Trigger validation for these fields to show errors if they become invalid
        trigger([
          'vertexRegion',
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
        setValue('acceleratorType', '');
        setValue('acceleratorCount', '');
        setValue('keyRing', '');
        setKeyRingList([]);
        setValue('cryptoKey', '');
        setCryptoKeyList([]);
        setValue('networkOption', DEFAULT_NETWORK_SELECTED);
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

      if (encryptionSelected === CUSTOMER_ENCRYPTION) {
        if (customerEncryptionType === PREDEFINED_CMEK) {
          trigger(['keyRing']);
          trigger(['cryptoKey']);
        } else if (customerEncryptionType === MANUAL_CMEK) {
          trigger(['manualKey']);
        }
      }
    },
    [setValue, trigger]
  );

  const handleDiskSizeBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const diskSizeValue = getValues('diskSize');
      // If disk size is blurred and is empty, set to default IF disk type is selected
      if (diskSizeValue === '' && currentDiskType) {
        setValue('diskSize', DEFAULT_DISK_SIZE);
      }
      trigger('diskSize'); // Trigger validation on blur
    },
    [setValue, currentDiskType, trigger, getValues]
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
            await StorageServices.newCloudStorageAPIService(newBucketName);
            // Re-fetch buckets to include the newly created one and set it
            const updatedBucketList =
              await StorageServices.cloudStorageAPIService();
            setCloudStorageList(updatedBucketList);
            setValue('cloudStorageBucket', newBucketName);
          } catch (error) {
            if (error instanceof AuthenticationError) {
              handleOpenLoginWidget(app);
            }

            setValue('cloudStorageBucket', ''); // Clear selection on failure
          } finally {
            setLoadingState(prev => ({ ...prev, cloudStorageBucket: false }));
            setIsCreatingBucket(false);
            setNewBucketCreated(null);
            trigger('cloudStorageBucket');
          }
        }
      } else {
        trigger('cloudStorageBucket');
      }
    },
    [setValue, setCloudStorageList, app]
  );

  // Error message for shared network if host project is missing or no networks
  const showSharedNetworkError = useMemo(() => {
    if (currentNetworkOption === 'networkSharedFromHostProject') {
      if (loadingState.hostProject) {
        return null;
      } // Don't show error while loading host project
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

  /**
   * Handles changes to the cron expression field, updating both the cron format and user-friendly fields.
   * @param value The new cron expression value.
   */
  const handleCronExpression = useCallback(
    (value: string) => {
      console.log('value cron handler', value);
      setValue('scheduleFieldCronFormat', value);
      setValue('scheduleValueUserFriendly', value);
      trigger(['scheduleFieldCronFormat', 'scheduleValueUserFriendly']);
    },
    [setValue, trigger]
  );
  console.log('Isvalid:', isValid);
  console.log('Errors:', errors);

  /**
   * List Customer managed encryption key rings
   */
  const listKeyRings = async () => {
    const listKeyRingsPayload = {
      region: currentRegion,
      projectId: credentials?.project_id,
      accessToken: credentials?.access_token
    };
    setLoadingState(prev => ({ ...prev, keyRings: true }));
    const keyRingList = await VertexServices.listKeyRings(listKeyRingsPayload);
    if (Array.isArray(keyRingList) && keyRingList.length > 0) {
      setKeyRingList(keyRingList);
    }
    setLoadingState(prev => ({ ...prev, keyRings: false }));
  };

  /**
   * List crypto keys from KmS key ring
   * @param {string} keyRing selected key ring to list down the keys
   */
  const listCryptoKeysAPI = async (keyRing: string) => {
    const listKeysPayload = {
      credentials: {
        region: credentials?.region_id,
        projectId: credentials?.project_id,
        accessToken: credentials?.access_token
      },
      keyRing
    };
    const cryptoKeyListResponse =
      await VertexServices.listCryptoKeysAPIService(listKeysPayload);
    if (
      Array.isArray(cryptoKeyListResponse) &&
      cryptoKeyListResponse.length > 0
    ) {
      setCryptoKeyList(cryptoKeyListResponse);
      if (!editScheduleData?.editMode) {
        setValue('cryptoKey', cryptoKeyListResponse[0].value);
        clearErrors('cryptoKey');
      }
    }
    setLoadingState(prev => ({ ...prev, cryptoKeys: false }));
  };

  /**
   * Handle key ring change
   * @param {string | null} selectedKeyRing selected key ring
   */

  const handleKeyRingChange = (selectedKeyRing: string | null) => {
    trigger(['keyRing', 'cryptoKey']);
    if (selectedKeyRing) {
      clearErrors('keyRing');
    }
  };

  /**
   * Handle crypo key change
   * @param {string | null} selectedCryptoKey selected crypto key
   */
  const handleCryptoKeyChange = (selectedCryptoKey: string | null) => {
    trigger('cryptoKey');
  };

  useEffect(() => {
    if (keyRingSelected) {
      listCryptoKeysAPI(keyRingSelected);
    } else {
      setValue('cryptoKey', '');
      setCryptoKeyList([]);
    }
  }, [keyRingSelected]);

  useEffect(() => {
    if (
      encryptionSelected === CUSTOMER_ENCRYPTION &&
      customerEncryptionType === PREDEFINED_CMEK
    ) {
      setValue('manualKey', '');
      trigger('keyRing');
      listKeyRings();
      clearErrors('manualKey');
    }
  }, [currentRegion, customerEncryptionType, encryptionSelected]);

  useEffect(() => {
    if (
      customerEncryptionType === MANUAL_CMEK ||
      encryptionSelected === DEFAULT_ENCRYPTION_SELECTED
    ) {
      setValue('keyRing', '');
      setKeyRingList([]);
      setValue('cryptoKey', '');
      setCryptoKeyList([]);
      setLoadingState(prev => ({
        ...prev,
        keyRings: false,
        cryptoKeys: false
      }));
      clearErrors(['keyRing', 'cryptoKey']);
    }
  }, [customerEncryptionType, cryptoKeySelected, encryptionSelected]);

  useEffect(() => {
    setDefaultFormValues(getValues());
  }, []);

  // --- Render Component UI ---
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
          disabled={editScheduleData?.editMode}
        />
      </div>
      {/* Machine Type Dropdown */}
      <div
        className={
          vertexErrors.vertexRegion
            ? 'scheduler-form-element-container scheduler-input-top error-input'
            : 'scheduler-form-element-container scheduler-input-top'
        }
      >
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
          <div
            className={
              vertexErrors.acceleratorCount
                ? 'horizontal-element-wrapper scheduler-input-top element-bottom'
                : 'horizontal-element-wrapper scheduler-input-top'
            }
          >
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
                  trigger(['acceleratorType', 'acceleratorCount']);
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
                      onChangeCallback={() => {
                        trigger('acceleratorCount');
                      }}
                    />
                  </div>
                ) : null
              )}
          </div>
        )}
      {/* Kernel Dropdown */}
      <div
        className={
          vertexErrors.machineType
            ? 'scheduler-form-element-container scheduler-input-top error-input'
            : 'scheduler-form-element-container scheduler-input-top'
        }
      >
        <FormInputDropdown
          name="kernelName"
          control={control}
          label="Kernel*"
          options={KERNEL_VALUE}
          customClass="scheduler-tag-style"
          error={vertexErrors.kernelName}
          onChangeCallback={() => trigger('kernelName')}
        />
      </div>
      {/* Cloud Storage Bucket Dropdown */}
      <div
        className={
          vertexErrors.kernelName
            ? 'scheduler-form-element-container scheduler-input-top error-input'
            : 'scheduler-form-element-container scheduler-input-top'
        }
      >
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
      <div
        className={
          vertexErrors.cloudStorageBucket
            ? 'horizontal-element-wrapper scheduler-input-top error-input'
            : 'horizontal-element-wrapper scheduler-input-top'
        }
      >
        <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="diskType"
            control={control}
            label="Disk Type*"
            options={DISK_TYPE_VALUE}
            customClass="scheduler-tag-style"
            error={vertexErrors.diskType}
            onChangeCallback={() => {
              setValue('diskSize', ''); // Clear disk size when disk type changes
              trigger(['diskSize', 'diskType']);
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
      <div
        className={
          vertexErrors.diskSize || vertexErrors.diskType
            ? 'scheduler-form-element-container'
            : 'scheduler-form-element-container footer-text scheduler-input-top'
        }
      >
        <FormInputDropdown
          name="serviceAccount"
          control={control}
          label="Service account*"
          options={serviceAccountList}
          loading={loadingState.serviceAccount}
          error={vertexErrors.serviceAccount}
          onChangeCallback={() => trigger('serviceAccount')}
        />
      </div>
      {/* Encryption */}
      <div className="create-job-scheduler-text-para create-job-scheduler-sub-title">
        {ENCRYPTION_TEXT}
      </div>
      <div className="scheduler-form-element-container panel-margin">
        <FormInputRadio
          name="encryptionOption"
          control={control}
          className="network-layout"
          options={ENCRYPTION_OPTIONS.map(option => {
            const newOption: RadioOption = { ...option };
            return newOption;
          })}
          error={vertexErrors.networkOption}
          projectId={credentials?.project_id}
        />
      </div>
      {/* --- Customer-Managed Encryption (CMEK) Section --- */}
      {encryptionSelected === CUSTOMER_ENCRYPTION && (
        <div className="schedule-child-section horizontal-element-wrapper">
          <FormInputRadio
            name="customerEncryptionType"
            control={control}
            className="schedule-radio-btn encryption-custom-radio"
            options={CUSTOMER_MANAGED_RADIO_OPTIONS}
            errorFlag={vertexErrors.keyRing || vertexErrors.cryptoKey}
          />

          {/* Option 1: Select Key Ring and Key */}
          <div className="encryption-custom-radio-element">
            <div className="horizontal-element-wrapper scheduler-input-top">
              <div className="scheduler-form-element-container create-scheduler-form-element-input-fl create-pr">
                <FormInputDropdown
                  name="keyRing"
                  control={control}
                  label="Key rings*"
                  options={keyRingList}
                  loading={loadingState.keyRings}
                  disabled={
                    !currentRegion ||
                    customerEncryptionType !== PREDEFINED_CMEK ||
                    loadingState.keyRings
                  }
                  error={vertexErrors.keyRing}
                  onChangeCallback={keyRingSelected =>
                    handleKeyRingChange(keyRingSelected)
                  }
                />
              </div>
              <div className="scheduler-form-element-container create-scheduler-form-element-input-fl">
                <FormInputDropdown
                  name="cryptoKey"
                  control={control}
                  label="Keys*"
                  options={cryptoKeyList}
                  loading={loadingState.cryptoKeys}
                  disabled={
                    !watch('keyRing') ||
                    customerEncryptionType !== PREDEFINED_CMEK ||
                    loadingState.cryptoKeys
                  }
                  error={vertexErrors.cryptoKey}
                  onChangeCallback={cryptoKeySelected =>
                    handleCryptoKeyChange(cryptoKeySelected)
                  }
                />
              </div>
            </div>

            {/* Option 2: Enter Key Manually */}
            <div className="scheduler-form-element-container scheduler-input-top encryption-custom-radio-manual">
              <FormInputText
                name="manualKey"
                control={control}
                label="Enter key manually*"
                error={vertexErrors.manualKey}
                placeholder="projects/PROJECT/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY"
                disabled={customerEncryptionType === PREDEFINED_CMEK}
                // onChangeCallback={handleManualEncryptionChange}
              />
            </div>
          </div>
        </div>
      )}
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
          options={NETWORK_OPTIONS.map(option => {
            const newOption: RadioOption = { ...option };
            // Check if the current option is the "host project" option
            if (option.value === 'networkSharedFromHostProject') {
              // If there's no hostProject, disable this option
              if (!hostProject?.name) {
                newOption.disabled = true;
              } // Add the host project name to the label if it exists
              if (hostProject?.name) {
                newOption.label = `${option.label} "${hostProject.name}"`;
              }
            }
            return newOption;
          })}
          error={vertexErrors.networkOption}
          onChange={() => {
            // // Clear all network-related fields when network option changes
            // setValue('primaryNetwork', '');
            // setValue('subNetwork', '');
            // setValue('sharedNetwork', { network: '', subnetwork: '' });
            // trigger(['primaryNetwork', 'subNetwork', 'sharedNetwork']);
          }}
        />
      </div>
      {/* Conditional Network Fields */}
      {currentNetworkOption === 'networkInThisProject' ? ( // 'networkInThisProject'
        <div className="horizontal-element-wrapper">
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
                console.log('Primary network selected:', selected);
                console.log('Setting primary network to:', selected.value);
                // setValue('primaryNetwork', selected ? selected.value : '');
                setValue('subNetwork', ''); // Clear subnetwork when primary changes
                trigger(['primaryNetwork', 'subNetwork']); // Trigger validation for subnetwork
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
                !getValues('vertexRegion') ||
                !getValues('primaryNetwork') ||
                loadingState.subNetwork
              }
              onChangeCallback={selected => {
                console.log('Sub network selected:', selected);
                // setValue('subNetwork', selected ? selected.value : '');
                trigger(['subNetwork', 'primaryNetwork']);
              }}
            />
          </div>
        </div>
      ) : (
        // 'networkSharedFromHostProject'
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
                trigger([
                  'sharedNetwork',
                  'sharedNetwork.network',
                  'sharedNetwork.subnetwork'
                ]);
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
              console.log('Resetting schedule fields for Run Now mode');
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
                // if (watch('internalScheduleMode') === 'cronFormat') {
                //   setValue('scheduleValue', EVERY_MINUTE_CRON);
                //   setValue('scheduleFieldCronFormat', '');
                // } else {
                //   setValue('scheduleFieldCronFormat', '');
                //   setValue('scheduleValue', EVERY_MINUTE_CRON);
                // }
                trigger([
                  'scheduleFieldCronFormat',
                  'scheduleValueUserFriendly'
                ]);
              }}
            />

            <div className="horizontal-element-wrapper module-top">
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
                <div className="create-scheduler-form-element-input-fl create-pr">
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
              <div
                className={
                  vertexErrors.endTime?.message ||
                  vertexErrors.startTime?.message
                    ? 'scheduler-form-element-container schedule-input-field scheduler-input-top error-input'
                    : 'scheduler-form-element-container schedule-input-field scheduler-input-top'
                }
              >
                <FormInputText
                  label="Schedule*"
                  control={control}
                  name="scheduleFieldCronFormat"
                  error={vertexErrors.scheduleFieldCronFormat}
                  onChangeCallback={handleCronExpression}
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
            <div className="scheduler-input-top">
              <Controller
                name="scheduleValueUserFriendly"
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
            <div className="scheduler-form-element-container scheduler-input-top">
              <FormInputDropdown
                name="timeZone"
                control={control}
                label="Time Zone*"
                options={timezones}
                customClass="scheduler-tag-style"
                error={vertexErrors.timeZone}
                retainDefaultOnClear={true}
                defaultValue={defaultFormValues.timeZone}
              />
            </div>

            <div className="scheduler-form-element-container scheduler-input-top">
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
