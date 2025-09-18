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
import {
  COMPOSER_SCHEDULER_NAME,
  SCHEDULER_OPTIONS,
  VERTEX_SCHEDULER_NAME
} from '../../utils/Constants';
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
  IInitialScheduleFormData
} from '../../interfaces/CommonInterface';
import { VertexSchedulerFormValues } from '../../schemas/CreateVertexSchema';
import { ComposerSchedulerFormValues } from '../../schemas/CreateComposerSchema';
import { getInitialFormValues } from '../../utils/FormDefaults';
import { Button } from '@mui/material';
import { IComposerSchedulePayload } from '../../interfaces/ComposerInterface';
import { getDefaultSchedulerTypeOnLoad } from '../../utils/SchedulerKernalUtil';
import { useNavigate, useParams } from 'react-router-dom';
import { SchedulerType } from '../../types/CommonSchedulerTypes';
import { VertexServices } from '../../services/vertex/VertexServices';
import { ComposerServices } from '../../services/composer/ComposerServices';
import { aiplatform_v1 } from 'googleapis';
import {
  transformVertexScheduleResponseToZodSchema,
  transformZodSchemaToVertexSchedulePayload
} from '../../utils/VertexDataTransform';
import { authApi, handleOpenLoginWidget } from '../common/login/Config';
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
  const [initialFormData, setInitialFormData] =
    useState<IInitialScheduleFormData>({});

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const navigate = useNavigate();

  /**
   * Fetches auth credentials and initial form data on component mount.
   * It handles both 'create' and 'edit' mode data fetching.
   */
  useEffect(() => {
    const fetchInitialSchedulerFormData = async () => {
      // 1. Fetch credentials
      const credentialsData = await authApi();
      if (!credentialsData) {
        // TO DO: Reroute Login
        console.error('Invalid credentials');
        return;
      }

      let kernelSchedulerData: INotebookKernalSchdulerDefaults | undefined;
      let editScheduleData: IEditScheduleData | undefined;

      // 2. Determine mode and fetch relevant data
      const isEditMode = !!(scheduleId && region && schedulerTypeForEdit);

      if (isEditMode) {
        editScheduleData = {
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
            editScheduleData.existingScheduleData =
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
          try {
            const fetchedData =
              await ComposerServices.getComposerJobScheduleDetails(
                scheduleId,
                region,
                projectId,
                environment
              );
            if (fetchedData) {
              editScheduleData.existingScheduleData =
                transformComposerScheduleDataToZodSchema(fetchedData);
            } else {
              //TODO: redirect to listing.
            }
          } catch (authenticationError) {
            handleOpenLoginWidget(createScheduleProps.app);
          }
        }
      } else {
        // Create mode logic
        kernelSchedulerData =
          preFetchedInitialDetails ??
          (await getDefaultSchedulerTypeOnLoad(sessionContext))
            .kernalAndSchedulerDetails;
      }

      // 3. Update the single formState object
      setInitialFormData({
        credentials: credentialsData,
        editModeData: editScheduleData,
        initialDefaults: kernelSchedulerData
      });
      setIsDataLoaded(true);
    };
    fetchInitialSchedulerFormData();
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
    if (
      initialFormData.editModeData?.editMode &&
      initialFormData.editModeData.existingScheduleData
    ) {
      return initialFormData.editModeData.existingScheduleData;
    }
    if (initialFormData.initialDefaults) {
      return getInitialFormValues(initialFormData, sessionContext);
    }
    return {} as CombinedCreateFormValues; // Return null or some default value if data isn't ready
  }, [isDataLoaded, initialFormData, schedulerTypeForEdit, sessionContext]);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
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
  // Watch for changes in schedulerSelection to reset form values accordingly
  useEffect(() => {
    const isEditMode = initialFormData.editModeData?.editMode;
    if (!isEditMode && initialFormData.initialDefaults) {
      const commonFields = {
        jobName: getValues('jobName'),
        inputFile: getValues('inputFile')
      };

      if (schedulerSelection === VERTEX_SCHEDULER_NAME) {
        // Get a new set of default Vertex-specific values
        const vertexDefaults = getInitialFormValues(
          {
            ...initialFormData,
            initialDefaults: {
              ...initialFormData.initialDefaults,
              schedulerType: VERTEX_SCHEDULER_NAME
            }
          },
          sessionContext
        ) as VertexSchedulerFormValues;

        // Merge common fields with new Vertex-specific defaults
        reset({
          ...commonFields,
          ...vertexDefaults,
          schedulerSelection: VERTEX_SCHEDULER_NAME
        });
      } else if (schedulerSelection === COMPOSER_SCHEDULER_NAME) {
        // Get a new set of default Composer-specific values
        const composerDefaults = getInitialFormValues(
          {
            ...initialFormData,
            initialDefaults: {
              ...initialFormData.initialDefaults,
              schedulerType: COMPOSER_SCHEDULER_NAME
            }
          },
          sessionContext
        ) as ComposerSchedulerFormValues;

        // Merge common fields with new Composer-specific defaults
        reset({
          ...commonFields,
          ...composerDefaults,
          schedulerSelection: COMPOSER_SCHEDULER_NAME
        });
      }
    }
  }, [schedulerSelection, initialFormData, sessionContext, reset, getValues]);

  // Show loading state while fetching initial data
  if (!isDataLoaded) {
    return <div>Loading...</div>;
  }

  /**
   *
   * @param data The form data submitted from the Create Notebook Schedule form.
   * @param credentials The authentication credentials for the user.
   */
  const onSubmit = async (data: CombinedCreateFormValues) => {
    console.log('On Submit');
    if (!initialFormData.credentials) {
      console.error('Credentials not available.');
      //TODO: handle credentials
      return;
    }
    let isSaveSuccessfull = false; // flag for successfull schedule creation/ update
    let routingParamForListing = '';
    //vertex payload creation
    if (
      data.schedulerSelection === VERTEX_SCHEDULER_NAME &&
      initialFormData.credentials.project_id
    ) {
      const vertexData = data as VertexSchedulerFormValues;
      const vertexPayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule =
        transformZodSchemaToVertexSchedulePayload(
          vertexData,
          initialFormData.credentials.project_id
        );
      console.log('Vertex Payload:', vertexPayload);

      if (initialFormData.editModeData?.editMode && scheduleId) {
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
      routingParamForListing =
        '${VERTEX_SCHEDULER_NAME}/${vertexData.vertexRegion}';
      //composer payload creation
    } else if (data.schedulerSelection === COMPOSER_SCHEDULER_NAME) {
      const composerData = data as ComposerSchedulerFormValues;
      const packagesToInstall: string[] = []; // TODO
      const composerPayload: IComposerSchedulePayload =
        transformZodSchemaToComposerSchedulePayload(
          composerData,
          packagesToInstall
        );

      try {
        isSaveSuccessfull =
          await ComposerServices.saveComposerNotebookJobSchedule(
            composerPayload,
            composerPayload.project_id, // TODO: verify and optimize
            composerPayload.region_id, // ToDO
            initialFormData.editModeData?.editMode
          );
        routingParamForListing = `${COMPOSER_SCHEDULER_NAME}/${composerData.composerRegion}/${composerData.projectId}/${composerData.environment}`;
      } catch (authenticationError) {
        handleOpenLoginWidget(createScheduleProps.app);
      }
    }
    console.log('is save successful', isSaveSuccessfull);
    if (isSaveSuccessfull) {
      //TODO: // redirect to list page or show success message
      navigate(`/list/${routingParamForListing}`);
    } else {
      //TODO: Retain the form. probably remove this.
    }
  };

  // Function to handle cancel action
  const handleCancel = () => {
    console.log('Cancelled');
    reset(); // Reset form to default values
    // TODO: Add navigation logic
  };
  console.log(' Scheduler:', schedulerSelection);
  //return if form is not valid
  if (
    !initialFormData.credentials ||
    (!initialFormData.initialDefaults && !initialFormData.editModeData) ||
    (initialFormData.editModeData?.editMode &&
      !initialFormData.editModeData.existingScheduleData)
  ) {
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
          {initialFormData.editModeData?.editMode
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
                  initialFormData.editModeData?.editMode ||
                  (initialFormData.initialDefaults?.kernelDetails
                    ?.executionMode !== 'local' &&
                    option.value === 'vertex')
              }))}
              error={errors.schedulerSelection}
            />
          </div>
          {/* Conditionally render specific scheduler components */}
          {schedulerSelection === VERTEX_SCHEDULER_NAME && (
            <CreateVertexSchedule
              app={createScheduleProps.app}
              control={control}
              errors={errors as Record<keyof VertexSchedulerFormValues, any>}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              trigger={trigger}
              isValid={isValid}
              credentials={initialFormData.credentials}
              editScheduleData={initialFormData.editModeData}
            />
          )}
          {schedulerSelection === COMPOSER_SCHEDULER_NAME && (
            <CreateComposerSchedule
              app={createScheduleProps.app}
              control={control}
              errors={errors as Record<keyof ComposerSchedulerFormValues, any>}
              setValue={setValue}
              watch={watch}
              setError={setError}
              getValues={getValues}
              trigger={trigger}
              credentials={initialFormData.credentials}
              editScheduleData={initialFormData.editModeData}
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
