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

import { requestAPI } from '../../handler/Handler';
import { LOG_LEVEL, SchedulerLoggingService } from '../common/LoggingService';
import { JupyterLab } from '@jupyterlab/application';
import {
  ABORT_MESSAGE,
  HTTP_STATUS_BAD_REQUEST,
  scheduleMode
} from '../../utils/Constants';
import {
  IClusterAPIResponse,
  IComposerEnvAPIResponse,
  IComposerSchedulePayload,
  IDagList,
  IDagRunList,
  ILoadingStateComposer,
  ISchedulerDagData,
  IUpdateSchedulerAPIResponse,
  IListDagInfoAPIServiceResponse
} from '../../interfaces/ComposerInterface';
import { Notification } from '@jupyterlab/apputils';
import { toast } from 'react-toastify';
import { handleErrorToast } from '../../components/common/notificationHandling/ErrorUtils';
import { toastifyCustomStyle } from '../../components/common/notificationHandling/Config';
import { Dispatch, SetStateAction } from 'react';
import { IDropdownOption } from '../../interfaces/FormInterface';

export class ComposerServices {
  static readonly listClustersAPIService = async (
    setClusterOptions: Dispatch<SetStateAction<IDropdownOption[]>>,
    setLoadingState?: Dispatch<SetStateAction<ILoadingStateComposer>>,
    nextPageToken?: string,
    previousClustersList?: (value: string[]) => void
  ) => {
    const pageToken = nextPageToken ?? '';
    try {
      if (setLoadingState) {
        setLoadingState(prev => ({ ...prev, cluster: true }));
      }
      const serviceURL = `clusterList?pageSize=500&pageToken=${pageToken}`;

      const formattedResponse: any = await requestAPI(serviceURL);
      let transformClusterListData = [];
      if (formattedResponse?.clusters) {
        transformClusterListData = formattedResponse?.clusters?.map(
          (data: IClusterAPIResponse) => {
            return {
              clusterName: data.clusterName
            };
          }
        );
      }
      const existingClusterData = previousClustersList ?? [];
      //setStateAction never type issue
      const allClustersData: any = [
        ...(existingClusterData as []),
        ...transformClusterListData
      ];

      if (formattedResponse.nextPageToken) {
        this.listClustersAPIService(
          setClusterOptions,
          formattedResponse.nextPageToken,
          allClustersData
        );
      } else {
        const transformClusterListData = allClustersData;

        const keyLabelStructure = transformClusterListData.map(
          (obj: { clusterName: string }) => ({
            label: obj.clusterName,
            value: obj.clusterName
          })
        );

        setClusterOptions(keyLabelStructure);
      }
      if (formattedResponse?.error) {
        handleErrorToast({
          error: formattedResponse?.error
        });
        if (setLoadingState) {
          setLoadingState(prev => ({ ...prev, cluster: false }));
        }
      }
    } catch (error) {
      if (setLoadingState) {
        setLoadingState(prev => ({ ...prev, cluster: false }));
      }
      SchedulerLoggingService.log('Error listing clusters', LOG_LEVEL.ERROR);
      const errorResponse = `Failed to fetch clusters : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly listSessionTemplatesAPIService = async (
    setServerlessOptions: Dispatch<SetStateAction<IDropdownOption[]>>,
    setLoadingState?: Dispatch<SetStateAction<ILoadingStateComposer>>,
    setIsLoadingKernelDetail?: (value: boolean) => void,
    nextPageToken?: string,
    previousSessionTemplatesList?: object
  ) => {
    const pageToken = nextPageToken ?? '';
    if (setIsLoadingKernelDetail) {
      setIsLoadingKernelDetail(true);
    }
    try {
      if (setLoadingState) {
        setLoadingState(prev => ({ ...prev, serverless: true }));
      }
      const serviceURL = `runtimeList?pageSize=500&pageToken=${pageToken}`;

      const formattedResponse: any = await requestAPI(serviceURL);
      let transformSessionTemplateListData = [];
      if (
        formattedResponse &&
        Object.hasOwn(formattedResponse, 'sessionTemplates')
      ) {
        transformSessionTemplateListData = formattedResponse.sessionTemplates
          .filter((item: any) => Object.hasOwn(item, 'jupyterSession'))
          .map((data: any) => {
            return {
              serverlessName: data.jupyterSession.displayName,
              serverlessData: data
            };
          });
      }
      const existingSessionTemplateData = previousSessionTemplatesList ?? [];
      //setStateAction never type issue
      const allSessionTemplatesData: any = [
        ...(existingSessionTemplateData as []),
        ...transformSessionTemplateListData
      ];

      if (formattedResponse.nextPageToken) {
        this.listSessionTemplatesAPIService(
          // setServerlessDataList,
          setServerlessOptions,
          formattedResponse.nextPageToken,
          allSessionTemplatesData
        );
      } else {
        const transformSessionTemplateListData = allSessionTemplatesData;
        const keyLabelStructure = transformSessionTemplateListData.map(
          (obj: { serverlessName: string }) => ({
            label: obj.serverlessName,
            value: obj.serverlessName
          })
        );

        // setServerlessDataList(transformSessionTemplateListData);
        setServerlessOptions(keyLabelStructure);
        if (setIsLoadingKernelDetail) {
          setIsLoadingKernelDetail(false);
        }
      }
      if (formattedResponse?.error) {
        handleErrorToast({
          error: formattedResponse?.error
        });
        if (setLoadingState) {
          setLoadingState(prev => ({ ...prev, serverless: false }));
        }
      }
    } catch (error) {
      if (setLoadingState) {
        setLoadingState(prev => ({ ...prev, serverless: false }));
      }
      SchedulerLoggingService.log(
        'Error listing session templates',
        LOG_LEVEL.ERROR
      );
      const errorResponse = `Failed to fetch session templates : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly listComposersAPIService = async (
    projectId: string,
    region: string
  ): Promise<IDropdownOption[]> => {
    const formattedResponse: IComposerEnvAPIResponse[] = await requestAPI(
      `composerList?project_id=${projectId}&region_id=${region}`
    );

    if (!Array.isArray(formattedResponse)) {
      // This custom error will now be thrown and caught by the caller.
      throw new Error('Invalid response format for composer environments');
    }

    const environmentOptions: IDropdownOption[] = formattedResponse.map(
      (env: IComposerEnvAPIResponse) => ({
        label: env.label,
        value: env.name
      })
    );
    environmentOptions.sort((a, b) => a.label.localeCompare(b.label));

    return environmentOptions;
  };
  static readonly createJobSchedulerService = async (
    payload: IComposerSchedulePayload,
    app: JupyterLab,
    setCreateCompleted: (value: boolean) => void,
    setCreatingScheduler: (value: boolean) => void,
    editMode: boolean,
    projectId: string,
    region: string,
    selectedMode: string,
    packageInstalledList: string[],
    setPackageEditFlag: (value: boolean) => void
  ) => {
    setCreatingScheduler(true);
    try {
      const data: any = await requestAPI(
        `createJobScheduler?project_id=${projectId}&region_id=${region}`,
        {
          body: JSON.stringify(payload),
          method: 'POST'
        }
      );
      if (data?.error) {
        handleErrorToast({
          error: data.error
        });
        setCreatingScheduler(false);
      } else {
        if (editMode) {
          Notification.success('Job scheduler successfully updated', {
            autoClose: false
          });
          if (packageInstalledList.length > 0) {
            Notification.success(
              'Installation of packages will take sometime',
              {
                autoClose: false
              }
            );
          }
          setPackageEditFlag(false);
        } else {
          Notification.success('Job scheduler successfully created', {
            autoClose: false
          });
          if (packageInstalledList.length > 0) {
            Notification.success(
              'Installation of packages will take sometime',
              {
                autoClose: false
              }
            );
          }
        }
        setCreatingScheduler(false);
        setCreateCompleted(true);
      }
    } catch (reason) {
      setCreatingScheduler(false);
      handleErrorToast({
        error: reason
      });
    }
  };

  static readonly editNotebookSchedulerService = async (
    bucketName: string,
    dagId: string
  ): Promise<any> => {
    const serviceURL = `editJobScheduler?&dag_id=${dagId}&bucket_name=${bucketName}`;
    const formattedResponse: any = await requestAPI(serviceURL, {
      method: 'POST'
    });
    return formattedResponse;
  };

  static readonly editJobSchedulerService = async (
    bucketName: string,
    dagId: string,
    composerEnvSelected: IComposerEnvAPIResponse | null,
    setEditDagLoading: (value: string) => void,
    setIsLocalKernel: (value: boolean) => void,
    setPackageEditFlag: (value: boolean) => void,
    setCreateCompleted?: (value: boolean) => void,
    setJobNameSelected?: (value: string) => void,
    setComposerEnvSelected?: (value: IComposerEnvAPIResponse | null) => void,
    setScheduleMode?: (value: scheduleMode) => void,
    setScheduleValue?: (value: string) => void,
    setInputFileSelected?: (value: string) => void,
    setParameterDetail?: (value: string[]) => void,
    setParameterDetailUpdated?: (value: string[]) => void,
    setSelectedMode?: (value: string) => void,
    setClusterSelected?: (value: string) => void,
    setServerlessSelected?: (value: string) => void,
    setServerlessDataSelected?: (value: Record<string, never>) => void,
    serverlessDataList?: string[],
    setServerlessDataList?: (value: string[]) => void,
    setServerlessList?: (value: string[]) => void,
    setRetryCount?: (value: number) => void,
    setRetryDelay?: (value: number) => void,
    setEmailOnFailure?: (value: boolean) => void,
    setEmailonRetry?: (value: boolean) => void,
    setEmailOnSuccess?: (value: boolean) => void,
    setEmailList?: (value: string[]) => void,
    setStopCluster?: (value: boolean) => void,
    setTimeZoneSelected?: (value: string) => void,
    setEditMode?: (value: boolean) => void,
    setIsLoadingKernelDetail?: (value: boolean) => void,
    region?: string,
    setRegion?: (value: string) => void,
    projectId?: string,
    setProjectId?: (value: string) => void
  ) => {
    setEditDagLoading(dagId);
    if (region && setRegion) {
      setRegion(region);
    }
    if (projectId && setProjectId) {
      setProjectId(projectId);
    }
    try {
      const serviceURL = `editJobScheduler?&dag_id=${dagId}&bucket_name=${bucketName}`;
      const formattedResponse: any = await requestAPI(serviceURL, {
        method: 'POST'
      });
      if (
        setCreateCompleted &&
        setJobNameSelected &&
        setComposerEnvSelected &&
        setScheduleMode &&
        setScheduleValue &&
        setInputFileSelected &&
        setParameterDetail &&
        setParameterDetailUpdated &&
        setSelectedMode &&
        setClusterSelected &&
        setServerlessSelected &&
        setServerlessDataSelected &&
        serverlessDataList &&
        setServerlessDataList &&
        setServerlessList &&
        setRetryCount &&
        setRetryDelay &&
        setEmailOnFailure &&
        setEmailonRetry &&
        setEmailOnSuccess &&
        setEmailList &&
        setStopCluster &&
        setTimeZoneSelected &&
        setEditMode &&
        dagId !== null
      ) {
        setJobNameSelected(dagId);
        setComposerEnvSelected(composerEnvSelected);
        setInputFileSelected(formattedResponse.input_filename);

        if (formattedResponse.mode_selected === 'local') {
          setIsLocalKernel(true);
          setPackageEditFlag(true);
          if (formattedResponse.parameters.length > 0) {
            const parameterList = formattedResponse.parameters[0]
              .split(',')
              .map((item: any) => item.trim());
            setParameterDetail(parameterList);
            setParameterDetailUpdated(parameterList);
          }
        } else {
          setParameterDetail(formattedResponse.parameters);
          setParameterDetailUpdated(formattedResponse.parameters);
        }

        setSelectedMode(formattedResponse.mode_selected);
        setClusterSelected(formattedResponse.cluster_name);
        setServerlessSelected(formattedResponse.serverless_name);
        if (formattedResponse.mode_selected === 'serverless') {
          // await this.listSessionTemplatesAPIService(
          //   setServerlessDataList,
          //   setServerlessList,
          //   setIsLoadingKernelDetail
          // );
          if (serverlessDataList.length > 0) {
            const selectedData: any = serverlessDataList.filter(
              (serverless: any) => {
                return (
                  serverless.serverlessName ===
                  formattedResponse.serverless_name
                );
              }
            );
            if (selectedData.length > 0) {
              setServerlessDataSelected(selectedData[0].serverlessData);
            }
          }
        }
        setRetryCount(formattedResponse.retry_count);
        setRetryDelay(formattedResponse.retry_delay);
        formattedResponse.email_failure.toLowerCase() === 'true'
          ? setEmailOnFailure(true)
          : setEmailOnFailure(false);
        formattedResponse.email_delay.toLowerCase() === 'true'
          ? setEmailonRetry(true)
          : setEmailonRetry(false);
        formattedResponse.email_success.toLowerCase() === 'true'
          ? setEmailOnSuccess(true)
          : setEmailOnSuccess(false);
        setEmailList(formattedResponse.email);
        formattedResponse.stop_cluster.toLowerCase() === 'true'
          ? setStopCluster(true)
          : setStopCluster(false);
        if (formattedResponse.time_zone === '') {
          setTimeZoneSelected(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } else {
          setTimeZoneSelected(formattedResponse.time_zone);
        }
        setEditMode(true);
        setCreateCompleted(false);
        if (formattedResponse.schedule_value === '@once') {
          setScheduleMode('runNow');
          setScheduleValue('');
        } else if (formattedResponse.schedule_value !== '@once') {
          setScheduleMode('runSchedule');
          setScheduleValue(formattedResponse.schedule_value);
        }
      }
      setEditDagLoading('');
    } catch (reason) {
      setEditDagLoading('');
      const errorResponse = `Error on POST {dataToSend}.\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };

  static readonly listDagRunsListService = async (
    composerName: string,
    dagId: string,
    startDate: string,
    endDate: string,
    setDagRunsList: (value: IDagRunList[]) => void,
    setDagRunId: (value: string) => void,
    setIsLoading: (value: boolean) => void,
    setGreyListDates: (value: string[]) => void,
    setRedListDates: (value: string[]) => void,
    setGreenListDates: (value: string[]) => void,
    setDarkGreenListDates: (value: string[]) => void,
    projectId: string,
    region: string,
    currentOffsetValue?: number,
    previousDagRunDataList?: object
  ) => {
    const offset = currentOffsetValue ?? 0;
    setIsLoading(true);
    const start_date = startDate;
    const end_date = endDate;
    setGreyListDates([]);
    setRedListDates([]);
    setGreenListDates([]);
    setDarkGreenListDates([]);
    try {
      const data: any = await requestAPI(
        `dagRun?composer=${composerName}&dag_id=${dagId}&start_date=${start_date}&end_date=${end_date}&offset=${offset}&project_id=${projectId}&region_id=${region}`
      );

      let transformDagRunListDataCurrent = [];
      if (data && data?.dag_runs?.length > 0) {
        transformDagRunListDataCurrent = data.dag_runs.map((dagRun: any) => {
          if (dagRun.start_date !== null) {
            return {
              dagRunId: dagRun.dag_run_id,
              filteredDate: new Date(dagRun.start_date),
              state: dagRun.state,
              date: new Date(dagRun.start_date).toDateString(),
              time: new Date(dagRun.start_date).toTimeString().split(' ')[0]
            };
          }
        });
      }
      transformDagRunListDataCurrent = transformDagRunListDataCurrent.filter(
        (dagRunData: any) => {
          if (dagRunData) {
            return dagRunData;
          }
        }
      );
      const existingDagRunsListData = previousDagRunDataList ?? [];
      //setStateAction never type issue
      const allDagRunsListData: any = [
        ...(existingDagRunsListData as []),
        ...transformDagRunListDataCurrent
      ];

      if (data?.dag_runs?.length + offset !== data.total_entries) {
        this.listDagRunsListService(
          composerName,
          dagId,
          startDate,
          endDate,
          setDagRunsList,
          setDagRunId,
          setIsLoading,
          setGreyListDates,
          setRedListDates,
          setGreenListDates,
          setDarkGreenListDates,
          projectId,
          region,
          data.dag_runs.length + offset,
          allDagRunsListData
        );
      } else {
        const transformDagRunListData = allDagRunsListData;

        if (transformDagRunListData?.length > 0) {
          // Group by date first, then by status
          const groupedDataByDateStatus = transformDagRunListData.reduce(
            (result: any, item: any) => {
              const date = item.filteredDate;
              const status = item.state;

              result[date] ??= {};

              result[date][status] ??= [];

              result[date][status].push(item);

              return result;
            },
            {}
          );

          const greyList: string[] = [];
          const redList: string[] = [];
          const greenList: string[] = [];
          const darkGreenList: string[] = [];

          Object.keys(groupedDataByDateStatus).forEach(dateValue => {
            if (
              groupedDataByDateStatus[dateValue].running ||
              groupedDataByDateStatus[dateValue].queued
            ) {
              greyList.push(dateValue);
            } else if (groupedDataByDateStatus[dateValue].failed) {
              redList.push(dateValue);
            } else if (
              groupedDataByDateStatus[dateValue].success &&
              groupedDataByDateStatus[dateValue].success.length === 1
            ) {
              greenList.push(dateValue);
            } else {
              darkGreenList.push(dateValue);
            }
          });

          setGreyListDates(greyList);
          setRedListDates(redList);
          setGreenListDates(greenList);
          setDarkGreenListDates(darkGreenList);

          setDagRunsList(transformDagRunListData);
        } else {
          setDagRunsList([]);
          setGreyListDates([]);
          setRedListDates([]);
          setGreenListDates([]);
          setDarkGreenListDates([]);
        }
        setIsLoading(false);
      }
    } catch (reason) {
      const errorResponse = `Error in listing dag runs..\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };
  static readonly listDagInfoAPIService = async (
    composerSelected: string,
    region: string,
    project: string
  ): Promise<IListDagInfoAPIServiceResponse> => {
    try {
      const serviceURL = `dagList?composer=${composerSelected}&project_id=${project}&region_id=${region}`;
      const formattedResponse: any = await requestAPI(serviceURL);

      let transformDagListData: IDagList[] = [];
      if (formattedResponse?.length > 0) {
        transformDagListData = formattedResponse[0]?.dags?.map((dag: any) => ({
          jobid: dag.dag_id,
          notebookname: dag.dag_id,
          schedule: dag.timetable_description,
          status: dag.is_paused ? 'Paused' : 'Active',
          scheduleInterval: dag.schedule_interval?.value
        }));
      }
      return {
        dagList: transformDagListData,
        bucketName: formattedResponse[1]
      };
    } catch (error) {
      if (!toast.isActive('dagListError')) {
        const errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? error.message
            : 'Unknown error';

        toast.error(`Failed to fetch schedule list: ${errorMessage}`, {
          toastId: 'dagListError'
        });
      }
      throw error;
    }
  };
  listDagInfoAPIServiceForCreateNotebook = (
    setDagList: (value: IDagList[]) => void,
    composerSelected: string,
    setJobNameUniquenessError: React.Dispatch<React.SetStateAction<boolean>>,
    region: string,
    project: string
  ) => {
    const serviceURL = `dagList?composer=${composerSelected}&project_id=${project}&region_id=${region}`;
    requestAPI(serviceURL)
      .then((formattedResponse: any) => {
        let transformDagListData = [];
        if (formattedResponse?.[0].dags) {
          transformDagListData = formattedResponse[0].dags.map(
            (dag: ISchedulerDagData) => {
              return {
                jobid: dag.dag_id,
                notebookname: dag.dag_id,
                schedule: dag.timetable_description,
                status: dag.is_paused ? 'Paused' : 'Active',
                scheduleInterval: dag.schedule_interval?.value
              };
            }
          );
        }
        setDagList(transformDagListData);
        setJobNameUniquenessError(false);
      })
      .catch(error => {
        SchedulerLoggingService.log(
          'Error listing dag Scheduler list',
          LOG_LEVEL.ERROR
        );
        setJobNameUniquenessError(true);
      });
  };

  static readonly handleDownloadOutputNotebookAPIService = async (
    composerName: string,
    dagRunId: string,
    bucketName: string,
    dagId: string,
    setDownloadOutputDagRunId: (value: string) => void,
    projectId: string,
    region: string
  ) => {
    setDownloadOutputDagRunId(dagRunId);
    try {
      dagRunId = encodeURIComponent(dagRunId);
      const serviceURL = `downloadOutput?composer=${composerName}&bucket_name=${bucketName}&dag_id=${dagId}&dag_run_id=${dagRunId}&project_id=${projectId}&region_id=${region}`;
      const formattedResponse: any = await requestAPI(serviceURL, {
        method: 'POST'
      });
      dagRunId = decodeURIComponent(dagRunId);
      if (formattedResponse.status === 0) {
        Notification.success(`${dagId}_${dagRunId} downloaded successfully`, {
          autoClose: false
        });
      } else {
        Notification.error(`Failed to download the ${dagId}_${dagRunId}`, {
          autoClose: false
        });
      }
      setDownloadOutputDagRunId('');
    } catch (error) {
      SchedulerLoggingService.log('Error in Download api', LOG_LEVEL.ERROR);
      const errorResponse = `Error in Download api : ${error}`;
      handleErrorToast({
        error: errorResponse
      });
      setDownloadOutputDagRunId('');
    }
  };
  static readonly handleDeleteSchedulerAPIService = async (
    composerSelected: string,
    dag_id: string,
    region: string,
    project: string,
    fromPage?: string | undefined
  ): Promise<IUpdateSchedulerAPIResponse> => {
    const serviceURL = `dagDelete?composer=${composerSelected}&dag_id=${dag_id}&from_page=${fromPage}&project_id=${project}&region_id=${region}`;
    const deleteResponse: IUpdateSchedulerAPIResponse = await requestAPI(
      serviceURL,
      { method: 'DELETE' }
    );
    return deleteResponse;
  };
  static readonly handleUpdateSchedulerAPIService = async (
    composerSelected: string,
    dag_id: string,
    is_status_paused: boolean,
    region: string,
    project: string
  ): Promise<IUpdateSchedulerAPIResponse> => {
    const serviceURL = `dagUpdate?composer=${composerSelected}&dag_id=${dag_id}&status=${is_status_paused}&project_id=${project}&region_id=${region}`;

    const formattedResponse: IUpdateSchedulerAPIResponse = await requestAPI(
      serviceURL,
      { method: 'POST' }
    );

    return formattedResponse;
  };
  static readonly listDagTaskInstancesListService = async (
    composerName: string,
    dagId: string,
    dagRunId: string,
    setDagTaskInstancesList: (value: any) => void,
    setIsLoading: (value: boolean) => void,
    projectId: string,
    region: string
  ) => {
    setDagTaskInstancesList([]);
    setIsLoading(true);
    try {
      dagRunId = encodeURIComponent(dagRunId);
      const data: any = await requestAPI(
        `dagRunTask?composer=${composerName}&dag_id=${dagId}&dag_run_id=${dagRunId}&project_id=${projectId}&region_id=${region}`
      );
      data.task_instances?.sort(
        (a: any, b: any) => new Date(a.start_date).getTime() - 12
      );
      let transformDagRunTaskInstanceListData = [];
      transformDagRunTaskInstanceListData = data.task_instances?.map(
        (dagRunTask: any) => {
          return {
            tryNumber: dagRunTask.try_number,
            taskId: dagRunTask.task_id,
            duration: dagRunTask.duration,
            state: dagRunTask.state,
            date: new Date(dagRunTask.start_date).toDateString(),
            time: new Date(dagRunTask.start_date).toTimeString().split(' ')[0]
          };
        }
      );
      setDagTaskInstancesList(transformDagRunTaskInstanceListData);
      setIsLoading(false);
    } catch (reason) {
      const errorResponse = `Error in dag task instances..\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };
  static readonly listDagTaskLogsListService = async (
    composerName: string,
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber: number,
    setLogList: (value: string) => void,
    setIsLoadingLogs: (value: boolean) => void,
    projectId: string,
    region: string
  ) => {
    try {
      setIsLoadingLogs(true);
      dagRunId = encodeURIComponent(dagRunId);
      const data: any = await requestAPI(
        `dagRunTaskLogs?composer=${composerName}&dag_id=${dagId}&dag_run_id=${dagRunId}&task_id=${taskId}&task_try_number=${tryNumber}&project_id=${projectId}&region_id=${region}`
      );
      setLogList(data?.content);
      setIsLoadingLogs(false);
    } catch (reason) {
      const errorResponse = `Error in listing task logs..\n${reason}`;
      handleErrorToast({
        error: errorResponse
      });
    }
  };
  static readonly handleImportErrordataService = async (
    composerSelectedList: string,
    setImportErrorData: (value: string[]) => void,
    setImportErrorEntries: (value: number) => void,
    project: string,
    region: string,
    abortControllers: any,
    isImportErrorLoading: { current: boolean }
  ) => {
    // setting controller to abort pending api call
    const controller = new AbortController();
    abortControllers.current.push(controller);
    const signal = controller.signal;

    try {
      const data: any = await requestAPI(
        `importErrorsList?composer=${composerSelectedList}&project_id=${project}&region_id=${region}`,
        { signal }
      );
      setImportErrorData(data?.import_errors);
      setImportErrorEntries(data?.total_entries);
      if (data) {
        isImportErrorLoading.current = false; // for future development add return statements only after this flag is turned false.
      }
    } catch (reason) {
      isImportErrorLoading.current = false; // for future development add return statements only after this flag is turned false.
      if (typeof reason === 'object' && reason !== null) {
        if (
          reason instanceof TypeError &&
          reason.toString().includes(ABORT_MESSAGE)
        ) {
          return;
        }
      } else {
        const errorResponse = `Error in fetching import errors list : ${reason}`;
        if (!toast.isActive('importListError')) {
          toast.error(errorResponse, {
            ...toastifyCustomStyle,
            toastId: 'importListError'
          });
        }
      }
    }
  };

  static readonly triggerDagService = async (
    dagId: string,
    composerSelectedList: string,
    project: string,
    region: string
  ): Promise<any> => {
    const data: any = await requestAPI(
      `triggerDag?dag_id=${dagId}&composer=${composerSelectedList}&project_id=${project}&region_id=${region}`,
      { method: 'POST' }
    );

    // If a 'Bad Request' error is returned, perform the secondary API call
    if (data?.error && data?.error.includes('Bad Request')) {
      const jsonstr = data?.error.slice(
        data?.error.indexOf('{'),
        data?.error.lastIndexOf('}') + 1
      );
      const errorObject = JSON.parse(jsonstr);

      if (errorObject?.status === HTTP_STATUS_BAD_REQUEST) {
        const installedPackageList: any = await requestAPI(
          `checkRequiredPackages?composer_environment_name=${composerSelectedList}&region_id=${region}`
        );
        // Return the response from the secondary API call to the handler
        return installedPackageList;
      }
    }

    // Otherwise, return the initial data
    return data;
  };

  static readonly listComposersAPICheckService = async () => {
    try {
      const formattedResponse: any = await requestAPI('composerList');
      return formattedResponse;
    } catch (error) {
      return error;
    }
  };

  static readonly getComposerEnvApiService = async (
    composerEnvName: string | undefined
  ) => {
    try {
      const formattedResponse: any = await requestAPI(
        `getComposerEnvironment?env_name=${composerEnvName}`
      );
      return formattedResponse;
    } catch (error) {
      return error;
    }
  };
}
