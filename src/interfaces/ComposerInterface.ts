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

import { ToastOptions } from 'react-toastify';
import { CombinedCreateFormValues } from '../schemas/CreateScheduleCombinedSchema';
import {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch
} from 'react-hook-form';
import { ComposerSchedulerFormValues } from '../schemas/CreateComposerSchema';
import { ExecutionMode } from '../types/CommonSchedulerTypes';
import {
  IAuthCredentials,
  IInitialSchedulerContextData
} from './CommonInterface';
import { JupyterFrontEnd } from '@jupyterlab/application';

export interface ICreateComposerSchedulerProps {
  control: Control<CombinedCreateFormValues>;
  errors: FieldErrors<ComposerSchedulerFormValues>;
  watch: UseFormWatch<CombinedCreateFormValues>;
  setValue: UseFormSetValue<CombinedCreateFormValues>;
  setError: UseFormSetError<ComposerSchedulerFormValues>;
  getValues: UseFormGetValues<CombinedCreateFormValues>;
  trigger: UseFormTrigger<CombinedCreateFormValues>;
  credentials: IAuthCredentials;
  isValid?: boolean;
  initialSchedulerDataContext?: IInitialSchedulerContextData | null;
  app: JupyterFrontEnd;
}

export interface IComposerSchedulePayload {
  dag_id: string;
  name: string;
  input_filename: string;
  project_id: string;
  region_id: string;
  composer_environment_name: string;
  local_kernel: boolean;
  output_formats: string[];
  parameters: string[];
  serverless_name?: string;
  cluster_name?: string;
  mode_selected: string;
  schedule_value?: string;
  retry_count: number | undefined;
  retry_delay: number | undefined;
  email_failure?: string;
  email_delay?: string;
  email_success?: string;
  email?: string[];
  stop_cluster: string;
  time_zone?: string;
  packages_to_install?: string[];
  error?: string;
}

export interface IUpdateSchedulerAPIResponse {
  status: number;
  error: string;
}

export interface IServerlessData {
  serverlessName: string;
  serverlessData: any; // Or a more specific type if you know the structure
}

export interface IKernelDetails {
  executionMode: ExecutionMode; //local or remote kernels
  isDataprocKernel: boolean; // Indicates if it's a Dataproc-related kernel (serverless or cluster)
  kernelDisplayName: string;
}

export interface ISchedulerDagData {
  dag_id: string;
  timetable_description: string;
  is_paused: string;
  schedule_interval: null | {
    value: string;
  };
}
export interface IDagList {
  jobid: string;
  notebookname: string;
  schedule: string;
  scheduleInterval: string;
}

export interface IClusterAPIResponse {
  clusterName: string;
  clusterUuid: string;
  config: Record<string, never>;
  labels: Record<string, never>;
  metrics: Record<string, never>;
  projectId: string;
  status: Record<string, never>;
  statusHistory: [];
}

export interface IComposerEnvAPIResponse {
  name: string;
  label: string;
  description: string;
  state: string;
  file_extensions: [];
  metadata: Record<string, never>;
  pypi_packages: Record<string, string> | undefined;
}

export interface IDagRunList {
  dagRunId: string;
  filteredDate: Date;
  state: string;
  date: Date;
  time: string;
}

export interface IExpandableToastProps extends ToastOptions {
  message: string;
}

export interface ILoadingStateComposerListing {
  projectId: boolean;
  region: boolean;
  environment: boolean;
  importErrors: boolean;
  dags: boolean;
  update: string;
  trigger: string;
  editNotebook: string;
  delete: boolean;
  editSchedule: string;
}

export interface IListDagInfoAPIServiceResponse {
  dagList: IDagList[];
  bucketName: string;
}

export interface ILoadingStateComposer {
  projectId: boolean;
  region: boolean;
  environment: boolean;
  cluster: boolean;
  serverless: boolean;
}
