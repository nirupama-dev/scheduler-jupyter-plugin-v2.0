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
 * Initialization data for the scheduler-jupyter-plugin extension.
 * Parent component for createVertexSchedule.tsx and CreateComposerSchedule.tsx
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { iconLeftArrow } from '../../utils/Icons';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import { SCHEDULER_OPTIONS } from '../../utils/Constants';
import { CreateVertexSchedule } from '../vertex/CreateVertexSchedule';
import { IFormInput } from '../../interfaces/CommonInterface';

export const CreateNotebookSchedule = () => {
  const {
    //handleSubmit, reset,
    control
    // //setValue
  } = useForm<IFormInput>({
    //defaultValues: defaultValues,
  });

  return (
    <div className="component-level">
      <div className="cluster-details-header">
        <div
          role="button"
          className="back-arrow-icon"
          //onClick={handleCancel}
        >
          <iconLeftArrow.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        <div className="create-job-scheduler-title">
          {
            // editMode ? 'Update A Scheduled Job' :
            'Create A Scheduled Job'
          }
        </div>
      </div>
      <div className="common-fields">
        <div className="create-scheduler-style">
          <FormInputText label="Job Name" control={control} name="jobName" />
        </div>

        <div className="create-scheduler-form-element-input-file">
          <div className="create-scheduler-style">
            <FormInputText
              label="Input File"
              control={control}
              name="inputFile"
            />
          </div>
        </div>

        <div className="create-scheduler-form-element sub-para">
          <FormInputRadio
            name="schedulerSelection"
            control={control}
            className="schedule-radio-btn"
            options={SCHEDULER_OPTIONS}
          />
        </div>

        <CreateVertexSchedule />
      </div>
    </div>
  );
};
