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
  SCHEDULE_LABEL_VERTEX,
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
  IInitialSchedulerContextData
} from '../../interfaces/CommonInterface';
import { VertexSchedulerFormValues } from '../../schemas/CreateVertexSchema';
import { ComposerSchedulerFormValues } from '../../schemas/CreateComposerSchema';
import { getInitialFormValues, validateForm } from '../../utils/FormDefaults';
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
import { useSchedulerContext } from '../../context/vertex/SchedulerContext';
import { AuthenticationError } from '../../exceptions/AuthenticationException';

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
    initialKernalScheduleDetails: preFetchedInitialDetails, // kernal and scheduler type (vertex/composer)
    app
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

  const schedulerContext = useSchedulerContext();
  const setVertexRouteState = schedulerContext?.setVertexRouteState;
  const setComposerRouteState = schedulerContext?.setComposerRouteState;

  /**
   * A unified state to manage all form-related data including edit mode,
   * authentication, and scheduler details.
   */
  const [initialSchedulerDataContext, setInitialSchedulerContext] =
    useState<IInitialSchedulerContextData>({});

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  console.log(isDataLoaded, 'isDataLoaded');

  const navigate = useNavigate();

  /**
   * Fetches auth credentials and initial form data on component mount.
   * It handles both 'create' and 'edit' mode data fetching.
   */
  useEffect(() => {
    const fetchInitialSchedulerFormData = async () => {
      try {
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
            const fetchedData =
              await VertexServices.getVertexJobScheduleDetails(
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
              navigate('/list/vertex', { state: { region: region } }); //TODO: redirect back to listing as no data was fetched
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
              editScheduleData.existingScheduleData =
                transformComposerScheduleDataToZodSchema(fetchedData);
            } else {
              navigate('/list/composer', {
                state: {
                  region: region,
                  projectId: projectId,
                  environment: environment
                }
              }); //TODO: redirect to listing.
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
        setInitialSchedulerContext({
          credentials: credentialsData,
          editModeData: editScheduleData,
          initialDefaults: kernelSchedulerData
        });
        setIsDataLoaded(true);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handleOpenLoginWidget(app);
        }
      }
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
    if (isDataLoaded) {
      if (
        initialSchedulerDataContext.editModeData?.editMode &&
        initialSchedulerDataContext.editModeData.existingScheduleData
      ) {
        //   setValue('schedulerSelection', initialFormData.editModeData.existingScheduleData.schedulerSelection);
        return initialSchedulerDataContext.editModeData.existingScheduleData;
      }
      if (initialSchedulerDataContext.initialDefaults) {
        //   setValue('schedulerSelection', initialFormData.initialDefaults.schedulerType);
        return getInitialFormValues(
          initialSchedulerDataContext,
          sessionContext
        );
      }
    }
    //  return {} as CombinedCreateFormValues; // Return null or some default value if data isn't ready
  }, [isDataLoaded]);
  console.log('Initial Form Values:', initialFormValues);

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
    getValues,
    trigger,
    setError,
    clearErrors
  } = useForm<CombinedCreateFormValues>({
    resolver: zodResolver(combinedCreateFormSchema),
    // values: initialFormValues,
    mode: 'all'
  });

  const schedulerSelectionSelected = watch('schedulerSelection');
  console.log('Scheduler Selection:', getValues('schedulerSelection'));

  useEffect(() => {
    if (initialFormValues) {
      reset(initialFormValues);
    }
  }, [initialFormValues, reset]);

  // Watch for changes in schedulerSelection to reset form values accordingly
  useEffect(() => {
    const isEditMode = initialSchedulerDataContext.editModeData?.editMode;
    if (!isEditMode && initialSchedulerDataContext.initialDefaults) {
      const commonFields = {
        jobName: getValues('jobName'),
        inputFile: getValues('inputFile')
      };

      if (schedulerSelectionSelected === VERTEX_SCHEDULER_NAME) {
        // Get a new set of default Vertex-specific values
        const vertexDefaults = getInitialFormValues(
          {
            ...initialSchedulerDataContext,
            initialDefaults: {
              ...initialSchedulerDataContext.initialDefaults,
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
        validateForm(trigger); // validate whole form
      } else if (schedulerSelectionSelected === COMPOSER_SCHEDULER_NAME) {
        // Get a new set of default Composer-specific values
        const composerDefaults = getInitialFormValues(
          {
            ...initialSchedulerDataContext,
            initialDefaults: {
              ...initialSchedulerDataContext.initialDefaults,
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
        validateForm(trigger); // validate whole form
      }
    }
  }, [
    schedulerSelectionSelected,
    initialSchedulerDataContext,
    sessionContext, 
    getValues
  ]);

  console.log('GetValues:', getValues());
  /**
   *
   * @param data The form data submitted from the Create Notebook Schedule form.
   * @param credentials The authentication credentials for the user.
   */
  const onSubmit = async (data: CombinedCreateFormValues) => {
    try {
      console.log('On Submit');
      if (!initialSchedulerDataContext.credentials) {
        console.error('Credentials not available.');
        throw new AuthenticationError('Unauthenticated');
      }
      let isSaveSuccessfull = false; // flag for successfull schedule creation/ update
      //vertex payload creation
      if (
        data.schedulerSelection === VERTEX_SCHEDULER_NAME &&
        initialSchedulerDataContext.credentials.project_id
      ) {
        const vertexData = data as VertexSchedulerFormValues;
        const vertexPayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule =
          transformZodSchemaToVertexSchedulePayload(
            vertexData,
            initialSchedulerDataContext.credentials.project_id,
            initialSchedulerDataContext.credentials.region_id || ''
          );
        console.log('Vertex Payload:', vertexPayload);

        if (initialSchedulerDataContext.editModeData?.editMode && scheduleId) {
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
        if (isSaveSuccessfull) {
          if (setVertexRouteState) {
            setVertexRouteState({
              schedulerName: SCHEDULE_LABEL_VERTEX.toLocaleLowerCase(),
              region: vertexData.vertexRegion
            });
          }
          navigate('/list');
        }
        //composer payload creation
      } else if (data.schedulerSelection === COMPOSER_SCHEDULER_NAME) {
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
            initialSchedulerDataContext.editModeData?.editMode
          );
        if (isSaveSuccessfull) {
          if (setComposerRouteState) {
            setComposerRouteState({
              schedulerName: COMPOSER_SCHEDULER_NAME,
              region: composerData.composerRegion,
              projectId: composerData.projectId,
              environment: composerData.environment
            });
          }
          navigate('/list');
        }
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }
    }
  };

  // Function to handle cancel action
  const handleCancel = () => {
    if (initialSchedulerDataContext.editModeData?.editMode) {
      if (setVertexRouteState && schedulerTypeForEdit === 'vertex') {
        setVertexRouteState({
          schedulerName: SCHEDULE_LABEL_VERTEX.toLocaleLowerCase(),
          region: initialSchedulerDataContext.editModeData.region
        });
      } else if (setComposerRouteState && schedulerTypeForEdit === 'composer') {
        setComposerRouteState({
          schedulerName: COMPOSER_SCHEDULER_NAME,
          region: initialSchedulerDataContext.editModeData.region,
          projectId: initialSchedulerDataContext.editModeData.projectId,
          environment: initialSchedulerDataContext.editModeData.environment
        });
      }
      navigate('/list');
    } else {
      (app.shell as any).activeWidget?.close();
    }
  };

  //return if form is not valid
  if (
    !initialSchedulerDataContext.credentials || //missing credentials
    (!initialSchedulerDataContext.initialDefaults &&
      !initialSchedulerDataContext.editModeData) || //missing initial data on create
    (initialSchedulerDataContext.editModeData?.editMode &&
      !initialSchedulerDataContext.editModeData.existingScheduleData) || // missing existing data on edit
    !isDataLoaded || // initial values not loaded
    !getValues('schedulerSelection') //
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
          {initialSchedulerDataContext.editModeData?.editMode
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

          <div
            className={
              errors.jobName
                ? 'create-scheduler-form-element-input-file footer-text'
                : 'create-scheduler-form-element-input-file'
            }
          >
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
                  initialSchedulerDataContext.editModeData?.editMode ||
                  (initialSchedulerDataContext.initialDefaults?.kernelDetails
                    ?.executionMode !== 'local' &&
                    option.value === 'vertex')
              }))}
              error={errors.schedulerSelection}
            />
          </div>
          {/* Conditionally render specific scheduler components */}
          {schedulerSelectionSelected === VERTEX_SCHEDULER_NAME && (
            <CreateVertexSchedule
              control={control}
              errors={errors as Record<keyof VertexSchedulerFormValues, any>}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              trigger={trigger}
              isValid={isValid}
              credentials={initialSchedulerDataContext.credentials}
              editScheduleData={initialSchedulerDataContext.editModeData}
              clearErrors={clearErrors}
              app={app}
            />
          )}
          {schedulerSelectionSelected === COMPOSER_SCHEDULER_NAME && (
            <CreateComposerSchedule
              control={control}
              errors={errors as Record<keyof ComposerSchedulerFormValues, any>}
              setValue={setValue}
              watch={watch}
              setError={setError}
              getValues={getValues}
              trigger={trigger}
              isValid={isValid}
              credentials={initialSchedulerDataContext.credentials}
              initialSchedulerDataContext={initialSchedulerDataContext}
              app={app}
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
