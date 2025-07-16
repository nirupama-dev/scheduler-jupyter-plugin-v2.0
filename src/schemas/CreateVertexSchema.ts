import { z } from 'zod';
import { DISK_MIN_SIZE, DISK_MAX_SIZE, EVERY_MINUTE_CRON } from '../utils/Constants';

/**
 * Zod schema for Vertex Scheduler form validation.
 */
export const createVertexSchema = z
  .object({
    inputFilename: z.string().min(1, 'Input file is required.'),
    displayName: z.string().min(1, 'Job name is required.'),
    machineType: z.string().min(1, 'Machine type is required.'),
    kernelName: z.string().min(1, 'Kernel is required.'),
    region: z.string().min(1, 'Region is required.'),
    cloudStorageBucket: z.string().min(1, 'Cloud storage bucket is required.'),
    serviceAccount: z.string().min(1, 'Service account is required.'),
    network: z.string().min(1, 'Network is required.'),
    subnetwork: z.string().min(1, 'Subnetwork is required.'),
    diskType: z.string().min(1, 'Disk type is required.'),
    diskSize: z
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
    networkOption: z.enum(['networkInThisProject', 'networkShared']).optional(),
    primaryNetworkSelected: z.string().optional(),
    subNetworkSelected: z.string().optional(),
    sharedNetworkSelected: z.string().optional(),
    parameters: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Accelerator count validation
    if (data.acceleratorType && data.acceleratorType !== '') {
      if (!data.acceleratorCount || !/^[1-9][0-9]*$/.test(data.acceleratorCount)) {
        ctx.addIssue({
          path: ['acceleratorCount'],
          code: z.ZodIssueCode.custom,
          message: 'Accelerator count is required and must be a positive integer.',
        });
      }
    }

    // Max run count validation
    if (
      data.scheduleMode === 'runSchedule' &&
      data.maxRunCount &&
      !/^[1-9][0-9]*$/.test(data.maxRunCount)
    ) {
      ctx.addIssue({
        path: ['maxRunCount'],
        code: z.ZodIssueCode.custom,
        message: 'Max run count must be a positive integer.',
      });
    }

    // Network selection validation
    if (data.networkOption === 'networkInThisProject') {
      if (!data.primaryNetworkSelected) {
        ctx.addIssue({
          path: ['primaryNetworkSelected'],
          code: z.ZodIssueCode.custom,
          message: 'Primary network is required when using network in this project.',
        });
      }
      if (!data.subNetworkSelected) {
        ctx.addIssue({
          path: ['subNetworkSelected'],
          code: z.ZodIssueCode.custom,
          message: 'Subnetwork is required when using network in this project.',
        });
      }
    }
    if (data.networkOption === 'networkShared') {
      if (!data.sharedNetworkSelected) {
        ctx.addIssue({
          path: ['sharedNetworkSelected'],
          code: z.ZodIssueCode.custom,
          message: 'Shared network is required when using shared network.',
        });
      }
    }

    // Schedule field validations
    if (data.scheduleMode === 'runSchedule') {
      // Start/end time required and valid
      if (!data.startTime) {
        ctx.addIssue({
          path: ['startTime'],
          code: z.ZodIssueCode.custom,
          message: 'Start time is required for scheduled jobs.',
        });
      }
      if (!data.endTime) {
        ctx.addIssue({
          path: ['endTime'],
          code: z.ZodIssueCode.custom,
          message: 'End time is required for scheduled jobs.',
        });
      }
      // If both present, end > start and both in the future
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime).getTime();
        const end = new Date(data.endTime).getTime();
        const now = Date.now();
        if (isNaN(start) || isNaN(end) || end <= start) {
          ctx.addIssue({
            path: ['endTime'],
            code: z.ZodIssueCode.custom,
            message: 'End time must be after start time.',
          });
        }
        if (start < now) {
          ctx.addIssue({
            path: ['startTime'],
            code: z.ZodIssueCode.custom,
            message: 'Start time must be set to a future date and time.',
          });
        }
        if (end < now) {
          ctx.addIssue({
            path: ['endTime'],
            code: z.ZodIssueCode.custom,
            message: 'End time must be set to a future date and time.',
          });
        }
      }
      // Time zone required
      if (!data.timeZone) {
        ctx.addIssue({
          path: ['timeZone'],
          code: z.ZodIssueCode.custom,
          message: 'Time zone is required for scheduled jobs.',
        });
      }
      // Schedule field required and not every minute cron
      if (data.internalScheduleMode === 'cronFormat') {
        if (!data.scheduleField || data.scheduleField.trim() === '') {
          ctx.addIssue({
            path: ['scheduleField'],
            code: z.ZodIssueCode.custom,
            message: 'Schedule field is required in cron format.',
          });
        }
        if (data.scheduleField === EVERY_MINUTE_CRON) {
          ctx.addIssue({
            path: ['scheduleField'],
            code: z.ZodIssueCode.custom,
            message: 'Every minute cron expression is not supported.',
          });
        }
      }
      if (data.internalScheduleMode === 'userFriendly') {
        if (data.scheduleValue === EVERY_MINUTE_CRON) {
          ctx.addIssue({
            path: ['scheduleValue'],
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