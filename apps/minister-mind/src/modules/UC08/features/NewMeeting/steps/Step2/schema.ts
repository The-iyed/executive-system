import { z } from 'zod';

export const step2Schema = z.object({
  invitees: z.array(z.object({
    id: z.string(), // Internal ID for tracking, not sent to API
    name: z.string().min(1, 'الاسم مطلوب'),
    position: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    is_required: z.boolean().optional().default(false),
  })).optional().default([]),
});

export type Step2FormData = z.infer<typeof step2Schema>;