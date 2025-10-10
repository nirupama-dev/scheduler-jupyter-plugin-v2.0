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

import { ILabelValue } from '../interfaces/CommonInterface';
import { ConfigService } from '../services/common/ConfigService';

export const PLUGIN_ID = 'scheduler-jupyter-plugin';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version, name } = require('../../package.json');
export const VERSION_DETAIL = version;
export const PLUGIN_NAME = name;
export const LOGIN_STATE = '1';
export const STATUS_SUCCESS = 'SUCCEEDED';
export const API_HEADER_BEARER = 'Bearer ';
export const API_HEADER_CONTENT_TYPE = 'application/json';
export const gcpServiceUrls = (async () => {
  return await ConfigService.gcpServiceUrlsAPI();
})();
export const ABORT_MESSAGE = 'signal is aborted without reason';
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_FORBIDDEN = 403;
export const DEFAULT_LABEL_DETAIL = 'client:scheduler-jupyter-plugin';
export const PACKAGES = ['apache-airflow-providers-papermill', 'ipykernel'];

// Pattern to check whether string contains link
export const URL_LINK_PATTERN =
  // eslint-disable-next-line
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g; // REGX to extract URL from string

export const DEFAULT_TIME_ZONE = 'UTC';
export const SCHEDULE_VALUE_EXPRESSION = '30 17 * * 1-5';

// Constants for disk size and cron validation in createVertexSchema
export const DISK_MIN_SIZE = 10;

export const DISK_MAX_SIZE = 65536;

export const EVERY_MINUTE_CRON = '* * * * *';

export const VERTEX_SCHEDULER_NAME = 'vertex';

export const COMPOSER_SCHEDULER_NAME = 'composer';

export const SCHEDULE_LABEL_VERTEX = 'Vertex';

export const SCHEDULE_LABEL_COMPOSER = 'Composer';

export const SCHEDULER_OPTIONS = [
  {
    label: SCHEDULE_LABEL_VERTEX,
    value: VERTEX_SCHEDULER_NAME
  },
  {
    label: SCHEDULE_LABEL_COMPOSER,
    value: COMPOSER_SCHEDULER_NAME
  }
];

export const DEFAULT_SCHEDULER_SELECTED = VERTEX_SCHEDULER_NAME;

export const NETWORK_CONFIGURATION_LABEL = 'Network Configuration';

export const NETWORK_CONFIGURATION_LABEL_DESCRIPTION =
  'Establishes connectivity for VM instances in the cluster';

export const NETWORK_IN_THIS_PROJECT_VALUE = 'networkInThisProject';

export const NETWORK_SHARED_FROM_HOST_PROJECT_VALUE =
  'networkSharedFromHostProject';

export const NETWORK_OPTIONS = [
  {
    label: 'Network in this project',
    value: NETWORK_IN_THIS_PROJECT_VALUE
  },
  {
    label: 'Network shared from host project',
    value: NETWORK_SHARED_FROM_HOST_PROJECT_VALUE
  }
];
export const DEFAULT_NETWORK_SELECTED = NETWORK_IN_THIS_PROJECT_VALUE;

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
    value: 'cronFormat'
  },
  {
    label: 'Use user-friendly scheduler',
    value: 'userFriendly'
  }
];

export const CORN_EXP_DOC_URL =
  'https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules';

export const SCHEDULE_FORMAT_DESCRIPTION = `Schedules are specified using unix-cron format. E.g. every 3 hours:
            "0 */3 * * *", every Monday at 9:00: "0 9 * * 1".`;

export const allowedPeriodsCron = ['year', 'month', 'week', 'day', 'hour'];

export const LISTING_PAGE_HEADING = 'Scheduled Jobs';

export const TITLE_LAUNCHER_CATEGORY = 'Google Cloud Resources';

export const GCS_PLUGIN_ID = 'gcs-jupyter-plugin:plugin';
export const POLLING_DAG_LIST_INTERVAL = 10000;
export const POLLING_IMPORT_ERROR_INTERVAL = 30000;

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

export const VERTEX_REGIONS: ILabelValue<string>[] = [
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

export const KERNEL_VALUE: ILabelValue<string>[] = [
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
export const DEFAULT_CLOUD_STORAGE_BUCKET = {
  label: 'default-vertex-schedules',
  value: 'default-vertex-schedules'
};

export const DISK_TYPE_VALUE: ILabelValue<string>[] = [
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

export const DEFAULT_DISK_SIZE = '100'; // Needs to be a string as diskSize is string in schema

export const DEFAULT_MACHINE_TYPE: ILabelValue<string> = {
  label: 'n1-standard-2 (2 CPUs, 8.05 GB RAM)',
  value: 'n1-standard-2'
}; // Make it ILabelValue

export const DEFAULT_KERNEL = 'python3';

export const DEFAULT_SERVICE_ACCOUNT = 'compute@developer.gserviceaccount.com'; // This might be an email, ensure ILabelValue if used for dropdown

export const CRON_FOR_SCHEDULE_EVERY_MIN = '* * * * *'; // Your 'everyMinuteCron'

export const LOADER_CONTENT_VERTEX_LISTING_SCREEN =
  'Loading Vertex Schedules...';

export const LOADER_CONTENT_COMPOSER_LISTING_SCREEN =
  'Loading Composer Schedules...';

export const LOADER_CONTENT_VERTEX_EXECUTION_SCREEN =
  'Loading Vertex Schedule Execution...';

export const LISTING_SCREEN_HEADING = [
  {
    Header: 'Schedule Name',
    accessor: 'displayName'
  },
  {
    Header: 'Frequency',
    accessor: 'schedule'
  },
  {
    Header: 'Next Run Date',
    accessor: 'nextRunTime'
  },
  {
    Header: 'Created',
    accessor: 'createTime'
  },
  {
    Header: 'Latest Execution Jobs',
    accessor: 'jobState'
  },
  {
    Header: 'Status',
    accessor: 'status'
  },
  {
    Header: 'Actions',
    accessor: 'actions'
  }
];

export const VIEW_CLOUD_LOGS = 'VIEW CLOUD LOGS';

export const VERTEX_EXECUTION_HISTORY_TABLE_HEADER = [
  { Header: 'State', accessor: 'state' },
  { Header: 'Date', accessor: 'date' },
  { Header: 'Time', accessor: 'time' },
  { Header: 'Code', accessor: 'code' },
  { Header: 'Status Message', accessor: 'statusMessage' },
  { Header: 'Actions', accessor: 'actions' }
];

export const VERTEX_EXECUTION_HISTORY_SCHEDULE_RUN_LOADER_TEXT =
  'Loading Vertex Schedule Runs...';

export const DEFAULT_LOADING_TEXT = 'Loading...';

export const OPEN_LOGIN_WIDGET_COMMAND = `${PLUGIN_ID}:route-to-login-page`;

export const composerEnvironmentStateList = ['RUNNING', 'UPDATING'];

export const composerEnvironmentStateListForCreate = 'RUNNING';

export const LIST_COMPOSER_TABLE_HEADER = [
  {
    Header: 'Job Name',
    accessor: 'jobid'
  },
  {
    Header: 'Schedule',
    accessor: 'schedule'
  },
  {
    Header: 'Status',
    accessor: 'status'
  },
  {
    Header: 'Actions',
    accessor: 'actions'
  }
];

export const COMPOSER_EXECUTION_HISTORY_DAG_HEADER = [
  {
    Header: 'State',
    accessor: 'state'
  },
  {
    Header: 'Date',
    accessor: 'date'
  },
  {
    Header: 'Time',
    accessor: 'time'
  },
  {
    Header: 'Actions',
    accessor: 'actions'
  }
];

export const NO_ROWS_TO_DISPLAY = 'No rows to display';

export const ENCRYPTION_TEXT = 'Encryption';

export const DEFAULT_ENCRYPTION_SELECTED = 'googleManagedEncryption';
export const CUSTOMER_ENCRYPTION = 'customerManagedEncryption';

export const ENCRYPTION_OPTIONS = [
  {
    label: 'Google-managed encryption key',
    value: DEFAULT_ENCRYPTION_SELECTED
  },
  {
    label: 'Customer managed encryption key(CMEK)',
    value: CUSTOMER_ENCRYPTION
  }
];

export const GOOGLE_MANAGED_ENCRYPTION_HELPER_TEXT =
  'No configuration required';

export const CUSTOMER_MANAGED_ENCRYPTION_HELPER_TEXT = 'Manage via';

export const DEFAULT_CUSTOMER_MANAGED_SELECTION = 'key';

export const CUSTOMER_MAANGED_ENCRYPTION = 'manual';

export const SECURITY_KEY =
  'https://console.cloud.google.com/security/kms/keyrings';

export const CUSTOMER_MANAGED_ENCRYPTION_LINK =
  'Google Cloud Key Management Service';

export const CUSTOMER_MANAGED_RADIO_OPTIONS = [
  { label: '', value: DEFAULT_CUSTOMER_MANAGED_SELECTION },
  { label: '', value: CUSTOMER_MAANGED_ENCRYPTION }
];

export const ENCRYPTION_MANUAL_KEY_SAMPLE =
  'Example format:projects/<project-name>/locations/<location-name>/keyRings/<keyring-name>/cryptoKeys/<key-name>';
