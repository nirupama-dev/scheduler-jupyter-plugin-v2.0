import { z } from 'zod';
import { createVertexSchema } from './CreateVertexSchema';
import { createComposerSchema } from './CreateComposerSchema';
import {
  CUSTOMER_ENCRYPTION,
  PREDEFINED_CMEK,
  ENCRYPTION_MANUAL_KEY_SAMPLE,
  EVERY_MINUTE_CRON,
  MANUAL_CMEK
} from '../utils/Constants';

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

      if (vertexData.encryptionOption === CUSTOMER_ENCRYPTION) {
        // First, check that a customer encryption type is selected
        if (!vertexData.customerEncryptionType) {
          ctx.addIssue({
            path: ['customerEncryptionType'], // This error will now appear
            code: z.ZodIssueCode.custom,
            message: 'Please select an encryption type (Predefined or Manual).'
          });
        } else if (vertexData.customerEncryptionType === PREDEFINED_CMEK) {
          // Validate the dropdowns
          if (!vertexData.keyRing) {
            ctx.addIssue({
              path: ['keyRing'],
              code: z.ZodIssueCode.custom,
              message: 'Key Ring is required.'
            });
          }
          if (vertexData.keyRing && !vertexData.cryptoKey) {
            ctx.addIssue({
              path: ['cryptoKey'],
              code: z.ZodIssueCode.custom,
              message: 'Crypto key is required.'
            });
          }
        } else if (vertexData.customerEncryptionType === MANUAL_CMEK) {
          // Validate the manual key field
          if (!vertexData.manualKey) {
            ctx.addIssue({
              path: ['manualKey'],
              code: z.ZodIssueCode.custom,
              message: 'Required manual encryption key'
            });
          }

          const numericRegex =
            /^projects\/[^/]+\/locations\/[^/]+\/keyRings\/[^/]+\/cryptoKeys\/[^/]+$/;
          if (
            vertexData.manualKey &&
            !numericRegex.test(vertexData.manualKey)
          ) {
            ctx.addIssue({
              path: ['manualKey'],
              code: z.ZodIssueCode.custom,
              message: ENCRYPTION_MANUAL_KEY_SAMPLE
            });
          }
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

      const isEditMode = !!vertexData.isEditMode;

      // Schedule field validations
      if (vertexData.scheduleMode === 'runSchedule') {
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
          if (!isEditMode && start < now) {
            ctx.addIssue({
              path: ['startTime'],
              code: z.ZodIssueCode.custom,
              message: 'Start time must be set to a future date and time.'
            });
          }
          if (!isEditMode && end < now) {
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
              path: ['scheduleFieldCronFormat'],
              code: z.ZodIssueCode.custom,
              message: 'Schedule field is required in cron format.'
            });
          }
          if (vertexData.scheduleFieldCronFormat === EVERY_MINUTE_CRON) {
            ctx.addIssue({
              path: ['scheduleFieldCronFormat'],
              code: z.ZodIssueCode.custom,
              message: 'Every minute cron expression is not supported.'
            });
          }
        }
        if (vertexData.internalScheduleMode === 'userFriendly') {
          if (vertexData.scheduleValueUserFriendly === EVERY_MINUTE_CRON) {
            ctx.addIssue({
              path: ['scheduleValueUserFriendly'],
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
      if (composerData.runOption === 'runSchedule') {
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
