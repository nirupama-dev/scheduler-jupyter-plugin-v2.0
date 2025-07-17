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

import React from 'react';
import { FormInputDropdown } from '../common/formFields/FormInputDropdown';
import {
  allowedPeriodsCron,
  CORN_EXP_DOC_URL,
  DEFAULT_MACHINE_TYPE,
  NETWORK_CONFIGURATION_LABEL,
  NETWORK_CONFIGURATION_LABEL_DESCRIPTION,
  NETWORK_OPTIONS,
  RUN_ON_SCHEDULE_OPTIONS,
  SCHEDULE_FORMAT_DESCRIPTION,
  SCHEDULE_MODE_OPTIONS
} from '../../utils/Constants';
import { useForm } from 'react-hook-form';
import { IFormInput } from '../../interfaces/CommonInterface';
import { FormInputText } from '../common/formFields/FormInputText';
import { FormInputRadio } from '../common/formFields/FormInputRadio';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LearnMore from '../common/links/LearnMore';
import Cron, { PeriodType } from 'react-js-cron';
import 'react-js-cron/dist/styles.css'; // Adjust path if necessary
import { Button } from '@mui/material';
import { ICreateVertexSchedulerProps } from '../../interfaces/VertexInterface';

export const CreateVertexSchedule: React.FC<ICreateVertexSchedulerProps> = ({
  control,
  errors
}) => {
  const {
    //handleSubmit, reset,
    control
    // //setValue
  } = useForm<IFormInput>({
    //defaultValues: defaultValues,
  });
  return (
    <div>
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="machineType"
          control={control}
          label="Machine Type*"
          options={DEFAULT_MACHINE_TYPE}
          customClass="create-scheduler-style"
        />
      </div>

      <div className="execution-history-main-wrapper">
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="acceleratorType"
            control={control}
            label="Accelerator Type*"
            options={DEFAULT_MACHINE_TYPE}
            customClass="create-scheduler-style create-scheduler-form-element-input-fl"
          />
        </div>
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="acceleratorCount"
            control={control}
            label="Accelerator Count*"
            options={DEFAULT_MACHINE_TYPE}
            customClass="create-scheduler-style create-scheduler-form-element-input-fl"
          />
        </div>
      </div>

      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="kernel"
          control={control}
          label="Kernel*"
          options={DEFAULT_MACHINE_TYPE}
          customClass="create-scheduler-style"
        />
      </div>

      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="cloudStorageBucket"
          control={control}
          label="Cloud Storage Bucket*"
          options={DEFAULT_MACHINE_TYPE}
          customClass="create-scheduler-style"
        />
      </div>

      <div className="execution-history-main-wrapper">
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="diskType"
            control={control}
            label="Disk Type*"
            options={DEFAULT_MACHINE_TYPE}
            customClass="create-scheduler-style"
          />
        </div>
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputText label="Disk size*" control={control} name="diskSize" />
        </div>
      </div>

      <div className="create-scheduler-form-element panel-margin footer-text">
        <FormInputDropdown
          name="serviceAccount"
          control={control}
          label="Service account*"
          options={DEFAULT_MACHINE_TYPE}
        />
      </div>

      <div className="create-job-scheduler-text-para create-job-scheduler-sub-title">
        {NETWORK_CONFIGURATION_LABEL}
      </div>

      <p>{NETWORK_CONFIGURATION_LABEL_DESCRIPTION}</p>

      <div className="create-scheduler-form-element panel-margin">
        <FormInputRadio
          name="schedulerSelection"
          control={control}
          className="network-layout"
          options={NETWORK_OPTIONS}
        />
      </div>

      {/* Network in this project  */}
      <div className="execution-history-main-wrapper">
        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
          <FormInputDropdown
            name="primaryNetwork"
            control={control}
            label="Primary network*"
            customClass="create-scheduler-style create-scheduler-form-element-input-fl"
            options={DEFAULT_MACHINE_TYPE}
          />
        </div>

        <div className="create-scheduler-form-element create-scheduler-form-element-input-fl">
          <FormInputDropdown
            name="subNetwork"
            control={control}
            label="Sub network*"
            customClass="create-scheduler-style create-scheduler-form-element-input-fl"
            options={DEFAULT_MACHINE_TYPE}
          />
        </div>
      </div>

      {/* Network shared from host project */}
      <div className="create-scheduler-form-element">
        <FormInputDropdown
          name="sharedNetwork"
          control={control}
          label="Shared network*"
          options={DEFAULT_MACHINE_TYPE}
          customClass="create-scheduler-style"
        />
      </div>

      <div className="create-scheduler-label">Schedule</div>
      <div className="create-scheduler-form-element">
        <FormInputRadio
          name="scheduleMode"
          control={control}
          className="network-layout"
          options={SCHEDULE_MODE_OPTIONS}
        />
      </div>
      <div className="schedule-child-section">
        <FormInputRadio
          name="schedulerSelection"
          control={control}
          className="schedule-radio-btn"
          options={RUN_ON_SCHEDULE_OPTIONS}
        />

        <div className="execution-history-main-wrapper">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
              <DateTimePicker
                className="create-scheduler-style create-scheduler-form-element-input-fl"
                label="Start Date"
                // value={startDate}
                // onChange={newValue => handleStartDate(newValue)}
                slots={{
                  openPickerIcon: CalendarMonthIcon
                }}
                slotProps={{
                  actionBar: {
                    actions: ['clear']
                  },
                  tabs: {
                    hidden: true
                  },
                  textField: {
                    error: false
                  }
                }}
                disablePast
                closeOnSelect={true}
                // viewRenderers={{
                //   hours: renderTimeViewClock,
                //   minutes: renderTimeViewClock,
                //   seconds: renderTimeViewClock
                // }}
              />
              {/* {isPastStartDate && (
                      <ErrorMessage
                        message="Start date should be greater than current date"
                        showIcon={false}
                      />
                    )} */}
            </div>
            <div className="create-scheduler-form-element create-scheduler-form-element-input-fl create-pr">
              <DateTimePicker
                className="create-scheduler-style create-scheduler-form-element-input-fl"
                label="End Date"
                // value={endDate}
                // onChange={newValue => handleEndDate(newValue)}
                slots={{
                  openPickerIcon: CalendarMonthIcon
                }}
                slotProps={{
                  actionBar: {
                    actions: ['clear']
                  },
                  field: { clearable: true },
                  tabs: {
                    hidden: true
                  },
                  textField: {
                    error: false
                  }
                }}
                disablePast
                closeOnSelect={true}
                // viewRenderers={{
                //   hours: renderTimeViewClock,
                //   minutes: renderTimeViewClock,
                //   seconds: renderTimeViewClock
                // }}
              />
              {/* {endDateError && (
                      <ErrorMessage
                        message="End date should be greater than Start date"
                        showIcon={false}
                      />
                    )} */}
              {/* {isPastEndDate && (
                      <ErrorMessage
                        message="End date should be greater than current date"
                        showIcon={false}
                      />
                    )} */}
            </div>
          </LocalizationProvider>
        </div>

        {/* Schedule Input */}
        <div className="create-scheduler-form-element schedule-input-field">
          <FormInputText label="Schedule*" control={control} name="schedule" />
        </div>
        <div>
          <span className="tab-description tab-text-sub-cl">
            {SCHEDULE_FORMAT_DESCRIPTION}
          </span>
          <div className="learn-more-url">
            <LearnMore path={CORN_EXP_DOC_URL} />
          </div>
        </div>

        {/* cron input */}
        <div className="create-scheduler-form-element">
          <Cron
            // value=""
            setValue={() => {}}
            value='0 */3 * * *'
            // setValue={setScheduleValue}
            allowedPeriods={allowedPeriodsCron as PeriodType[] | undefined}
          />
        </div>

        <div className="create-scheduler-form-element">
          <FormInputDropdown
            name="timeZone"
            control={control}
            label="Time Zone*"
            options={DEFAULT_MACHINE_TYPE}
            customClass="create-scheduler-style"
          />
        </div>

        <div className="create-scheduler-form-element">
          <FormInputText label="Max runs*" control={control} name="maxRuns" />
        </div>

        <div className="save-overlay">
            <Button
              // onClick={() => handleCreateJobScheduler()}
              variant="contained"
              // aria-label={editMode ? ' Update Schedule' : 'Create Schedule'}
              // disabled={isSaveDisabled()}
            >
              <div>
                Create
                {/* {editMode
                  ? creatingVertexScheduler
                    ? 'UPDATING'
                    : 'UPDATE'
                  : creatingVertexScheduler
                    ? 'CREATING'
                    : 'CREATE'} */}
              </div>
            </Button>
            <Button
              variant="outlined"
              aria-label="cancel Batch"
              // disabled={creatingVertexScheduler}
              // onClick={!creatingVertexScheduler ? handleCancel : undefined}
            >
              <div>CANCEL</div>
            </Button>
          </div>
      </div>
    </div>
  );
};
