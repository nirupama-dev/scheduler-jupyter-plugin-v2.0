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
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
import { AuthenticationError } from '../../exceptions/AuthenticationException';
import { requestAPI } from '../../handler/Handler';
import { ILabelValue } from '../../interfaces/CommonInterface';
import { LOG_LEVEL, SchedulerLoggingService } from './LoggingService';

export class IamServices {
  static async serviceAccountAPIService(): Promise<ILabelValue<string>[]> {
    try {
      const serviceAccountsResponse = await requestAPI(
        'api/iam/listServiceAccount'
      );
      if (
        Array.isArray(serviceAccountsResponse) &&
        serviceAccountsResponse.length > 0
      ) {
        const serviceAccountList: ILabelValue<string>[] =
          serviceAccountsResponse.map((account: any) => ({
            label: account.displayName,
            value: account.email
          }));
        serviceAccountList.sort((a, b) => a.label.localeCompare(b.label));
        return serviceAccountList;
      }
      return [];
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      SchedulerLoggingService.log(
        `Error listing service accounts : ${error}`,
        LOG_LEVEL.ERROR
      );
      handleErrorToast({
        error: `Failed to fetch service accounts list : ${error}`
      });
      return [];
    }
  }
}
