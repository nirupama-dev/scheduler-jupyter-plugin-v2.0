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


import {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch
} from 'react-hook-form';
import { CombinedCreateFormValues } from '../schemas/CreateScheduleCombinedSchema';
import { IAuthCredentials, IEditScheduleData, ILabelValue, Parameter } from './CommonInterface';
import { HeaderProps, Renderer } from 'react-table';
import dayjs from 'dayjs';

export interface ICreateVertexSchedulerProps {
  control: Control<CombinedCreateFormValues>;
  errors: FieldErrors<CombinedCreateFormValues>;
  watch: UseFormWatch<CombinedCreateFormValues>;
  setValue: UseFormSetValue<CombinedCreateFormValues>;
  getValues: UseFormGetValues<CombinedCreateFormValues>;
  trigger: UseFormTrigger<CombinedCreateFormValues>;
  credentials: IAuthCredentials;
  editScheduleData: IEditScheduleData | null | undefined;
}
/*
 * Interface for the payload sent from the Create Vertex Scheduler form to the create API.
 */
export interface IVertexSchedulePayload {
  job_id?: string;
  input_filename: string;
  display_name: string;
  machine_type: string;
  kernel_name: string;
  region: string;
  cloud_storage_bucket: string;
  service_account: string
  network_option: 'networkInThisProject' | 'networkSharedFromHostProject'|'';
  primary_network?: string;
  sub_network?: string;
  disk_type: string;
  disk_size: string;
  accelerator_type?: string;
  accelerator_count?: string;
  schedule_mode: string;
  schedule_value?: string; // Optional: only for scheduled jobs
  cron?: string; // Optional: only for scheduled jobs
  time_zone?: string; // Optional: only for scheduled jobs
  max_run_count?: string; // Optional: only for scheduled jobs
  start_time?: dayjs.Dayjs; // Optional: only for scheduled jobs
  end_time?: dayjs.Dayjs; // Optional: only for scheduled jobs
  parameters?: Parameter[]; //future enhancement: optional parameters for the job
}

export interface IMachineType {
  machineType: { label: string; value: string };
  acceleratorConfigs: IAcceleratorConfig[] | null;
}
export interface IAllowedCounts {
  label: number;
  value: number;
}
export interface IAcceleratorConfig {
  acceleratorType: { label: string; value: string };
  allowedCounts: IAllowedCounts[];
}

// This interface defines the structure of each item in the final transformed array
export interface IMachineTypeFormatted {
  machineType: ILabelValue<string>;
  acceleratorConfigs?: IAcceleratorConfig[] | null; // Optional, can be array or null
}


export interface IVertexScheduleList {
  displayName: string;
  schedule: string;
  status: string;
  jobState?: any[];
 // region: string;
}
export interface IUpdateSchedulerAPIResponse {
  status: number;
  error: string;
}
export interface ITriggerSchedule {
  metedata: object;
  name: string;
}
export interface IDeleteSchedulerAPIResponse {
  done: boolean;
  metadata: object;
  name: string;
  response: object;
}
export interface IVertexScheduleRunList {
  jobRunId: string;
  startDate: string;
  endDate: string;
  gcsUrl: string;
  state: string;
  date: Date;
  time: string;
  fileName: string;
}
export interface ISchedulerData {
  name: string;
  displayName: string;
  schedule: string;
  status: string;
  createTime: string;
  lastScheduledRunResponse: ILastScheduledRunResponse;
}

export interface ILastScheduledRunResponse {
  scheduledRunTime: string;
  runResponse: string;
}

export interface IPaginationViewProps {
  canPreviousPage: boolean;
  canNextPage: boolean;
  currentStartIndex: number;
  currentLastIndex: number;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  isLoading: boolean;
  totalCount: number;
}

export interface IActivePaginationVariables {
  scheduleListPageLength: number;
  totalCount: number; // size of each page with pagination
  pageTokenList: string[];
  nextPageToken: string | null;
}

// Define the expected type for formattedResponse
export interface IFormattedResponse {
  schedules?: IVertexScheduleList[];
  nextPageToken?: string;
  error?: { code: number; message: string };
}

export interface ILoadingStateVertex {
  region: boolean;
  machineType: boolean;
  cloudStorageBucket: boolean;
  serviceAccount: boolean;
  primaryNetwork: boolean;
  subNetwork: boolean;
  sharedNetwork: boolean;
  hostProject: boolean;
}

export interface IServiceAccount {
  displayName: string;
  email: string;
}

export interface INetworkVertex {
  name: string;
  link: string;
}

export interface ISharedNetwork {
  name: string;
  network: string;
  subnetwork: string;
}

export interface IVertexCellProps {
  getCellProps: () => React.TdHTMLAttributes<HTMLTableDataCellElement>;
  value: string | any;
  column: {
    Header?: string | undefined | Renderer<HeaderProps<{}>>;
  };
  row: {
    original: {
      id?: string;
      status?: string;
      lastScheduledRunResponse?: {
        runResponse: string;
      };
      jobState?: string[];
      name?: string;
      createTime?: string;
      nextRunTime?: string;
    };
  };
  render: (value: string) => React.ReactNode;
}

export interface IVertexScheduleListing {
  isLoading: boolean;
}

export interface IVertexScheduleList {
  displayName: string;
  schedule: string;
  status: string;
  jobState?: any[];
  region: string;
}

export interface IVertexListingLoadingState {
  isLoading: boolean;
  regionLoader: boolean;
}

export interface IUpdateSchedulerArgs {
  scheduleId: string;
  region: string;
  displayName: string;
  // setResumeLoading: (value: string) => void;
  // abortControllers: any;
}
