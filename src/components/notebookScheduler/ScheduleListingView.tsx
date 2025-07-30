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
import { ListVertexSchedule } from '../vertex/scheduleListingView/ListVertexSchedule';

export const ScheduleListingView = () => {
  const [schedulerSelected, setSchedulerSelected] = useState<string>(
    SCHEDULE_LABEL_VERTEX
  );

  /**
   * Handle he change  of the scheduler selection
   * @param(React.ChangeEvent<HTMLInputElement>) scheduler selected
   */
  const handleSchedulerModeChange = (event: React.ChangeEvent<HTMLInputElement> ) => {
    const selectedScheduler =(event.target as HTMLInputElement).value;
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

      <ListVertexSchedule/>
    </>
  );
};