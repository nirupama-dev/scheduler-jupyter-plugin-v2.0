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

export const handleDebounce = (func: any, delay: number) => {
  let timeoutId: any;
  return function (...args: any) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/***
 * Setting API list to abort
 * @param {any} abortControllers abortController to hold API list
 */
export const settingController = (abortControllers: any) => {
  const controller = new AbortController();
  abortControllers.current.push(controller);
  const signal = controller.signal;
  return signal;
};

/**
 * Abort Api calls while moving away from page.
 * @param {any} abortControllers API list to abort
 */
export const abortApiCall = (abortControllers: any) => {
  // Accept either the ref itself or an object with .abortControllers
  const ref = abortControllers?.current
    ? abortControllers
    : abortControllers?.abortControllers;

  if (!ref) {
    return;
  }

  const controllers = ref.current;
  if (!controllers || !Array.isArray(controllers) || controllers.length === 0) {
    return;
  }

  try {
    controllers.forEach((controller: any) => {
      if (controller && typeof controller.abort === 'function') {
        controller.abort();
      }
    });
  } catch {
    return;
  } finally {
    // clear stored controllers
    if (ref.current) {
      ref.current = [];
    }
  }
};
