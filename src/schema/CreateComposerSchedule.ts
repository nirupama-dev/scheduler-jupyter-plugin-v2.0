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

// Helper schema for email validation (can remain as is)
const emailSchema = z.string().email("Invalid email address").array().min(1, "Email is required").optional(); // Removed the specific message here as it will be handled by superRefine

export const createJobSchema = z.object({
  job_name: z.string()
    .min(1, "Job Name is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Name must contain only letters, numbers, hyphens, and underscores"),

  input_file_name: z.string().min(1, "Input File Name is required"),

  project_id: z.string().min(1, "Project ID is required"),

  region: z.string().min(1, "Region is required"),

  environment: z.string().min(1, "Environment is required"),

  retry_count: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().int().min(0, "Retry Count must be a non-negative integer").optional().default(2)
  ),

  retry_delay: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().int().min(0, "Retry Delay must be a non-negative integer").optional().default(5)
  ),

  email_on_failure: z.boolean().default(false),
  email_on_retry: z.boolean().default(false),
  email_on_success: z.boolean().default(false),

  // Email field is now just optional by default
  email: emailSchema, // This field is optional by itself, the required logic is in the superRefine

  run_option: z.enum(["run_now", "run_on_schedule"], {
    errorMap: () => ({ message: "Please select a run option" })
  }),

  schedule_value: z.string().optional(),
  time_zone: z.string().optional(),
})
.superRefine((data, ctx) => {
  // Conditional validation for email based on checkboxes
  if (data.email_on_failure || data.email_on_retry || data.email_on_success) {
    if (!data.email || data.email.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email recipients is required field",
        path: ['email'],
      });
    }
  }

  // Conditional validation for "Run on Schedule" fields
  if (data.run_option === "run_on_schedule") {
    if (!data.schedule_value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule is required when 'Run on Schedule' is selected",
        path: ['schedule_value'],
      });
    }
    if (!data.time_zone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Timezone is required when 'Run on Schedule' is selected",
        path: ['time_zone'],
      });
    }
  }
});

// Type inference for your form data
export type CreateJobFormData = z.infer<typeof createJobSchema>;