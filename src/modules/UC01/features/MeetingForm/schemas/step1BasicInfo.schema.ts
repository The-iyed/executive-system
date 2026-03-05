import { z } from 'zod';

const CATEGORIES_REQUIRING_REASON = ['PRIVATE_MEETING', 'BILATERAL_MEETING'] as const;
const CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE = 'GOVERNMENT_CENTER_TOPICS' as const;
const MEETING_TYPE_REQUIRING_SECTOR = 'INTERNAL' as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDateOrDateTime = (val: string): boolean => {
  if (!val || val.trim() === '') return false;
  const d = new Date(val.trim());
  return !Number.isNaN(d.getTime());
};

const requiredString = (message: string, minLength = 1, maxLength?: number) => {
  const schema = z.string({
    required_error: message,
    invalid_type_error: `${message} يجب أن يكون نصاً`,
  }).min(minLength, message);
  return maxLength ? schema.max(maxLength, `${message} يجب أن يكون أقل من ${maxLength} حرف`) : schema;
};

const optionalString = (invalidTypeMessage: string) =>
  z.string({ invalid_type_error: invalidTypeMessage }).optional().or(z.literal(''));

const dateSchema = (required: boolean, fieldName: string) => {
  const base = required
    ? requiredString(fieldName).refine(
        (val) => val && DATE_PATTERN.test(val),
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      )
    : optionalString(`${fieldName} يجب أن يكون نصاً`).refine(
        (val) => !val || val === '' || DATE_PATTERN.test(val),
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      );
  
  return base.refine(
    (val) => {
      if (!val || val === '') return true;
      const selectedDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    'لا يمكن اختيار تاريخ في الماضي'
  );
};

/** Date or datetime (ISO) for meeting start/end - required when meeting dates are required. */
const dateTimeSchema = (required: boolean, fieldName: string) => {
  const base = required
    ? requiredString(fieldName).refine(isValidDateOrDateTime, 'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح')
    : optionalString(`${fieldName} يجب أن يكون نصاً`).refine(
        (val) => !val || val.trim() === '' || isValidDateOrDateTime(val),
        'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح'
      );
  return base;
};

const MAX_MEETING_DURATION_MS = 24 * 60 * 60 * 1000;

const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function getMeetingDurationMinutes(
  startISO: string | undefined,
  endISO: string | undefined
): number | null {
  if (!startISO?.trim() || !endISO?.trim()) return null;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end < start) return null;
  if (!isSameCalendarDay(start, end)) return null;
  const ms = end.getTime() - start.getTime();
  if (ms > MAX_MEETING_DURATION_MS) return null;
  return Math.round(ms / (60 * 1000));
}

export function getAgendaTotalDurationMinutes(
  agenda: Array<Record<string, unknown>> | undefined
): number {
  if (!agenda?.length) return 0;
  return agenda.reduce((sum, item) => {
    const n = parseInt(String(item.presentation_duration_minutes ?? ''), 10);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
}

/** Reference time for "now" (seconds precision for consistent validation). */
function getNowTimestamp(): number {
  return Math.floor(Date.now() / 1000) * 1000;
}

/**
 * Returns true if the meeting start time is in the past (strict, no buffer).
 */
export function isMeetingTimeInPast(
  startISO: string | undefined,
  _endISO?: string | undefined
): boolean {
  if (!startISO?.trim()) return false;
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() < getNowTimestamp();
}

const MINISTER_SUPPORT_TYPE_OTHER = 'أخرى';
const MINISTER_SUPPORT_TYPE_VALUES = ['إحاطة', 'تحديث', 'قرار', 'توجيه', 'اعتماد', 'أخرى'] as const;

const agendaItemBaseSchema = z.object({
  id: z.string(),
  agenda_item: z.string().optional(),
  presentation_duration_minutes: z.string().optional(),
  minister_support_type: z.string().optional().or(z.literal('')),
  minister_support_other: z.string().optional().or(z.literal('')),
});

const agendaItemStrictSchema = z
  .object({
    id: z.string(),
    agenda_item: z.string().min(1, 'عنصر الأجندة مطلوب'),
    presentation_duration_minutes: z.string().min(1, 'مدة العرض (بالدقائق) مطلوبة'),
    minister_support_type: z.string().min(1, 'الدعم المطلوب من الوزير مطلوب'),
    minister_support_other: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const num = parseInt(data.presentation_duration_minutes, 10);
      return !Number.isNaN(num) && num >= 0 && Number.isInteger(num);
    },
    { message: 'مدة العرض يجب أن تكون رقماً صحيحاً (بالدقائق)', path: ['presentation_duration_minutes'] }
  )
  .refine(
    (data) => (MINISTER_SUPPORT_TYPE_VALUES as readonly string[]).includes(data.minister_support_type),
    { message: 'اختر نوع الدعم من القائمة', path: ['minister_support_type'] }
  )
  .superRefine((data, ctx) => {
    if (data.minister_support_type === MINISTER_SUPPORT_TYPE_OTHER) {
      if (!data.minister_support_other || data.minister_support_other.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'نص الدعم مطلوب عند اختيار "أخرى"',
          path: ['minister_support_other'],
        });
      }
    }
  });

export const step1BasicInfoBaseSchema = z.object({
  meetingSubject: z.string(),
  meetingType: z.string(),
  meetingCategory: z.string(),
  meetingSubCategory: z.string().optional().or(z.literal('')),
  meetingReason: z.string().optional().or(z.literal('')),
  meetingDescription: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification1: z.string(),
  meetingClassification2: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string(),
  meetingChannel: z.string().optional().or(z.literal('')),
  meeting_location: z.string().optional().or(z.literal('')),
  meeting_location_option: z.string().optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  meetingAgenda: z.array(agendaItemBaseSchema).optional().default([]),
  notes: z.string({invalid_type_error: 'القيمة المُدخلة غير صحيحة'}).optional().or(z.literal('')),
  is_urgent: z.boolean().optional().default(false),
  urgent_reason: z.string().optional().or(z.literal('')),
  is_on_behalf_of: z.boolean().optional().default(false),
  meeting_manager_id: z.string().optional().or(z.literal('')),
  is_based_on_directive: z.boolean().optional().default(false),
  directive_method: z.string().optional().or(z.literal('')),
  previous_meeting_minutes_file: z.union([z.instanceof(File), z.null()]).optional(),
  directive_text: z.string().optional().or(z.literal('')),
  meeting_start_date: z.string().optional().or(z.literal('')),
  meeting_end_date: z.string().optional().or(z.literal('')),
  alternative_1_start_date: z.string().optional().or(z.literal('')),
  alternative_1_end_date: z.string().optional().or(z.literal('')),
  alternative_2_start_date: z.string().optional().or(z.literal('')),
  alternative_2_end_date: z.string().optional().or(z.literal('')),
});

export type Step1BasicInfoFormData = z.infer<typeof step1BasicInfoBaseSchema>;

export const isUrgentReasonRequired = (data: Partial<Step1BasicInfoFormData>): boolean =>
  data.is_urgent === true;

z.setErrorMap(() => ({
  message: 'هناك خطأ ما في هذا الحقل',
}));

export const createStep1BasicInfoSchema = (data: Partial<Step1BasicInfoFormData>) => {
  const requiresReason = data.meetingCategory
    ? (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
    : false;
  const requiresRelatedTopic = data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
  const requiresSector = data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;

  const requiresUrgentReason = isUrgentReasonRequired(data);
  const requiresMeetingManager = data.is_on_behalf_of === true;
  const requiresDirectiveMethod = data.is_based_on_directive === true;
  const requiresDirectiveText = data.directive_method === 'DIRECT_DIRECTIVE';
  const requiresClassification = data.meetingCategory === 'BUSINESS';
  const requiresAgenda = data.meetingCategory !== 'PRIVATE_MEETING';
  const requiresMeetingDates = data.is_urgent !== true;
  const requiresMeetingLocation = data.meetingChannel === 'PHYSICAL';

  const agendaItemsWithSupportSchema = requiresAgenda
    ? z.array(agendaItemStrictSchema).min(1, 'يجب إضافة عنصر أجندة واحد على الأقل').optional().default([])
    : z.array(agendaItemStrictSchema).optional().default([]);

  const baseSchema = z.object({
    meetingSubject: requiredString('عنوان الاجتماع مطلوب', 1, 200),
    meetingType: requiredString('نوع الاجتماع مطلوب', 1, 100),
    meetingCategory: requiredString('فئة الاجتماع مطلوبة'),
    meetingClassification1: requiresClassification
      ? requiredString('تصنيف الاجتماع مطلوب')
      : optionalString('تصنيف الاجتماع يجب أن يكون نصاً'),
    meetingClassification2: optionalString('تصنيف الاجتماع يجب أن يكون نصاً'),
    meetingConfidentiality: z.union([z.enum(['CONFIDENTIAL', 'NORMAL']), z.literal('')]).default('NORMAL').transform((v) => (v === '' ? 'NORMAL' : v)),
    meetingChannel: optionalString('آلية انعقاد الاجتماع يجب أن تكون نصاً'),
    meeting_location: requiresMeetingLocation
      ? requiredString('الموقع مطلوب')
      : optionalString('الموقع يجب أن يكون نصاً'),
    sector: optionalString('القطاع يجب أن يكون نصاً'),
    meetingAgenda: agendaItemsWithSupportSchema,
    notes: optionalString('الملاحظات يجب أن تكون نصاً'),
    is_urgent: z.boolean().optional().default(false),
    is_on_behalf_of: z.boolean().optional().default(false),
    is_based_on_directive: z.boolean().optional().default(false),
  });

  return baseSchema.extend({
    meetingReason: requiresReason
      ? requiredString('مبرر اللقاء مطلوب')
      : optionalString('مبرر اللقاء يجب أن يكون نصاً'),
    relatedTopic: requiresRelatedTopic
      ? requiredString('موضوع التكليف المرتبط مطلوب')
      : optionalString('موضوع التكليف المرتبط يجب أن يكون نصاً'),
    dueDate: dateSchema(requiresRelatedTopic, 'تاريخ الاستحقاق مطلوب'),
    sector: requiresSector ? requiredString('القطاع مطلوب') : optionalString('القطاع يجب أن يكون نصاً'),
    urgent_reason: requiresUrgentReason
      ? requiredString('السبب مطلوب')
      : optionalString('السبب يجب أن يكون نصاً'),
    meeting_manager_id: requiresMeetingManager
      ? requiredString('مالك الاجتماع مطلوب')
      : optionalString('مالك الاجتماع يجب أن يكون نصاً'),
    directive_method: requiresDirectiveMethod
      ? requiredString('طريقة التوجيه مطلوبة')
      : optionalString('طريقة التوجيه يجب أن تكون نصاً'),
    previous_meeting_minutes_file: z.union([z.instanceof(File), z.null()]).optional(),
    directive_text: requiresDirectiveText
      ? requiredString('التوجيه مطلوب')
      : optionalString('التوجيه يجب أن يكون نصاً'),
    meeting_start_date: dateTimeSchema(requiresMeetingDates, 'تاريخ ووقت بداية الاجتماع مطلوب'),
    meeting_end_date: dateTimeSchema(requiresMeetingDates, 'تاريخ ووقت نهاية الاجتماع مطلوب'),
    alternative_1_start_date: optionalString('تاريخ بداية الموعد البديل الأول').refine(
      (val) => !val || val.trim() === '' || isValidDateOrDateTime(val),
      'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح'
    ),
    alternative_1_end_date: optionalString('تاريخ نهاية الموعد البديل الأول').refine(
      (val) => !val || val.trim() === '' || isValidDateOrDateTime(val),
      'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح'
    ),
    alternative_2_start_date: optionalString('تاريخ بداية الموعد البديل الثاني').refine(
      (val) => !val || val.trim() === '' || isValidDateOrDateTime(val),
      'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح'
    ),
    alternative_2_end_date: optionalString('تاريخ نهاية الموعد البديل الثاني').refine(
      (val) => !val || val.trim() === '' || isValidDateOrDateTime(val),
      'تاريخ ووقت غير صحيح. يرجى إدخال تاريخ ووقت صالح'
    ),
  })
  .superRefine((data, ctx) => {
    if (data.directive_method === 'PREVIOUS_MEETING') {
      const file = data.previous_meeting_minutes_file;
      if (!file || !(file instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'محضر الاجتماع مطلوب (PDF، Word، Excel)',
          path: ['previous_meeting_minutes_file'],
        });
      }
    }
    if (requiresMeetingDates && data.meeting_start_date && data.meeting_end_date) {
      const start = new Date(data.meeting_start_date);
      const end = new Date(data.meeting_end_date);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (isMeetingTimeInPast(data.meeting_start_date, data.meeting_end_date)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'وقت الاجتماع لا يمكن أن يكون في الماضي',
            path: ['meeting_start_date'],
          });
        } else if (end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'وقت النهاية يجب أن يكون بعد أو يساوي وقت البداية',
            path: ['meeting_end_date'],
          });
        } else if (!isSameCalendarDay(start, end)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'وقت النهاية يجب أن يكون في نفس يوم البداية',
            path: ['meeting_end_date'],
          });
        } else if (end.getTime() - start.getTime() > MAX_MEETING_DURATION_MS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'مدة الاجتماع يجب ألا تتجاوز 24 ساعة',
            path: ['meeting_end_date'],
          });
        }
      }
    }
    // Alternative 1: if either date set, both required and end >= start
    const alt1StartSet = !!(data.alternative_1_start_date?.trim());
    const alt1EndSet = !!(data.alternative_1_end_date?.trim());
    if (alt1StartSet || alt1EndSet) {
      if (!alt1StartSet) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاريخ بداية الموعد البديل الأول مطلوب', path: ['alternative_1_start_date'] });
      } else if (!alt1EndSet) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاريخ نهاية الموعد البديل الأول مطلوب', path: ['alternative_1_end_date'] });
      } else {
        const s = new Date(data.alternative_1_start_date!);
        const e = new Date(data.alternative_1_end_date!);
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
          if (e < s) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'وقت النهاية يجب أن يكون بعد أو يساوي وقت البداية', path: ['alternative_1_end_date'] });
          } else if (!isSameCalendarDay(s, e)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'وقت النهاية يجب أن يكون في نفس يوم البداية', path: ['alternative_1_end_date'] });
          } else if (e.getTime() - s.getTime() > MAX_MEETING_DURATION_MS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'مدة الموعد البديل يجب ألا تتجاوز 24 ساعة', path: ['alternative_1_end_date'] });
          }
        }
      }
    }
    const alt2StartSet = !!(data.alternative_2_start_date?.trim());
    const alt2EndSet = !!(data.alternative_2_end_date?.trim());
    if (alt2StartSet || alt2EndSet) {
      if (!alt2StartSet) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاريخ بداية الموعد البديل الثاني مطلوب', path: ['alternative_2_start_date'] });
      } else if (!alt2EndSet) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاريخ نهاية الموعد البديل الثاني مطلوب', path: ['alternative_2_end_date'] });
      } else {
        const s = new Date(data.alternative_2_start_date!);
        const e = new Date(data.alternative_2_end_date!);
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
          if (e < s) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'وقت النهاية يجب أن يكون بعد أو يساوي وقت البداية', path: ['alternative_2_end_date'] });
          } else if (!isSameCalendarDay(s, e)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'وقت النهاية يجب أن يكون في نفس يوم البداية', path: ['alternative_2_end_date'] });
          } else if (e.getTime() - s.getTime() > MAX_MEETING_DURATION_MS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'مدة الموعد البديل يجب ألا تتجاوز 24 ساعة', path: ['alternative_2_end_date'] });
          }
        }
      }
    }
    if (requiresMeetingDates && data.meeting_start_date && data.meeting_end_date) {
      const meetingMinutes = getMeetingDurationMinutes(
        data.meeting_start_date,
        data.meeting_end_date
      );
      if (meetingMinutes != null && (data.meetingAgenda?.length ?? 0) > 0) {
        const agendaTotal = getAgendaTotalDurationMinutes(data.meetingAgenda);
        if (agendaTotal !== meetingMinutes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `مجموع مدة عناصر الأجندة (${agendaTotal} دقيقة) يجب أن يساوي بالضبط مدة الاجتماع (${meetingMinutes} دقيقة)`,
            path: ['meetingAgenda'],
          });
        }
      }
    }
  });
};

export const validateStep1BasicInfo = (data: Partial<Step1BasicInfoFormData>) => {
  return createStep1BasicInfoSchema(data).safeParse(data);
};

export const extractStep1BasicInfoErrors = (
  validationResult: z.SafeParseError<Partial<Step1BasicInfoFormData>>,
  inputData?: Partial<Step1BasicInfoFormData>
) => {
  const formErrors: Partial<Record<keyof Step1BasicInfoFormData, string>> = {};
  const tableErrors: Record<string, Record<string, string>> = {};
  const data = inputData || {};

  validationResult.error.errors.forEach((err) => {
    const [arrayField, index, field] = err.path;

    if (typeof index === 'number' && typeof field === 'string') {
      const arrayData = (data as any)?.[arrayField];
      const item = arrayData?.[index];
      if (item?.id) {
        if (!tableErrors[item.id]) tableErrors[item.id] = {};
        tableErrors[item.id][field] = err.message;
      }
    } else if (typeof arrayField === 'string') {
      formErrors[arrayField as keyof Step1BasicInfoFormData] = err.message;
    }
  });

  return { formErrors, tableErrors };
};

const CATEGORY_PRIVATE_MEETING = 'PRIVATE_MEETING' as const;

export type Step1FieldKey = keyof Step1BasicInfoFormData;

export const isStep1BasicInfoFieldRequired = (field: Step1FieldKey, data: Partial<Step1BasicInfoFormData>): boolean => {
  switch (field) {
    case 'meetingSubject':
    case 'meetingType':
    case 'meetingCategory':
    case 'meetingConfidentiality':
    case 'meetingClassification1':
      return data.meetingCategory === 'BUSINESS';
    case 'meetingReason':
      return !!data.meetingCategory && (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory);
    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
    case 'sector':
      return data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;
    case 'urgent_reason':
      return isUrgentReasonRequired(data);
    case 'meeting_manager_id':
      return data.is_on_behalf_of === true;
    case 'directive_method':
      return data.is_based_on_directive === true;
    case 'previous_meeting_minutes_file':
      return data.directive_method === 'PREVIOUS_MEETING';
    case 'directive_text':
      return data.directive_method === 'DIRECT_DIRECTIVE';
    case 'meetingAgenda':
      return data.meetingCategory !== CATEGORY_PRIVATE_MEETING;
    case 'meeting_end_date':
      return data.is_urgent !== true;
    case 'meeting_location':
      return data.meetingChannel === 'PHYSICAL';
    default:
      return false;
  }
};