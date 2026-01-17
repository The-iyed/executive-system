import { z } from 'zod';

export const step2Schema = z.object({
  invitees: z.array(z.object({
    id: z.string(), // Internal ID for tracking, not sent to API
    name: z.string().min(1, 'الاسم مطلوب'),
    position: z.string().min(1, 'المنصب مطلوب'),
    mobile: z.string().min(1, 'رقم الجوال مطلوب'),
    email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
    is_required: z.boolean().optional().default(false),
  })).optional().default([]),
});

export type Step2FormData = z.infer<typeof step2Schema>;