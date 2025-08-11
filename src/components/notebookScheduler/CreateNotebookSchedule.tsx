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

/**
 * @file CreateNotebookSchedule.tsx
 * This file contains the CreateNotebookSchedule component which is used to create a new notebook schedule.
 * It includes form handling for both Vertex and Composer schedulers.
 * The component uses React Hook Form for form management and Zod for schema validation.
 * It is the parent component for CreateVertexSchedule.tsx and CreateComposerSchedule.tsx
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { iconLeftArrow } from '../../utils/Icons';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import { SCHEDULER_OPTIONS } from '../../utils/Constants';
// import { CreateVertexSchedule } from '../vertex/CreateVertexSchedule';
// import { IFormInput } from '../../interfaces/CommonInterface';
import { CreateVertexSchedule } from '../vertex/CreateVertexSchedule';
import { CreateComposerSchedule } from '../composer/CreateComposerSchedule';
import {
  combinedCreateFormSchema,
  CombinedCreateFormValues
} from '../../schemas/CreateScheduleCombinedSchema';
import {
  ICreateNotebookScheduleProps,
  Parameter,
  INotebookKernalSchdulerDefaults
} from '../../interfaces/CommonInterface';
import { IVertexSchedulePayload } from '../../interfaces/VertexInterface';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import { createComposerSchema } from '../../schemas/CreateComposerSchema';
import z from 'zod';
import { getInitialFormValues as getFormValuesForScheduler } from '../../utils/FormDefaults';
import { Button } from '@mui/material';
import { IComposerSchedulePayload } from '../../interfaces/ComposerInterface';
import { getDefaultSchedulerTypeOnLoad } from '../../utils/SchedulerKernalUtil';

/**
 * CreateNotebookSchedule component
 * This component renders the form for creating a notebook schedule.
 * It dynamically loads the appropriate scheduler form based on the selected scheduler type.
 */

export const CreateNotebookSchedule = (
  createScheduleProps: ICreateNotebookScheduleProps
) => {
  const {
    sessionContext,
    initialKernalScheduleDetails: preFetchedInitialDetails,
    editModeData: editModeData,
  } = createScheduleProps; //sessionContext is used to fetch the initial kernel details
  const [kernalAndScheduleValue, setKernalAndScheduleValue] =
    useState<INotebookKernalSchdulerDefaults>(
      preFetchedInitialDetails || {
        schedulerType: 'vertex',
        kernalDetails: {
          executionMode: 'local',
          isDataprocKernel: false,
          kernelDisplayName: ''
        }
      }
    );

  /**
   * Function to Extract Kernal details and assign default Scheduler
   * Initially looks for the prefetched Ker
   *
   */
  const loadDefaultKernalScheduler = async () => {
    if (preFetchedInitialDetails) {
      // Case 1: Details were successfully pre-fetched by the button extension
      console.log(
        'Using pre-fetched Initial Scheduler Details:',
        preFetchedInitialDetails
      );
      setKernalAndScheduleValue(preFetchedInitialDetails);
    } else {
      // Case 2: Pre-fetched details were not provided (e.g., direct navigation, or button pre-fetch failed silently)
      // In this scenario, we perform a fallback fetch.
      console.log(
        'Pre-fetched details not available. Falling back to internal fetch.'
      );
      try {
        setKernalAndScheduleValue(
          (await getDefaultSchedulerTypeOnLoad(sessionContext))
            .kernalAndSchedulerDetails
        );
        console.log(
          'Fallback fetched Initial Scheduler Details:',
          kernalAndScheduleValue
        );
      } catch (error) {
        console.error(
          'Failed to fetch initial scheduler details in fallback:',
          error
        );
        // Define a safe default if even the fallback fetch fails
        setKernalAndScheduleValue({
          schedulerType: 'vertex',
          kernalDetails: {
            executionMode: 'local',
            isDataprocKernel: false,
            kernelDisplayName: ''
          }
        });
        // You might want to show a toast/notification here if this happens often
      }
    }
  };
  /**
   * Effect to set the initial scheduler type based on the session context.
   * This runs once when the component mounts.
   */
  useEffect(() => {
    // This effect runs when preFetchedInitialDetails changes or when the component mounts
    // and preFetchedInitialDetails is initially null/undefined.

    loadDefaultKernalScheduler();

    // Set form values using react-hook-form's setValue
    setValue('schedulerSelection', kernalAndScheduleValue.schedulerType);
    if (kernalAndScheduleValue.kernalDetails) {
      setValue(
        'executionMode',
        kernalAndScheduleValue.kernalDetails.executionMode
      );
      setValue(
        'serverless',
        kernalAndScheduleValue.kernalDetails.selectedServerlessName
      );
      setValue(
        'cluster',
        kernalAndScheduleValue.kernalDetails.selectedClusterName
      );
    }
  }, [preFetchedInitialDetails, sessionContext]); // Ensure all dependencies are listed

  // Destructure for easier access in JSX
  const { schedulerType } = kernalAndScheduleValue;

  /**
   * Get the initial form values based on the scheduler type.
   * This ensures that the form is pre-populated with the correct fields for the selected scheduler
   */
  const schedulerFormValues = useMemo(() => {
    // This will now use the dynamically determined schedulerType
    return getFormValuesForScheduler(kernalAndScheduleValue, sessionContext);
  }, [schedulerType]);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
    getValues,
    trigger,
    setError
  } = useForm<CombinedCreateFormValues>({
    resolver: zodResolver(combinedCreateFormSchema),
    defaultValues: schedulerFormValues,
    mode: 'onChange'
  });

  useEffect(() => {
  // This effect runs when preFetchedInitialDetails changes or when the component mounts
  // and preFetchedInitialDetails is initially null/undefined.
  let isMounted = true;
  (async () => {
    console.log(
      'Component mounted or preFetchedInitialDetails changed. Current value:',
      preFetchedInitialDetails
    );
    let loadedDetails: INotebookKernalSchdulerDefaults;
    // If preFetchedInitialDetails is available, use it; otherwise, fetch the default scheduler type
    if (preFetchedInitialDetails) {
      loadedDetails = preFetchedInitialDetails;
      console.log('Using pre-fetched Initial Scheduler Details:', loadedDetails);
    } else {
      try {
        loadedDetails = (
          await getDefaultSchedulerTypeOnLoad(sessionContext)
        ).kernalAndSchedulerDetails;
        console.log('Fallback fetched Initial Scheduler Details:', loadedDetails);
      } catch (error) {
        console.error(
          'Failed to fetch initial scheduler details in fallback:',
          error
        );
        loadedDetails = {
          schedulerType: 'vertex',
          kernalDetails: {
            executionMode: 'local',
            isDataprocKernel: false,
            kernelDisplayName: ''
          }
        };
      }
    }
    if (isMounted) {
      setKernalAndScheduleValue(loadedDetails);
      setValue('schedulerSelection', loadedDetails.schedulerType);
      setValue('executionMode', loadedDetails.kernalDetails?.executionMode||'local');
      setValue('serverless', loadedDetails.kernalDetails?.selectedServerlessName);
      setValue('cluster', loadedDetails.kernalDetails?.selectedClusterName);
      console.log('Scheduler Selection set to:', loadedDetails.schedulerType);
    }
  })();
  return () => {
    isMounted = false;
  };
}, [preFetchedInitialDetails, sessionContext, setValue]);
  const schedulerSelection = watch('schedulerSelection'); // Get the current value of the radio button
  /**
   * Helper function to get the schedule values from the Vertex scheduler form.
   * @param vertexData The data from the Vertex scheduler form.
   * @returns The schedule values as a string or undefined.
   */
  const getScheduleValues = (
    vertexData: z.infer<typeof createVertexSchema>
  ): string | undefined => {
    if (vertexData.scheduleMode === 'runNow') {
      return ''; // Or undefined, depending on backend's strictness for empty string vs missing key
    }
    if (
      vertexData.scheduleMode === 'runSchedule' &&
      vertexData.internalScheduleMode === 'cronFormat'
    ) {
      return vertexData.scheduleField;
    }
    if (
      vertexData.scheduleMode === 'runSchedule' &&
      vertexData.internalScheduleMode === 'userFriendly'
    ) {
      return vertexData.scheduleValue;
    }
    return undefined; // Fallback
  };

  /**
   * Converts an array of parameters to a string representation.
   * @param params An array of parameters to convert to a string.
   * @returns A string representation of the parameters, formatted as "key:value" pairs.
   */
  const convertParametersToString = (params: Parameter[]): string => {
    if (!params || params.length === 0) {
      return '';
    }

    return params.map(param => `${param.key}:${param.value}`).join(', ');
  };

  /**
   *
   * @param data The form data submitted from the Create Notebook Schedule form.
   */
  const onSubmit = (data: CombinedCreateFormValues) => {
    //vertex payload creation
    if (data.schedulerSelection === 'vertex') {
      const vertexData = data as z.infer<typeof createVertexSchema>;
      const vertexPayload: IVertexSchedulePayload = {
        input_filename: data.inputFile,
        display_name: data.jobName,
        machine_type: vertexData.machineType,
        kernel_name: vertexData.kernelName,
        region: vertexData.vertexRegion,
        cloud_storage_bucket: vertexData.cloudStorageBucket,
        service_account: vertexData.serviceAccount,
        network_option: vertexData.networkOption || 'networkInThisProject',
        primaryNetwork: vertexData.primaryNetwork,
        subnetwork: vertexData.subNetwork,
        disk_type: vertexData.diskType,
        disk_size: vertexData.diskSize,
        accelerator_type: vertexData.acceleratorType,
        accelerator_count: vertexData.acceleratorCount,
        schedule_value: getScheduleValues(vertexData),
        time_zone: vertexData.timeZone,
        max_run_count: vertexData.maxRunCount,
        start_time: vertexData.startTime,
        end_time: vertexData.endTime,
        //parameters: vertexData.parameters
      };
      console.log('Vertex Payload:', vertexPayload);
      // TODO: Call your Vertex API here with vertexPayload

      //composer payload creation
    } else if (data.schedulerSelection === 'composer') {
      const composerData = data as z.infer<typeof createComposerSchema>;
      // Map composerData to your Composer API payload here
      const composerPayload: IComposerSchedulePayload = {
        job_name: composerData.jobName,
        input_filename: composerData.inputFile,
        project_id: composerData.projectId,
        region: composerData.composerRegion,
        composer_environment_name: composerData.environment,
        retry_count: composerData.retryCount,
        retry_delay: composerData.retryDelay,
        email_failure: composerData.emailOnFailure,
        email_retry: composerData.emailOnRetry,
        email_success: composerData.emailOnSuccess,
        email_recipients: composerData.email_recipients, // Assuming 'email' is an array of strings
        run_option: composerData.runOption,
        schedule_value: composerData.scheduleValue,
        time_zone: composerData.timeZone,
        output_formats: composerData.outputFormats || [], // Ensure this is an array
        dag_id: composerData.dagId ? composerData.dagId : '', // Assuming this is part of the form data
        parameters: convertParametersToString(composerData.parameters || []), // Convert parameters to string
        execution_mode: composerData.executionMode || 'local', // Default to 'local' if not set
        stop_cluster: false,
        packages_to_install: []
      };
      console.log('Composer Payload:', composerPayload);
      // TODO: Call your Composer API here with composerPayload
    }

    // reset(); // Reset form to default values after submission
    // redirect to list page or show success message
  };

  // Function to handle cancel action
  const handleCancel = () => {
    reset(schedulerFormValues); // Reset form to default values
    // TODO: Add navigation logic
  };

  return (
    <div className="component-level">
      <div className="cluster-details-header">
        <div role="button" className="back-arrow-icon" onClick={handleCancel}>
          <iconLeftArrow.react
            tag="div"
            className="logo-alignment-style" //icon-white
          />
        </div>
        <div className="create-job-scheduler-title">
          {
            // editMode ? 'Update A Scheduled Job' :
            'Create A Scheduled Job'
          }
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="common-fields">
          <div className="create-scheduler-style">
            <FormInputText
              label="Job Name"
              control={control}
              name="jobName"
              error={errors.jobName}
            />
          </div>

          <div className="create-scheduler-form-element-input-file">
            <div className="create-scheduler-style">
              <FormInputText
                label="Input File"
                control={control}
                name="inputFile"
                error={errors.inputFile}
                disabled={true}
              />
            </div>
          </div>

          <div className="create-scheduler-form-element">
            <FormInputRadio
              name="schedulerSelection"
              control={control}
              className="schedule-radio-btn"
              options={SCHEDULER_OPTIONS}
              error={errors.schedulerSelection}
            />
          </div>
          {/* Conditionally render specific scheduler components */}
          {schedulerSelection === 'vertex' && (
            <CreateVertexSchedule
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              trigger={trigger}
            //sessionContext={sessionContext}
              editModeData={editModeData}
            />
          )}
          {schedulerSelection === 'composer' && (
            <CreateComposerSchedule
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              setError={setError}
            />
          )}
          <div className="save-overlay">
            <Button
              variant="contained"
              aria-label="Create Schedule"
              type="submit"
            >
              <div>CREATE</div>
            </Button>
            <Button
              variant="outlined"
              aria-label="cancel Batch"
              type="button"
              onClick={handleCancel}
            >
              <div>CANCEL</div>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
