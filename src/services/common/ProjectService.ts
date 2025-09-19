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

import { authApi } from '../../components/common/login/Config';
import { loggedFetch } from '../../components/common/logs/Config';
import { IProject } from '../../interfaces/CommonInterface';
import {
  API_HEADER_BEARER,
  API_HEADER_CONTENT_TYPE,
  gcpServiceUrls
} from '../../utils/Constants';

export const projectListAPI = async (prefix: string): Promise<string[]> => {
  const credentials = await authApi();
  // let CLOUD_RESOURCE_MANAGER: any; // Initialize the variable
  const resolvedUrls = await gcpServiceUrls;

  // 2. Add a safety check for the undefined case
  if (!resolvedUrls) {
    console.error('GCP service URLs could not be loaded.');
    return []; // Exit early if URLs are not available
  }

  // 3. Now, access the property from the resolved object
  const { CLOUD_RESOURCE_MANAGER } = resolvedUrls;
  if (!credentials) {
    return [];
  }
  const requestUrl = new URL(CLOUD_RESOURCE_MANAGER);
  if (prefix.length > 0) {
    requestUrl.searchParams.append('filter', `name:${prefix}*`);
  }
  requestUrl.searchParams.append('pageSize', '200');
  const resp = await loggedFetch(requestUrl.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': API_HEADER_CONTENT_TYPE,
      Authorization: API_HEADER_BEARER + credentials.access_token
    }
  });
  const { projects } = (await resp.json()) as {
    projects: IProject[] | undefined;
  };
  return (projects ?? []).map(project => project.projectId);
};
