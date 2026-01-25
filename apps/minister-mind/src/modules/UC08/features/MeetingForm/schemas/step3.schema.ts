import { z } from 'zod';
import { MeetingChannel } from '../utils/constants';

// Helper to validate ISO 8601 date format (YYYY-MM-DD)
const isValidISO8601Date = (dateString: string): boolean => {
  if (!dateString) return false;
  // Check if it matches YYYY-MM-DD pattern
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateString)) return false;
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime());
};

export const step3Schema = z.object({
  selectedEvent: z
    .object({
      id: z.string(),
      type: z.enum(['reserved', 'optional', 'compulsory']),
      label: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      date: z.date(),
      title: z.string().optional(),
    })
    .optional(),
  // Meeting channel - select dropdown (PHYSICAL, VIRTUAL, HYBRID) - REQUIRED
  meeting_channel: z.nativeEnum(MeetingChannel, {
    required_error: 'قناة الاجتماع مطلوبة',
    invalid_type_error: 'قناة الاجتماع يجب أن تكون واحدة من: حضور، افتراضي، مختلط',
  }),
  // Scheduled date - REQUIRED (date only, no time)
  scheduled_at: z
    .string({
      required_error: 'تاريخ الاجتماع مطلوب',
      invalid_type_error: 'تاريخ الاجتماع يجب أن يكون نصاً',
    })
    .refine(
      (val) => val && isValidISO8601Date(val),
      'تاريخ الاجتماع غير صحيح. يرجى إدخال تاريخ بصيغة (YYYY-MM-DD)'
    ),
  // Requires protocol - checkbox (boolean)
  requires_protocol: z.boolean().optional().default(false),
  // Notes - textarea (string)
  notes: z.string().optional().or(z.literal('')),
});

export type Step3FormData = z.infer<typeof step3Schema>;
