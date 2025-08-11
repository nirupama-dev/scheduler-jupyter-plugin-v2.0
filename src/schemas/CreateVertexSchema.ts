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
 * This file defines the schema for creating a Vertex scheduler.
 * It extends the common notebook schema and includes Vertex-specific fields.
 */
import { z } from 'zod';
import { DISK_MIN_SIZE, DISK_MAX_SIZE } from '../utils/Constants';
import {
  createNotebookCommonSchema,
  parameterSchema,
  sharedNetworkSchema
} from './CreateNotebookCommonSchema';

/**
 * Zod schema for Vertex Scheduler form validation.
 */
export const createVertexSchema = createNotebookCommonSchema.extend({
  schedulerSelection: z.literal('vertex'), // Discriminator property
  vertexRegion: z
    .string()
    .nonempty('Region is required.')
    .min(1, 'Region is required.'),
  machineType: z.string().min(1, 'Machine type is required.'),
  kernelName: z.string().min(1, 'Kernel is required.'),
  cloudStorageBucket: z.string().min(1, 'Cloud storage bucket is required.'),
  serviceAccount: z.string().min(1, 'Service account is required.'),
  networkOption: z
    .enum(['networkInThisProject', 'networkSharedFromHostProject'])
    .optional(),
  primaryNetwork: z.string().optional(),
  subNetwork: z.string().optional(),
  sharedNetwork: sharedNetworkSchema.optional(),
  diskType: z.string().min(1, 'Disk type is required.'),
  diskSize: z.string().refine(
    val => {
      const num = Number(val);
      return (
        !isNaN(num) &&
        Number.isInteger(num) &&
        num >= DISK_MIN_SIZE &&
        num <= DISK_MAX_SIZE
      );
    },
    {
      message: `Disk size must be an integer between ${DISK_MIN_SIZE} and ${DISK_MAX_SIZE}.`
    }
  ),
  acceleratorType: z.string().optional().or(z.literal('')),
  acceleratorCount: z.string().optional(),
  scheduleMode: z.enum(['runNow', 'runSchedule']),
  internalScheduleMode: z.enum(['cronFormat', 'userFriendly']).optional(),
  scheduleField: z.string().optional(),
  scheduleValue: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxRunCount: z.string().optional(),
  timeZone: z.string().optional(),
  parameters: z.array(parameterSchema).optional()
});

/**
 * TypeScript type for Vertex Scheduler form values.
 */
export type VertexSchedulerFormValues = z.infer<typeof createVertexSchema>;
