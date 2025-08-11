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
 *
 */

import { ISessionContext } from '@jupyterlab/apputils';
import { IKernelDetails } from './ComposerInterface';
import { SchedulerType } from '../types/CommonSchedulerTypes';
import { JupyterLab } from '@jupyterlab/application';

export interface IAuthCredentials {
  access_token?: string;
  project_id?: string;
  region_id?: string;
  config_error?: number;
  login_error?: number;
}

export interface ISchedulerRoutesProps {
  sessionContext?: ISessionContext | null | undefined;
  initialKernalSchedulerDetails?: INotebookKernalSchdulerDefaults| null |undefined;
  app?:JupyterLab;
}

export interface IGcpUrlResponseData {
  dataproc_url: string;
  compute_url: string;
  metastore_url: string;
  cloudkms_url: string;
  cloudresourcemanager_url: string;
  datacatalog_url: string;
  storage_url: string;
}

export interface IProject {
  projectId: string;
  name: string;
}

export interface IFormInput {
  textValue: string;
  radioValue: string;
  checkboxValue: string[];
  dateValue: Date;
  dropdownValue: string;
}

export interface IPath {
  path?: string;
}

export interface Parameter {
  key: string;
  value: string;
}

export interface INotebookKernalSchdulerDefaults {
  schedulerType: SchedulerType;
  kernalDetails?: IKernelDetails;
}

export interface IEdiModeData {
  editMode: boolean;
  existingData: any;
}


//Remove this if same as ISchedulerRoutesProps
export interface ICreateNotebookScheduleProps {
  sessionContext?: ISessionContext| null | undefined | null | undefined;
  initialKernalScheduleDetails?: INotebookKernalSchdulerDefaults|null|undefined;
  editModeData?: IEdiModeData | null | undefined;
}


export interface Parameter {
  key: string;
  value: string;
}


export interface ILabelValue<T, U = T> {
  label: T;
  value: U;
}

export interface LoaderProps {
  message: string;
}
