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
 * This file defines the schema common to all schedulers.
 */
import { z } from 'zod';

// Regex for letters, numbers, hyphens, and underscores (including international characters)
const jobNameRegex = /^[\p{L}\p{N}_-]+$/u;

/**
 * Common schema for creating a notebook job with shared fields.
 * This schema is extended by both Vertex and Composer schemas.
 */
export const createNotebookCommonSchema = z.object({
  jobName: z
    .string()
    .min(1, 'Job Name is required.')
    .regex(
      jobNameRegex,
      'Job name must contain only letters, numbers, hyphens, and underscores.'
    ),
  jobId: z.string().optional(),
  inputFile: z.string().min(1, 'Input File is required.')
});

const parameterRegex = /^[\p{L}\p{N}_-]+$/u;

export const parameterSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(
      parameterRegex,
      'Only letters, numbers, hyphens, and underscores are allowed (international characters supported).'
    ),
  value: z
    .string()
    .min(1, 'Value is required')
    .regex(
      parameterRegex,
      'Only letters, numbers, hyphens, and underscores are allowed (international characters supported).'
    )
});

export const sharedNetworkSchema = z.object({
  network: z.string().min(1, 'Network is required.'),
  subnetwork: z.string().min(1, 'Subnetwork is required.'),
  sharedNetworkSelected: z.string().optional()
});

export type CommonFormValues = z.infer<typeof createNotebookCommonSchema>;
