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
import { Notification } from '@jupyterlab/apputils';
import { requestAPI } from '../../handler/Handler';
import { SchedulerLoggingService, LOG_LEVEL } from './LoggingService';
import path from 'path';
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
// import { ILoadingStateVertex } from '../../interfaces/VertexInterface';
import { ILabelValue } from '../../interfaces/CommonInterface';

export class StorageServices {
  // static readonly cloudStorageAPIService = (
  //   setCloudStorageList: (value: ILabelValue<string>[]) => void
  //   // setCloudStorageLoading: (value: boolean) => void,
  //   // setErrorMessageBucket: (value: string) => void
  // ) => {
  //   // setCloudStorageLoading(true);
  //   requestAPI('api/storage/listBucket')
  //     .then((formattedResponse: any) => {
  //       if (formattedResponse.length > 0) {
  //         const cloudStorageBucketList: ILabelValue<string>[] =
  //           formattedResponse.map((bucket: string) => {
  //             return {
  //               label: bucket,
  //               value: bucket
  //             };
  //           });
  //         setCloudStorageList(cloudStorageBucketList);
  //       } else if (formattedResponse.error) {
  //         // setErrorMessageBucket(formattedResponse.error);
  //         setCloudStorageList([]);
  //       } else {
  //         setCloudStorageList([]);
  //       }
  //       // setCloudStorageLoading(false);
  //     })
  //     .catch(error => {
  //       setCloudStorageList([]);
  //       // setCloudStorageLoading(false);
  //       SchedulerLoggingService.log(
  //         `Error listing cloud storage bucket : ${error}`,
  //         LOG_LEVEL.ERROR
  //       );
  //       const errorResponse = `Failed to fetch cloud storage bucket : ${error}`;
  //       handleErrorToast({
  //         error: errorResponse
  //       });
  //     });
  // };
  // static readonly newCloudStorageAPIService = (
  //   bucketName: string,
  //   setLoadingState: React.Dispatch<React.SetStateAction<ILoadingStateVertex>>,
  //   // setBucketError: (value: string) => void
  // ) => {
  //   const payload = {
  //     bucket_name: bucketName
  //   };
  //   // setIsCreatingNewBucket(true);
  //   setLoadingState((prev: ILoadingStateVertex) => ({ ...prev, machineType: true }));
  //   requestAPI('api/storage/createNewBucket', {
  //     body: JSON.stringify(payload),
  //     method: 'POST'
  //   })
  //     .then((formattedResponse: any) => {
  //       if (formattedResponse === null) {
  //         Notification.success('Bucket created successfully', {
  //           autoClose: false
  //         });
  //         // setBucketError('');
  //       } else if (formattedResponse?.error) {
  //         // setBucketError(formattedResponse.error);
  //       }
  //       // setIsCreatingNewBucket(false);
  //       setLoadingState((prev: ILoadingStateVertex) => ({ ...prev, machineType: false }));
  //     })
  //     .catch(error => {
  //       // setIsCreatingNewBucket(false);
  //       setLoadingState((prev: ILoadingStateVertex) => ({ ...prev, machineType: false }));
  //       SchedulerLoggingService.log(
  //         `Error creating the cloud storage bucket ${error}`,
  //         LOG_LEVEL.ERROR
  //       );
  //     });
  // };

  /**
   * Fetches a list of cloud storage buckets.
   * Handles error logging and toast notifications internally.
   *
   * @returns A Promise that resolves with an array of `ILabelValue<string>` for buckets
   * on success, or an empty array on error/no data.
   */
  static async cloudStorageAPIService(): Promise<ILabelValue<string>[]> {
    try {
      const formattedResponse: any = await requestAPI('api/storage/listBucket');

      if (Array.isArray(formattedResponse) && formattedResponse.length > 0) {
        const cloudStorageBucketList: ILabelValue<string>[] =
          formattedResponse.map((bucket: string) => ({
            label: bucket,
            value: bucket // Using bucket name as value as per previous structure
          }));
        return cloudStorageBucketList;
      } else if (formattedResponse?.error) {
        // Original error handling for specific API error structure
        throw new Error(formattedResponse.error); // Throw to be caught in service's catch block
      }
      return []; // Return empty array if no data or unexpected format
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error listing cloud storage bucket: ${error}`,
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch cloud storage bucket: ${error}`;
      handleErrorToast({ error: errorResponse }); // Keep original toast behavior
      return []; // Return empty array on caught exception
    }
  }

  /**
   * Creates a new cloud storage bucket.
   * Handles success/error notifications and logging internally.
   *
   * @param bucketName The name of the bucket to create.
   * @returns A Promise that resolves with `void` on successful creation.
   * It does not return data, but manages notifications.
   */
  static async newCloudStorageAPIService(bucketName: string): Promise<void> {
    const payload = { bucket_name: bucketName };
    try {
      const formattedResponse: any = await requestAPI(
        'api/storage/createNewBucket',
        {
          body: JSON.stringify(payload),
          method: 'POST'
        }
      );
      console.log('Create bucket response:', formattedResponse);
      if (formattedResponse === null) {
        // Assuming null indicates success from backend
        Notification.success('Bucket created successfully', {
          autoClose: false
        });
      } else if (formattedResponse?.error) {
        throw new Error(formattedResponse.error); // Propagate API error message
      }
    } catch (error: any) {
      SchedulerLoggingService.log(
        `Error creating the cloud storage bucket ${error}`,
        LOG_LEVEL.ERROR
      );
      // Original code did not have a handleErrorToast here for new bucket creation errors
      // If you want one, add it like: handleErrorToast({ error: `Failed to create bucket: ${error}` });
      throw error; // Re-throw so the calling component can still know if it failed (e.g., for loading states)
    }
  }

  static readonly downloadJobAPIService = async (
    gcsUrl: string | undefined,
    fileName: string | undefined,
    jobRunId: string | undefined,
    setJobDownloadLoading: (value: boolean) => void,
    scheduleName: string
  ) => {
    try {
      const bucketName = gcsUrl?.split('//')[1];
      setJobDownloadLoading(true);
      const formattedResponse: any = await requestAPI(
        `api/storage/downloadOutput?bucket_name=${bucketName}&job_run_id=${jobRunId}&file_name=${fileName}`,
        {
          method: 'POST'
        }
      );
      if (formattedResponse.status === 0) {
        const base_filename = path.basename(
          formattedResponse.downloaded_filename
        );
        Notification.success(
          `${base_filename} has been successfully downloaded from the ${scheduleName} job history`,
          {
            autoClose: false
          }
        );
      } else {
        SchedulerLoggingService.log(
          'Error in downloading the job history',
          LOG_LEVEL.ERROR
        );
        Notification.error('Error in downloading the job history', {
          autoClose: false
        });
      }
      setJobDownloadLoading(false);
    } catch (error) {
      setJobDownloadLoading(false);
      SchedulerLoggingService.log(
        'Error in downloading the job history',
        LOG_LEVEL.ERROR
      );
      Notification.error('Error in downloading the job history', {
        autoClose: false
      });
    }
  };
}
