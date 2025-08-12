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

import { CombinedCreateFormValues } from '../schemas/CreateScheduleCombinedSchema';
import { VertexSchedulerFormValues } from '../schemas/CreateVertexSchema'; // Import types for clarity
import { ComposerSchedulerFormValues } from '../schemas/CreateComposerSchema'; // Import types for clarity
import {
  DEFAULT_DISK_SIZE,
  DEFAULT_NETWORK_SELECTED,
  DEFAULT_SCHEDULER_SELECTED,
  DEFAULT_CLOUD_STORAGE_BUCKET,
  DEFAULT_MACHINE_TYPE,
  DEFAULT_KERNEL,
  DEFAULT_SERVICE_ACCOUNT,
  DEFAULT_TIME_ZONE,
  DISK_TYPE_VALUE,
  CRON_FOR_SCHEDULE_EVERY_MIN
} from './Constants';
import { INotebookKernalSchdulerDefaults } from '../interfaces/CommonInterface';
import { ISessionContext } from '@jupyterlab/apputils';
import dayjs from 'dayjs';

/**
 * Formats a timestamp into a specific string format.
 * @param timestamp The timestamp to format.
 * @returns A formatted string representing the timestamp.
 */
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Generates a default job name based on the current time.
 * @returns A string for the default job name.
 */
const generateDefaultJobName = () => {
  const currentTime = new Date().getTime();
  const formattedCurrentTime = formatTimestamp(currentTime);
  return `job_${formattedCurrentTime}`;
};

/**
 *
 * @returns Default values for the Vertex scheduler form fields.
 * @description
 * This function returns default values for the form fields used in the Vertex scheduler.
 * It provides a set of initial values that can be used when creating a new Vertex schedule.
 */
const getDefaultVertexValues = (
  initialKernelDetails: INotebookKernalSchdulerDefaults,
  inputFilePath: string
): VertexSchedulerFormValues => ({
  schedulerSelection: DEFAULT_SCHEDULER_SELECTED,
  jobName: generateDefaultJobName(),
  inputFile: inputFilePath, // input file is fetched from the Session context path
  machineType: DEFAULT_MACHINE_TYPE.value, // Assumes DEFAULT_MACHINE_TYPE will be found by useEffect
  kernelName: DEFAULT_KERNEL, // Assumes DEFAULT_KERNEL will be found by useEffect
  acceleratorType: '', // Null initially, set by user if machineType supports
  acceleratorCount: '', // Null initially, set by user if acceleratorType chosen
  vertexRegion: '', // Will be set by authApi in useEffect, but starts empty
  cloudStorageBucket: DEFAULT_CLOUD_STORAGE_BUCKET.value, // Assumes DEFAULT_CLOUD_STORAGE_BUCKET will be found by useEffect
  serviceAccount: DEFAULT_SERVICE_ACCOUNT, // Assumes DEFAULT_SERVICE_ACCOUNT will be found by useEffect
  networkOption: DEFAULT_NETWORK_SELECTED,
  primaryNetwork: '', // Will be dynamically set by primaryNetworkSelected if 'networkInThisProject'
  subNetwork: '', // Will be dynamically set by subNetworkList[0] if 'networkInThisProject'
  diskType: DISK_TYPE_VALUE[0].value, // First value from DISK_TYPE_VALUE array
  diskSize: DEFAULT_DISK_SIZE,
  scheduleMode: 'runNow',
  internalScheduleMode: 'cronFormat',
  scheduleField: '', // Empty string for direct cron input
  scheduleValue: CRON_FOR_SCHEDULE_EVERY_MIN, // Default for user-friendly cron
  startTime: dayjs().toISOString(), // Default to current date/time, may be cleared by component logic
  endTime: dayjs().toISOString(), // Default to current date/time, may be cleared by component logic
  maxRunCount: '',
  timeZone: DEFAULT_TIME_ZONE, // Browser's local time zone
  parameters: []
});

/**
 *
 * @returns Default values for the Composer scheduler form fields.
 * @description
 * This function returns default values for the form fields used in the Composer scheduler.
 * It provides a set of initial values that can be used when creating a new Composer schedule.
 */
const getDefaultComposerValues = (
  initialKernelDetails: INotebookKernalSchdulerDefaults,
  inputFilePath: string
): ComposerSchedulerFormValues => ({
  schedulerSelection: 'composer',
  jobName: generateDefaultJobName(),
  inputFile: inputFilePath, // input file is fetched from the Session context path
  projectId: '',
  composerRegion: '',
  executionMode: initialKernelDetails?.kernalDetails?.executionMode ?? 'local', // Default to 'local' if executionMode is not provided
  environment: '',
  retryCount: 2, // Matches Zod's default if preprocess resolves to number
  retryDelay: 5, // Matches Zod's default
  emailOnFailure: false,
  emailOnRetry: false,
  emailOnSuccess: false,
  email_recipients: [], // Default for array of emails
  runOption: 'runNow',
  cluster: initialKernelDetails?.kernalDetails?.selectedClusterName ?? '',
  serverless: initialKernelDetails.kernalDetails?.selectedServerlessName ?? '',
  timeZone: ''
});

/**
 * Determines the initial form values based on provided criteria.
 * @param criteria Your criteria (e.g., 'vertex', 'composer', or more complex data)
 * @returns CombinedCreateFormValues that match one of the discriminated union branches.
 */
export const getInitialFormValues = (
  initialKernelDetails: INotebookKernalSchdulerDefaults,
  sessionContext: ISessionContext | null | undefined
): CombinedCreateFormValues => {
  console.log('Initial Kernel Details:', initialKernelDetails);
  if (initialKernelDetails.schedulerType === 'composer') {
    return getDefaultComposerValues(
      initialKernelDetails,
      sessionContext?.path || ''
    );
  }
  // Default to Vertex if no criteria or criteria is 'vertex'
  return getDefaultVertexValues(
    initialKernelDetails,
    sessionContext?.path || ''
  );
};

/**
 *
 * @param existingData Existing data to edit, which should match the CombinedCreateFormValues type.
 * This function merges existing data with default values for the form.
 * @returns
 */
export const getEditFormValues = (
  existingData: any,
  sessionContext: ISessionContext
): CombinedCreateFormValues => {
  // Create a dummy INotebookKernalSchdulerDefaults to satisfy the getDefault*Values function signatures.
  // This ensures the required 'kernalDetails' structure is present, even if empty.
  const dummyInitialKernelDetails: INotebookKernalSchdulerDefaults = {
    schedulerType: existingData.schedulerSelection || 'vertex',
    kernalDetails: {
      kernelDisplayName: existingData.kernelName || DEFAULT_KERNEL,
      executionMode: existingData.executionMode || 'local',
      selectedClusterName: existingData.cluster || '',
      selectedServerlessName: existingData.serverless || '',
      isDataprocKernel: false
    }
  };

  if (existingData.schedulerSelection === 'vertex') {
    const vertexDefaults = getDefaultVertexValues(
      dummyInitialKernelDetails,
      sessionContext.path
    );
    return {
      ...vertexDefaults, // Start with defaults
      ...existingData, // Overlay existing data (prioritizes existingData for most fields)
      jobId: existingData.jobId,
      jobName: existingData.jobName,
      inputFile: existingData.gcsSourceFilePath,
      // For optional fields that might be empty/null in existingData, ensure defaults are applied if not present
      scheduleField: existingData.scheduleField,
      scheduleValue: existingData.scheduleValue,
      maxRunCount: existingData.maxRunCount,
      startTime: existingData.startTime,
      endTime: existingData.endTime,
      timeZone: existingData.timeZone,
      acceleratorType: existingData.acceleratorType,
      acceleratorCount: existingData.acceleratorCount,
      parameters: existingData.parameters,
      networkOption: existingData.networkOption,
      primaryNetwork: existingData.primaryNetwork,
      subNetwork: existingData.subnetwork,
      sharedNetwork: existingData.sharedNetwork
    };
  } else if (existingData.schedulerSelection === 'composer') {
    const composerDefaults = getDefaultComposerValues(
      dummyInitialKernelDetails,
      sessionContext.path
    );
    return {
      ...composerDefaults,
      ...existingData,
      inputFile: sessionContext.path,
      // Composer-specific merging for optional fields
      email_recipients:
        existingData.email_recipients ?? composerDefaults.email_recipients,
      scheduleValue:
        existingData.scheduleValue ?? composerDefaults.scheduleValue,
      timeZone: existingData.timeZone ?? composerDefaults.timeZone
    };
  }
  // Fallback if schedulerSelection is not recognized, default to Vertex
  return getDefaultVertexValues(dummyInitialKernelDetails, sessionContext.path);
};
