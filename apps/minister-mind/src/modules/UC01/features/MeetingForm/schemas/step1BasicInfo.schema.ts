import { z } from 'zod';

const CATEGORIES_REQUIRING_REASON = ['PRIVATE_MEETING', 'BILATERAL_MEETING'] as const;
const CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE = 'GOVERNMENT_CENTER_TOPICS' as const;
const MEETING_TYPE_REQUIRING_SECTOR = 'INTERNAL' as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  return base;
};

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
  meetingReason: z.string().optional().or(z.literal('')),
  meetingDescription: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification1: z.string(),
  meetingClassification2: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string(),
  meetingChannel: z.string().optional().or(z.literal('')),
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
});

export type Step1BasicInfoFormData = z.infer<typeof step1BasicInfoBaseSchema>;

z.setErrorMap(() => ({
  message: 'هناك خطأ ما في هذا الحقل',
}));

export const createStep1BasicInfoSchema = (data: Partial<Step1BasicInfoFormData>) => {
  const requiresReason = data.meetingCategory
    ? (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
    : false;
  const requiresRelatedTopic = data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
  const requiresSector = data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;

  const requiresUrgentReason = data.is_urgent === true;
  const requiresMeetingManager = data.is_on_behalf_of === true;
  const requiresDirectiveMethod = data.is_based_on_directive === true;
  const requiresDirectiveText = data.directive_method === 'DIRECT_DIRECTIVE';
  const requiresClassification = data.meetingCategory !== 'PRIVATE_MEETING';
  const requiresAgenda = data.meetingCategory !== 'PRIVATE_MEETING';

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
    meetingConfidentiality: requiredString('سرية الاجتماع مطلوبة'),
    meetingChannel: optionalString('آلية انعقاد الاجتماع يجب أن تكون نصاً'),
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

export type Step1FieldKey = keyof Step1BasicInfoFormData | 'selected_time_slot_id';

export const isStep1BasicInfoFieldRequired = (field: Step1FieldKey, data: Partial<Step1BasicInfoFormData>): boolean => {
  switch (field) {
    case 'meetingSubject':
    case 'meetingType':
    case 'meetingCategory':
    case 'meetingConfidentiality':
    case 'meetingClassification1':
      return data.meetingCategory !== CATEGORY_PRIVATE_MEETING;
    case 'meetingReason':
      return !!data.meetingCategory && (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory);
    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
    case 'sector':
      return data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;
    case 'urgent_reason':
      return data.is_urgent === true;
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
    case 'selected_time_slot_id':
      return data.is_urgent !== true;
    default:
      return false;
  }
};