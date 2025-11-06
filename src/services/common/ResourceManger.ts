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
import { IProjectAPIResponse } from '../../interfaces/CommonInterface';
import { IDropdownOption } from '../../interfaces/FormInterface';

export class ResourceManagerServices {
  static readonly projectAPIService = async (): Promise<IDropdownOption[]> => {
    try {
      const projectResponse: IProjectAPIResponse[] =
        await requestAPI(`projectsList`);

      if (!Array.isArray(projectResponse)) {
        throw new Error('Invalid response format for project list');
      }

      const projectOptions: IDropdownOption[] = projectResponse.map(
        (project: IProjectAPIResponse) => ({
          value: project.project_id,
          label: project.project_id
        })
      );
      projectOptions.sort((a, b) => a.label.localeCompare(b.label));

      return projectOptions;
    } catch (error) {
      const errorResponse = `Failed to fetch project list : ${error}`;

      if (error instanceof AuthenticationError) {
        throw error;
      }

      handleErrorToast({
        error: errorResponse
      });
      throw error;
    }
  };
}
