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

/**
 * Initialization data for the scheduler-jupyter-plugin extension.
 * Parent component for createVertexSchedule.tsx and CreateComposerSchedule.tsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
 
export const CreateNotebookSchedule = () => {
  const navigate = useNavigate();
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ...submit logic...
    navigate('/list');
  };
 
  return (
<form onSubmit={handleSubmit}>
<h2>Create Schedule</h2>
<input type="text" placeholder="Job Name" required />
<button type="submit">Submit</button>
</form>
  );
}