import { z } from 'zod';

const CATEGORIES_REQUIRING_REASON = ['PRIVATE_MEETING', 'BILATERAL_MEETING'] as const;
const CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE = 'GOVERNMENT_CENTER_TOPICS' as const;
const CATEGORIES_MAKING_FILE_OPTIONAL = ['BILATERAL_MEETING', 'PRIVATE_MEETING', 'GOVERNMENT_CENTER_TOPICS'] as const;
const CONFIDENTIALITY_MAKING_FILE_OPTIONAL = 'CONFIDENTIAL' as const;
const ISO_8601_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
const SIMPLE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const isValidISO8601Date = (dateString: string): boolean => {
  if (!dateString) return false;
  
  if (SIMPLE_DATE_PATTERN.test(dateString)) {
    const date = new Date(dateString + 'T00:00:00');
    return !isNaN(date.getTime());
  }
  
  if (ISO_8601_DATE_PATTERN.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  
  return false;
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
        (val) => val && isValidISO8601Date(val),
        'تاريخ غير صحيح. يرجى إدخال تاريخ بصيغة (YYYY-MM-DD)'
      )
    : optionalString(`${fieldName} يجب أن يكون نصاً`).refine(
        (val) => !val || val === '' || isValidISO8601Date(val),
        'تاريخ غير صحيح. يرجى إدخال تاريخ بصيغة (YYYY-MM-DD)'
      );
  return base;
};

const fileSchema = z
  .instanceof(File, { message: 'الملف مطلوب' })
  .refine((file) => file.size <= MAX_FILE_SIZE, 'حجم الملف يتجاوز 20 ميجابايت')
  .refine(
    (file) =>
      ACCEPTED_FILE_TYPES.includes(file.type) ||
      ACCEPTED_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL'
  );

const fileArraySchema = z
  .array(fileSchema)
  .optional()
  .default([])
  .refine(
    (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
    'يجب أن يكون حجم جميع الملفات أقل من 20 ميجابايت'
  );

const meetingGoalItemSchema = z.object({ id: z.string(), objective: z.string() });
const meetingGoalItemValidationSchema = z.object({ id: z.string(), objective: z.string().min(1, 'الهدف مطلوب') });

const agendaItemBaseSchema = z.object({
  id: z.string(),
  agenda_item: z.string().optional(),
  presentation_duration_minutes: z.string().optional(),
  minister_support_type: z.string().optional().or(z.literal('')),
  minister_support_other: z.string().optional().or(z.literal('')),
});

const MINISTER_SUPPORT_TYPE_VALUES = ['إحاطة', 'تحديث', 'قرار', 'توجيه', 'اعتماد', 'أخرى'] as const;
const MINISTER_SUPPORT_TYPE_OTHER = 'أخرى';

const agendaItemSchema = (required: boolean) =>
  agendaItemBaseSchema
    .extend({
      agenda_item: required ? z.string().min(1, 'عنصر الأجندة مطلوب') : z.string().optional(),
      presentation_duration_minutes: required ? z.string().min(1, 'مدة العرض (بالدقائق) مطلوبة') : z.string().optional(),
      minister_support_type: required ? z.string().min(1, 'الدعم المطلوب من الوزير مطلوب') : z.string().optional().or(z.literal('')),
    })
    .refine(
      (data) => {
        const val = data.presentation_duration_minutes;
        if (!val) return !required;
        const num = parseInt(val, 10);
        return !Number.isNaN(num) && num >= 0 && Number.isInteger(num);
      },
      { message: 'مدة العرض يجب أن تكون رقماً صحيحاً (بالدقائق)', path: ['presentation_duration_minutes'] }
    )
    .refine(
      (data) => !data.minister_support_type || (MINISTER_SUPPORT_TYPE_VALUES as readonly string[]).includes(data.minister_support_type),
      { message: 'اختر نوع الدعم من القائمة', path: ['minister_support_type'] }
    )
    .superRefine((data, ctx) => {
      if (data.minister_support_type === MINISTER_SUPPORT_TYPE_OTHER) {
        if (!data.minister_support_other || String(data.minister_support_other).trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'نص الدعم مطلوب عند اختيار "أخرى"',
            path: ['minister_support_other'],
          });
        }
      }
    });

const ministerSupportItemSchema = z.object({ id: z.string(), support_description: z.string() });
const ministerSupportItemValidationSchema = z.object({ id: z.string(), support_description: z.string().min(1, 'الدعم مطلوب') });

const relatedDirectiveItemSchema = z.object({
  id: z.string(),
  directive: z.string().optional(),
  previousMeeting: z.string().optional(),
  directiveDate: z.string().optional(),
  directiveStatus: z.string().optional(),
  dueDate: z.string().optional(),
  responsible: z.string().optional(),
});

const existingFileSchema = z.object({
  id: z.string(),
  file_name: z.string(),
  blob_url: z.string(),
  file_size: z.number().optional(),
  file_type: z.string().optional(),
});

const previousMeetingItemSchema = z.object({
  id: z.string(),
  meeting_subject: z.string().optional(),
  meeting_date: z.string().optional(),
});

const previousMeetingItemValidationSchema = z.object({
  id: z.string(),
  meeting_subject: z.string().optional(),
  meeting_date: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || isValidISO8601Date(val),
      'تاريخ الاجتماع السابق غير صحيح. يرجى إدخال تاريخ بصيغة ISO 8601 (YYYY-MM-DD)'
    ),
});

const optionTypeSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
}).nullable().optional().or(z.literal(''));

export const step1BaseSchema = z.object({
  relatedDirective: optionTypeSchema,
  requester: optionTypeSchema,
  previousMeeting: z.string().optional().or(z.literal('')),
  meetingNature: z.string().optional().or(z.literal('')),
  meetingOwner: optionTypeSchema,
  meetingTitle: z.string().optional().or(z.literal('')),
  meetingSubject: z.string().optional().or(z.literal('')),
  meetingSubjectOptional: z.string().optional().or(z.literal('')),
  meetingDescription: z.string().optional().or(z.literal('')),
  meetingType: z.string().optional().or(z.literal('')),
  meetingCategory: z.string(),
  meetingReason: z.string().optional().or(z.literal('')),
  relatedTopic: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  meetingClassification1: z.string().optional().or(z.literal('')),
  meetingClassification2: z.string().optional().or(z.literal('')),
  meetingConfidentiality: z.string().optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  isUrgent: z.boolean().optional().default(false),
  urgentReason: z.string().optional().or(z.literal('')),
  meetingStartDate: z.string().optional().or(z.literal('')),
  meetingEndDate: z.string().optional().or(z.literal('')),
  meeting_channel: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  requiresProtocol: z.boolean().optional().default(false),
  meetingGoals: z.array(meetingGoalItemSchema).optional().default([]),
  meetingAgenda: z.array(agendaItemBaseSchema).optional().default([]),
  ministerSupport: z.array(ministerSupportItemSchema).optional().default([]),
  relatedDirectives: z.array(relatedDirectiveItemSchema).optional().default([]),
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetingDate: z.string().optional().or(z.literal('')),
  previousMeetings: z.array(previousMeetingItemSchema).optional().default([]),
  notes: z.string({invalid_type_error: 'القيمة المُدخلة غير صحيحة'}).optional().or(z.literal('')),
  presentation_files: z.array(z.instanceof(File)).optional().default([]),
  presentationFile: z.instanceof(File).optional().nullable(),
  additionalAttachments: z.instanceof(File).optional().nullable(),
  existingFiles: z.array(existingFileSchema).optional().default([]),
  isComplete: z.boolean().optional().default(false),
});

export type Step1FormData = z.infer<typeof step1BaseSchema>;

z.setErrorMap(() => ({
  message: 'هناك خطأ ما في هذا الحقل',
}));

export const createConditionalSchema = (data: Partial<Step1FormData>) => {
  const requiresReason = data.meetingCategory
    ? (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
    : false;
  const requiresRelatedTopic = data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
  const requiresAgenda = !!(data.presentation_files && data.presentation_files.length > 0) || !!data.presentationFile;
  const requiresPreviousDate = data.wasDiscussedPreviously === true;
  const requiresPreviousMeeting =
    data.meetingNature === 'SEQUENTIAL' || data.meetingNature === 'PERIODIC';
  const isFileOptional =
    (data.meetingCategory && (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(data.meetingCategory)) ||
    data.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL;

  const requiresLocation = data.meeting_channel === 'PHYSICAL';
  const baseSchema = z.object({
    meetingTitle: requiredString('عنوان الاجتماع مطلوب', 1, 200),
    meetingSubject: optionalString('موضوع الاجتماع'),
    meetingCategory: requiredString('فئة الاجتماع مطلوبة'),
    meeting_channel: requiredString('آلية انعقاد الاجتماع مطلوبة'),
    requiresProtocol: z.boolean().optional().default(false),
    meetingClassification1: optionalString('تصنيف الاجتماع يجب أن يكون نصاً'),
    meetingClassification2: optionalString('تصنيف الاجتماع يجب أن يكون نصاً'),
    meetingConfidentiality: optionalString('سرية الاجتماع يجب أن تكون نصاً'),
    sector: optionalString('القطاع يجب أن يكون نصاً'),
    // meetingGoals is optional (JSON string array) - no minimum required
    meetingGoals: z.array(meetingGoalItemValidationSchema).optional().default([]),
    meetingAgenda: requiresAgenda
      ? z.array(agendaItemSchema(true)).min(1, 'يجب إضافة عنصر أجندة واحد على الأقل عند وجود ملف عرض تقديمي').optional().default([])
      : z.array(agendaItemSchema(false)).optional().default([]),
    // ministerSupport is optional (JSON string array) - no minimum required
    ministerSupport: z.array(ministerSupportItemValidationSchema).optional().default([]),
    relatedDirectives: z.array(relatedDirectiveItemSchema).optional().default([]),
    wasDiscussedPreviously: z.boolean().optional().default(false),
    // previousMeetings is optional (JSON string array)
    previousMeetings: z.array(previousMeetingItemValidationSchema).optional().default([]),
    notes: optionalString('الملاحظات يجب أن تكون نصاً'),
    meetingNature: z.string().optional().or(z.literal('')),
    isComplete: z.boolean().optional().default(false),
  });

  return baseSchema.extend({
    location: requiresLocation
      ? requiredString('الموقع مطلوب عند اختيار حضوري')
      : optionalString('الموقع يجب أن يكون نصاً'),
    meetingReason: requiresReason
      ? requiredString('مبرر اللقاء مطلوب')
      : optionalString('مبرر اللقاء يجب أن يكون نصاً'),
    relatedTopic: requiresRelatedTopic
      ? requiredString('الموضوع المرتبط مطلوب')
      : optionalString('الموضوع المرتبط يجب أن يكون نصاً'),
    dueDate: dateSchema(requiresRelatedTopic, 'تاريخ الاستحقاق مطلوب'),
    // previousMeetingDate is deprecated - still validate if provided but prefer previousMeetings
    previousMeetingDate: dateSchema(requiresPreviousDate, 'تاريخ الاجتماع السابق مطلوب'),
    // previousMeeting is required when Nature = Follow-up (SEQUENTIAL) or Recurring (PERIODIC)
    previousMeeting: requiresPreviousMeeting
      ? requiredString('الاجتماع السابق مطلوب عند اختيار طبيعة الاجتماع إلحاقي أو دوري')
      : optionalString('الاجتماع السابق يجب أن يكون نصاً'),
    // presentation_files is optional file array
    presentation_files: fileArraySchema,
    presentationFile: isFileOptional
      ? z.instanceof(File, { message: 'الملف مطلوب' }).optional().nullable()
      : z.instanceof(File, { message: 'الملف مطلوب' }).optional().nullable(),
    // additionalAttachments is optional file array
    additionalAttachments: z
      .instanceof(File, { message: 'الملف مطلوب' })
      .optional()
      .nullable()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        'حجم الملف يتجاوز 20 ميجابايت'
      )
      .refine(
        (file) =>
          !file ||
          ACCEPTED_FILE_TYPES.includes(file.type) ||
          ACCEPTED_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
        'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL'
      ),
  }).refine(
    (data) => {
      if (!isFileOptional) {
        const hasFile = (data.presentationFile !== null && data.presentationFile !== undefined) ||
                       (data.presentation_files && data.presentation_files.length > 0);
        return hasFile;
      }
      return true;
    },
    {
      message: 'يجب رفع ملف عرض تقديمي واحد على الأقل',
      path: ['presentationFile'],
    }
  );
};

export const validateStep1 = (data: Partial<Step1FormData>) => {
  return createConditionalSchema(data).safeParse(data);
};

export const extractValidationErrors = (
  validationResult: z.SafeParseError<Partial<Step1FormData>>,
  inputData?: Partial<Step1FormData>
) => {
  const formErrors: Partial<Record<keyof Step1FormData, string>> = {};
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
      formErrors[arrayField as keyof Step1FormData] = err.message;
    }
  });

  return { formErrors, tableErrors };
};

export const isFieldRequired = (field: keyof Step1FormData, data: Partial<Step1FormData>): boolean => {
  switch (field) {
    case 'meetingTitle':
    case 'meetingCategory':
    case 'meeting_channel':
    case 'requester':
    case 'meetingOwner':
      return true;
    case 'location':
      return data.meeting_channel === 'PHYSICAL';
    case 'meetingReason':
      return !!data.meetingCategory && (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory);
    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;
    case 'previousMeetingDate':
      return data.wasDiscussedPreviously === true;
    case 'previousMeeting':
      return data.meetingNature === 'SEQUENTIAL' || data.meetingNature === 'PERIODIC';
    case 'presentation_files':
    case 'presentationFile':
      return !(
        (data.meetingCategory && (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(data.meetingCategory)) ||
        data.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL
      );
    case 'meetingAgenda':
      return !!(data.presentation_files && data.presentation_files.length > 0) || !!data.presentationFile;
    case 'meetingGoals':
    case 'ministerSupport':
      return false;
    default:
      return false;
  }
};