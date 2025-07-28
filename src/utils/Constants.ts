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

import { ConfigService } from '../services/common/ConfigService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version, name } = require('../../package.json');
export const VERSION_DETAIL = version;
export const PLUGIN_NAME = name;
export const LOGIN_STATE = '1';
export const STATUS_SUCCESS = 'SUCCEEDED';
export const API_HEADER_BEARER = 'Bearer ';
export const API_HEADER_CONTENT_TYPE = 'application/json';
export type scheduleMode = 'runNow' | 'runSchedule';
export const gcpServiceUrls = (async () => {
  return await ConfigService.gcpServiceUrlsAPI();
})();
export const ABORT_MESSAGE = 'signal is aborted without reason';
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_FORBIDDEN = 403;

// Pattern to check whether string contains link
export const pattern =
  // eslint-disable-next-line
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g; // REGX to extract URL from string

export const DEFAULT_TIME_ZONE = 'UTC';

// Constants for disk size and cron validation in createVertexSchema
export const DISK_MIN_SIZE = 10;
export const DISK_MAX_SIZE = 65536;
export const EVERY_MINUTE_CRON = '* * * * *';
export const SCHEDULER_OPTIONS = [
  {
    label: 'Vertex',
    value: 'vertex'
  },
  {
    label: 'Composer',
    value: 'composer'
  }
];
export const DEFAULT_SCHEDULER_SELECTED = 'composer';

export const DEFAULT_MACHINE_TYPE = [
  {
    label: 'n1-standard-4',
    value: 'n1-standard-4'
  }
];

export const NETWORK_CONFIGURATION_LABEL = 'Network Configuration';

export const NETWORK_CONFIGURATION_LABEL_DESCRIPTION =
  'Establishes connectivity for VM instances in the cluster';

export const NETWORK_OPTIONS = [
  {
    label: 'Network in this project',
    value: 'networkInThisProject'
  },
  {
    label: 'Network shared from host project',
    value: 'networkSharedFromHostProject'
  }
];

export const SHARED_NETWORK_DOC_URL =
  'https://cloud.google.com/vpc/docs/shared-vpc';

export const SHARED_NETWORK_DESCRIPTION =
  'Choose a shared VPC network from the project that is different from the clusters project';

export const SCHEDULE_MODE_OPTIONS = [
  {
    label: 'Run now',
    value: 'runNow'
  },
  {
    label: 'Run on schedule',
    value: 'runSchedule'
  }
];

export const RUN_ON_SCHEDULE_OPTIONS = [
  {
    label: 'Use UNIX cron format',
    value: 'useUnixCronFormat'
  },
  {
    label: 'Use user-friendly scheduler',
    value: 'useUserFriendlyScheduler'
  }
];

export const CORN_EXP_DOC_URL =
  'https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules';

export const SCHEDULE_FORMAT_DESCRIPTION = `Schedules are specified using unix-cron format. E.g. every 3 hours:
            "0 */3 * * *", every Monday at 9:00: "0 9 * * 1".`;

export const allowedPeriodsCron = ['year', 'month', 'week', 'day', 'hour'];

export const TITLE_LAUNCHER_CATEGORY = 'Google Cloud Resources';

export const LISTING_PAGE_HEADING = 'Scheduled Jobs';

export const SCHEDULE_LABEL_VERTEX = 'Vertex';

export const SCHEDULE_LABEL_COMPOSER = 'Composer';