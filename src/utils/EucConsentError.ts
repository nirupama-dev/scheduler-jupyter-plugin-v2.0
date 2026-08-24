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

// Deliberately free of imports so this parsing can be unit tested without
// pulling in the UI toolchain, or Const.ts and its require() of package.json.

// Reason code on the google.rpc.ErrorInfo the API attaches to its
// UNAUTHENTICATED response when the execution user has not granted consent.
export const EUC_CONSENT_REQUIRED_REASON = 'EUC_CONSENT_REQUIRED';

// Matches the OAuth consent URL the API returns when the execution user has not
// granted consent. Anchored on the OAuth endpoint rather than matching any URL:
// the same error also carries a documentation link, and sending the user there
// leaves them exactly as stuck as before.
export const OAUTH_CONSENT_URL_PATTERN =
  /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?[^\s"'\\]+/;

// Parse a JSON object out of an error, which reaches the frontend as a string
// with the API's response body embedded in it.
function parseErrorJson(error: any): any {
  if (typeof error !== 'string') {
    return error;
  }
  const jsonStart = error.indexOf('{');
  const jsonEnd = error.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    return undefined;
  }
  try {
    return JSON.parse(error.slice(jsonStart, jsonEnd + 1));
  } catch {
    return undefined;
  }
}

/**
 * Returns the OAuth consent URL when an error is the API's "execution user has
 * not granted consent" rejection, or undefined for every other error.
 *
 * The API reports this as UNAUTHENTICATED with a google.rpc.ErrorInfo detail
 * carrying the URL, so the reason code is matched first. The regex fallback
 * exists because the whole response is flattened into a string on its way here,
 * and it is anchored on the OAuth endpoint on purpose: the same error also
 * carries a documentation link, and sending the user there would leave them
 * exactly as stuck as before.
 * @param error - error string or object from the create/update call
 */
export function extractEucConsentUrl(error: any): string | undefined {
  const errorObj = parseErrorJson(error);
  const details = errorObj?.error?.details ?? errorObj?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (detail?.reason === EUC_CONSENT_REQUIRED_REASON) {
        const url = detail?.metadata?.oauthUri;
        if (typeof url === 'string' && url) {
          return url;
        }
      }
    }
  }

  const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
  if (!errorStr || !errorStr.includes(EUC_CONSENT_REQUIRED_REASON)) {
    return undefined;
  }
  return errorStr.match(OAUTH_CONSENT_URL_PATTERN)?.[0];
}
