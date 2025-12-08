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

/**
 * Helper method for fetch with logging.
 */
import { SchedulerLoggingService } from '../../../services/common/LoggingService';

/**
 * Helper method that wraps fetch and logs the request uri and status codes to
 * jupyter server.
 */
export async function loggedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const resp = await fetch(input, init);
  // Intentionally not waiting for log response.
  SchedulerLoggingService.logFetch(input, init, resp);
  return resp;
}
