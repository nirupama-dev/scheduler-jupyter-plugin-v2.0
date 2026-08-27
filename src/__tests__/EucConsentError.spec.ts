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

import { extractEucConsentUrl } from '../utils/EucConsentError';

const CONSENT_URL =
  'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&response_type=none+gsession&client_id=1057398310658-abc.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fnotebooks.cloud.google.com%2Fstatic%2Foauth.html&login_hint=user%40example.com';

const DOCS_URL =
  'https://cloud.google.com/colab/docs/run-code-adc#end-user-credentials';

const consentErrorBody = {
  error: {
    code: 401,
    status: 'UNAUTHENTICATED',
    message:
      "You must grant Colab Enterprise consent to create a NotebookExecutionJob with 'user@example.com' as an execution identity. " +
      `See ${DOCS_URL} for more details on how to grant consent.`,
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'EUC_CONSENT_REQUIRED',
        domain: 'aiplatform.googleapis.com',
        metadata: { oauthUri: CONSENT_URL }
      }
    ]
  }
};

describe('extractEucConsentUrl', () => {
  it('reads the consent URL from a structured error object', () => {
    expect(extractEucConsentUrl(consentErrorBody)).toEqual(CONSENT_URL);
  });

  it('reads the consent URL out of the flattened error string', () => {
    // The backend collapses the whole response body into one string before it
    // reaches the frontend, so this is the shape actually seen at runtime.
    const flattened = `Error creating schedule: Unauthorized ${JSON.stringify(
      consentErrorBody
    )}`;

    expect(extractEucConsentUrl(flattened)).toEqual(CONSENT_URL);
  });

  it('never returns the documentation link instead of the consent link', () => {
    // The same error carries a docs URL in its message. Returning that would
    // send the user to a page that leaves them exactly as stuck as before.
    const flattened = `Error creating schedule: Unauthorized ${JSON.stringify(
      consentErrorBody
    )}`;

    expect(extractEucConsentUrl(flattened)).not.toContain(
      'cloud.google.com/colab/docs'
    );
  });

  it('returns undefined for an unrelated error', () => {
    const permissionDenied = {
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        message:
          "Provided execution_user 'other@example.com' should match the authenticated user 'user@example.com'."
      }
    };

    expect(extractEucConsentUrl(permissionDenied)).toBeUndefined();
    expect(
      extractEucConsentUrl(JSON.stringify(permissionDenied))
    ).toBeUndefined();
  });

  it('returns undefined for an error that only mentions the docs URL', () => {
    expect(
      extractEucConsentUrl(`Error creating schedule: see ${DOCS_URL}`)
    ).toBeUndefined();
  });

  it('handles empty and malformed input without throwing', () => {
    expect(extractEucConsentUrl('')).toBeUndefined();
    expect(extractEucConsentUrl(undefined)).toBeUndefined();
    expect(extractEucConsentUrl('{not json')).toBeUndefined();
  });
});
