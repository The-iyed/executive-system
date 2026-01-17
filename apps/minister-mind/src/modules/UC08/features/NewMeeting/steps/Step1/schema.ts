import { z } from 'zod';

/**
 * Base schema for UC08 Step1 form data structure
 */
export const step1BaseSchema = z.object({
  requester: z.string().optional().or(z.literal('')),
  relatedDirective: z.string().optional().or(z.literal('')),
  meetingNature: z.string(),
  previousMeeting: z.string().optional().or(z.literal('')),
  meetingSubject: z.string(),
  meetingType: z.string(),
  meetingCategory: z.string(),
  meetingReason: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string().optional().or(z.literal('')),
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
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetings: z
    .array(
      z.object({
        id: z.string(),
        meeting_subject: z.string().optional(),
        meeting_date: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  relatedDirectives: z
    .array(
      z.object({
        id: z.string(),
        previous_meeting: z.string().optional(),
        directive_date: z.string().optional(),
        directive_status: z.string().optional(),
        due_date: z.string().optional(),
        responsible: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  notes: z.string().optional().or(z.literal('')),
  isComplete: z.boolean().optional().default(false),
});

export type Step1FormData = z.infer<typeof step1BaseSchema>;
