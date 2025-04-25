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
import { toast } from 'react-toastify';
import { requestAPI } from '../handler/Handler';
import { SchedulerLoggingService, LOG_LEVEL } from './LoggingService';
import { showToast, toastifyCustomStyle } from '../utils/Config';
import {
  ICreatePayload,
  IVertexScheduleList,
  IVertexScheduleRunList,
  IDeleteSchedulerAPIResponse,
  IMachineType,
  ISchedulerData,
  ITriggerSchedule,
  IUpdateSchedulerAPIResponse
} from '../scheduler/vertex/VertexInterfaces';
import dayjs, { Dayjs } from 'dayjs';
import { scheduleMode } from '../utils/Const';
import { Dispatch, SetStateAction } from 'react';

export class VertexServices {
  static machineTypeAPIService = async (
    region: string,
    setMachineTypeList: (value: IMachineType[]) => void,
    setMachineTypeLoading: (value: boolean) => void,
    setIsApiError: (value: boolean) => void,
    setApiError: (value: string) => void
  ) => {
    try {
      setMachineTypeLoading(true);
      const formattedResponse: any = await requestAPI(
        `api/vertex/uiConfig?region_id=${region}`
      );
      if (formattedResponse.length > 0) {
        setMachineTypeList(formattedResponse);
      } else if (formattedResponse.length === undefined) {
        try {
          if (formattedResponse.error.code === 403) {
            setIsApiError(true);
            setApiError(formattedResponse.error.message);
          }
        } catch (error) {
          showToast(
            'Error fetching machine type list. Please try again later.'
          );
        }
      } else {
        setMachineTypeList([]);
      }
      setMachineTypeLoading(false);
    } catch (error) {
      setMachineTypeList([]);
      setMachineTypeLoading(false);
      SchedulerLoggingService.log(
        'Error listing machine type',
        LOG_LEVEL.ERROR
      );
      toast.error('Failed to fetch machine type list', toastifyCustomStyle);
    }
  };
  static createVertexSchedulerService = async (
    payload: ICreatePayload,
    setCreateCompleted: (value: boolean) => void,
    setCreatingVertexScheduler: (value: boolean) => void
  ) => {
    setCreatingVertexScheduler(true);
    try {
      const data: any = await requestAPI('api/vertex/createJobScheduler', {
        body: JSON.stringify(payload),
        method: 'POST'
      });
      if (data.error) {
        if (data.error.includes(':')) {
          toast.error(data.error.split(':')[0], toastifyCustomStyle);
          setCreatingVertexScheduler(false);
        } else {
          toast.error(data.error, toastifyCustomStyle);
          setCreatingVertexScheduler(false);
        }
      } else {
        toast.success(
          `Job ${payload.display_name} successfully created`,
          toastifyCustomStyle
        );
        setCreatingVertexScheduler(false);
        setCreateCompleted(true);
      }
    } catch (reason) {
      setCreatingVertexScheduler(false);
      toast.error(
        `Error on POST {dataToSend}.\n${reason}`,
        toastifyCustomStyle
      );
    }
  };

  static editVertexJobSchedulerService = async (
    jobId: string,
    region: string,
    payload: ICreatePayload,
    setCreateCompleted: (value: boolean) => void,
    setCreatingVertexScheduler: (value: boolean) => void,
    gcsPath: string,
    setEditMode: (value: boolean) => void
  ) => {
    setCreatingVertexScheduler(true);
    if (gcsPath) {
      payload.gcs_notebook_source = gcsPath;
    }

    try {
      const data: any = await requestAPI(
        `api/vertex/updateSchedule?region_id=${region}&schedule_id=${jobId}`,
        {
          body: JSON.stringify(payload),
          method: 'POST'
        }
      );
      if (data.error) {
        if (data.error.includes(':')) {
          toast.error(data.error.split(':')[0], toastifyCustomStyle);
          setCreatingVertexScheduler(false);
        } else {
          toast.error(data.error, toastifyCustomStyle);
          setCreatingVertexScheduler(false);
        }
      } else {
        toast.success(
          `Job ${payload.display_name} successfully updated`,
          toastifyCustomStyle
        );
        setCreatingVertexScheduler(false);
        setCreateCompleted(true);
        setEditMode(false);
      }
    } catch (reason) {
      setCreatingVertexScheduler(false);
      toast.error(
        `Error on POST {dataToSend}.\n${reason}`,
        toastifyCustomStyle
      );
    }
  };
  static listVertexSchedules = async (
    setVertexScheduleList: (
      value:
        | IVertexScheduleList[]
        | ((prevItems: IVertexScheduleList[]) => IVertexScheduleList[])
    ) => void,
    region: string,
    setIsLoading: (value: boolean) => void,
    setIsApiError: (value: boolean) => void,
    setApiError: (value: string) => void,
    setNextPageToken: (value: string | null) => void, // function for setting the next page token
    newPageToken: string | null | undefined, // token of page to be fetched
    pageLength: number = 50, // number of items to be fetched
    setHasNextPageToken: (value: boolean) => void, // true if there are more items that were not fetched
    abortControllers?: any
  ) => {
    setIsLoading(true);
    setIsApiError(false);
    setApiError('');

    try {
      const serviceURL = 'api/vertex/listSchedules';
      let urlparam = `?region_id=${region}&page_size=${pageLength}`;
      if (newPageToken) {
        urlparam += `&page_token=${newPageToken}`;
      }

      // API call
      const formattedResponse = await requestAPI(serviceURL + urlparam);

      if (!formattedResponse || Object.keys(formattedResponse).length === 0) {
        setVertexScheduleList([]);
        setNextPageToken(null);
        setHasNextPageToken(false);
        return;
      }

      // Define the expected type for formattedResponse
      interface IFormattedResponse {
        schedules?: IVertexScheduleList[];
        nextPageToken?: string;
        error?: { code: number; message: string };
      }

      const { schedules, nextPageToken, error } =
        formattedResponse as IFormattedResponse;

      // Handle API error
      if (error?.code === 403) {
        setIsApiError(true);
        setApiError(error.message);
        return;
      }

      // Handle schedule data
      if (schedules && schedules.length > 0) {
        setVertexScheduleList(schedules);

        // Handle pagination
        if (nextPageToken) {
          setNextPageToken(nextPageToken);
          setHasNextPageToken(true);
        } else {
          setNextPageToken(null);
          setHasNextPageToken(false);
        }

        // Adding a slight delay for DOM refresh
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Fetch Last run status asynchronously without waiting for completion
        schedules.forEach((schedule: IVertexScheduleList) => {
          // Triggering fetch asynchronously
          fetchLastFiveRunStatus(
            schedule,
            region,
            setVertexScheduleList,
            abortControllers
          );
        });

        setIsLoading(false); // Stop loading after everything is complete
      } else {
        setVertexScheduleList([]);
        setNextPageToken(null);
        setHasNextPageToken(false);
        setIsLoading(false);
      }
    } catch (error) {
      // Handle errors during the API call
      setVertexScheduleList([]);
      setNextPageToken(null);
      setHasNextPageToken(false);
      setIsApiError(true);
      setApiError('An error occurred while fetching schedules.');
      SchedulerLoggingService.log(
        'Error listing vertex schedules',
        LOG_LEVEL.ERROR
      );
    } finally {
      setIsLoading(false); // Ensure loading is stopped
    }
  };

  static handleUpdateSchedulerPauseAPIService = async (
    scheduleId: string,
    region: string,
    displayName: string,
    setResumeLoading: (value: string) => void
  ) => {
    setResumeLoading(scheduleId);
    try {
      const serviceURL = 'api/vertex/pauseSchedule';
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&&schedule_id=${scheduleId}`
      );
      if (Object.keys(formattedResponse).length === 0) {
        toast.success(
          `Schedule ${displayName} updated successfully`,
          toastifyCustomStyle
        );
        setResumeLoading('');
      } else {
        setResumeLoading('');
        SchedulerLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
        toast.error('Failed to pause schedule');
      }
    } catch (error) {
      setResumeLoading('');
      SchedulerLoggingService.log('Error in pause schedule', LOG_LEVEL.ERROR);
      toast.error(`Failed to pause schedule : ${error}`, toastifyCustomStyle);
    }
  };

  static handleUpdateSchedulerResumeAPIService = async (
    scheduleId: string,
    region: string,
    displayName: string,
    setResumeLoading: (value: string) => void
  ) => {
    setResumeLoading(scheduleId);
    try {
      const serviceURL = 'api/vertex/resumeSchedule';
      const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
      );
      if (Object.keys(formattedResponse).length === 0) {
        toast.success(
          `Schedule ${displayName} updated successfully`,
          toastifyCustomStyle
        );
        setResumeLoading('');
      } else {
        setResumeLoading('');
        SchedulerLoggingService.log(
          'Error in resume schedule',
          LOG_LEVEL.ERROR
        );
        toast.error('Failed to resume schedule');
      }
    } catch (error) {
      setResumeLoading('');
      SchedulerLoggingService.log('Error in resume schedule', LOG_LEVEL.ERROR);
      toast.error(`Failed to resume schedule : ${error}`, toastifyCustomStyle);
    }
  };

  static triggerSchedule = async (
    region: string,
    scheduleId: string,
    displayName: string,
    setTriggerLoading: (value: string) => void
  ) => {
    setTriggerLoading(scheduleId);
    try {
      const serviceURL = 'api/vertex/triggerSchedule';
      const data: ITriggerSchedule = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
      );
      if (data.name) {
        setTriggerLoading('');
        toast.success(
          `${displayName} triggered successfully `,
          toastifyCustomStyle
        );
      } else {
        setTriggerLoading('');
        toast.error(`Failed to Trigger ${displayName}`, toastifyCustomStyle);
      }
    } catch (reason) {
      setTriggerLoading('');
      toast.error(
        `Failed to Trigger ${displayName} : ${reason}`,
        toastifyCustomStyle
      );
    }
  };

  static handleDeleteSchedulerAPIService = async (
    region: string,
    scheduleId: string,
    displayName: string,
    setVertexScheduleList: (
      value:
        | IVertexScheduleList[]
        | ((prevItems: IVertexScheduleList[]) => IVertexScheduleList[])
    ) => void,
    setIsLoading: (value: boolean) => void,
    setIsApiError: (value: boolean) => void,
    setApiError: (value: string) => void,
    setNextPageToken: (value: string | null) => void,
    newPageToken: string | null | undefined,
    pageLength: number = 50,
    hasNextPage: (value: boolean) => void
  ) => {
    try {
      const serviceURL = 'api/vertex/deleteSchedule';
      const deleteResponse: IDeleteSchedulerAPIResponse = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`,
        { method: 'DELETE' }
      );
      if (deleteResponse.done) {
        await VertexServices.listVertexSchedules(
          setVertexScheduleList,
          region,
          setIsLoading,
          setIsApiError,
          setApiError,
          setNextPageToken,
          newPageToken,
          pageLength,
          hasNextPage
        );
        toast.success(
          `Deleted job ${displayName}. It might take a few minutes to for it to be deleted from the list of jobs.`,
          toastifyCustomStyle
        );
      } else {
        toast.error(`Failed to delete the ${displayName}`, toastifyCustomStyle);
      }
    } catch (error) {
      SchedulerLoggingService.log('Error in Delete api', LOG_LEVEL.ERROR);
      toast.error(
        `Failed to delete the ${displayName} : ${error}`,
        toastifyCustomStyle
      );
    }
  };

  static editVertexSchedulerService = async (
    scheduleId: string,
    region: string,
    setInputNotebookFilePath: (value: string) => void,
    setEditNotebookLoading: (value: string) => void
  ) => {
    setEditNotebookLoading(scheduleId);
    try {
      const serviceURL = 'api/vertex/getSchedule';
      const formattedResponse: any = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${scheduleId}`
      );
      if (
        Object.prototype.hasOwnProperty.call(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob,
          'gcsNotebookSource'
        )
      ) {
        setInputNotebookFilePath(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.gcsNotebookSource.uri
        );
      } else {
        setEditNotebookLoading('');
        toast.error('File path not found', toastifyCustomStyle);
      }
    } catch (reason) {
      setEditNotebookLoading('');
      toast.error(
        `Error in updating notebook.\n${reason}`,
        toastifyCustomStyle
      );
    }
  };

  static editVertexSJobService = async (
    job_id: string,
    region: string,
    setEditDagLoading: (value: string) => void,
    setCreateCompleted: (value: boolean) => void,
    setInputFileSelected: (value: string) => void,
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
    setScheduleMode: (value: scheduleMode) => void,
    setScheduleField: (value: string) => void,
    setStartDate: (value: dayjs.Dayjs | null) => void,
    setEndDate: (value: dayjs.Dayjs | null) => void,
    setMaxRuns: (value: string) => void,
    setEditMode: (value: boolean) => void,
    setJobNameSelected: (value: string) => void,
    setGcsPath: (value: string) => void
  ) => {
    setEditDagLoading(job_id);
    try {
      const serviceURL = 'api/vertex/getSchedule';
      const formattedResponse: any = await requestAPI(
        serviceURL + `?region_id=${region}&schedule_id=${job_id}`
      );

      if (formattedResponse && Object.keys(formattedResponse).length > 0) {
        const inputFileName =
          formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsNotebookSource.uri.split(
            '/'
          );
        setInputFileSelected(inputFileName[inputFileName.length - 1]);
        setCreateCompleted(false);
        setRegion(region);
        setJobNameSelected(formattedResponse.displayName);
        setGcsPath(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.gcsNotebookSource.uri
        );

        // Machine type selection
        setMachineTypeSelected(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.machineSpec.machineType
        );
        setAcceleratedCount(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.machineSpec
            .acceleratorCount
        );
        setAcceleratorType(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.machineSpec
            .acceleratorType
        );

        setKernelSelected(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.kernelName
        );
        setCloudStorage(
          formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.gcsOutputUri.replace(
            'gs://',
            ''
          )
        );
        setDiskTypeSelected(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.persistentDiskSpec
            .diskType
        );
        setDiskSize(
          formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.persistentDiskSpec
            .diskSizeGb
        );

        // Parameters
        if (
          Object.prototype.hasOwnProperty.call(
            formattedResponse.createNotebookExecutionJobRequest
              .notebookExecutionJob,
            'parameters'
          )
        ) {
          const parameterList = Object.keys(
            formattedResponse.createNotebookExecutionJobRequest
              .notebookExecutionJob.parameters
          ).map(
            key =>
              key +
              ':' +
              formattedResponse.createNotebookExecutionJobRequest
                .notebookExecutionJob.parameters[key]
          );
          setParameterDetail(parameterList);
          setParameterDetailUpdated(parameterList);
        }

        setServiceAccountSelected({
          displayName: '',
          email:
            formattedResponse.createNotebookExecutionJobRequest
              .notebookExecutionJob.serviceAccount
        });

        // Network
        const primaryNetwork =
          formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.networkSpec.network.split(
            '/'
          );
        setPrimaryNetworkSelected({
          name: primaryNetwork[primaryNetwork.length - 1],
          link: formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.networkSpec.network
        });
        const subnetwork =
          formattedResponse.createNotebookExecutionJobRequest.notebookExecutionJob.customEnvironmentSpec.networkSpec.subnetwork.split(
            '/'
          );
        setSubNetworkSelected({
          name: subnetwork[subnetwork.length - 1],
          link: formattedResponse.createNotebookExecutionJobRequest
            .notebookExecutionJob.customEnvironmentSpec.networkSpec.subnetwork
        });

        setSubNetworkList([
          {
            name: subnetwork[subnetwork.length - 1],
            link: subnetwork[subnetwork.length - 1]
          }
        ]);
        if (
          formattedResponse.cron === '* * * * *' &&
          formattedResponse.maxRunCount === '1'
        ) {
          setScheduleMode('runNow');
        } else {
          setScheduleMode('runSchedule');
        }
        setScheduleField(formattedResponse.cron);
        const start_time = formattedResponse.startTime;
        const end_time = formattedResponse.endTime;
        setStartDate(start_time ? dayjs(start_time) : null);
        setEndDate(end_time ? dayjs(end_time) : null);
        setMaxRuns(formattedResponse.maxRunCount);
        setEditMode(true);
      } else {
        setEditDagLoading('');
        toast.error('File path not found', toastifyCustomStyle);
      }
    } catch (reason) {
      setEditDagLoading('');
      toast.error(
        `Error in updating notebook.\n${reason}`,
        toastifyCustomStyle
      );
    }
  };

  static executionHistoryServiceList = async (
    region: string,
    schedulerData: ISchedulerData | undefined,
    selectedMonth: Dayjs | null,
    setIsLoading: (value: boolean) => void,
    setVertexScheduleRunsList: (value: IVertexScheduleRunList[]) => void,
    setBlueListDates: (value: string[]) => void,
    setGreyListDates: (value: string[]) => void,
    setOrangeListDates: (value: string[]) => void,
    setRedListDates: (value: string[]) => void,
    setGreenListDates: (value: string[]) => void,
    setDarkGreenListDates: (value: string[]) => void
  ) => {
    setIsLoading(true);
    const selected_month = selectedMonth && selectedMonth.toISOString();
    const schedule_id = schedulerData?.name.split('/').pop();
    const serviceURL = 'api/vertex/listNotebookExecutionJobs';
    const formattedResponse: any = await requestAPI(
      serviceURL +
        `?region_id=${region}&schedule_id=${schedule_id}&start_date=${selected_month}&order_by=createTime desc`
    );
    try {
      let transformDagRunListDataCurrent = [];
      if (formattedResponse && formattedResponse.length > 0) {
        transformDagRunListDataCurrent = formattedResponse.map(
          (jobRun: any) => {
            const createTime = new Date(jobRun.createTime);
            const updateTime = new Date(jobRun.updateTime);
            const timeDifferenceMilliseconds =
              updateTime.getTime() - createTime.getTime(); // Difference in milliseconds
            const totalSeconds = Math.floor(timeDifferenceMilliseconds / 1000); // Convert to seconds
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            let codeValue = '',
              statusMessage = '';
            if (Object.hasOwn(jobRun, 'status')) {
              codeValue = jobRun.status.code;
              statusMessage = jobRun.status.message;
            }

            return {
              jobRunId: jobRun.name.split('/').pop(),
              startDate: jobRun.createTime,
              endDate: jobRun.updateTime,
              gcsUrl: jobRun.gcsOutputUri,
              state: jobRun.jobState.split('_')[2].toLowerCase(),
              date: new Date(jobRun.createTime).toDateString(),
              fileName: jobRun.gcsNotebookSource.uri.split('/').pop(),
              time: `${minutes} min ${seconds} sec`,
              code:
                jobRun.jobState === 'JOB_STATE_FAILED'
                  ? (codeValue ?? '')
                  : '-',
              statusMessage:
                jobRun.jobState === 'JOB_STATE_FAILED'
                  ? (statusMessage ?? '')
                  : '-'
            };
          }
        );
      }

      // Group data by date and state
      const groupedDataByDateStatus = transformDagRunListDataCurrent.reduce(
        (result: any, item: any) => {
          const date = item.date; // Group by date
          const status = item.state; // Group by state

          if (!result[date]) {
            result[date] = {};
          }

          if (!result[date][status]) {
            result[date][status] = [];
          }

          result[date][status].push(item);

          return result;
        },
        {}
      );

      // Initialize grouping lists
      const blueList: string[] = [];
      const greyList: string[] = [];
      const orangeList: string[] = [];
      const redList: string[] = [];
      const greenList: string[] = [];
      const darkGreenList: string[] = [];

      // Process grouped data
      Object.keys(groupedDataByDateStatus).forEach(dateValue => {
        if (groupedDataByDateStatus[dateValue].running) {
          blueList.push(dateValue);
        } else if (groupedDataByDateStatus[dateValue].queued) {
          greyList.push(dateValue);
        } else if (
          groupedDataByDateStatus[dateValue].failed &&
          groupedDataByDateStatus[dateValue].succeeded
        ) {
          orangeList.push(dateValue);
        } else if (groupedDataByDateStatus[dateValue].failed) {
          redList.push(dateValue);
        } else if (
          groupedDataByDateStatus[dateValue].succeeded &&
          groupedDataByDateStatus[dateValue].succeeded.length === 1
        ) {
          greenList.push(dateValue);
        } else {
          darkGreenList.push(dateValue);
        }
      });

      // Update state lists with their respective transformations
      setBlueListDates(blueList);
      setGreyListDates(greyList);
      setOrangeListDates(orangeList);
      setRedListDates(redList);
      setGreenListDates(greenList);
      setDarkGreenListDates(darkGreenList);
      setVertexScheduleRunsList(transformDagRunListDataCurrent);
    } catch (error) {
      toast.error(
        'Error in fetching the execution history',
        toastifyCustomStyle
      );
    }
    setIsLoading(false);
  };

  //Funtion to check weather output file exists or not
  static outputFileExists = async (
    bucketName: string | undefined,
    jobRunId: string | undefined,
    fileName: string | undefined,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    setFileExists: Dispatch<SetStateAction<boolean>>
  ) => {
    try {
      const formattedResponse = await requestAPI(
        `api/storage/outputFileExists?bucket_name=${bucketName}&job_run_id=${jobRunId}&file_name=${fileName}`
      );
      setFileExists(formattedResponse === 'true' ? true : false);
      setIsLoading(false);
    } catch (lastRunError: any) {
      SchedulerLoggingService.log(
        'Error checking output file',
        LOG_LEVEL.ERROR
      );
    }
  };
}

//Funtion to fetch last five run status for Scheduler Listing screen.
async function fetchLastFiveRunStatus(
  schedule: any,
  region: string,
  setVertexScheduleList: (
    value:
      | IVertexScheduleList[]
      | ((prevItems: IVertexScheduleList[]) => IVertexScheduleList[])
  ) => void,
  abortControllers: any
): Promise<any> {
  // Controller to abort pending API call
  const controller = new AbortController();
  abortControllers.current.push(controller);
  const signal = controller.signal;

  //Extract Schedule id from schedule name.
  const scheduleId = schedule.name.split('/').pop();
  const serviceURLLastRunResponse = 'api/vertex/listNotebookExecutionJobs';
  try {
    const jobExecutionList: any[] = await requestAPI(
      serviceURLLastRunResponse +
        `?region_id=${region}&schedule_id=${scheduleId}&page_size=5&order_by=createTime desc`,
      { signal }
    );

    const lastFiveRun = jobExecutionList.map((job: any) => job.jobState);
    schedule.jobState = lastFiveRun;

    setVertexScheduleList((prevItems: IVertexScheduleList[]) =>
      prevItems.map(prevItem =>
        prevItem.displayName === schedule.name
          ? { ...prevItem, jobState: lastFiveRun }
          : prevItem
      )
    );
  } catch (lastRunError: any) {
    setVertexScheduleList((prevItems: IVertexScheduleList[]) =>
      prevItems.map(prevItem =>
        prevItem.displayName === schedule.name
          ? { ...prevItem, jobState: [] }
          : prevItem
      )
    );
    SchedulerLoggingService.log(
      'Error fetching last five job executions',
      LOG_LEVEL.ERROR
    );
  }
}
