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

import React, { FC } from 'react';
import {
  Autocomplete,
  Button,
  CircularProgress,
  TextField
} from '@mui/material';
import { VERTEX_REGIONS } from '../../../utils/Constants';
import { ErrorMessage } from '../../common/notificationHandling/ErrorUtils';
import { IVertexListingInputProps } from '../../../interfaces/VertexInterface';

const VertexListingInputLayout: FC<IVertexListingInputProps> = ({
  region,
  handleRegion,
  loaderState,
  regionDisable,
  handleCurrentPageRefresh
}) => (
  <div className="select-text-overlay-scheduler">
    <div className="enable-text-label">
      <div className="scheduler-form-element-container content-pd-space">
        <Autocomplete
          options={VERTEX_REGIONS}
          value={VERTEX_REGIONS.find(option => option.value === region) || null}
          getOptionLabel={option => option.label}
          onChange={(_event, val) => handleRegion(val)}
          renderInput={params => (
            <TextField
              {...params}
              label="Region*"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loaderState.regionLoader ? (
                      <CircularProgress size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
          clearIcon={false}
          loading={loaderState.regionLoader}
          disabled={regionDisable}
        />
        {!loaderState.isLoading && !region && (
          <ErrorMessage message="Region is required" showIcon={false} />
        )}
      </div>
    </div>
    <div className="btn-refresh">
      <Button
        disabled={loaderState.isLoading}
        className="btn-refresh-text"
        variant="outlined"
        onClick={handleCurrentPageRefresh}
      >
        REFRESH
      </Button>
    </div>
  </div>
);

export default VertexListingInputLayout;
