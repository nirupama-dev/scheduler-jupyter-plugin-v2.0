import React, { useEffect, useState } from 'react';
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
// import { ListVertexSchedule } from '../vertex/scheduleListingView/ListVertexSchedule';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export const ScheduleListingView = () => {
  const [schedulerSelected, setSchedulerSelected] = useState<
    string | undefined
  >('');

  const navigate = useNavigate();
  const location = useLocation();

  // Determine current sub-route based on path
  const currentSubPath = location.pathname.split('/').pop(); // Gets 'vertex' or 'composer'

  // Effect to redirect to a default sub-route if /list is accessed directly
  useEffect(() => {
    if (location.pathname === '/list' || location.pathname === '/list/') {
      navigate(SCHEDULE_LABEL_VERTEX, { replace: true }); // Default to /list/vertex
    }
    console.log('inside effect naigateion');
    setSchedulerSelected(currentSubPath);
  }, [location.pathname, navigate]);

  // useEffect(() => {
  //   console.log('inside effect')
  //   setSchedulerSelected(SCHEDULE_LABEL_VERTEX);
  // }, []);

  /**
   * Handle he change  of the scheduler selection
   * @param(React.ChangeEvent<HTMLInputElement>) scheduler selected
   */
  const handleSchedulerModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedScheduler = (event.target as HTMLInputElement).value;
    setSchedulerSelected(selectedScheduler);
    console.log('selectedScheduler', selectedScheduler);
    navigate(`/list/${selectedScheduler}`);
  };

  return (
    <>
      <div className="cluster-list-overlay" role="tab">
        <div className="list-vertex-title">{LISTING_PAGE_HEADING}</div>
      </div>

      <div className="create-scheduler-form-element sub-para">
        <FormControl>
          <RadioGroup
            className="schedule-radio-btn"
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={schedulerSelected}
            onChange={handleSchedulerModeChange}
            data-testid={
              schedulerSelected === 'vertex'
                ? 'vertex-selected'
                : 'composer-selected'
            }
          >
            <FormControlLabel
              value="vertex"
              className="create-scheduler-label-style"
              control={<Radio size="small" />}
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
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {SCHEDULE_LABEL_COMPOSER}
                </Typography>
              }
            />
          </RadioGroup>
        </FormControl>
      </div>

      <div>
        <Outlet />
      </div>
    </>
  );
};
