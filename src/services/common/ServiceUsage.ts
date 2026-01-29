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
import { LOG_LEVEL, SchedulerLoggingService } from './LoggingService';

export class ServiceUsageServices {
  static async checkApiEnabledService(
    projectId: string,
    serviceName: string
  ): Promise<boolean> {
    try {
      const checkApiEnabledResponse = await requestAPI(
        `api/serviceUsage/checkApiEnabled?project_id=${projectId}&api_service_name=${serviceName}`
      );
      if (checkApiEnabledResponse === true) {
        return true;
      }
      return false;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      SchedulerLoggingService.log(
        `Error checking API enabled service : ${error}`,
        LOG_LEVEL.ERROR
      );
      handleErrorToast({
        error: `Failed to check API enabled service : ${error}`
      });
      return false;
    }
  }
}
