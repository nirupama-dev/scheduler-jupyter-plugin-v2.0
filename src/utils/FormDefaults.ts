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
  DEFAULT_CLOUD_STORAGE_BUCKET,
  DEFAULT_MACHINE_TYPE,
  DEFAULT_KERNEL,
  DEFAULT_SERVICE_ACCOUNT,
  DEFAULT_TIME_ZONE,
  DISK_TYPE_VALUE,
  KERNEL_VALUE,
  VERTEX_SCHEDULER_NAME,
  COMPOSER_SCHEDULER_NAME
} from './Constants';
import { INotebookKernalSchdulerDefaults, IInitialScheduleFormData } from '../interfaces/CommonInterface';
import { ISessionContext } from '@jupyterlab/apputils';

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
  initialSchedulerStateData: IInitialScheduleFormData,
  sessionContext: ISessionContext
): VertexSchedulerFormValues => {
  const inputFilePath = sessionContext?.path;
  const selectedKernelName = sessionContext?.kernelPreference?.name;
  const isKernelValid = KERNEL_VALUE.some(
        kernel => kernel.value === selectedKernelName
      );
  console.log('Kernal Details:', initialSchedulerStateData, sessionContext);
  return {
  schedulerSelection: VERTEX_SCHEDULER_NAME,
  jobName: generateDefaultJobName(),
  inputFile: inputFilePath, // input file is fetched from the Session context path
  machineType: DEFAULT_MACHINE_TYPE.value, // Assumes DEFAULT_MACHINE_TYPE will be found by useEffect
  kernelName: isKernelValid ? selectedKernelName! : DEFAULT_KERNEL, // Assumes DEFAULT_KERNEL will be found by useEffect
  acceleratorType: '', // Null initially, set by user if machineType supports
  acceleratorCount: '', // Null initially, set by user if acceleratorType chosen
  vertexRegion: initialSchedulerStateData?.credentials?.region_id ?? '', //set from credentials.
  cloudStorageBucket: DEFAULT_CLOUD_STORAGE_BUCKET.value, // Assumes DEFAULT_CLOUD_STORAGE_BUCKET will be found by useEffect
  serviceAccount: DEFAULT_SERVICE_ACCOUNT, // Assumes DEFAULT_SERVICE_ACCOUNT will be found by useEffect
  networkOption: DEFAULT_NETWORK_SELECTED,
  primaryNetwork: '', // Will be dynamically set by primaryNetworkSelected if 'networkInThisProject'
  subNetwork: '', // Will be dynamically set by subNetworkList[0] if 'networkInThisProject'
  diskType: DISK_TYPE_VALUE[0].value, // First value from DISK_TYPE_VALUE array
  diskSize: DEFAULT_DISK_SIZE,
  scheduleMode: 'runNow',
  internalScheduleMode: undefined,
  scheduleFieldCronFormat: '', 
  scheduleValueUserFriendly: '', 
  startTime: undefined,
  endTime: undefined,
  maxRunCount: undefined,
  timeZone: DEFAULT_TIME_ZONE, // Browser's local time zone
  parameters: []
};
}

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
  schedulerSelection: COMPOSER_SCHEDULER_NAME,
  jobName: generateDefaultJobName(),
  inputFile: inputFilePath, // input file is fetched from the Session context path
  projectId: '',
  composerRegion: '',
  executionMode: initialKernelDetails?.kernelDetails?.executionMode ?? 'local', // Default to 'local' if executionMode is not provided
  environment: '',
  retryCount: 2, // Matches Zod's default if preprocess resolves to number
  retryDelay: 5, // Matches Zod's default
  emailOnFailure: false,
  emailOnRetry: false,
  emailOnSuccess: false,
  emailRecipients: [], // Default for array of emails
  runOption: 'runNow',
  cluster: initialKernelDetails?.kernelDetails?.selectedClusterName ?? '',
  serverless: initialKernelDetails.kernelDetails?.selectedServerlessName ?? '',
  timeZone: ''
});

/**
 * Determines the initial form values based on provided criteria.
 * @param criteria Your criteria (e.g., 'vertex', 'composer', or more complex data)
 * @returns CombinedCreateFormValues that match one of the discriminated union branches.
 */
export const getInitialFormValues = (
  formState: IInitialScheduleFormData,
  sessionContext: ISessionContext | null | undefined
): CombinedCreateFormValues => {
  if (!sessionContext?.path) {
    throw new Error('Notebook path not found in this session');
  }
  if (formState.initialDefaults?.schedulerType === 'composer') {
    return getDefaultComposerValues(formState.initialDefaults, sessionContext?.path);
  }
  // Default to Vertex if no criteria or criteria is 'vertex' and load default vertex values.
  return getDefaultVertexValues(formState, sessionContext);
};

/**
 *
 * @param existingScheduleData Existing data to edit, which should match the CombinedCreateFormValues type.
 * This function merges existing data with default values for the form.
 * @returns
 */
// export const getEditFormValues = (
//   schedulerType: SchedulerType,
//   existingScheduleData: VertexSchedulerFormValues| ComposerSchedulerFormValues
// ): CombinedCreateFormValues => {

//   if (schedulerType === 'vertex' ) {
//   const vertexData = existingScheduleData as VertexSchedulerFormValues;
//   return {
//   schedulerSelection: schedulerType,
//   jobName: vertexData.display_name,
//   inputFile: vertexData.input_filename,
//   machineType: vertexData.machine_type,
//   kernelName: vertexData.kernel_name,
//   acceleratorType: vertexData.accelerator_type,
//   acceleratorCount: vertexData.accelerator_count,
//   vertexRegion: vertexData.region,
//   cloudStorageBucket: vertexData.cloud_storage_bucket,
//   serviceAccount: vertexData.service_account,
//   networkOption: '',
//   primaryNetwork: vertexData.primary_network || '', // Will be dynamically set by primaryNetworkSelected if 'networkInThisProject'
//   subNetwork: vertexData.sub_network || '', // Will be dynamically set by subNetworkList[0] if 'networkInThisProject'
//   diskType: vertexData.disk_type || '',
//   diskSize: vertexData.disk_size || '',
//   scheduleMode:  vertexData.schedule_mode || 'runNow',
//   internalScheduleMode: 'cronFormat',
//   scheduleFieldCronFormat: vertexData.cron,
//   scheduleValueUserFriendly: vertexData.cron, // TO Do need to be converted
//   startTime: vertexData.start_time,
//   endTime: vertexData.end_time,
//   maxRunCount: vertexData.max_run_count || '',
//   timeZone: vertexData.time_zone || DEFAULT_TIME_ZONE,
//   parameters: vertexData.parameters?.map(param => ({
//     key: param.key,
//     value: param.value
//   })) || [],
//   };
//   } else if (existingScheduleData.schedulerSelection === 'composer') {
//     const composerData = existingScheduleData as IComposerSchedulePayload;
//     return {
//       schedulerSelection: 'composer',
//       jobName: composerData.job_name,
//       inputFile: composerData.input_filename,
//       projectId: composerData.project_id,
//       composerRegion: composerData.region,
//       environment: composerData.composer_environment_name,
//       executionMode: composerData.execution_mode || 'local',
//       retryCount: composerData.retry_count || 0,
//       scheduleMode: composerData.schedule_mode || 'runNow',
//       internalScheduleMode: 'cronFormat',
//       scheduleFieldCronFormat: composerData.cron,
//       scheduleValueUserFriendly: composerData.cron, // TO Do need to be converted
//       startTime: composerData.start_time,
//       endTime: composerData.end_time,
//       maxRunCount: composerData.max_run_count || '',
//       timeZone: composerData.time_zone || DEFAULT_TIME_ZONE,
//       parameters: composerData.parameters?.map(param => ({
//         key: param.key,
//         value: param.value
//       })) || [],
//     };
//   }
//   // Fallback if schedulerSelection is not recognized, default to Vertex
//   return getDefaultVertexValues(dummyInitialKernelDetails, sessionContext.path);
// };
