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
 * React component that defines the Notebook Scheduler widget.
 * It uses MemoryRouter to handle routing within the JupyterLab environment.
 * I wraps the SchedulerRoutes component to provide the necessary routing context.
 */

import React, { useState } from 'react';
import {
  LISTING_PAGE_HEADING,
  SCHEDULE_LABEL_COMPOSER,
  SCHEDULE_LABEL_VERTEX
} from '../../utils/Constants';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import { ListComposerSchedule } from '../composer/listingView/ListComposerSchedule';

export const ScheduleListingView = () => {
  const [schedulerSelected, setSchedulerSelected] = useState<string>(
    SCHEDULE_LABEL_VERTEX
  );

  /**
   * Handle he change  of the scheduler selection
   * @param(React.ChangeEvent<HTMLInputElement>) scheduler selected
   */
  const handleSchedulerModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedScheduler = (event.target as HTMLInputElement).value;
    setSchedulerSelected(selectedScheduler);
  };

  return (
    <>
      <div className="cluster-list-overlay" role="tab">
        <div className="cluster-details-title">{LISTING_PAGE_HEADING}</div>
      </div>

      <div className="create-scheduler-form-element sub-para">
        <FormControl>
          <RadioGroup
            className="schedule-radio-btn"
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={schedulerSelected}
            onChange={handleSchedulerModeChange}
            // data-testid={
            //   notebookSelector === 'vertex'
            //     ? 'vertex-selected'
            //     : 'composer-selected'
            // }
          >
            <FormControlLabel
              value="vertex"
              className="create-scheduler-label-style"
              control={<Radio size="small" />}
              //   disabled={
              //     schedulerBtnDisable ||
              //     (editMode && notebookSelector === 'composer')
              //   }
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {SCHEDULE_LABEL_VERTEX}
                </Typography>
              }
            />
            <FormControlLabel
              value="composer"
              className="create-scheduler-label-style"
              control={<Radio size="small" />}
              //   disabled={editMode && notebookSelector === 'vertex'}
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {SCHEDULE_LABEL_COMPOSER}
                </Typography>
              }
            />
          </RadioGroup>
        </FormControl>
      </div>

      <ListComposerSchedule />
    </>
  );
};
