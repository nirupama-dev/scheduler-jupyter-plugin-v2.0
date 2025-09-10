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

import { requestAPI } from '../../../handler/Handler';
import { IAuthCredentials } from '../../../interfaces/CommonInterface';
import { AuthenticationService } from '../../../services/common/AuthenticationService';
import { STATUS_SUCCESS } from '../../../utils/Constants';

/**
 * Authentication function
 * @param checkApiEnabled
 * @returns credentials
 */
export const authApi = async (
  checkApiEnabled: boolean = true
): Promise<IAuthCredentials | undefined> => {
  const authService = await AuthenticationService.authCredentialsAPI();
  return authService;
};

export const login = async () => {
  const data = await requestAPI('login', {
    method: 'POST'
  });
  if (typeof data === 'object' && data !== null) {
    const loginStatus = (data as { login: string }).login;
    if (loginStatus === STATUS_SUCCESS) {
      return false;
    } else {
      return true;
    }
  }
};
