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

import { requestAPI } from '../handler/Handler';
import { ISaveConfig } from '../login/LoginInterfaces';
import { toastifyCustomStyle } from '../utils/CustomStyle';
import { eventEmitter } from '../utils/SignalEmitter';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IGcpUrlResponseData } from '../utils/SchedulerJupyterInterfaces';

export class ConfigService {
  static saveConfig = async (
    dataToSend: ISaveConfig,
    setIsSaving: (value: boolean) => void
  ) => {
    console.log('datasend from services', dataToSend);
    try {
      const data = await requestAPI('configuration', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      if (typeof data === 'object' && data !== null) {
        const configStatus = (data as { config: string }).config;
        if (configStatus && !toast.isActive('custom-toast')) {
          if (configStatus.includes('Failed')) {
            toast.error(configStatus, toastifyCustomStyle);
          } else {
            toast.success(
              `${configStatus} - You will need to restart Jupyter in order for the new project and region to fully take effect.`,
              toastifyCustomStyle
            );
            // Emit signal after toast success
            eventEmitter.emit(
              'schedulerConfigChange',
              `${configStatus} - Configuration updated successfully.`
            );
          }
        }
      }
    } catch (reason) {
      toast.error(
        `Error on POST {dataToSend}.\n${reason}`,
        toastifyCustomStyle
      );
    } finally {
      setIsSaving(false);
    }
  };

  static gcpServiceUrlsAPI = async () => {
    const data = (await requestAPI('getGcpServiceUrls')) as IGcpUrlResponseData;
    const storage_url = new URL(data.storage_url);
    const storage_upload_url = new URL(data.storage_url);

    if (
      !storage_url.pathname ||
      storage_url.pathname === '' ||
      storage_url.pathname === '/'
    ) {
      // If the overwritten  storage_url doesn't contain a path, add it.
      storage_url.pathname = 'storage/v1/';
    }
    storage_upload_url.pathname = 'upload/storage/v1/';

    return {
      DATAPROC: data.dataproc_url + 'v1',
      COMPUTE: data.compute_url,
      METASTORE: data.metastore_url + 'v1',
      CLOUD_KMS: data.cloudkms_url + 'v1',
      CLOUD_RESOURCE_MANAGER: data.cloudresourcemanager_url + 'v1/projects',
      REGION_URL: data.compute_url + '/projects',
      CATALOG: data.datacatalog_url + 'v1/catalog:search',
      COLUMN: data.datacatalog_url + 'v1/',
      STORAGE: storage_url.toString(),
      STORAGE_UPLOAD: storage_upload_url.toString()
    };
  };
}
