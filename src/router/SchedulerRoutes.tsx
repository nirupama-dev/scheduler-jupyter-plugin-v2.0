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
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CreateNotebookSchedule } from '../components/notebookScheduler/CreateNotebookSchedule';
import { ISchedulerRoutesProps } from '../interfaces/CommonInterface';
import { ScheduleListingView } from '../components/notebookScheduler/ScheduleListingView';
import Loader from '../components/common/loader/Loader';
import {
  LOADER_CONTENT_COMPOSER_LISTING_SCREEN,
  LOADER_CONTENT_VERTEX_LISTING_SCREEN
} from '../utils/Constants';

// Dummy ExecutionHistoryScreen for testing purposes
function ExecutionHistoryScreen() {
  const { id } = useParams();
  return (
    <div>
      <h2>Execution History</h2>
      <div>History for job: {id}</div>
    </div>
  );
}
/**
 * 
 * @param schedulerRouteProps 
 * @returns 
 * This component defines the routes for the scheduler application.
 */
export function SchedulerRoutes(schedulerRouteProps: ISchedulerRoutesProps) {
  const { app, sessionContext, initialKernalSchedulerDetails } =
    schedulerRouteProps;

  const ListVertexSchedule = lazy(
    () => import('../components/vertex/vertexListingView/ListVertexSchedule')
  );

  const ListComposerSchedule = lazy(
    () => import('../components/composer/composerListingView/ListComposerSchedule')
  );

  return (
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

      <Route path="/list" element={<ScheduleListingView />}>
        <Route
          path="vertex"
          element={
            <Suspense
              fallback={
                <Loader message={LOADER_CONTENT_VERTEX_LISTING_SCREEN} />
              }
            >
              <ListVertexSchedule />
            </Suspense>
          }
        />
        <Route
          path="composer"
          element={
            <Suspense
              fallback={
                <Loader message={LOADER_CONTENT_COMPOSER_LISTING_SCREEN} />
              }
            >
              <ListComposerSchedule app={app} />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/execution-vertex-history/:id"
        element={<ExecutionHistoryScreen />}
      />
    </Routes>
  );
}
