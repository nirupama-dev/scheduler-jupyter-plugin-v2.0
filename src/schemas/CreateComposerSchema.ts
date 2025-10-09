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
 * This file defines the schema specific to creating a Composer scheduler.
 */

import { z } from 'zod';
import {
  createNotebookCommonSchema,
  parameterSchema
} from './CreateNotebookCommonSchema';

// Custom Regex Refine
const customEmailSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Please enter a valid email address. E.g username@domain.com'
  );

export const createComposerSchema = createNotebookCommonSchema.extend({
  schedulerSelection: z.literal('composer'), // Discriminator property
  projectId: z.string().min(1, 'Project ID is required'),
  composerRegion: z.string().min(1, 'Region is required'),
  environment: z.string().min(1, 'Environment is required'),
  executionMode: z.enum(['serverless', 'cluster', 'local']),
  retryCount: z.preprocess(
    val => (val === '' ? undefined : Number(val)),
    z
      .number()
      .int()
      .min(0, 'Retry Count must be a non-negative integer')
      .optional()
      .default(2)
  ),
  retryDelay: z.preprocess(
    val => (val === '' ? undefined : Number(val)),
    z
      .number()
      .int()
      .min(0, 'Retry Delay must be a non-negative integer')
      .optional()
      .default(5)
  ),
  emailOnFailure: z.boolean().default(false),
  emailOnRetry: z.boolean().default(false),
  emailOnSuccess: z.boolean().default(false),
  emailRecipients: z.array(customEmailSchema).optional(),
  runOption: z.enum(['runNow', 'runOnSchedule'], {
    errorMap: () => ({ message: 'Please select a run option' })
  }),
  scheduleValue: z.string().optional(),
  timeZone: z.string().optional(),
  outputFormats: z
    .string()
    .array()
    .min(1, 'At least one output format is required')
    .optional(),
  parameters: z.array(parameterSchema).optional(),
  cluster: z.string().optional(),
  serverless: z.string().optional(),
  stopClusterAfterExecution: z.boolean().optional()
});

// Type inference for your form data
export type ComposerSchedulerFormValues = z.infer<typeof createComposerSchema>;
