/**
 * @license
 * Copyright 2026 Google LLC
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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSchedulerContext } from '../../context/vertex/SchedulerContext';
import { abortApiCall } from '../../utils/GeneralConfig';

export const ScheduleListingView = (abortControllers: {
  abortControllers: any;
}) => {
  const schedulerContext = useSchedulerContext();
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
      if (
        schedulerContext?.vertexRouteState?.schedulerName ===
        SCHEDULE_LABEL_VERTEX.toLocaleLowerCase()
      ) {
        navigate(SCHEDULE_LABEL_VERTEX.toLocaleLowerCase(), { replace: true }); // Default to /list/vertex
      } else if (
        schedulerContext?.vertexRouteState?.schedulerName ===
        SCHEDULE_LABEL_COMPOSER.toLocaleLowerCase()
      ) {
        navigate(SCHEDULE_LABEL_COMPOSER.toLocaleLowerCase(), {
          replace: true
        }); // Default to /list/composer
      } else {
        navigate(SCHEDULE_LABEL_VERTEX.toLocaleLowerCase(), { replace: true });
      }
    }
    setSchedulerSelected(currentSubPath);
  }, [location.pathname, navigate]);

  /**
   * Handle he change  of the scheduler selection
   * @param(React.ChangeEvent<HTMLInputElement>) scheduler selected
   */
  const handleSchedulerModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedScheduler = (event.target as HTMLInputElement).value;
    setSchedulerSelected(selectedScheduler);
    abortApiCall(abortControllers);
    navigate(`/list/${selectedScheduler}`);
  };

  return (
    <>
      <div className="scheduler-list-overlay" role="tab">
        <div className="list-vertex-title">{LISTING_PAGE_HEADING}</div>
      </div>

      <div className="scheduler-form-element-container sub-para">
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
              className="scheduler-label-font"
              control={<Radio size="small" />}
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {SCHEDULE_LABEL_VERTEX}
                </Typography>
              }
            />
            <FormControlLabel
              value="composer"
              className="scheduler-label-font"
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
