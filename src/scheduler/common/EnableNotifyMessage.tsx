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

import React from 'react';

const EnableNotifyMessage = ({ message }: { message: string }): JSX.Element => {
  const pattern =
    // eslint-disable-next-line
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g; // REGX to extract URL from string
  const url: any = message.match(pattern);
  const beforeLink = message.split('. ')[0] || '';
  return (
    <>
      {beforeLink}
      <a
        href={url[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="error-schedule-link"
      >
        Click here
      </a>{' '}
      to enable it.
    </>
  );
};

export default EnableNotifyMessage;
