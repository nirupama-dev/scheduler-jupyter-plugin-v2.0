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
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
import { CreateNotebookSchedule } from '../components/notebookScheduler/CreateNotebookSchedule';

// Dummy ListingScreen for demonstration
function ListingScreen() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Listing Screen</h2>
      <button onClick={() => navigate('/create')}>Go to Create</button>
      <button onClick={() => navigate('/history/123')}>
        Go to History for 123
      </button>
    </div>
  );
}

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

export function SchedulerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/list" replace />} />
      <Route path="/create" element={<CreateNotebookSchedule />} />
      <Route path="/list" element={<ListingScreen />} />
      <Route path="/history/:id" element={<ExecutionHistoryScreen />} />
    </Routes>
  );
}
