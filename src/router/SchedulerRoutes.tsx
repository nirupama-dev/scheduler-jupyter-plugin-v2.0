/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { lazy, Suspense, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CreateNotebookSchedule } from '../components/notebookScheduler/CreateNotebookSchedule';
import { ISchedulerRoutesProps } from '../interfaces/CommonInterface';
import { ScheduleListingView } from '../components/notebookScheduler/ScheduleListingView';
import Loader from '../components/common/loader/LoadingSpinner';
import {
  LOADER_CONTENT_COMPOSER_LISTING_SCREEN,
  LOADER_CONTENT_VERTEX_EXECUTION_SCREEN,
  LOADER_CONTENT_VERTEX_LISTING_SCREEN
} from '../utils/Constants';
import { VertexListProvider } from '../context/vertex/VertexListprovider';

/**
 *
 * @param schedulerRouteProps
 * @returns
 * This component defines the routes for the scheduler application.
 */
export function SchedulerRoutes(schedulerRouteProps: ISchedulerRoutesProps) {
  const { app, sessionContext, initialKernalSchedulerDetails } =
    schedulerRouteProps;

  const abortControllers = useRef<any>([]);

  const ListVertexSchedule = lazy(
    () => import('../components/vertex/vertexListingView/ListVertexSchedule')
  );

  const ListComposerSchedule = lazy(
    () =>
      import('../components/composer/composerListingView/ListComposerSchedule')
  );

  const VertexExecutionHistory = lazy(
    () =>
      import(
        '../components/vertex/vertexExecutionHistoryView/VertexExecutionHistory'
      )
  );

  return (
    <VertexListProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/list" replace />} />
        <Route
          path="/create"
          element={
            <CreateNotebookSchedule
              sessionContext={sessionContext}
              initialKernalScheduleDetails={initialKernalSchedulerDetails}
            />
          }
        />

        <Route
          path="/edit/:schedulerType/:scheduleId/:region/:projectId?/:environment?"
          element={<CreateNotebookSchedule />}
        />

        <Route path="/list" element={<ScheduleListingView />}>
          <Route
            path="vertex"
            element={
              <Suspense
                fallback={
                  <Loader
                    message={LOADER_CONTENT_VERTEX_LISTING_SCREEN}
                    iconClassName="spin-loader-custom-style"
                    parentTagClassName="spin-loader-main spin-loader-listing"
                  />
                }
              >
                <ListVertexSchedule abortControllers={abortControllers} />
              </Suspense>
            }
          />

          <Route
            path="composer"
            element={
              <Suspense
                fallback={
                  <Loader
                    message={LOADER_CONTENT_COMPOSER_LISTING_SCREEN}
                    iconClassName="spin-loader-custom-style"
                    parentTagClassName='"spin-loader-main spin-loader-listing'
                  />
                }
              >
                <ListComposerSchedule app={app} />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/execution-vertex-history"
          element={
            <Suspense
              fallback={
                <Loader
                  message={LOADER_CONTENT_VERTEX_EXECUTION_SCREEN}
                  iconClassName="spin-loader-custom-style"
                  parentTagClassName='"spin-loader-main spin-loader-listing'
                />
              }
            >
              <VertexExecutionHistory abortControllers={abortControllers} />
            </Suspense>
          }
        />
      </Routes>
    </VertexListProvider>
  );
}
