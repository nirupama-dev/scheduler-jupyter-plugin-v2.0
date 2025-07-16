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

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { MuiChipsInput } from 'mui-chips-input';
import { FormInputDropdown } from '../common/formFields/FormInputDropdown';
import { useRegion } from '../../services/common/RegionService';
import { FormInputMultiCheckbox } from '../common/formFields/FormInputCheckbox';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import Cron from 'react-js-cron';
import { Button } from '@mui/material';
// import { projectListAPI } from '../../services/common/ProjectService';

export const CreateComposerSchedule = () => {
  const { control, setValue } = useForm<any>();

  // const projects = projectListAPI(''); // Fetch projects with an empty prefix
  // console.log(projects);

  const regions = useRegion('	dataproc-jupyter-ext-dev-2');

  const regionStrList = useMemo(
    () => regions.map(region => ({ label: region.name, value: region.name })),
    [regions]
  );

  return (
    <div className="common-fields">
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="projectId"
            label="Project ID"
            control={control}
            options={[]}
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="regionId"
            label="Region"
            control={control}
            options={regionStrList}
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="composerEnvironmentName"
            label="Environment"
            control={control}
            options={[]}
          />
        </div>
      </div>
      <div className="create-scheduler-label block-seperation">
        Output formats
      </div>
      <div className="create-scheduler-form-element-input-file">
        <FormInputMultiCheckbox
          name="outputFormats"
          label="Notebook"
          control={control}
          setValue={setValue}
          options={[
            {
              label: 'Notebook',
              value: 'ipynb',
              defaultChecked: true,
              disabled: true
            }
          ]}
        />
      </div>
      <div className="create-scheduler-label block-seperation">Parameters</div>
      <div className="create-scheduler-form-element sub-para">
        <FormInputRadio
          name="schedulerSelection"
          control={control}
          className="schedule-radio-btn"
          options={[
            {
              label: 'Serverless',
              value: 'serverless'
            },
            {
              label: 'Cluster',
              value: 'cluster'
            }
          ]}
        />
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="cluster"
            label="Cluster*"
            control={control}
            options={[]}
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="serverless"
            label="Serverless"
            control={control}
            options={[]}
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <FormInputMultiCheckbox
          name="stopClusterAfterExecution"
          control={control}
          setValue={setValue}
          options={[
            {
              label: 'Stop the cluster after notebook execution',
              value: ''
            }
          ]}
        />
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputText
            label="Retry count"
            control={control}
            name="retryCount"
            type="number"
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputText
            label="Retry delay (minutes)"
            control={control}
            name="retryDelay"
            type="number"
          />
        </div>
      </div>
      <div className="create-scheduler-form-element-input-file">
        <FormInputMultiCheckbox
          name="email"
          control={control}
          setValue={setValue}
          options={[
            {
              label: 'Email on failure',
              value: ''
            },
            {
              label: 'Email on retry',
              value: ''
            },
            {
              label: 'Email on success',
              value: ''
            }
          ]}
        />
      </div>
      <div className="create-scheduler-form-element">
        <MuiChipsInput
          className="select-job-style"
          // onChange={e => handleEmailList(e)}
          addOnBlur={true}
          // value={emailList}
          inputProps={{ placeholder: '' }}
          label="Email recipients"
        />
      </div>
      <div className="create-scheduler-label block-seperation">Schedule</div>
      <div className="create-scheduler-form-element sub-para">
        <FormInputRadio
          name="schedulerSelection"
          control={control}
          className="schedule-radio-btn"
          options={[
            {
              label: 'Run now',
              value: 'runNow'
            },
            {
              label: 'Run on a schedule',
              value: 'runSchedule'
            }
          ]}
        />
      </div>
      <div className="create-scheduler-form-element">
        <Cron value={''} setValue={() => {}} />
      </div>
      <div className="create-scheduler-form-element-input-file">
        <div className="create-scheduler-style">
          <FormInputDropdown
            name="timeZone"
            label="Time Zone"
            control={control}
            options={[]}
          />
        </div>
      </div>
      <div className="save-overlay">
        <Button variant="contained" aria-label="Create Schedule">
          <div>CREATE</div>
        </Button>
        <Button variant="outlined" aria-label="cancel Batch">
          <div>CANCEL</div>
        </Button>
      </div>
    </div>
  );
};
