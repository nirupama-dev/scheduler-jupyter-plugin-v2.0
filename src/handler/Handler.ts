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

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

let refreshPromise: Promise<any> | null = null;

const isTokenExpired = (data: any, response: Response): boolean => {
  if (response.status === 401) return true;

  const errorStr = typeof data === 'string' ? data : JSON.stringify(data);
  return (
    errorStr.includes('ACCESS_TOKEN_EXPIRED') ||
    errorStr.includes('UNAUTHENTICATED') ||
    errorStr.includes('Invalid authentication credentials')
  );
};

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {},
  attemptRetry = true
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'scheduler-plugin',
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as Error);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  console.log('Response data: ', data);
  console.log(
    'isTokenExpired(data, response): ',
    isTokenExpired(data, response)
  );
  console.log('attemptRetry: ', attemptRetry);
  console.log('endPoint: ', endPoint);
  if (
    isTokenExpired(data, response) &&
    attemptRetry &&
    endPoint !== 'credentials'
  ) {
    // Check if a refresh is already in progress
    if (!refreshPromise) {
      console.log('Scheduler Plugin: Token expired. Refreshing...');
      refreshPromise = requestAPI('credentials', {}, false)
        .then(() => {
          // If credentials succeeds, we just return true to signal "go ahead"
          return true;
        })
        .finally(() => {
          // ALWAYS release the lock when done
          refreshPromise = null;
        });
    }

    try {
      // ALL failing requests wait here for the ONE credentials call to finish
      await refreshPromise;

      // Once resolved, everyone retries their own original request
      return await requestAPI<T>(endPoint, init, false);
    } catch (refreshError) {
      console.error('Scheduler Plugin: Token refresh failed.', refreshError);
      // If refresh fails, fall through to throw the original error
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message);
  }

  return data;
}
