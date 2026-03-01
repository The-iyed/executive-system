import { z } from 'zod';

/** Backend invitee item (request submitter & minister invitees). */
export const inviteeBackendSchema = z.object({
  full_name: z.string().min(1, 'الاسم الكامل مطلوب'),
  position_title: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  mobile_number: z.string().min(1, 'رقم الجوال مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  attendance_mode: z.enum(['IN_PERSON', 'REMOTE'], {
    required_error: 'آلية الحضور مطلوبة',
    invalid_type_error: 'آلية الحضور يجب أن تكون حضوري أو عن بُعد',
  }),
  view_permission: z.boolean(),
});

/** Form row for invitee (includes UI-only id and isOwner). */
export const inviteeFormRowSchema = inviteeBackendSchema.extend({
  id: z.string(),
  isOwner: z.boolean().optional().default(false),
});

export const step3Schema = z
  .object({
    invitees: z.array(inviteeFormRowSchema).min(1, 'يجب إضافة مدعو واحد على الأقل'),
    minister_invitees: z.array(inviteeFormRowSchema).optional().default([]),
    proposer_user_ids: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      if (!data.minister_invitees?.length) return true;
      return data.minister_invitees.every((m) => {
        const r = inviteeBackendSchema.safeParse(m);
        return r.success;
      });
    },
    { message: 'بيانات مدعوي الوزير غير صحيحة', path: ['minister_invitees'] }
  );

export type InviteeBackend = z.infer<typeof inviteeBackendSchema>;
export type InviteeFormRow = z.infer<typeof inviteeFormRowSchema>;
export type Step3FormData = z.infer<typeof step3Schema>;
