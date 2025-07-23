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
export const DEFAULT_LABEL_DETAIL = 'client:scheduler-jupyter-plugin';

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

export const EXECUTION_MODE_OPTIONS = [
  {
    label: 'Serverless',
    value: 'serverless'
  },
  {
    label: 'Cluster',
    value: 'cluster'
  }
];

export const VERTEX_REGIONS = [
  {
    label: 'asia-east2',
    value: 'asia-east2'
  },
  {
    label: 'asia-northeast1',
    value: 'asia-northeast1'
  },
  {
    label: 'asia-northeast3',
    value: 'asia-northeast3'
  },
  {
    label: 'asia-south1',
    value: 'asia-south1'
  },
  {
    label: 'asia-southeast1',
    value: 'asia-southeast1'
  },
  {
    label: 'australia-southeast1',
    value: 'australia-southeast1'
  },
  {
    label: 'europe-west1',
    value: 'europe-west1'
  },
  {
    label: 'northamerica-northeast1',
    value: 'northamerica-northeast1'
  },
  {
    label: 'southamerica-east1',
    value: 'southamerica-east1'
  },
  {
    label: 'us-central1',
    value: 'us-central1'
  },
  {
    label: 'us-west1',
    value: 'us-west1'
  },
  {
    label: 'us-west4',
    value: 'us-west4'
  }
];

export const DEFAULT_MACHINE_TYPE = [
  {
    label: 'n1-standard-2 (2 CPUs, 8.05 GB RAM)',
    value: 'n1-standard-2 (2 CPUs, 8.05 GB RAM)'
  }
];

export const KERNEL_VALUE = [
  {
    label: 'python3',
    value: 'python3'
  },
  {
    label: 'pytorch',
    value: 'pytorch'
  },
  {
    label: 'tensorflow',
    value: 'tensorflow'
  }
];
export const DEFAULT_CLOUD_STORAGE_BUCKET = [
  { label: 'default-vertex-schedules', value: 'default-vertex-schedules' }
];

export const DISK_TYPE_VALUE = [
  {
    label: 'pd-standard (Persistent Disk Standard',
    value: 'pd-standard (Persistent Disk Standard'
  },
  {
    label: 'pd-ssd (Persistent Disk Solid state Drive)',
    value: 'pd-ssd (Persistent Disk Solid state Drive)'
  },
  {
    label: 'pd-standard (Persistent Disk Hard Disk Drive)',
    value: 'pd-standard (Persistent Disk Hard Disk Drive)'
  },
  {
    label: 'pd-balanced (Balanced Persistent Disk)',
    value: 'pd-balanced (Balanced Persistent Disk)'
  },
  {
    label: 'pd-extreme (Extreme Persistent Disk)',
    value: 'pd-extreme (Extreme Persistent Disk)'
  }
];

export const DEFAULT_DISK_SIZE = '100';

export const DEFAULT_DISK_MIN_SIZE = 10;

export const DEFAULT_DISK_MAX_SIZE = 65536;