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
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CreateNotebookSchedule } from '../components/notebookScheduler/CreateNotebookSchedule';
import { ScheduleListingView } from '../components/notebookScheduler/ScheduleListingView';
import { JupyterLab } from '@jupyterlab/application';

// Dummy ExecutionHistoryScreen for demonstration
function ExecutionHistoryScreen() {
  const { id } = useParams();
  return (
    <div>
      <h2>Execution History</h2>
      <div>History for job: {id}</div>
    </div>
  );
}

export function SchedulerRoutes({ app }: { app: JupyterLab }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/list" replace />} />
      <Route path="/create" element={<CreateNotebookSchedule />} />
      <Route path="/list" element={<ScheduleListingView app={app} />} />
      <Route path="/history/:id" element={<ExecutionHistoryScreen />} />
    </Routes>
  );
}
