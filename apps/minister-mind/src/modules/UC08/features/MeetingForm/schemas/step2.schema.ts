import { z } from 'zod';

export const step2Schema = z.object({
  invitees: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    position: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    is_required: z.boolean().optional().default(false),
    user_id: z.string().optional(),
    username: z.string().optional(),
    disabled: z.boolean().optional(),
  }).refine((data) => {
    if (data.user_id) {
      return true;
    }
    return !!data.name && !!data.position && !!data.mobile && !!data.email;
  }, {
    message: 'الحقول مطلوبة للمستخدمين الخارجيين',
    path: ['name', 'position', 'mobile', 'email'],
  })).optional().default([]),
});

export type Step2FormData = z.infer<typeof step2Schema>;