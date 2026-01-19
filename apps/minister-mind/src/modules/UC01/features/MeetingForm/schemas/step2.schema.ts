import { z } from 'zod';

export const step2Schema = z.object({
  invitees: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    position: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    is_required: z.boolean().optional().default(false),
    user_id: z.string().optional(), // Indicates user exists in the platform
    username: z.string().optional(), // Username for display when user exists
    disabled: z.boolean().optional(), // Indicates if fields should be disabled (true when user_id exists)
  }).refine((data) => {
    // If user_id exists, name, position, mobile are not required
    if (data.user_id) {
      return true;
    }
    // If no user_id, name, position, mobile, email are required
    return !!data.name && !!data.position && !!data.mobile && !!data.email;
  }, {
    message: 'الحقول مطلوبة للمستخدمين الخارجيين',
    path: ['name', 'position', 'mobile', 'email'], // Error will be shown on name field
  })).optional().default([]),
});

export type Step2FormData = z.infer<typeof step2Schema>;