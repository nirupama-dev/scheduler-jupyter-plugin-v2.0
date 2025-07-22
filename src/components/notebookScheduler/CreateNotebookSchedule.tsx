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

import React, { useMemo } from 'react';
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
import { IVertexSchedulePayload } from '../../interfaces/VertexInterface';
import { createVertexSchema } from '../../schemas/CreateVertexSchema';
import { createComposerSchema } from '../../schemas/CreateComposerSchema';
import z from 'zod';
import { getInitialFormValues } from '../../utils/FormDefaults';
import { Button } from '@mui/material';

export const CreateNotebookSchedule = () => {
  const scheduleType = 'vertex'; // Default to Vertex, can be changed based on user selection or props
  //function to be added for conditional rendering of scheduler type based on kernal selection.

  const schedulerFormValues = useMemo(() => {
    return getInitialFormValues(scheduleType);
  }, [scheduleType]); // Recalculate if criteria changes (e.g., in edit mode)

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
    getValues,
    trigger
  } = useForm<CombinedCreateFormValues>({
    resolver: zodResolver(combinedCreateFormSchema),
    defaultValues: schedulerFormValues,
    mode: 'onChange'
  });
  const schedulerSelection = watch('schedulerSelection'); // Get the current value of the radio button

  const onSubmit = (data: CombinedCreateFormValues) => {
    // You can now confidently cast and transform based on schedulerSelection
    if (data.schedulerSelection === 'vertex') {
      const vertexData = data as z.infer<typeof createVertexSchema>;
      const vertexPayload: IVertexSchedulePayload = {
        input_filename: data.inputFile,
        display_name: data.jobName,
        machine_type: vertexData.machineType,
        kernel_name: vertexData.kernelName,
        region: vertexData.region,
        cloud_storage_bucket: vertexData.cloudStorageBucket,
        service_account: vertexData.serviceAccount,
        network_option: vertexData.networkOption,
        network: vertexData.network,
        subnetwork: vertexData.subnetwork,
        disk_type: vertexData.diskType,
        disk_size: vertexData.diskSize,
        accelerator_type: vertexData.acceleratorType,
        accelerator_count: vertexData.acceleratorCount,
        schedule_value: vertexData.scheduleValue,
        time_zone: vertexData.timeZone,
        max_run_count: vertexData.maxRunCount,
        start_time: vertexData.startTime,
        end_time: vertexData.endTime,
        parameters: vertexData.parameters
      };
      console.log('Vertex Payload:', vertexPayload);
      // TODO: Call your Vertex API here with vertexPayload
    } else if (data.schedulerSelection === 'composer') {
      // Assuming you have an IComposerSchedulePayload interface similar to IVertexSchedulePayload
      const composerData = data as z.infer<typeof createComposerSchema>;
      // Map composerData to your Composer API payload here
      const composerPayload = {
        job_name: composerData.jobName,
        input_file_name: composerData.inputFile,
        project_id: composerData.projectId,
        region: composerData.region,
        environment: composerData.environment,
        retry_count: composerData.retryCount,
        retry_delay: composerData.retryDelay,
        email_on_failure: composerData.emailOnFailure,
        email_on_retry: composerData.emailOnRetry,
        email_on_success: composerData.emailOnSuccess,
        email_recipients: composerData.email, // Assuming 'email' is an array of strings
        run_option: composerData.runOption,
        schedule_value: composerData.scheduleValue,
        time_zone: composerData.timeZone
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
            />
          )}
          {schedulerSelection === 'composer' && (
            <CreateComposerSchedule
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
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