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
  INotebookKernalSchdulerDefaults,
  IEditScheduleData,
  IAuthCredentials
} from '../../interfaces/CommonInterface';
import {
  VertexSchedulerFormValues
} from '../../schemas/CreateVertexSchema';
import {
  ComposerSchedulerFormValues,
} from '../../schemas/CreateComposerSchema';
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
   * Determines the scheduler type to be used. It prioritizes the URL parameter if available (edit mode), otherwise, it uses the pre-fetched value (create mode).
   */
  const schedulerType =
    schedulerTypeForEdit || preFetchedInitialDetails?.schedulerType || 'vertex';

  /**
   * Create Edit Schedule Data State (for edit)
   */
  const [editScheduleData, setEditScheduleData] =
    useState<IEditScheduleData | null>({
      editMode: scheduleId ? true : false,
      region: region,
      projectId: projectId,
      environment: environment,
      existingScheduleData: undefined
    });

  /**
   * Create Kernel and Schedule Value State (for create)
   */
  const [kernalAndScheduleValue, setKernalAndScheduleValue] =
    useState<INotebookKernalSchdulerDefaults>(
      preFetchedInitialDetails || {
        schedulerType: schedulerType,
        kernalDetails: {
          executionMode: 'local',
          isDataprocKernel: false,
          kernelDisplayName: ''
        }
      }
    );
  /**
   * State variable for credentials.
   */
  const [credentials, setCredentials] = useState<IAuthCredentials>();

  /**
   * Helper Function to Extract Kernel details and assign default Scheduler to be selected for the CREATE form
   * Initially looks for the prefetched Kernel details
   *
   */
  const loadDefaultKernelScheduler = async () => {
    //First when landing from Create Schedule on Notebook prefetchedInitialDetails are used.
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
        // TO DO show a toast/notification here if this happens often
      }
    }
  };

  /**
   * Helper function to Fetch the edit data for a Vertex schedule.
   */
  const fetchVertexEditData = async (scheduleId: string, region: string) => {
    try {
      const vertexScheduleDataToUpdate:
        | aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule
        | undefined = await VertexServices.getVertexJobScheduleDetails(
        scheduleId,
        region
      );

      // assign the fetched data to the editModeData state
      if (!vertexScheduleDataToUpdate) {
        // TO DO: routing redirect to Listing screen
      } else {
        setEditScheduleData(prevState => {
          // Check if the previous state is null. If so, return a new valid object.
          if (prevState === null) {
            return {
              editMode: true, // You must explicitly set this
              region: region,
              projectId: projectId,
              environment: environment,
              existingScheduleData: transformVertexScheduleResponseToZodSchema(
                vertexScheduleDataToUpdate,
                region,
                projectId
              )
            };
          }
          // Otherwise, safely spread the previous state and update existingData
          return {
            ...prevState,
            existingScheduleData: transformVertexScheduleResponseToZodSchema(
              vertexScheduleDataToUpdate,
              region,
              projectId
            )
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch schedule details:', error);
      // Handle error, e.g., show a toast or redirect
    }
  };

  /**
   * Helper function to Fetch the edit data for a Composer schedule.
   */
  const fetchComposerEditData = async (
    scheduleId: string,
    region: string,
    projectId: string,
    environment: string
  ) => {
    try {
      const composerScheduleDataToUpdate =
        await ComposerServices.getComposerJobScheduleDetails(
          scheduleId,
          region,
          projectId,
          environment
        );
      // assign the fetched data to the editModeData state
      if (!composerScheduleDataToUpdate) {
        // TO DO: routing redirect to Listing screen
      } else {
        setEditScheduleData(prevState => {
          // Check if the previous state is null. If so, return a new valid object.
          // This handles the initial state case correctly.
          if (prevState === null) {
            return {
              editMode: true, // You must explicitly set this
              region: region,
              projectId: projectId,
              environment: environment,
              existingScheduleData: transformComposerScheduleDataToZodSchema(
                composerScheduleDataToUpdate
              )
            };
          }
          // Otherwise, safely spread the previous state and update existingData
          return {
            ...prevState,
            existingScheduleData: transformComposerScheduleDataToZodSchema(
              composerScheduleDataToUpdate
            )
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch schedule details:', error);
      // Handle error, e.g., show a toast or redirect
    }
  };

  /**
   * Authentication
   */
  useEffect(() => {
    let credentials = authApi();
    if (!credentials) {
      //TO DO: Reroute Login
    }
    credentials.then(data => {
      setCredentials(data);
    });
  }, []);

  /**
   * useEffect to handle the data fetching for EDIT mode
   *
   */
  useEffect(() => {
    if (editScheduleData?.editMode && scheduleId && region) {
      if (schedulerType == 'vertex') {
        fetchVertexEditData(scheduleId, region);
      }
      if (schedulerType == 'composer' && projectId && environment) {
        fetchComposerEditData(scheduleId, region, projectId, environment);
      }

      setValue('schedulerSelection', schedulerType);
    
    }
  }, [scheduleId, projectId, region, environment]);

  /**
   * Effect to set the initial scheduler type based on the session context (for CREATE form).
   * This effect runs when on Create schedule mode and preFetchedInitialDetails changes or when the component mounts
   */
  useEffect(() => {
    if (!editScheduleData?.editMode) {
      loadDefaultKernelScheduler();

      // Set form values for the form
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
    }
  }, [preFetchedInitialDetails, sessionContext]); // Ensure all dependencies are listed

  /**
   * Get the initial form values based on the scheduler type.
   * This ensures that the form is pre-populated with the correct fields for the selected scheduler
   */
  const schedulerFormValues = useMemo(() => {
    //Load existing data in case of EDIT
    if(editScheduleData && editScheduleData.editMode && editScheduleData.existingScheduleData){
      return editScheduleData.existingScheduleData;
    }
    try{
    //Load default values on CREATE
    return getInitialFormValues(
      kernalAndScheduleValue,
      sessionContext
    );
  }catch(error){
    console.error("Error loading Scheduler form values:", error);
    //TODO: Reroute
    return {};
  }
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
  /**
   * Effect to set the initial form values based on the scheduler type.
   */

// useEffect(() => {
    // This effect runs when preFetchedInitialDetails changes or when the component mounts
    // and preFetchedInitialDetails is initially null/undefined.
  //   let isMounted = true;
  //   (async () => {
  //     console.log(
  //       'Component mounted or preFetchedInitialDetails changed. Current value:',
  //       preFetchedInitialDetails
  //     );
  //     let loadedDetails: INotebookKernalSchdulerDefaults;
  //     // If preFetchedInitialDetails is available, use it; otherwise, fetch the default scheduler type
  //     if (preFetchedInitialDetails) {
  //       loadedDetails = preFetchedInitialDetails;
  //       console.log(
  //         'Using pre-fetched Initial Scheduler Details:',
  //         loadedDetails
  //       );
  //     } else {
  //       try {
  //         loadedDetails = (await getDefaultSchedulerTypeOnLoad(sessionContext))
  //           .kernalAndSchedulerDetails;
  //         console.log(
  //           'Fallback fetched Initial Scheduler Details:',
  //           loadedDetails
  //         );
  //       } catch (error) {
  //         console.error(
  //           'Failed to fetch initial scheduler details in fallback:',
  //           error
  //         );
  //         loadedDetails = {
  //           schedulerType: 'vertex',
  //           kernalDetails: {
  //             executionMode: 'local',
  //             isDataprocKernel: false,
  //             kernelDisplayName: ''
  //           }
  //         };
  //       }
  //     }
  //     if (isMounted) {
  //       setKernalAndScheduleValue(loadedDetails);
  //       setValue('schedulerSelection', loadedDetails.schedulerType);
  //       setValue(
  //         'executionMode',
  //         loadedDetails.kernalDetails?.executionMode || 'local'
  //       );
  //       setValue(
  //         'serverless',
  //         loadedDetails.kernalDetails?.selectedServerlessName
  //       );
  //       setValue('cluster', loadedDetails.kernalDetails?.selectedClusterName);
  //       console.log('Scheduler Selection set to:', loadedDetails.schedulerType);
  //     }
  //   })();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [preFetchedInitialDetails, sessionContext, setValue]);

  const schedulerSelection = watch('schedulerSelection'); // Get the current value of the radio button
  /**
   * Helper function to get the schedule values from the Vertex scheduler form.
   * @param vertexData The data from the Vertex scheduler form.
   * @returns The schedule values as a string or undefined.
   */
  // const getScheduleValues = (
  //   vertexData: z.infer<typeof createVertexSchema>
  // ): string | undefined => {
  //   if (vertexData.scheduleMode === 'runNow') {
  //     return ''; // Or undefined, depending on backend's strictness for empty string vs missing key
  //   }
  //   if (
  //     vertexData.scheduleMode === 'runSchedule' &&
  //     vertexData.internalScheduleMode === 'cronFormat'
  //   ) {
  //     return vertexData.scheduleFieldCronFormat;
  //   }
  //   if (
  //     vertexData.scheduleMode === 'runSchedule' &&
  //     vertexData.internalScheduleMode === 'userFriendly'
  //   ) {
  //     return vertexData.scheduleValueUserFriendly;
  //   }
  //   return undefined; // Fallback
  // };

  /**
   *
   * @param data The form data submitted from the Create Notebook Schedule form.
   */
  const onSubmit = async (
    data: CombinedCreateFormValues,
    credentials: IAuthCredentials
  ) => {
    let isSaveSuccessfull = false; // flag for successfull schedule creation/ update
    //vertex payload creation
    if (
      data.schedulerSelection === 'vertex' &&
      credentials.project_id &&
      credentials.region_id
    ) {
      const vertexData = data as VertexSchedulerFormValues;
      const vertexPayload: aiplatform_v1.Schema$GoogleCloudAiplatformV1Schedule =
        transformZodSchemaToVertexSchedulePayload(
          vertexData,
          credentials?.project_id,
          credentials?.region_id
        );
      console.log('Vertex Payload:', vertexPayload);

      if (editScheduleData?.editMode && scheduleId) {
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
          editScheduleData?.editMode
        );
    }

    if (isSaveSuccessfull) {
      //TODO: // redirect to list page or show success message
    } else {
      //TODO: Retain the form.
    }
  };

  // Function to handle cancel action
  const handleCancel = () => {
    reset(schedulerFormValues); // Reset form to default values
    // TODO: Add navigation logic
  };
  // return if authentication is successfull
  if (!credentials) {
    return null;
    //TO DO: Handle unauthenticated state
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
          {
            editScheduleData&& editScheduleData.editMode ? 'Update Scheduled Notebook Job' :
            'Create Scheduled Notebook Job'
          }
        </div>
      </div>
      <form onSubmit={handleSubmit(data => onSubmit(data, credentials))}>
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
              credentials={credentials}
              editScheduleData={editScheduleData}
            />
          )}
          {schedulerSelection === 'composer' && (
            <CreateComposerSchedule
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              setError={setError}
              getValues={getValues}
              trigger={trigger}
              credentials={credentials}
              editScheduleData={editScheduleData}
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
