import { z } from 'zod';

const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (s: string): boolean => {
  if (!s) return false;
  if (DATE_ONLY.test(s)) return !Number.isNaN(new Date(s + 'T00:00:00').getTime());
  if (ISO_8601.test(s)) return !Number.isNaN(new Date(s).getTime());
  return false;
};

// ─── Shared field schemas ────────────────────────────────────────────────────

const str = (msg: string, min = 1, max?: number) => {
  const base = z.string({ required_error: msg, invalid_type_error: `${msg} يجب أن يكون نصاً` }).min(min, msg);
  return max ? base.max(max, `${msg} يجب أن يكون أقل من ${max} حرف`) : base;
};

const strOptional = (msg: string) =>
  z.string({ invalid_type_error: msg }).optional().or(z.literal(''));

const optionType = z
  .object({ value: z.string(), label: z.string(), description: z.string().optional() })
  .nullable()
  .optional()
  .or(z.literal(''));

// ─── Item schemas ────────────────────────────────────────────────────────────

const meetingGoalItem = z.object({ id: z.string(), objective: z.string() });
const meetingGoalItemStrict = z.object({ id: z.string(), objective: z.string().min(1, 'الهدف مطلوب') });

const agendaItemBase = z.object({
  id: z.string(),
  agenda_item: z.string().optional(),
  presentation_duration_minutes: z.string().optional(),
  minister_support_type: z.string().optional().or(z.literal('')),
  minister_support_other: z.string().optional().or(z.literal('')),
});

const MINISTER_SUPPORT_VALUES = ['إحاطة', 'تحديث', 'قرار', 'توجيه', 'اعتماد', 'أخرى'] as const;
const agendaItem = (required: boolean) =>
  agendaItemBase
    .extend({
      agenda_item: required ? z.string().min(1, 'عنصر الأجندة مطلوب') : z.string().optional(),
      presentation_duration_minutes: required ? z.string().min(1, 'مدة العرض (بالدقائق) مطلوبة') : z.string().optional(),
      minister_support_type: required ? z.string().min(1, 'الدعم المطلوب من الوزير مطلوب') : z.string().optional().or(z.literal('')),
    })
    .refine(
      (d) => {
        const v = d.presentation_duration_minutes;
        if (!v) return !required;
        const n = parseInt(v, 10);
        return !Number.isNaN(n) && n >= 0 && Number.isInteger(n);
      },
      { message: 'مدة العرض يجب أن تكون رقماً صحيحاً (بالدقائق)', path: ['presentation_duration_minutes'] }
    )
    .refine(
      (d) => !d.minister_support_type || MINISTER_SUPPORT_VALUES.includes(d.minister_support_type as (typeof MINISTER_SUPPORT_VALUES)[number]),
      { message: 'اختر نوع الدعم من القائمة', path: ['minister_support_type'] }
    )
    .superRefine((d, ctx) => {
      if (d.minister_support_type === 'أخرى' && (!d.minister_support_other || String(d.minister_support_other).trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'نص الدعم مطلوب عند اختيار "أخرى"', path: ['minister_support_other'] });
      }
    });

const ministerSupportItem = z.object({ id: z.string(), support_description: z.string() });
const ministerSupportItemStrict = z.object({ id: z.string(), support_description: z.string().min(1, 'الدعم مطلوب') });

const relatedDirectiveItem = z.object({
  id: z.string(),
  directive: z.string().optional(),
  previousMeeting: z.string().optional(),
  directiveDate: z.string().optional(),
  directiveStatus: z.string().optional(),
  dueDate: z.string().optional(),
  responsible: z.string().optional(),
});

const previousMeetingItem = z.object({
  id: z.string(),
  meeting_subject: z.string().optional(),
  meeting_date: z.string().optional(),
});

const previousMeetingItemStrict = z.object({
  id: z.string(),
  meeting_subject: z.string().optional(),
  meeting_date: z.string().optional().refine((v) => !v || v === '' || isValidDate(v), 'تاريخ الاجتماع السابق غير صحيح. يرجى إدخال تاريخ بصيغة (YYYY-MM-DD)'),
});

const emptyStr = () => strOptional('القيمة المُدخلة غير صحيحة');

export const step1BaseSchema = z.object({
  relatedDirective: optionType,
  requester: optionType,
  meetingOwner: optionType,
  previousMeeting: emptyStr(),
  meetingNature: emptyStr(),
  meetingTitle: emptyStr(),
  meetingSubject: emptyStr(),
  meetingSubjectOptional: emptyStr(),
  meetingDescription: emptyStr(),
  meetingType: emptyStr(),
  meetingCategory: z.string(),
  meetingReason: emptyStr(),
  relatedTopic: emptyStr(),
  dueDate: emptyStr(),
  meetingClassification1: emptyStr(),
  meetingClassification2: emptyStr(),
  meetingConfidentiality: emptyStr(),
  sector: emptyStr(),
  isUrgent: z.boolean().optional().default(false),
  urgentReason: emptyStr(),
  meetingStartDate: emptyStr(),
  meetingEndDate: emptyStr(),
  alternative1StartDate: emptyStr(),
  alternative1EndDate: emptyStr(),
  alternative2StartDate: emptyStr(),
  alternative2EndDate: emptyStr(),
  meeting_channel: emptyStr(),
  location: emptyStr(),
  requiresProtocol: z.boolean().optional().default(false),
  meetingGoals: z.array(meetingGoalItem).optional().default([]),
  meetingAgenda: z.array(agendaItemBase).optional().default([]),
  ministerSupport: z.array(ministerSupportItem).optional().default([]),
  relatedDirectives: z.array(relatedDirectiveItem).optional().default([]),
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetingDate: emptyStr(),
  previousMeetings: z.array(previousMeetingItem).optional().default([]),
  notes: z.string({ invalid_type_error: 'القيمة المُدخلة غير صحيحة' }).optional().or(z.literal('')),
  isComplete: z.boolean().optional().default(false),
});

export type Step1FormData = z.infer<typeof step1BaseSchema>;

export const step1ValidationSchema = step1BaseSchema
  .extend({
    requester: optionType.refine(
      (v) =>
        !!v &&
        typeof v === 'object' &&
        v !== null &&
        'value' in v &&
        String(v.value).trim() !== '',
      'مقدّم الطلب مطلوب'
    ),
    meetingNature: str('طبيعة الاجتماع مطلوبة'),
    meetingOwner: optionType.refine(
      (v) =>
        !!v &&
        typeof v === 'object' &&
        v !== null &&
        'value' in v &&
        String(v.value).trim() !== '',
      'مالك الاجتماع مطلوب'
    ),
    meetingTitle: str('عنوان الاجتماع مطلوب', 1, 200),
    meetingCategory: str('فئة الاجتماع مطلوبة'),
    meetingClassification1: str('تصنيف الاجتماع مطلوب'),
    meeting_channel: str('آلية انعقاد الاجتماع مطلوبة'),
    meetingGoals: z.array(meetingGoalItemStrict).optional().default([]),
    meetingAgenda: z.array(agendaItem(false)).optional().default([]),
    ministerSupport: z.array(ministerSupportItemStrict).optional().default([]),
    previousMeetings: z.array(previousMeetingItemStrict).optional().default([]),
  })
  .superRefine((d, ctx) => {
    if (d.isUrgent) {
      if (!d.urgentReason || d.urgentReason === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'سبب الاجتماع العاجل مطلوب',
          path: ['urgentReason'],
        });
      }
    } else {
      if (!d.meetingStartDate || d.meetingStartDate === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'موعد بداية الاجتماع مطلوب',
          path: ['meetingStartDate'],
        });
      }
      if (!d.meetingEndDate || d.meetingEndDate === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'موعد نهاية الاجتماع مطلوب',
          path: ['meetingEndDate'],
        });
      }
    }
  });

export function validateStep1(data: Partial<Step1FormData>): z.SafeParseReturnType<Step1FormData, Step1FormData> {
  return step1ValidationSchema.safeParse(data) as z.SafeParseReturnType<Step1FormData, Step1FormData>;
}

export function extractValidationErrors(
  result: z.SafeParseError<Partial<Step1FormData>>,
  inputData?: Partial<Step1FormData>
): { formErrors: Partial<Record<keyof Step1FormData, string>>; tableErrors: Record<string, Record<string, string>> } {
  const formErrors: Partial<Record<keyof Step1FormData, string>> = {};
  const tableErrors: Record<string, Record<string, string>> = {};
  const data = inputData ?? {};

  result.error.errors.forEach((err) => {
    const path = err.path;
    const arrayField = path[0];
    const index = path[1];
    const field = path[2];

    if (typeof index === 'number' && typeof field === 'string') {
      const arr = (data as Record<string, unknown>)[arrayField as string];
      const item = Array.isArray(arr) ? arr[index] : undefined;
      if (item && typeof item === 'object' && item !== null && 'id' in item) {
        const id = String((item as { id: string }).id);
        if (!tableErrors[id]) tableErrors[id] = {};
        tableErrors[id][field] = err.message;
      }
    } else if (typeof arrayField === 'string' && !(arrayField in formErrors)) {
      formErrors[arrayField as keyof Step1FormData] = err.message;
    }
  });

  return { formErrors, tableErrors };
}