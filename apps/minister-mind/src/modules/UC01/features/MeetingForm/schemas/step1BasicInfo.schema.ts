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

// Reusable schema objects
const meetingGoalItemSchema = z.object({ id: z.string(), objective: z.string() });
const meetingGoalItemValidationSchema = z.object({ id: z.string(), objective: z.string().min(1, 'الهدف مطلوب') });

// Minister support type values per requirement: إحاطة|تحديث|قرار|توجيه|اعتماد|أخرى
const MINISTER_SUPPORT_TYPE_OTHER = 'أخرى';

const agendaItemBaseSchema = z.object({
  id: z.string(),
  agenda_item: z.string().optional(),
  presentation_duration_minutes: z.string().optional(),
  minister_support_type: z.string().optional().or(z.literal('')),
  minister_support_other: z.string().optional().or(z.literal('')),
});

const agendaItemSchema = (required: boolean) =>
  agendaItemBaseSchema.extend({
    agenda_item: required ? z.string().min(1, 'عنصر الأجندة مطلوب') : z.string().optional(),
    minister_support_other: z.string().optional().or(z.literal('')),
  }).superRefine((data, ctx) => {
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

const relatedDirectiveItemSchema = z.object({
  id: z.string(),
  directive: z.string().optional(),
  previousMeeting: z.string().optional(),
  directiveDate: z.string().optional(),
  directiveStatus: z.string().optional(),
  dueDate: z.string().optional(),
  responsible: z.string().optional(),
});

// Type-only schema - minimal validation for TypeScript inference
export const step1BasicInfoBaseSchema = z.object({
  meetingSubject: z.string(),
  meetingType: z.string(),
  meetingCategory: z.string(),
  meetingReason: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification1: z.string(),
  meetingClassification2: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string(),
  sector: z.string().optional().or(z.literal('')),
  meeting_location: z.string().optional().or(z.literal('')),
  meetingGoals: z.array(meetingGoalItemSchema).optional().default([]),
  meetingAgenda: z.array(agendaItemBaseSchema).optional().default([]),
  relatedDirectives: z.array(relatedDirectiveItemSchema).optional().default([]),
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetingDate: z.string().optional().or(z.literal('')),
  notes: z.string({invalid_type_error: 'القيمة المُدخلة غير صحيحة'}).optional().or(z.literal('')),
  is_urgent: z.boolean().optional().default(false),
  urgent_reason: z.string().optional().or(z.literal('')),
  is_on_behalf_of: z.boolean().optional().default(false),
  meeting_manager_id: z.string().optional().or(z.literal('')),
  is_based_on_directive: z.boolean().optional().default(false),
  directive_method: z.string().optional().or(z.literal('')),
  previous_meeting_minutes_id: z.string().optional().or(z.literal('')),
});

export type Step1BasicInfoFormData = z.infer<typeof step1BasicInfoBaseSchema>;

z.setErrorMap(() => ({
  message: 'هناك خطأ ما في هذا الحقل',
}));

// Validation schema factory with conditional rules
export const createStep1BasicInfoSchema = (data: Partial<Step1BasicInfoFormData>) => {
  const requiresReason = data.meetingCategory
    ? (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
    : false;
  const requiresRelatedTopic = data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
  const requiresPreviousDate = data.wasDiscussedPreviously === true;
  const requiresSector = data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;

  const requiresUrgentReason = data.is_urgent === true;
  const requiresMeetingManager = data.is_on_behalf_of === true;
  const requiresDirectiveMethod = data.is_based_on_directive === true;
  const requiresPreviousMeetingMinutes = data.directive_method === 'PREVIOUS_MEETING';

  // Agenda optional in step 1; presentation/content is in step 2
  const agendaItemsWithSupportSchema = z.array(agendaItemSchema(false)).optional().default([]);

  const baseSchema = z.object({
    meetingSubject: requiredString('موضوع الاجتماع مطلوب', 1, 200),
    meetingType: requiredString('نوع الاجتماع مطلوب', 1, 100),
    meetingCategory: requiredString('فئة الاجتماع مطلوبة'),
    meetingClassification1: requiredString('تصنيف الاجتماع مطلوب'),
    meetingClassification2: optionalString('تصنيف الاجتماع يجب أن يكون نصاً'),
    meetingConfidentiality: requiredString('سرية الاجتماع مطلوبة'),
    sector: optionalString('القطاع يجب أن يكون نصاً'),
    meeting_location: optionalString('مقر الاجتماع يجب أن يكون نصاً'),
    meetingGoals: z
      .array(meetingGoalItemValidationSchema)
      .min(1, 'يجب إضافة هدف واحد على الأقل')
      .optional()
      .default([]),
    meetingAgenda: agendaItemsWithSupportSchema,
    relatedDirectives: z.array(relatedDirectiveItemSchema).optional().default([]),
    wasDiscussedPreviously: z.boolean().optional().default(false),
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
      ? requiredString('الموضوع المرتبط مطلوب')
      : optionalString('الموضوع المرتبط يجب أن يكون نصاً'),
    dueDate: dateSchema(requiresRelatedTopic, 'تاريخ الاستحقاق مطلوب'),
    previousMeetingDate: dateSchema(requiresPreviousDate, 'تاريخ الاجتماع السابق مطلوب'),
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
    previous_meeting_minutes_id: requiresPreviousMeetingMinutes
      ? requiredString('محضر الاجتماع مطلوب')
      : optionalString('محضر الاجتماع يجب أن يكون نصاً'),
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

export const isStep1BasicInfoFieldRequired = (field: keyof Step1BasicInfoFormData, data: Partial<Step1BasicInfoFormData>): boolean => {
  switch (field) {
    case 'meetingSubject':
    case 'meetingType':
    case 'meetingCategory':
    case 'meetingClassification1':
    case 'meetingConfidentiality':
    case 'meetingGoals':
      return true;
    case 'meetingReason':
      return !!data.meetingCategory && (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory);
    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
    case 'previousMeetingDate':
      return data.wasDiscussedPreviously === true;
    case 'sector':
      return data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;
    case 'urgent_reason':
      return data.is_urgent === true;
    case 'meeting_manager_id':
      return data.is_on_behalf_of === true;
    case 'directive_method':
      return data.is_based_on_directive === true;
    case 'previous_meeting_minutes_id':
      return data.directive_method === 'PREVIOUS_MEETING';
    default:
      return false;
  }
};
