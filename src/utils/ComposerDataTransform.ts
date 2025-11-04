/**
 *  * @license
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

/**
 * Data Type Transformation Util for Composer Schedule functionality.
 */
import { v4 as uuidv4 } from 'uuid';
import { ComposerSchedulerFormValues } from '../schemas/CreateComposerSchema';
import { IComposerSchedulePayload} from '../interfaces/ComposerInterface';

/**
 * Transforming UI Form field data to Create/ Update Payload for backend functionality.
 * @param composerScheduleData UI Form data of defined Zod Schema Type
 * @param packagesToInstall Optional packages that needs to be installed on create/ update schedule
 * @returns
 */
export const transformZodSchemaToComposerSchedulePayload = (
  composerScheduleData: ComposerSchedulerFormValues,
  packagesToInstall?: string[]
) => {
  console.log(
    'transform UI composer values to payload: Input: ',
    JSON.stringify(composerScheduleData)
  );
  const outputFormats = composerScheduleData.outputFormatAsNotebook
    ? ['Notebook']
    : []; // Adjust this logic if there are more formats in future

  const composerPayloadData: IComposerSchedulePayload = {
    input_filename: composerScheduleData.inputFile,
    composer_environment_name: composerScheduleData.environment,
    output_formats: outputFormats,
    parameters:
      composerScheduleData.parameters &&
      composerScheduleData.parameters.length > 0
        ? composerScheduleData.parameters
            .map(param => `${param.key}:${param.value}`)
        : [],
    local_kernel: composerScheduleData.executionMode === 'local' ? true : false,
    mode_selected: composerScheduleData.executionMode,
    retry_count: composerScheduleData.retryCount ?? '',
    retry_delay: composerScheduleData.retryDelay ?? '',
    email_failure:
      composerScheduleData.emailOnFailure === true ? 'true' : 'false',
    email_delay: composerScheduleData.emailOnRetry === true ? 'true' : 'false',
    email_success:
      composerScheduleData.emailOnSuccess === true ? 'true' : 'false',
    email: composerScheduleData.emailRecipients ?? undefined,
    name: composerScheduleData.jobName,
    schedule_value: composerScheduleData.scheduleValue ?? '',
    stop_cluster:
      composerScheduleData.stopClusterAfterExecution === true
        ? 'true'
        : 'false',
    dag_id: composerScheduleData.jobId ?? uuidv4(),
    time_zone: composerScheduleData.timeZone ?? '',
    project_id: composerScheduleData.projectId,
    region_id: composerScheduleData.composerRegion,
    serverless_name: composerScheduleData.serverless ?? undefined,
    cluster_name: composerScheduleData.cluster ?? undefined,
    packages_to_install: packagesToInstall ?? []
  };
  console.log('Composer schedule to be created: ', JSON.stringify(composerPayloadData));
  return composerPayloadData;
};

/**
 * Transforms Cloud Composer Job Schedule Data for Notebook from the Backend utility to UI Form filed that is in Zod schema format defined.
 * @param composerScheduleData composer job schedule data recieved from backend.
 * @returns
 */
export const transformComposerScheduleDataToZodSchema = (
  composerScheduleData: IComposerSchedulePayload
) => {
  console.log(
    'transform backend composer values to UI form values: Input: ',
    JSON.stringify(composerScheduleData)
  );
  const outputFormats = composerScheduleData.output_formats ?? [];

  const composerScheduleDataForForm: ComposerSchedulerFormValues = {
    jobId: composerScheduleData.dag_id,
    jobName: composerScheduleData.dag_id!,
    inputFile: composerScheduleData.input_filename!,
    schedulerSelection: 'composer',
    composerRegion: composerScheduleData.region_id!,
    projectId: composerScheduleData.project_id!,
    environment: composerScheduleData.composer_environment_name!,
    outputFormatAsNotebook:
      outputFormats.length !== 0 && outputFormats.includes('Notebook'),
    retryCount: composerScheduleData.retry_count!,
    retryDelay: composerScheduleData.retry_delay!,
    executionMode:
      composerScheduleData.mode_selected === 'local'
        ? composerScheduleData.mode_selected
        : composerScheduleData.mode_selected === 'cluster'
          ? composerScheduleData.mode_selected
          : 'serverless',
    cluster: composerScheduleData.cluster_name ?? undefined,
    serverless: composerScheduleData.serverless_name ?? undefined,
    emailOnSuccess:
      composerScheduleData.email_success?.toLowerCase() === 'true',
    emailOnFailure:
      composerScheduleData.email_failure?.toLowerCase() === 'true',
    emailOnRetry: composerScheduleData.email_delay?.toLowerCase() === 'true',
    emailRecipients: composerScheduleData.email ?? undefined,
    parameters: composerScheduleData.parameters 
      ? composerScheduleData.parameters.map(item => {
          const [key, value] = item.trim().split(':');
          return {
            key: key.trim(),
            value: value ? value.trim() : ''
          };
        })
      : [],
    runOption:
      composerScheduleData.schedule_value === '@once'
        ? 'runNow'
        : 'runOnSchedule',
    scheduleValue:
      composerScheduleData.schedule_value !== '@once'
        ? composerScheduleData.schedule_value
        : '',
    stopClusterAfterExecution:
      composerScheduleData.stop_cluster?.toLowerCase() === 'true',
    timeZone:
      composerScheduleData.time_zone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  console.log('output: ', JSON.stringify(composerScheduleDataForForm));
  return composerScheduleDataForForm;
};
