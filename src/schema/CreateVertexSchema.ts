import { z } from 'zod';
import { DISK_MIN_SIZE, DISK_MAX_SIZE, EVERY_MINUTE_CRON } from '../utils/Constants';

/**
 * Zod schema for Vertex Scheduler form validation.
 */
export const createVertexSchema = z
  .object({
    input_filename: z.string().min(1, 'Input file is required.'),
    display_name: z.string().min(1, 'Job name is required.'),
    machine_type: z.string().min(1, 'Machine type is required.'),
    kernel_name: z.string().min(1, 'Kernel is required.'),
    region: z.string().min(1, 'Region is required.'),
    cloud_storage_bucket: z.string().min(1, 'Cloud storage bucket is required.'),
    service_account: z.string().min(1, 'Service account is required.'),
    network: z.string().min(1, 'Network is required.'),
    subnetwork: z.string().min(1, 'Subnetwork is required.'),
    disk_type: z.string().min(1, 'Disk type is required.'),
    disk_size: z
      .string()
      .refine(
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
          message: `Disk size must be an integer between ${DISK_MIN_SIZE} and ${DISK_MAX_SIZE}.`,
        }
      ),
    accelerator_type: z.string().optional().or(z.literal('')),
    accelerator_count: z.string().optional(),
    schedule_mode: z.enum(['runNow', 'runSchedule']),
    internal_schedule_mode: z.enum(['cronFormat', 'userFriendly']).optional(),
    schedule_field: z.string().optional(),
    schedule_value: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    max_run_count: z.string().optional(),
    time_zone: z.string().optional(),
    network_option: z.enum(['networkInThisProject', 'networkShared']).optional(),
    primary_network_selected: z.string().optional(),
    sub_network_selected: z.string().optional(),
    shared_network_selected: z.string().optional(),
    parameters: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Accelerator count validation
    if (data.accelerator_type && data.accelerator_type !== '') {
      if (!data.accelerator_count || !/^[1-9][0-9]*$/.test(data.accelerator_count)) {
        ctx.addIssue({
          path: ['accelerator_count'],
          code: z.ZodIssueCode.custom,
          message: 'Accelerator count is required and must be a positive integer.',
        });
      }
    }

    // Max run count validation
    if (
      data.schedule_mode === 'runSchedule' &&
      data.max_run_count &&
      !/^[1-9][0-9]*$/.test(data.max_run_count)
    ) {
      ctx.addIssue({
        path: ['max_run_count'],
        code: z.ZodIssueCode.custom,
        message: 'Max run count must be a positive integer.',
      });
    }

    // Network selection validation
    if (data.network_option === 'networkInThisProject') {
      if (!data.primary_network_selected) {
        ctx.addIssue({
          path: ['primary_network_selected'],
          code: z.ZodIssueCode.custom,
          message: 'Primary network is required when using network in this project.',
        });
      }
      if (!data.sub_network_selected) {
        ctx.addIssue({
          path: ['sub_network_selected'],
          code: z.ZodIssueCode.custom,
          message: 'Subnetwork is required when using network in this project.',
        });
      }
    }
    if (data.network_option === 'networkShared') {
      if (!data.shared_network_selected) {
        ctx.addIssue({
          path: ['shared_network_selected'],
          code: z.ZodIssueCode.custom,
          message: 'Shared network is required when using shared network.',
        });
      }
    }

    // Schedule field validations
    if (data.schedule_mode === 'runSchedule') {
      // Start/end time required and valid
      if (!data.start_time) {
        ctx.addIssue({
          path: ['start_time'],
          code: z.ZodIssueCode.custom,
          message: 'Start time is required for scheduled jobs.',
        });
      }
      if (!data.end_time) {
        ctx.addIssue({
          path: ['end_time'],
          code: z.ZodIssueCode.custom,
          message: 'End time is required for scheduled jobs.',
        });
      }
      // If both present, end > start and both in the future
      if (data.start_time && data.end_time) {
        const start = new Date(data.start_time).getTime();
        const end = new Date(data.end_time).getTime();
        const now = Date.now();
        if (isNaN(start) || isNaN(end) || end <= start) {
          ctx.addIssue({
            path: ['end_time'],
            code: z.ZodIssueCode.custom,
            message: 'End time must be after start time.',
          });
        }
        if (start < now) {
          ctx.addIssue({
            path: ['start_time'],
            code: z.ZodIssueCode.custom,
            message: 'Start time must be set to a future date and time.',
          });
        }
        if (end < now) {
          ctx.addIssue({
            path: ['end_time'],
            code: z.ZodIssueCode.custom,
            message: 'End time must be set to a future date and time.',
          });
        }
      }
      // Time zone required
      if (!data.time_zone) {
        ctx.addIssue({
          path: ['time_zone'],
          code: z.ZodIssueCode.custom,
          message: 'Time zone is required for scheduled jobs.',
        });
      }
      // Schedule field required and not every minute cron
      if (data.internal_schedule_mode === 'cronFormat') {
        if (!data.schedule_field || data.schedule_field.trim() === '') {
          ctx.addIssue({
            path: ['schedule_field'],
            code: z.ZodIssueCode.custom,
            message: 'Schedule field is required in cron format.',
          });
        }
        if (data.schedule_field === EVERY_MINUTE_CRON) {
          ctx.addIssue({
            path: ['schedule_field'],
            code: z.ZodIssueCode.custom,
            message: 'Every minute cron expression is not supported.',
          });
        }
      }
      if (data.internal_schedule_mode === 'userFriendly') {
        if (data.schedule_value === EVERY_MINUTE_CRON) {
          ctx.addIssue({
            path: ['schedule_value'],
            code: z.ZodIssueCode.custom,
            message: 'Every minute cron expression is not supported.',
          });
        }
      }
    }
  });

/**
 * TypeScript type for Vertex Scheduler form values.
 */
export type VertexSchedulerFormValues = z.infer<typeof createVertexSchema>;