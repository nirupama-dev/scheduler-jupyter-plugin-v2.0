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
import { createNotebookCommonSchema } from './CreateNotebookCommonSchema';

// Helper schema for email validation (can remain as is)
const emailSchema = z
  .string()
  .email('Invalid email address')
  .array()
  .min(1, 'Email is required')
  .optional(); // Removed the specific message here as it will be handled by superRefine

export const createComposerSchema = createNotebookCommonSchema.extend({
  schedulerSelection: z.literal('composer'), // Discriminator property
  dagId: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  region: z.string().min(1, 'Region is required'),
  environment: z.string().min(1, 'Environment is required'),
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
  // Email field is now just optional by default
  email_recipients: emailSchema, // This field is optional by itself, the required logic is in the superRefine
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
  parameters: z
    .string()
    .array().optional()
});

// Type inference for your form data
export type ComposerSchedulerFormValues = z.infer<typeof createComposerSchema>;
