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
 * Data Type Transformation Util for Vertex Notebook Job Schedule functionality.
 */
import { aiplatform_v1 } from 'googleapis';
import { VertexSchedulerFormValues } from '../schemas/CreateVertexSchema';
import { CRON_FOR_SCHEDULE_EVERY_MIN, DEFAULT_TIME_ZONE } from './Constants';
import { NetworkOption, ScheduleMode } from '../types/CommonSchedulerTypes';

/**
 * Transforms UI Form Fields in Zod schema format to Vertex Schedule payload for backen API functionality.
 * @param VertexScheduleData
 * @param projectId
 * @param region
 * @returns
 */
export const transformZodSchemaToVertexSchedulePayload = (
  VertexScheduleData: VertexSchedulerFormValues,
  projectId: string
) => {
  console.log(
    'Vertex Schedule Data from UI:',
    JSON.stringify(VertexScheduleData, null, 2)
  );

  let combinedCronSchedule =
    VertexScheduleData.scheduleFieldCronFormat || CRON_FOR_SCHEDULE_EVERY_MIN;
  const isUtc = VertexScheduleData.timeZone === 'UTC';
  if (!isUtc && VertexScheduleData.timeZone) {
    combinedCronSchedule = `TZ=${VertexScheduleData.timeZone} ${combinedCronSchedule}`;
  }

  const getGcsUri = (path: string, bucketName?: string): string => {
    if (path.startsWith('gs://')) {
      return path;
    }
    if (path.startsWith('gs:')) {
      return path.replace('gs:', 'gs://');
    }
    if (bucketName) {
      return `gs://${bucketName}/${path}`;
    }
    return 'gs://' + path;
  };

  const outputBucketUri = getGcsUri(VertexScheduleData.cloudStorageBucket);

  const bucketName = outputBucketUri
    ? outputBucketUri.split('//')[1].split('/')[0]
    : undefined;

  const notebookSourceUri = getGcsUri(VertexScheduleData.inputFile, bucketName);

  const vertexPayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule = {
    displayName: VertexScheduleData.jobName,
    cron: combinedCronSchedule,
    maxConcurrentRunCount: '1',
    ...(VertexScheduleData.maxRunCount
      ? { maxRunCount: VertexScheduleData.maxRunCount }
      : { maxRunCount: '1' }),
    ...(VertexScheduleData.startTime
      ? { startTime: VertexScheduleData.startTime }
      : {}),
    ...(VertexScheduleData.endTime
      ? { endTime: VertexScheduleData.endTime }
      : {}),
    createNotebookExecutionJobRequest: {
      parent: `projects/${projectId}/locations/${VertexScheduleData.vertexRegion}`,
      notebookExecutionJob: {
        displayName: VertexScheduleData.jobName,
        labels: {
          'aiplatform.googleapis.com/colab_enterprise_entry_service':
            'workbench'
        },
        customEnvironmentSpec: {
          machineSpec: {
            machineType: VertexScheduleData.machineType,
            ...(VertexScheduleData.acceleratorType !== ''
              ? {
                  acceleratorType: VertexScheduleData.acceleratorType
                }
              : {}),
            ...(VertexScheduleData.acceleratorType !== ''
              ? {
                  acceleratorCount: Number(VertexScheduleData.acceleratorCount)
                }
              : {})
          },
          persistentDiskSpec: {
            diskType: VertexScheduleData.diskType.split(' ')[0], // extract valid key from the expanded full key value
            diskSizeGb: VertexScheduleData.diskSize
          },
          networkSpec: {
            enableInternetAccess: true,
            network: VertexScheduleData.primaryNetwork ?? undefined,
            subnetwork: VertexScheduleData.subNetwork ?? undefined
          }
        },
        gcsNotebookSource: { uri: notebookSourceUri },
        gcsOutputUri: outputBucketUri,
        serviceAccount: VertexScheduleData.serviceAccount,
        kernelName: VertexScheduleData.kernelName,
        workbenchRuntime: {}
      }
    }
  };
  console.log(
    'Vertex Schedule Payload:',
    JSON.stringify(vertexPayload, null, 2)
  );
  return vertexPayload;
};

/**
 * Transforms Vertex Schedule response from backend to Zod schema format for Create/ Update UI Form .
 * @param vertexScheduleData
 * @param scheduleRegion
 * @param projectIdFromCredentials
 * @returns
 */
export const transformVertexScheduleResponseToZodSchema = (
  vertexScheduleData: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule,
  scheduleRegion: string,
  projectIdFromCredentials?: string
): VertexSchedulerFormValues => {
  console.log(
    'Data from backend: ',
    JSON.stringify(vertexScheduleData, null, 2)
  );
  const inputFileName =
    vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob?.gcsNotebookSource?.uri
      ?.split('/')
      .pop()!;
  const jobId = vertexScheduleData.name?.split('/').pop();
  const primaryNetwork =
    vertexScheduleData?.createNotebookExecutionJobRequest?.notebookExecutionJob?.customEnvironmentSpec?.networkSpec?.network
      ?.split('/')
      .pop()!;
  const subnetwork =
    vertexScheduleData?.createNotebookExecutionJobRequest?.notebookExecutionJob?.customEnvironmentSpec?.networkSpec?.subnetwork
      ?.split('/')
      .pop()!;
  const primaryNetworkLink =
    vertexScheduleData?.createNotebookExecutionJobRequest?.notebookExecutionJob
      ?.customEnvironmentSpec?.networkSpec?.network;

  // eslint-disable-next-line no-useless-escape
  const projectInNetwork = primaryNetworkLink?.match(/projects\/([^\/]+)/);
  let networkOption: NetworkOption = 'networkInThisProject';
  if (projectInNetwork?.[1]) {
    if (projectInNetwork[1] !== projectIdFromCredentials) {
      networkOption = 'networkSharedFromHostProject';
    }
  }
  let timeZone = DEFAULT_TIME_ZONE;
  let cron = vertexScheduleData.cron || '';

  if (cron.includes('TZ=')) {
    const match = cron.match(/TZ=([^ ]+)\s+(.*)/);
    if (match) {
      [, timeZone, cron] = match;
    }
  }
  const scheduleMode: ScheduleMode =
    vertexScheduleData.cron === '* * * * *' &&
    vertexScheduleData.maxRunCount === '1'
      ? 'runNow'
      : 'runSchedule';
  const acceleratorCount =
    vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
      ?.customEnvironmentSpec?.machineSpec?.acceleratorCount ?? '';
  const acceleratorType =
    vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
      ?.customEnvironmentSpec?.machineSpec?.acceleratorType ?? '';

  const vertexScheduleDataForForm: VertexSchedulerFormValues = {
    schedulerSelection: 'vertex',
    jobId: jobId,
    inputFile: inputFileName,
    jobName: vertexScheduleData.displayName!,
    vertexRegion:
      vertexScheduleData.name?.match(/locations\/([^\/]+)/)?.[1] ??
      scheduleRegion,
    cloudStorageBucket:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob?.gcsOutputUri!?.replace(
        'gs://',
        ''
      ),
    machineType:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
        ?.customEnvironmentSpec?.machineSpec?.machineType!,
    acceleratorCount: acceleratorCount.toString(),
    acceleratorType: acceleratorType,
    kernelName:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
        ?.kernelName!,
    diskType:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
        ?.customEnvironmentSpec?.persistentDiskSpec?.diskType!,
    diskSize:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
        ?.customEnvironmentSpec?.persistentDiskSpec?.diskSizeGb!,

    serviceAccount:
      vertexScheduleData.createNotebookExecutionJobRequest?.notebookExecutionJob
        ?.serviceAccount!,
    networkOption: networkOption,
    primaryNetwork: primaryNetwork ?? '',
    subNetwork: subnetwork ?? '',
    scheduleFieldCronFormat: scheduleMode !== 'runNow' ? cron : '',
    internalScheduleMode: scheduleMode !== 'runNow' ? 'cronFormat' : undefined,
    timeZone: timeZone,
    maxRunCount: scheduleMode !== 'runNow' ? vertexScheduleData.maxRunCount! : undefined,
    startTime: scheduleMode !== 'runNow' ? vertexScheduleData.startTime ?? undefined : undefined,
    endTime: scheduleMode !== 'runNow' ? vertexScheduleData.endTime?? undefined : undefined,
    scheduleMode: scheduleMode
  };

  console.log(
    'Transformed Vertex Schedule Data for UI: Input: ',
    JSON.stringify(vertexScheduleData),
    'output: ',
    JSON.stringify(vertexScheduleDataForForm, null, 2)
  );
  return vertexScheduleDataForForm;
};
