import { z } from 'zod';

/**
 * Base schema for Step1 form data structure
 * Conditional validation is handled in validation.ts
 */
export const step1BaseSchema = z.object({
  meetingSubject: z.string(),
  meetingType: z.string(),
  meetingCategory: z.string(),
  meetingReason: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification1: z.string(),
  meetingClassification2: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string(),
  sector: z.string().optional().or(z.literal('')),
  meetingGoals: z
    .array(
      z.object({
        id: z.string(),
        objective: z.string(),
      })
    )
    .optional()
    .default([]),
  meetingAgenda: z
    .array(
      z.object({
        id: z.string(),
        agenda_item: z.string().optional(),
        presentation_duration_minutes: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  ministerSupport: z
    .array(
      z.object({
        id: z.string(),
        support_description: z.string(),
      })
    )
    .optional()
    .default([]),
  relatedDirectives: z
    .array(
      z.object({
        id: z.string(),
        directive: z.string().optional(),
        previousMeeting: z.string().optional(),
        directiveDate: z.string().optional(),
        directiveStatus: z.string().optional(),
        dueDate: z.string().optional(),
        responsible: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetingDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  file: z.instanceof(File).optional(),
  existingFiles: z.array(z.object({
    id: z.string(),
    file_name: z.string(),
    blob_url: z.string(),
    file_size: z.number().optional(),
    file_type: z.string().optional(),
  })).optional().default([]),
});

export type Step1FormData = z.infer<typeof step1BaseSchema>;
