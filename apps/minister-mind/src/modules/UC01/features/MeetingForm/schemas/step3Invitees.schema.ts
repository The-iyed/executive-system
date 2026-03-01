import { z } from 'zod';
import { AttendanceMechanism } from '@shared/types';
import { isValidPhone } from '@shared';

const attendanceMechanismSchema = z.nativeEnum(AttendanceMechanism);

const inviteeSchema = z
  .object({
    id: z.string(),
    user_id: z.string().optional().or(z.literal('')), 
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')), 
    name: z.string().optional().or(z.literal('')), 
    position: z.string().optional().or(z.literal('')), 
    mobile: z.string().optional().or(z.literal('')),
    sector: z.string().optional().or(z.literal('')),
    attendance_mechanism: attendanceMechanismSchema.optional().default(AttendanceMechanism.PHYSICAL),
    is_required: z.boolean().optional().default(false),
    username: z.string().optional(),
    disabled: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Phone: when provided and non-empty, must be valid (digits only, optional leading +) — for all rows (manual and selected user)
    const mobile = (data.mobile ?? '').trim();
    if (mobile !== '' && !isValidPhone(mobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الجوال: صيغة غير صحيحة (أرقام فقط، مع إمكانية + في البداية)',
        path: ['mobile'],
      });
    }
    if (!data.sector || String(data.sector).trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الجهة مطلوب',
        path: ['sector'],
      });
    }
    const hasUserId = !!data.user_id && data.user_id.trim().length > 0;
    if (hasUserId) return;
    if (!data.name || data.name.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'الإسم مطلوب للمدعو الخارجي',
        path: ['name'],
      });
    }
    if (!data.email || data.email.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'البريد الإلكتروني مطلوب للمدعو الخارجي',
        path: ['email'],
      });
    }
  });

export const createStep3InviteesSchema = (opts?: { inviteesRequired?: boolean }) => {
  const inviteesRequired = opts?.inviteesRequired ?? true;

  return z
    .object({
      invitees: z.array(inviteeSchema).optional().default([]),
    })
    .superRefine((data, ctx) => {
      if (inviteesRequired && (!data.invitees || data.invitees.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'قائمة المدعوين مطلوبة',
          path: ['invitees'],
        });
      }
    });
};

export const step3InviteesSchema = createStep3InviteesSchema({ inviteesRequired: true });

export type Step3InviteesFormData = z.infer<typeof step3InviteesSchema>;