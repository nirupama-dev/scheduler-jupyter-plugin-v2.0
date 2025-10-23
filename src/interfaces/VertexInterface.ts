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

import { Dayjs } from 'dayjs';
import { LabIcon } from '@jupyterlab/ui-components';
import {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch
} from 'react-hook-form';
import { CombinedCreateFormValues } from '../schemas/CreateScheduleCombinedSchema';
import {
  IAuthCredentials,
  IEditScheduleData,
  ILabelValue
} from './CommonInterface';
import { HeaderProps, Renderer } from 'react-table';
import { PickersDayProps } from '@mui/x-date-pickers';
import { JupyterFrontEnd } from '@jupyterlab/application';

export interface ICreateVertexSchedulerProps {
  control: Control<CombinedCreateFormValues>;
  errors: FieldErrors<CombinedCreateFormValues>;
  watch: UseFormWatch<CombinedCreateFormValues>;
  setValue: UseFormSetValue<CombinedCreateFormValues>;
  getValues: UseFormGetValues<CombinedCreateFormValues>;
  trigger: UseFormTrigger<CombinedCreateFormValues>;
  isValid: boolean;
  credentials: IAuthCredentials;
  editScheduleData: IEditScheduleData | null | undefined;
  clearErrors: any;
  app: JupyterFrontEnd;
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
  pageNumber: number;
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
  pageNumber: number;
  region: string;
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
  keyRings: boolean;
  cryptoKeys: boolean;
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
    Header?: string | undefined | Renderer<HeaderProps<object>>;
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
  initialLoading: boolean;
  isLoading: boolean;
  regionLoader: boolean;
  editScheduleLoader: boolean;
  isLoadingTableContent: boolean;
}

export interface IVertexSelectedActionProps {
  resumePauseLoading?: string;
  triggerLoading?: string;
  editScheduleLoading?: string;
  deleteLoading?: string;
}

export interface IUpdateSchedulerArgs {
  scheduleId: string;
  region: string;
  displayName: string;
  abortControllers: any;
}

export interface ISheduleToDelete {
  scheduleId: string;
  displayName: string;
  deletePopUpShow: boolean;
  deletingStatus?: boolean;
}

export interface IVertexDeleteAPIArgs {
  region: string;
  uniqueScheduleId: string;
  scheduleDisplayName: string;
  listVertexScheduleInfoAPI: (
    nextPageTokenToLoad: string | null | undefined
  ) => void;
}

export interface IVertexListPayload {
  region: string;
  nextToken: string | null | undefined;
  scheduleListPageLength: number;
  abortControllers: any;
}

export interface IVertexScheduleRun {
  name: string;
  createTime: string;
  updateTime: string;
  gcsOutputUri: string;
  jobState: string;
  gcsNotebookSource: { uri: string };
  displayName: string;
  status?: { code: string; message: string };
}

export interface IGroupedExecutionHistoryDates {
  grey: string[];
  red: string[];
  green: string[];
  darkGreen: string[];
}

export interface IExecutionPayload {
  region: string;
  scheduleId: string;
  selectedMonth: Dayjs | null;
  abortControllers: any;
}

export interface IVertexExecutionHistoryCellProps {
  getCellProps: () => React.TdHTMLAttributes<HTMLTableDataCellElement>;
  value: string | any;
  column: {
    Header: string;
  };
  row: {
    original: {
      id: string;
      status: string;
      scheduleId: string;
      state: string;
      gcsUrl: string;
      fileName: string;
    };
  };
  render: (value: string) => React.ReactNode;
}

export interface IScheduleRun {
  state: string;
  gcsUrl: string;
  scheduleRunId: string;
  scheduleId: string;
  fileName: string;
}

export interface IVertexExecutionHistoryActionsProps {
  data: {
    scheduleRunId?: string;
    state?: string;
    gcsUrl?: string;
    fileName?: string;
  };
  scheduleName: string;
  fileExists?: boolean;
  app: JupyterFrontEnd;
}

export interface IScheduleRunFiltered {
  date: string;
  actions?: any;
  scheduleId?: string;
  state?: string;
  gcsUrl?: string;
  fileName?: string;
  code?: string;
  statusMessage?: string;
  time?: string;
}

export interface IOutputFileExistsPayload {
  bucketName: string;
  scheduleRunId: string;
  fileName: string;
  abortControllers: any;
}

export interface IDownloadFile {
  gcsUrl: string;
  fileName: string;
  scheduleRunId: string;
  scheduleName: string;
}

export interface ICustomDateProps extends PickersDayProps<Dayjs> {
  selectedDate?: Dayjs | null;
  greyListDates?: string[];
  redListDates?: string[];
  greenListDates?: string[];
  darkGreenListDates?: string[];
  isLoading?: boolean;
}

export interface IVertexListingInputProps {
  region: string;
  handleRegion: (regionSelected: ILabelValue<string> | null) => void;
  loaderState: IVertexListingLoadingState;
  regionDisable: boolean;
  handleCurrentPageRefresh: () => void;
}

export interface ISchedulerContext {
  activePaginationVariables: IActivePaginationVariables | null;
  setActivePaginationVariables: React.Dispatch<
    React.SetStateAction<IActivePaginationVariables | null>
  >;
  vertexRouteState: any;
  setVertexRouteState: React.Dispatch<React.SetStateAction<any>>;
  composerRouteState: any;
  setComposerRouteState: React.Dispatch<React.SetStateAction<any>>;
}

export interface IActionButtonProps {
  title: string;
  icon: LabIcon;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export interface IKeyRingPayload {
  region: string | undefined;
  projectId: string | undefined;
  accessToken: string | undefined;
}

export interface ICryptoListKeys {
  credentials: IKeyRingPayload;
  keyRing: string;
}
