import { z } from 'zod';
import { createVertexSchema } from './CreateVertexSchema';
import { createComposerSchema } from './CreateComposerSchema';
import { EVERY_MINUTE_CRON } from '../utils/Constants';

/**
 * Combined schema for creating a job, either in Vertex or Composer.
 * This schema uses discriminated union to handle different scheduler selections.
 * It also includes superRefine for custom validation logic based on the selected scheduler.
 */
export const combinedCreateFormSchema = z
  .discriminatedUnion('schedulerSelection', [
    createVertexSchema,
    createComposerSchema
  ])
  .superRefine((commonData, ctx) => {
    if (commonData.schedulerSelection === 'vertex') {
      // Vertex specific validation
      const vertexData = commonData as z.infer<typeof createVertexSchema>;

      // Accelerator count validation
      if (vertexData.acceleratorType && vertexData.acceleratorType !== '') {
        if (
          !vertexData.acceleratorCount ||
          !/^[1-9][0-9]*$/.test(vertexData.acceleratorCount)
        ) {
          ctx.addIssue({
            path: ['acceleratorCount'],
            code: z.ZodIssueCode.custom,
            message:
              'Accelerator count is required and must be a positive integer.'
          });
        }
      }

      // Max run count validation
      if (
        vertexData.scheduleMode === 'runSchedule' &&
        vertexData.maxRunCount &&
        !/^[1-9][0-9]*$/.test(vertexData.maxRunCount)
      ) {
        ctx.addIssue({
          path: ['maxRunCount'],
          code: z.ZodIssueCode.custom,
          message: 'Max run count must be a positive integer.'
        });
      }

      // Network selection validation
      if (vertexData.networkOption === 'networkInThisProject') {
        if (!vertexData.primaryNetwork && vertexData.subNetwork) {
          ctx.addIssue({
            path: ['primaryNetwork'],
            code: z.ZodIssueCode.custom,
            message: 'Primary network is required when subnetwork is selected.'
          });
        }
      }
      if (vertexData.networkOption === 'networkSharedFromHostProject') {
        if (!vertexData.sharedNetwork) {
          ctx.addIssue({
            path: ['sharedNetwork'],
            code: z.ZodIssueCode.custom,
            message:
              'Shared network is required when using shared network from a host project.'
          });
        }
      }

      // Schedule field validations
      if (vertexData.scheduleMode === 'runSchedule') {
        // Start/end time required and valid
        if (!vertexData.startTime) {
          ctx.addIssue({
            path: ['startTime'],
            code: z.ZodIssueCode.custom,
            message: 'Start time is required for scheduled jobs.'
          });
        }
        if (!vertexData.endTime) {
          ctx.addIssue({
            path: ['endTime'],
            code: z.ZodIssueCode.custom,
            message: 'End time is required for scheduled jobs.'
          });
        }
        // If both present, end > start and both in the future
        if (vertexData.startTime && vertexData.endTime) {
          const start = new Date(vertexData.startTime).getTime();
          const end = new Date(vertexData.endTime).getTime();
          const now = Date.now();
          if (isNaN(start) || isNaN(end) || end <= start) {
            ctx.addIssue({
              path: ['endTime'],
              code: z.ZodIssueCode.custom,
              message: 'End time must be after start time.'
            });
          }
          if (start < now) {
            ctx.addIssue({
              path: ['startTime'],
              code: z.ZodIssueCode.custom,
              message: 'Start time must be set to a future date and time.'
            });
          }
          if (end < now) {
            ctx.addIssue({
              path: ['endTime'],
              code: z.ZodIssueCode.custom,
              message: 'End time must be set to a future date and time.'
            });
          }
        }
        // Time zone required
        if (!vertexData.timeZone) {
          ctx.addIssue({
            path: ['timeZone'],
            code: z.ZodIssueCode.custom,
            message: 'Time zone is required for scheduled jobs.'
          });
        }
        // Schedule field required and not every minute cron
        if (vertexData.internalScheduleMode === 'cronFormat') {
          if (
            !vertexData.scheduleFieldCronFormat ||
            vertexData.scheduleFieldCronFormat.trim() === ''
          ) {
            ctx.addIssue({
              path: ['scheduleField'],
              code: z.ZodIssueCode.custom,
              message: 'Schedule field is required in cron format.'
            });
          }
          if (vertexData.scheduleFieldCronFormat === EVERY_MINUTE_CRON) {
            ctx.addIssue({
              path: ['scheduleField'],
              code: z.ZodIssueCode.custom,
              message: 'Every minute cron expression is not supported.'
            });
          }
        }
        if (vertexData.internalScheduleMode === 'userFriendly') {
          if (vertexData.scheduleValueUserFriendly === EVERY_MINUTE_CRON) {
            ctx.addIssue({
              path: ['scheduleValue'],
              code: z.ZodIssueCode.custom,
              message: 'Every minute cron expression is not supported.'
            });
          }
        }
      }
    } else if (commonData.schedulerSelection === 'composer') {
      // Composer specific validation
      const composerData = commonData as z.infer<typeof createComposerSchema>;
      // Conditional validation for email based on checkboxes
      if (
        composerData.emailOnFailure ||
        composerData.emailOnRetry ||
        composerData.emailOnSuccess
      ) {
        if (
          !composerData.emailRecipients ||
          composerData.emailRecipients.length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Email recipients is required field',
            path: ['emailRecipients']
          });
        }
      }

      // Conditional validation for "Run on Schedule" fields
      if (composerData.runOption === 'runOnSchedule') {
        if (!composerData.scheduleValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Schedule is required when 'Run on Schedule' is selected",
            path: ['scheduleValue']
          });
        }
        if (!composerData.timeZone) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timezone is required when 'Run on Schedule' is selected",
            path: ['timeZone']
          });
        }
      }
    }
  });

export type CombinedCreateFormValues = z.infer<typeof combinedCreateFormSchema>;
