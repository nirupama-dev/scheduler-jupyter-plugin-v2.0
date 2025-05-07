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

import React, { useRef, useState } from 'react';
import { SchedulerWidget } from '../../controls/SchedulerWidget';
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import ListVertexScheduler from '../vertex/ListVertexScheduler';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { scheduleMode } from '../../utils/Const';
import dayjs from 'dayjs';
import { ISchedulerData } from './VertexInterfaces';
import VertexExecutionHistory from './VertexExecutionHistory';

const VertexScheduleJobs = ({
  app,
  settingRegistry,
  setJobId,
  createCompleted,
  setCreateCompleted,
  setInputFileSelected,
  region,
  setRegion,
  setMachineTypeSelected,
  setAcceleratedCount,
  setAcceleratorType,
  setKernelSelected,
  setCloudStorage,
  setDiskTypeSelected,
  setDiskSize,
  setParameterDetail,
  setParameterDetailUpdated,
  setServiceAccountSelected,
  setPrimaryNetworkSelected,
  setSubNetworkSelected,
  setSubNetworkList,
  setSharedNetworkSelected,
  setScheduleMode,
  setScheduleField,
  setStartDate,
  setEndDate,
  setMaxRuns,
  setEditMode,
  setJobNameSelected,
  setGcsPath,
  setExecutionPageFlag,
  setIsApiError,
  setApiError,
  setExecutionPageListFlag
}: {
  app: JupyterLab;
  themeManager: IThemeManager;
  settingRegistry: ISettingRegistry;
  setJobId: (value: string) => void;
  createCompleted?: boolean;
  setCreateCompleted: (value: boolean) => void;
  setInputFileSelected: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  setMachineTypeSelected: (value: string | null) => void;
  setAcceleratedCount: (value: string | null) => void;
  setAcceleratorType: (value: string | null) => void;
  setKernelSelected: (value: string | null) => void;
  setCloudStorage: (value: string | null) => void;
  setDiskTypeSelected: (value: string | null) => void;
  setDiskSize: (value: string) => void;
  setParameterDetail: (value: string[]) => void;
  setParameterDetailUpdated: (value: string[]) => void;
  setServiceAccountSelected: (
    value: { displayName: string; email: string } | null
  ) => void;
  setPrimaryNetworkSelected: (
    value: { name: string; link: string } | null
  ) => void;
  setSubNetworkSelected: (value: { name: string; link: string } | null) => void;
  setSubNetworkList: (value: { name: string; link: string }[]) => void;
  setSharedNetworkSelected: (
    value: { name: string; network: string; subnetwork: string } | null
  ) => void;
  setScheduleMode: (value: scheduleMode) => void;
  setScheduleField: (value: string) => void;
  setStartDate: (value: dayjs.Dayjs | null) => void;
  setEndDate: (value: dayjs.Dayjs | null) => void;
  setMaxRuns: (value: string) => void;
  setEditMode: (value: boolean) => void;
  setJobNameSelected?: (value: string) => void;
  setGcsPath: (value: string) => void;
  setExecutionPageFlag: (value: boolean) => void;
  setIsApiError: (value: boolean) => void;
  setApiError: (value: string) => void;
  setExecutionPageListFlag: (value: boolean) => void;
}): React.JSX.Element => {
  const [showExecutionHistory, setShowExecutionHistory] =
    useState<boolean>(false);
  const [schedulerData, setScheduleData] = useState<ISchedulerData>();
  const [scheduleName, setScheduleName] = useState('');
  const abortControllers = useRef<any>([]); // Array of API signals to abort

  /**
   * Handles the back button click event.
   */
  const handleBackButton = () => {
    setShowExecutionHistory(false);
    setExecutionPageFlag(true);
    abortApiCall();
  };

  /**
   * Handles the selection of a DAG ID and updates the state with the selected scheduler data.
   * @param {any} schedulerData - The data related to the selected scheduler.
   * @param {string} scheduleName - The name of the selected schedule.
   */
  const handleScheduleIdSelection = (schedulerData: any, scheduleName: string) => {
    setShowExecutionHistory(true);
    setScheduleName(scheduleName);
    setScheduleData(schedulerData);
  };

  const abortApiCall = () => {
    abortControllers.current.forEach((controller: any) => controller.abort());
    abortControllers.current = [];
  };

  return (
    <>
      {showExecutionHistory ? (
        <VertexExecutionHistory
          region={region}
          setRegion={setRegion}
          schedulerData={schedulerData}
          scheduleName={scheduleName}
          handleBackButton={handleBackButton}
          setExecutionPageFlag={setExecutionPageFlag}
          setExecutionPageListFlag={setExecutionPageListFlag}
          abortControllers={abortControllers}
          abortApiCall={abortApiCall}
        />
      ) : (
        <ListVertexScheduler
          region={region}
          setRegion={setRegion}
          app={app}
          setJobId={setJobId}
          settingRegistry={settingRegistry}
          createCompleted={createCompleted}
          setCreateCompleted={setCreateCompleted}
          setInputFileSelected={setInputFileSelected}
          setMachineTypeSelected={setMachineTypeSelected}
          setAcceleratedCount={setAcceleratedCount}
          setAcceleratorType={setAcceleratorType}
          setKernelSelected={setKernelSelected}
          setCloudStorage={setCloudStorage}
          setDiskTypeSelected={setDiskTypeSelected}
          setDiskSize={setDiskSize}
          setParameterDetail={setParameterDetail}
          setParameterDetailUpdated={setParameterDetailUpdated}
          setServiceAccountSelected={setServiceAccountSelected}
          setPrimaryNetworkSelected={setPrimaryNetworkSelected}
          setSubNetworkSelected={setSubNetworkSelected}
          setSubNetworkList={setSubNetworkList}
          setSharedNetworkSelected={setSharedNetworkSelected}
          setScheduleMode={setScheduleMode}
          setScheduleField={setScheduleField}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setMaxRuns={setMaxRuns}
          setEditMode={setEditMode}
          setJobNameSelected={setJobNameSelected!}
          setGcsPath={setGcsPath}
          handleScheduleIdSelection={handleScheduleIdSelection}
          setIsApiError={setIsApiError}
          setApiError={setApiError}
          abortControllers={abortControllers}
          abortApiCall={abortApiCall}
        />
      )}
    </>
  );
};

export class NotebookJobs extends SchedulerWidget {
  app: JupyterLab;
  settingRegistry: ISettingRegistry;
  setExecutionPageFlag: (value: boolean) => void;
  setJobId: (value: string) => void;
  setCreateCompleted: (value: boolean) => void;
  setInputFileSelected: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  setMachineTypeSelected: (value: string | null) => void;
  setAcceleratedCount: (value: string | null) => void;
  setAcceleratorType: (value: string | null) => void;
  setKernelSelected: (value: string | null) => void;
  setCloudStorage: (value: string | null) => void;
  setDiskTypeSelected: (value: string | null) => void;
  setDiskSize: (value: string) => void;
  setParameterDetail: (value: string[]) => void;
  setParameterDetailUpdated: (value: string[]) => void;
  setServiceAccountSelected: (
    value: { displayName: string; email: string } | null
  ) => void;
  setPrimaryNetworkSelected: (
    value: { name: string; link: string } | null
  ) => void;
  setSubNetworkSelected: (value: { name: string; link: string } | null) => void;
  setSubNetworkList: (value: { name: string; link: string }[]) => void;
  setSharedNetworkSelected: (
    value: { name: string; network: string; subnetwork: string } | null
  ) => void;
  setScheduleMode: (value: scheduleMode) => void;
  setScheduleField: (value: string) => void;
  setStartDate: (value: dayjs.Dayjs | null) => void;
  setEndDate: (value: dayjs.Dayjs | null) => void;
  setMaxRuns: (value: string) => void;
  setEditMode: (value: boolean) => void;
  setJobNameSelected?: (value: string) => void;
  setGcsPath: (value: string) => void;
  setIsApiError: (value: boolean) => void;
  setApiError: (value: string) => void;
  setExecutionPageListFlag: (value: boolean) => void;

  constructor(
    app: JupyterLab,
    settingRegistry: ISettingRegistry,
    themeManager: IThemeManager,
    setExecutionPageFlag: (value: boolean) => void,
    setJobId: (value: string) => void,
    setCreateCompleted: (value: boolean) => void,
    setInputFileSelected: (value: string) => void,
    region: string,
    setRegion: (value: string) => void,
    setMachineTypeSelected: (value: string | null) => void,
    setAcceleratedCount: (value: string | null) => void,
    setAcceleratorType: (value: string | null) => void,
    setKernelSelected: (value: string | null) => void,
    setCloudStorage: (value: string | null) => void,
    setDiskTypeSelected: (value: string | null) => void,
    setDiskSize: (value: string) => void,
    setParameterDetail: (value: string[]) => void,
    setParameterDetailUpdated: (value: string[]) => void,
    setServiceAccountSelected: (
      value: { displayName: string; email: string } | null
    ) => void,
    setPrimaryNetworkSelected: (
      value: { name: string; link: string } | null
    ) => void,
    setSubNetworkSelected: (
      value: { name: string; link: string } | null
    ) => void,
    setSubNetworkList: (value: { name: string; link: string }[]) => void,
    setSharedNetworkSelected: (
      value: { name: string; network: string; subnetwork: string } | null
    ) => void,
    setScheduleMode: (value: scheduleMode) => void,
    setScheduleField: (value: string) => void,
    setStartDate: (value: dayjs.Dayjs | null) => void,
    setEndDate: (value: dayjs.Dayjs | null) => void,
    setMaxRuns: (value: string) => void,
    setEditMode: (value: boolean) => void,
    setGcsPath: (value: string) => void,
    setIsApiError: (value: boolean) => void,
    setApiError: (value: string) => void,
    setExecutionPageListFlag: (value: boolean) => void,
    setJobNameSelected?: (value: string) => void
  ) {
    super(themeManager);
    this.app = app;
    this.settingRegistry = settingRegistry;
    this.setExecutionPageFlag = setExecutionPageFlag;
    this.setJobId = setJobId;
    this.setCreateCompleted = setCreateCompleted;
    this.setInputFileSelected = setInputFileSelected;
    this.region = region;
    this.setRegion = setRegion;
    this.setMachineTypeSelected = setMachineTypeSelected;
    this.setAcceleratedCount = setAcceleratedCount;
    this.setAcceleratorType = setAcceleratorType;
    this.setKernelSelected = setKernelSelected;
    this.setCloudStorage = setCloudStorage;
    this.setDiskTypeSelected = setDiskTypeSelected;
    this.setDiskSize = setDiskSize;
    this.setParameterDetail = setParameterDetail;
    this.setParameterDetailUpdated = setParameterDetailUpdated;
    this.setServiceAccountSelected = setServiceAccountSelected;
    this.setPrimaryNetworkSelected = setPrimaryNetworkSelected;
    this.setSubNetworkSelected = setSubNetworkSelected;
    this.setSubNetworkList = setSubNetworkList;
    this.setSharedNetworkSelected = setSharedNetworkSelected;
    this.setScheduleMode = setScheduleMode;
    this.setScheduleField = setScheduleField;
    this.setStartDate = setStartDate;
    this.setEndDate = setEndDate;
    this.setMaxRuns = setMaxRuns;
    this.setEditMode = setEditMode;
    this.setJobNameSelected = setJobNameSelected;
    this.setExecutionPageFlag = setExecutionPageFlag;
    this.setIsApiError = setIsApiError;
    this.setApiError = setApiError;
    this.setGcsPath = setGcsPath;
    this.setExecutionPageListFlag = setExecutionPageListFlag;
  }
  renderInternal(): React.JSX.Element {
    return (
      <VertexScheduleJobs
        app={this.app}
        settingRegistry={this.settingRegistry}
        themeManager={this.themeManager}
        setJobId={this.setJobId}
        setCreateCompleted={this.setCreateCompleted}
        setInputFileSelected={this.setInputFileSelected}
        region={this.region}
        setRegion={this.setRegion}
        setMachineTypeSelected={this.setMachineTypeSelected}
        setAcceleratedCount={this.setAcceleratedCount}
        setAcceleratorType={this.setAcceleratorType}
        setKernelSelected={this.setKernelSelected}
        setCloudStorage={this.setCloudStorage}
        setDiskTypeSelected={this.setDiskTypeSelected}
        setDiskSize={this.setDiskSize}
        setParameterDetail={this.setParameterDetail}
        setParameterDetailUpdated={this.setParameterDetailUpdated}
        setServiceAccountSelected={this.setServiceAccountSelected}
        setPrimaryNetworkSelected={this.setPrimaryNetworkSelected}
        setSubNetworkSelected={this.setSubNetworkSelected}
        setSubNetworkList={this.setSubNetworkList}
        setSharedNetworkSelected={this.setSharedNetworkSelected}
        setScheduleMode={this.setScheduleMode}
        setScheduleField={this.setScheduleField}
        setStartDate={this.setStartDate}
        setEndDate={this.setEndDate}
        setMaxRuns={this.setMaxRuns}
        setEditMode={this.setEditMode}
        setGcsPath={this.setGcsPath}
        setExecutionPageFlag={this.setExecutionPageFlag}
        setIsApiError={this.setIsApiError}
        setApiError={this.setApiError}
        setExecutionPageListFlag={this.setExecutionPageListFlag}
      />
    );
  }
}

export default VertexScheduleJobs;
