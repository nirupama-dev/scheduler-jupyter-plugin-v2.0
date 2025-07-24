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
import { INotebookKernalSchdulerDefaults } from '../interfaces/CommonInterface';

/**
 * Provides default values for the form fields based on the selected scheduler type.
 * @returns Default values for the form fields.
 * @description
 * This function returns default values for the form fields used in the notebook scheduler.
 * It provides separate defaults for Vertex and Composer schedulers.
 * The returned values are used to initialize the form when creating a new schedule or editing an existing schedule.
 */

/**
 *
 * @returns Default values for the Vertex scheduler form fields.
 * @description
 * This function returns default values for the form fields used in the Vertex scheduler.
 * It provides a set of initial values that can be used when creating a new Vertex schedule.
 */
const getDefaultVertexValues = (): VertexSchedulerFormValues => ({
  schedulerSelection: 'vertex',
  jobName: '',
  inputFile: '',
  machineType: '',
  kernelName: '',
  region: '',
  cloudStorageBucket: '',
  serviceAccount: '',
  network: '',
  subnetwork: '',
  diskType: '',
  diskSize: '50', // Example string default
  acceleratorType: '',
  acceleratorCount: '',
  scheduleMode: 'runNow',
  internalScheduleMode: undefined,
  scheduleField: '',
  scheduleValue: '',
  startTime: '',
  endTime: '',
  maxRunCount: '',
  timeZone: '',
  networkOption: undefined,
  primaryNetworkSelected: '',
  subNetworkSelected: '',
  sharedNetworkSelected: '',
  parameters: []
});

/**
 *
 * @returns Default values for the Composer scheduler form fields.
 * @description
 * This function returns default values for the form fields used in the Composer scheduler.
 * It provides a set of initial values that can be used when creating a new Composer schedule.
 */
const getDefaultComposerValues = (initialKernelDetails: INotebookKernalSchdulerDefaults): ComposerSchedulerFormValues => ({
  schedulerSelection: 'composer',
  jobName: '',
  inputFile: '',
  projectId: '',
  region: '',
  executionMode: initialKernelDetails.kernalDetails.executionMode ?? 'local', // Default to 'local' if executionMode is not provided
  environment: '',
  retryCount: 2, // Matches Zod's default if preprocess resolves to number
  retryDelay: 5, // Matches Zod's default
  emailOnFailure: false,
  emailOnRetry: false,
  emailOnSuccess: false,
  email_recipients: [], // Default for array of emails
  runOption: 'runNow',
  cluster: initialKernelDetails.kernalDetails.selectedClusterName ?? '',
  serverless: initialKernelDetails.kernalDetails.selectedServerlessName ?? '',
  timeZone: ''
});

/**
 * Determines the initial form values based on provided criteria.
 * @param criteria Your criteria (e.g., 'vertex', 'composer', or more complex data)
 * @returns CombinedCreateFormValues that match one of the discriminated union branches.
 */
export const getInitialFormValues = (
 initialKernelDetails: INotebookKernalSchdulerDefaults
): CombinedCreateFormValues => {
  if (initialKernelDetails.schedulerType === 'composer') {
    return getDefaultComposerValues(initialKernelDetails);
  }
  // Default to Vertex if no criteria or criteria is 'vertex'
  return getDefaultVertexValues();
};

/**
 *
 * @param existingData Existing data to edit, which should match the CombinedCreateFormValues type.
 * This function merges existing data with default values for the form.
 * @returns
 */
export const getEditFormValues = (
  existingData: any
): CombinedCreateFormValues => {
  if (existingData.schedulerSelection === 'vertex') {
    return {
      ...getDefaultVertexValues(), // Start with defaults
      ...existingData // Overlay existing data
    };
  } else if (existingData.schedulerSelection === 'composer') {
    return {
      ...getDefaultComposerValues(existingData.executionMode),
      ...existingData
    };
  }
  return getDefaultVertexValues(); // Fallback
};
