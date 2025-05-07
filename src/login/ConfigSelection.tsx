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

import { Button, CircularProgress } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import THIRD_PARTY_LICENSES from '../../third-party-licenses.txt';
import { DynamicDropdown } from '../controls/DynamicDropdown';
import { RegionDropdown } from '../controls/RegionDropdown';
import {
  IAuthCredentials,
  IConfigSelectionProps,
  IUserInfoResponse
} from '../login/LoginInterfaces';
import { LOG_LEVEL, SchedulerLoggingService } from '../services/LoggingService';
import { projectListAPI } from '../services/ProjectService';
import { authApi, loggedFetch } from '../utils/Config';
import {
  API_HEADER_BEARER,
  API_HEADER_CONTENT_TYPE,
  USER_INFO_URL,
  VERSION_DETAIL
} from '../utils/Const';
import { toastifyCustomStyle } from '../utils/CustomStyle';
import { IconGoogleCloud } from '../utils/Icons';
import { ConfigService } from '../services/ConfigService';

function ConfigSelection({
  configError,
  setConfigError,
  app,
  launcher,
  settingRegistry
}: IConfigSelectionProps) {
  const [projectId, setProjectId] = useState('');
  const [region, setRegion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userInfo, setUserInfo] = useState({
    email: '',
    picture: ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    const dataToSend = { projectId, region };
    await ConfigService.saveConfig(dataToSend, setIsSaving);
  };

  const displayUserInfo = async (credentials: IAuthCredentials | undefined) => {
    if (credentials) {
      loggedFetch(USER_INFO_URL, {
        method: 'GET',
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + credentials.access_token
        }
      })
        .then((response: Response) => {
          response
            .json()
            .then((responseResult: IUserInfoResponse) => {
              if (responseResult?.error?.code) {
                toast.error(
                  responseResult?.error?.message,
                  toastifyCustomStyle
                );
              } else {
                setUserInfo(responseResult);
                setIsLoadingUser(false);
              }
            })
            .catch((e: Error) => console.error(e));
        })
        .catch((err: Error) => {
          setIsLoadingUser(false);
          SchedulerLoggingService.log(
            'Error displaying user info',
            LOG_LEVEL.ERROR
          );
          toast.error(
            `Failed to fetch user information : ${err}`,
            toastifyCustomStyle
          );
        });
    }
  };
  /**
   * onClick handler for when user's click on the "license" link in
   * the user info box.
   */
  const handleLicenseClick = async () => {
    const licenseWindow = window.open('about:blank');
    if (licenseWindow) {
      const preEle = licenseWindow.document.createElement('pre');
      preEle.textContent = THIRD_PARTY_LICENSES;
      licenseWindow.document.body.appendChild(preEle);
    }
  };

  useEffect(() => {
    authApi().then(credentials => {
      displayUserInfo(credentials);

      if (credentials && credentials.project_id && credentials.region_id) {
        setProjectId(credentials.project_id);
        setRegion(credentials.region_id);
        setConfigError(false);
      } else {
        setConfigError(true);
      }
    });
  }, []);
  return (
    <div>
      {isLoadingUser && !configError ? (
        <div className="spin-loader-main">
          <CircularProgress
            className="spin-loader-custom-style"
            size={20}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          Loading Config Setup
        </div>
      ) : (
        <div className="settings-component">
          <div className="settings-overlay">
            <div>
              <IconGoogleCloud.react
                tag="div"
                className="logo-alignment-style"
              />
            </div>
            <div className="settings-text">Settings</div>
          </div>
          <div className="settings-separator"></div>
          <div className="project-header">Google Cloud Project Settings </div>
          <div className="config-overlay">
            <div className="config-form">
              <div className="project-overlay">
                <DynamicDropdown
                  value={projectId}
                  onChange={(_, projectId: string | null) =>
                    setProjectId(projectId ?? '')
                  }
                  fetchFunc={projectListAPI}
                  label="Project ID*"
                  // Always show the clear indicator and hide the dropdown arrow
                  // make it very clear that this is an autocomplete.
                  sx={{
                    '& .MuiAutocomplete-clearIndicator': {
                      visibility: 'visible'
                    }
                  }}
                  popupIcon={null}
                />
              </div>

              <div className="region-overlay">
                <RegionDropdown
                  projectId={projectId}
                  region={region}
                  onRegionChange={region => setRegion(region)}
                />
              </div>
              <div className="save-overlay">
                <Button
                  variant="contained"
                  disabled={
                    isSaving || projectId.length === 0 || region.length === 0
                  }
                  onClick={handleSave}
                >
                  {isSaving ? 'Saving' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="user-info-card">
              <div className="user-overlay">
                <div className="user-image-overlay">
                  <img
                    src={userInfo.picture}
                    alt="User Image"
                    className="user-image"
                  />
                </div>
                <div className="user-details">
                  <div className="user-email">{userInfo.email}</div>
                </div>
              </div>
              <div className="separator"></div>
              <div className="google-header">
                <a
                  href="https://policies.google.com/privacy?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                <span className="privacy-terms"> • </span>
                <a
                  href="https://policies.google.com/terms?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
                <span className="footer-divider"> • </span>
                <a onClick={handleLicenseClick} href="#">
                  Licenses
                </a>
              </div>
              <div className="feedback-version-container">
                <div className="google-header">
                  <a
                    className="feedback-container"
                    href="https://forms.gle/wnEnH3fL4JRjPwbr7"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Provide Feedback
                  </a>
                  <span className="privacy-terms"> • </span>
                  {/* TODO: change this to scheduler jupyter plugin git repository*/}
                  <a
                    href="https://github.com/GoogleCloudDataproc/dataproc-jupyter-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Version {VERSION_DETAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigSelection;
