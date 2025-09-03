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
import { CreateVertexSchedule } from '../vertex/CreateVertexSchedule';
import { CreateComposerSchedule } from '../composer/CreateComposerSchedule';
import {
  combinedCreateFormSchema,
  CombinedCreateFormValues
} from '../../schemas/CreateScheduleCombinedSchema';
import {
  ICreateNotebookScheduleProps,
  INotebookKernalSchdulerDefaults,
  IEditScheduleData,
  IAuthCredentials
} from '../../interfaces/CommonInterface';
import { VertexSchedulerFormValues } from '../../schemas/CreateVertexSchema';
import { ComposerSchedulerFormValues } from '../../schemas/CreateComposerSchema';
import { getInitialFormValues } from '../../utils/FormDefaults';
import { Button } from '@mui/material';
import { IComposerSchedulePayload } from '../../interfaces/ComposerInterface';
import { getDefaultSchedulerTypeOnLoad } from '../../utils/SchedulerKernalUtil';
import { useParams } from 'react-router-dom';
import { SchedulerType } from '../../types/CommonSchedulerTypes';
import { VertexServices } from '../../services/vertex/VertexServices';
import { ComposerServices } from '../../services/composer/ComposerServices';
import { aiplatform_v1 } from 'googleapis';
import {
  transformVertexScheduleResponseToZodSchema,
  transformZodSchemaToVertexSchedulePayload
} from '../../utils/VertexDataTransform';
import { authApi } from '../common/login/Config';
import {
  transformComposerScheduleDataToZodSchema,
  transformZodSchemaToComposerSchedulePayload
} from '../../utils/ComposerDataTransform';

/**
 * Create Notebook Schedule Parent component that renders common components
 * and redirects to the child componets depending scheduler type.
 * @param createScheduleProps
 * @returns
 */
export const CreateNotebookSchedule = (
  createScheduleProps: ICreateNotebookScheduleProps
) => {
  /**
   * Extracts session context and initial kernel schedule details from props.
   */
  const {
    sessionContext,
    initialKernalScheduleDetails: preFetchedInitialDetails // kernal and scheduler type (vertex/composer)
  } = createScheduleProps; //sessionContext is used to fetch the initial kernel details

  /**
   * Extracts scheduler details for editing from the URL parameters.
   */
  const {
    schedulerType: schedulerTypeForEdit,
    scheduleId,
    region,
    projectId,
    environment
  } = useParams<{
    schedulerType: SchedulerType;
    scheduleId: string;
    region: string;
    projectId: string;
    environment: string;
  }>();

  /**
   * A unified state to manage all form-related data including edit mode,
   * authentication, and scheduler details.
   */
  const [formState, setFormState] = useState<{
    credentials?: IAuthCredentials | undefined;
    editModeData?: IEditScheduleData;
    initialDefaults?: INotebookKernalSchdulerDefaults;
  }>({});

  /**
   * Fetches auth credentials and initial form data on component mount.
   * It handles both 'create' and 'edit' mode data fetching.
   */
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch credentials
      const creds = await authApi();
      if (!creds) {
        // TO DO: Reroute Login
        console.error('Invalid credentials');
        return;
      }

      let defaults: INotebookKernalSchdulerDefaults | undefined;
      let editData: IEditScheduleData | undefined;

      // 2. Determine mode and fetch relevant data
      const isEditMode = !!(scheduleId && region && schedulerTypeForEdit);

      if (isEditMode) {
        editData = {
          editMode: true,
          region,
          projectId,
          environment,
          existingScheduleData: undefined // Will be filled below
        };

        if (schedulerTypeForEdit === 'vertex') {
          const fetchedData = await VertexServices.getVertexJobScheduleDetails(
            scheduleId,
            region
          );
          if (fetchedData) {
            editData.existingScheduleData =
              transformVertexScheduleResponseToZodSchema(
                fetchedData,
                region,
                projectId
              );
          } else {
            //TODO: redirect back to listing as no data was fetched
          }
        } else if (
          schedulerTypeForEdit === 'composer' &&
          projectId &&
          environment
        ) {
          const fetchedData =
            await ComposerServices.getComposerJobScheduleDetails(
              scheduleId,
              region,
              projectId,
              environment
            );
          if (fetchedData) {
            editData.existingScheduleData =
              transformComposerScheduleDataToZodSchema(fetchedData);
          } else {
            //TODO: redirect to listing.
          }
        }
      } else {
        // Create mode logic
        defaults =
          preFetchedInitialDetails ??
          (await getDefaultSchedulerTypeOnLoad(sessionContext))
            .kernalAndSchedulerDetails;
      }

      // 3. Update the single formState object
      setFormState({
        credentials: creds,
        editModeData: editData,
        initialDefaults: defaults
      });
    };
    fetchData();
  }, [
    scheduleId,
    region,
    projectId,
    environment,
    schedulerTypeForEdit,
    preFetchedInitialDetails,
    sessionContext
  ]);

  /**
   * Derive the initial form values.
   * This useMemo hook ensures that default form values are only computed
   * when the underlying data has been fetched and is available.
   */
  const initialFormValues = useMemo(() => {
    if (formState.editModeData?.editMode && formState.editModeData.existingScheduleData) {
      return formState.editModeData.existingScheduleData;
    }
    if (formState.initialDefaults) {
      return getInitialFormValues(formState.initialDefaults, sessionContext);
    }
    // Return a default structure to prevent errors while data is loading.
    return {
      schedulerSelection: schedulerTypeForEdit || 'vertex'
    } as CombinedCreateFormValues;
  }, [formState, schedulerTypeForEdit, sessionContext]);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid, validatingFields },
    reset,
    setValue,
    getValues,
    trigger,
    setError
  } = useForm<CombinedCreateFormValues>({
    resolver: zodResolver(combinedCreateFormSchema),
    values: initialFormValues,
    mode: 'all'
  });

  const schedulerSelection = watch('schedulerSelection');

  /**
   * useEffect to manage the radio button selection and its state.
   * It handles disabling the radio button in edit mode and updates
   * the scheduler selection based on the initial form data.
   */
  useEffect(() => {
    // If we are in edit mode, ensure the scheduler radio is disabled
    // and correctly reflects the URL param.
    if (formState.editModeData?.editMode) {
      setValue('schedulerSelection', schedulerTypeForEdit as SchedulerType);
    } else if (formState.initialDefaults?.kernalDetails?.executionMode === 'serverless' || formState.initialDefaults?.kernalDetails?.executionMode === 'cluster') {
      // If we're in create mode with a remote kernel, default to Composer.
      setValue('schedulerSelection', 'composer');
    } else if (formState.initialDefaults) {
      // Otherwise, use the pre-fetched or default value.
      setValue('schedulerSelection', formState.initialDefaults.schedulerType);
    }
  }, [formState, schedulerTypeForEdit, setValue]);

  console.log('Is form valid?', isValid);
  console.log('Form errors:', errors);
  const formValues = watch();
  console.log('Current form values:', formValues);
  console.log('Validating Fields:', validatingFields);

 /**
  *
  * @param data The form data submitted from the Create Notebook Schedule form.
  * @param credentials The authentication credentials for the user.
  */
  const onSubmit = async (
    data: CombinedCreateFormValues
  ) => {
    console.log('On Submit');
    if (!formState.credentials) {
    console.error('Credentials not available.');
    //TODO: handle credentials
    return;
  }
    let isSaveSuccessfull = false; // flag for successfull schedule creation/ update
    //vertex payload creation
    if (
      data.schedulerSelection === 'vertex' &&
      formState.credentials.project_id &&
      formState.credentials.region_id
    ) {
      const vertexData = data as VertexSchedulerFormValues;
      const vertexPayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule =
        transformZodSchemaToVertexSchedulePayload(
          vertexData,
          formState.credentials?.project_id,
          formState.credentials?.region_id
        );
      console.log('Vertex Payload:', vertexPayload);

       if (formState.editModeData?.editMode && scheduleId) {
        isSaveSuccessfull =
          await VertexServices.updateVertexNotebookJobSchedule(
            scheduleId,
            vertexData.vertexRegion,
            vertexPayload
          );
      } else {
        isSaveSuccessfull =
          await VertexServices.createVertexNotebookJobSchedule(
            vertexPayload,
            vertexData.vertexRegion
          );
      }

      //composer payload creation
    } else if (data.schedulerSelection === 'composer') {
      const composerData = data as ComposerSchedulerFormValues;
      const packagesToInstall: string[] = []; // TODO
      const composerPayload: IComposerSchedulePayload =
        transformZodSchemaToComposerSchedulePayload(
          composerData,
          packagesToInstall
        );

      isSaveSuccessfull =
        await ComposerServices.saveComposerNotebookJobSchedule(
          composerPayload,
          composerPayload.project_id, // TODO: verify and optimize
          composerPayload.region_id, // ToDO
          formState.editModeData?.editMode
        );
    }
    console.log('is save successful', isSaveSuccessfull);
    if (isSaveSuccessfull) {
      //TODO: // redirect to list page or show success message
    } else {
      //TODO: Retain the form.
    }
  };

  // Function to handle cancel action
  const handleCancel = () => {
    console.log('Cancelled');
    reset(); // Reset form to default values
    // TODO: Add navigation logic
  };
  // return if authentication is not successfull
   if (!formState.credentials || (formState.editModeData?.editMode && !formState.editModeData.existingScheduleData)) {
    // Show a loading state or a spinner while data is being fetched
    return <div>Loading...</div>;
  }
  return (
    <div className="component-level">
      <div className="create-form-header">
        <div role="button" className="back-arrow-icon" onClick={handleCancel}>
          <iconLeftArrow.react
            tag="div"
            className="logo-alignment-style" //icon-white
          />
        </div>
        <div className="create-job-scheduler-title">
         {formState.editModeData?.editMode
            ? 'Update Scheduled Notebook Job'
            : 'Create Scheduled Notebook Job'}
        </div>
      </div>
  <form onSubmit={handleSubmit(data => onSubmit(data))}>
        <div className="common-fields">
          <div className="scheduler-tag-style">
            <FormInputText
              label="Job Name"
              control={control}
              name="jobName"
              error={errors.jobName}
            />
          </div>

          <div className="create-scheduler-form-element-input-file">
            <div className="scheduler-tag-style">
              <FormInputText
                label="Input File"
                control={control}
                name="inputFile"
                error={errors.inputFile}
                disabled={true}
              />
            </div>
          </div>

          <div className="scheduler-form-element-container">
            <FormInputRadio
              name="schedulerSelection"
              control={control}
              className="schedule-radio-btn"
              options={SCHEDULER_OPTIONS.map(option => ({
                ...option,
                disabled:
                  formState.editModeData?.editMode ||
                  (formState.initialDefaults?.kernalDetails?.executionMode !== 'local' && option.value === 'vertex')
              }))}
              error={errors.schedulerSelection}
            />
          </div>
          {/* Conditionally render specific scheduler components */}
          {schedulerSelection === 'vertex' && (
            <CreateVertexSchedule
              control={control}
              errors={errors as Record<keyof VertexSchedulerFormValues, any>} 
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              trigger={trigger}
              credentials={formState.credentials}
              editScheduleData={formState.editModeData}
            />
          )}
          {schedulerSelection === 'composer' && (
            <CreateComposerSchedule
              control={control}
              errors={errors as Record<keyof ComposerSchedulerFormValues, any>} 
              setValue={setValue}
              watch={watch}
              setError={setError}
              getValues={getValues}
              trigger={trigger}
              credentials={formState.credentials}
              editScheduleData={formState.editModeData}
            />
          )}

          <div className="save-overlay">
            <Button
              variant="contained"
              aria-label="Create Schedule"
              type="submit"
              disabled={!isValid}
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
