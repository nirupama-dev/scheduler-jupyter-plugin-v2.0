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
import { z } from 'zod';

/**
 * Common schema for creating a notebook job with shared fields.
 * This schema is extended by both Vertex and Composer schemas.
 */
export const createNotebookCommonSchema = z.object({
  jobName: z.string().min(1, 'Job Name is required.'),
  inputFile: z.string().min(1, 'Input File is required.'),
  schedulerSelection: z.enum(['vertex', 'composer'], {
    errorMap: () => ({ message: 'Please select a scheduler option' })
  })
});

export type CommonFormValues = z.infer<typeof createNotebookCommonSchema>;
