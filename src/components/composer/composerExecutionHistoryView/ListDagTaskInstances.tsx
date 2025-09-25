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

import React, { useEffect, useState } from 'react';
import { Typography, IconButton } from '@mui/material';
import { ComposerServices } from '../../../services/composer/ComposerServices';
import { handleDebounce } from '../../../utils/Config';
import {
  iconDagTaskFailed,
  iconExpandLess,
  iconExpandMore,
  iconStop,
  iconSuccess
} from '../../../utils/Icons';
import { ActionButton } from '../../common/button/ActionButton';
import LoadingSpinner from '../../common/loader/LoadingSpinner';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { handleOpenLoginWidget } from '../../common/login/Config';
import { AuthenticationError } from '../../../exceptions/AuthenticationException';

const ListDagTaskInstances = ({
  composerName,
  dagId,
  dagRunId,
  projectId,
  region,
  app
}: {
  composerName: string;
  dagId: string;
  dagRunId: string;
  projectId: string;
  region: string;
  app: JupyterFrontEnd;
}): JSX.Element => {
  const [dagTaskInstancesList, setDagTaskInstancesList] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [logList, setLogList] = useState('');

  const [height, setHeight] = useState(window.innerHeight - 320);

  function handleUpdateHeight() {
    const updateHeight = window.innerHeight - 320;
    setHeight(updateHeight);
  }

  // Debounce the handleUpdateHeight function
  const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

  // Add event listener for window resize using useEffect
  useEffect(() => {
    window.addEventListener('resize', debouncedHandleUpdateHeight);

    // Cleanup function to remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', debouncedHandleUpdateHeight);
    };
  }, []);

  const listDagTaskInstancesRunsList = async () => {
    try {
      await ComposerServices.listDagTaskInstancesListService(
        composerName,
        dagId,
        dagRunId,
        setDagTaskInstancesList,
        setIsLoading,
        projectId,
        region
      );
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }
    }
  };

  useEffect(() => {
    listDagTaskInstancesRunsList();
    setExpanded(false);
  }, [dagRunId]);

  useEffect(() => {
    if (dagTaskInstancesList.length > 0) {
      setExpanded('0');
      listDagTaskLogList('0', dagTaskInstancesList[0].tryNumber);
    }
  }, [dagTaskInstancesList]);

  const handleChange = (
    index: string,
    iconIndex: number,
    fromClick: string
  ) => {
    if (`${index}` === expanded && fromClick === 'expandClick') {
      setExpanded(false);
    } else {
      setExpanded(`${index}`);
      listDagTaskLogList(index, iconIndex);
    }
  };

  const listDagTaskLogList = async (index: string, iconIndex: number) => {
    try {
      await ComposerServices.listDagTaskLogsListService(
        composerName,
        dagId,
        dagRunId,
        dagTaskInstancesList[index].taskId,
        iconIndex,
        setLogList,
        setIsLoadingLogs,
        projectId,
        region
      );
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleOpenLoginWidget(app);
      }
    }
  };
  return (
    <div>
      {dagTaskInstancesList.length > 0 ? (
        <div>
          <div className="accordion-row-parent-header">
            <div className="accordion-row-data">Task Id</div>
            <div className="accordion-row-data">Attempts</div>
            <div className="accordion-row-data">Duration (in seconds)</div>
            <div className="accordion-row-data-expand-logo"></div>
          </div>
          {dagTaskInstancesList.length > 0 &&
            dagTaskInstancesList.map((taskInstance: any, index: string) => (
              <div key={taskInstance.taskId}>
                <div className="accordion-row-parent">
                  <div className="accordion-row-data">
                    {taskInstance.taskId}
                  </div>
                  <div className="accordion-row-data">
                    {taskInstance.tryNumber === 0 ? (
                      <IconButton disabled>
                        <iconStop.react tag="div" />
                      </IconButton>
                    ) : (
                      <div className="logo-row-container">
                        {Array.from({ length: taskInstance.tryNumber }).map(
                          (_, i) => (
                            <IconButton
                              key={i}
                              onClick={() =>
                                handleChange(index, i + 1, 'attemptsClick')
                              }
                            >
                              {i === taskInstance.tryNumber - 1 ? (
                                taskInstance.state === 'failed' ? (
                                  <iconDagTaskFailed.react tag="div" />
                                ) : (
                                  <iconSuccess.react tag="div" />
                                )
                              ) : (
                                <iconDagTaskFailed.react tag="div" />
                              )}
                            </IconButton>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="accordion-row-data">
                    {taskInstance.duration}
                  </div>
                  {taskInstance.tryNumber !== 0 ? (
                    <div className="accordion-row-data-expand-logo">
                      <ActionButton
                        title={expanded === `${index}` ? 'Collapse' : 'Expand'}
                        onClick={() =>
                          handleChange(
                            index,
                            taskInstance.tryNumber,
                            'expandClick'
                          )
                        }
                        icon={
                          expanded === `${index}`
                            ? iconExpandLess
                            : iconExpandMore
                        }
                        className="icon-white logo-alignment-style-accordion"
                      />
                    </div>
                  ) : (
                    <div className="accordion-row-data-expand-logo"></div>
                  )}
                </div>

                {isLoadingLogs && expanded === `${index}` ? (
                  <div className="spin-loader-main">
                    <LoadingSpinner iconClassName="spin-loader-custom-style" />
                    Loading Dag Runs Task Logs
                  </div>
                ) : (
                  expanded === `${index}` && (
                    <div>
                      {' '}
                      <Typography>
                        <pre
                          className="logs-content-style"
                          style={{ maxHeight: height }}
                        >
                          {logList}
                        </pre>
                      </Typography>{' '}
                    </div>
                  )
                )}
              </div>
            ))}
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className="spin-loader-main">
              <LoadingSpinner iconClassName="spin-loader-custom-style" />
              Loading Dag Runs Task Instances
            </div>
          ) : (
            <div className="no-data-style">No rows to display</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListDagTaskInstances;
