import { z } from 'zod';
import type { Step1FormData } from './schema';

// Category values that require meetingReason
const CATEGORIES_REQUIRING_REASON = ['PRIVATE_MEETING', 'BILATERAL_MEETING'] as const;

// Category value that requires relatedTopic and dueDate
const CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE = 'GOVERNMENT_CENTER_TOPICS' as const;

// Categories that make file optional
const CATEGORIES_MAKING_FILE_OPTIONAL = [
  'BILATERAL_MEETING',
  'PRIVATE_MEETING',
  'GOVERNMENT_CENTER_TOPICS',
] as const;

// Confidentiality value that makes file optional
const CONFIDENTIALITY_MAKING_FILE_OPTIONAL = 'CONFIDENTIAL' as const;

// Meeting type that requires sector
const MEETING_TYPE_REQUIRING_SECTOR = 'INTERNAL' as const;

/**
 * Creates a conditional schema based on form data
 */
export const createConditionalSchema = (data: Partial<Step1FormData>) => {
  const baseSchema = z.object({
    meetingSubject: z
      .string({
        required_error: 'موضوع الاجتماع مطلوب',
        invalid_type_error: 'موضوع الاجتماع يجب أن يكون نصاً',
      })
      .min(1, 'موضوع الاجتماع مطلوب')
      .max(200, 'موضوع الاجتماع يجب أن يكون أقل من 200 حرف'),

    meetingType: z
      .string({
        required_error: 'نوع الاجتماع مطلوب',
        invalid_type_error: 'نوع الاجتماع يجب أن يكون نصاً',
      })
      .min(1, 'نوع الاجتماع مطلوب')
      .max(100, 'نوع الاجتماع يجب أن يكون أقل من 100 حرف'),

    meetingCategory: z
      .string({
        required_error: 'فئة الاجتماع مطلوبة',
        invalid_type_error: 'فئة الاجتماع يجب أن تكون نصاً',
      })
      .min(1, 'فئة الاجتماع مطلوبة'),

    meetingClassification1: z
      .string({
        required_error: 'تصنيف الاجتماع مطلوب',
        invalid_type_error: 'تصنيف الاجتماع يجب أن يكون نصاً',
      })
      .min(1, 'تصنيف الاجتماع مطلوب'),

    meetingClassification2: z
      .string({
        invalid_type_error: 'تصنيف الاجتماع يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal('')),

    meetingConfidentiality: z
      .string({
        required_error: 'سرية الاجتماع مطلوبة',
        invalid_type_error: 'سرية الاجتماع يجب أن تكون نصاً',
      })
      .min(1, 'سرية الاجتماع مطلوبة'),

    sector: z
      .string({
        invalid_type_error: 'القطاع يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal('')),

    // Table data
    meetingGoals: z
      .array(
        z.object({
          id: z.string(),
          objective: z.string().min(1, 'الهدف مطلوب'),
        })
      )
      .min(1, 'يجب إضافة هدف واحد على الأقل')
      .optional()
      .default([]),

    meetingAgenda: z
      .array(
        z.object({
          id: z.string(),
          agenda_item: z.string().optional(),
          presentation_duration_minutes: z.string().optional(),
        })
      )
      .optional()
      .default([]),

    ministerSupport: z
      .array(
        z.object({
          id: z.string(),
          support_description: z.string().min(1, 'الدعم مطلوب'),
        })
      )
      .min(1, 'يجب إضافة دعم واحد على الأقل')
      .optional()
      .default([]),

    relatedDirectives: z
      .array(
        z.object({
          id: z.string(),
          directive: z.string().optional(),
          previousMeeting: z.string().optional(),
          directiveDate: z.string().optional(),
          directiveStatus: z.string().optional(),
          dueDate: z.string().optional(),
          responsible: z.string().optional(),
        })
      )
      .optional()
      .default([]),

    wasDiscussedPreviously: z.boolean().optional().default(false),

    notes: z
      .string({
        invalid_type_error: 'الملاحظات يجب أن تكون نصاً',
      })
      .optional()
      .or(z.literal('')),
  });

  // Conditional: meetingReason - required if category is PRIVATE_MEETING or BILATERAL_MEETING
  const requiresReason = data.meetingCategory
    ? (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
    : false;

  const meetingReasonSchema = requiresReason
    ? z
      .string({
        required_error: 'مبرر اللقاء مطلوب',
        invalid_type_error: 'مبرر اللقاء يجب أن يكون نصاً',
      })
      .min(1, 'مبرر اللقاء مطلوب')
    : z
      .string({
        invalid_type_error: 'مبرر اللقاء يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal(''));

  // Conditional: relatedTopic - required if category is GOVERNMENT_CENTER_TOPICS
  const requiresRelatedTopic = data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;

  const relatedTopicSchema = requiresRelatedTopic
    ? z
      .string({
        required_error: 'الموضوع المرتبط مطلوب',
        invalid_type_error: 'الموضوع المرتبط يجب أن يكون نصاً',
      })
      .min(1, 'الموضوع المرتبط مطلوب')
    : z
      .string({
        invalid_type_error: 'الموضوع المرتبط يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal(''));

  // Conditional: dueDate - required if category is GOVERNMENT_CENTER_TOPICS
  const dueDateSchema = requiresRelatedTopic
    ? z
      .string({
        required_error: 'تاريخ الاستحقاق مطلوب',
        invalid_type_error: 'تاريخ الاستحقاق يجب أن يكون نصاً',
      })
      .min(1, 'تاريخ الاستحقاق مطلوب')
      .refine(
        (val) => {
          if (!val || val === '') return false;
          return /^\d{4}-\d{2}-\d{2}$/.test(val);
        },
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      )
    : z
      .string({
        invalid_type_error: 'تاريخ الاستحقاق يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(val);
        },
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      );

  // Conditional: meetingAgenda - required if file exists
  const requiresAgenda = !!data.file;

  const meetingAgendaSchema = requiresAgenda
    ? z
      .array(
        z.object({
          id: z.string(),
          agenda_item: z.string().min(1, 'عنصر جدول أعمال الاجتماع مطلوب'),
          presentation_duration_minutes: z.string().optional(),
        })
      )
      .min(1, 'يجب إضافة عنصر جدول أعمال الاجتماع واحد على الأقل عند وجود ملف عرض تقديمي')
      .optional()
      .default([])
    : z
      .array(
        z.object({
          id: z.string(),
          agenda_item: z.string().optional(),
          presentation_duration_minutes: z.string().optional(),
        })
      )
      .optional()
      .default([]);

  // Conditional: previousMeetingDate - required if wasDiscussedPreviously is true
  const requiresPreviousDate = data.wasDiscussedPreviously === true;

  const previousMeetingDateSchema = requiresPreviousDate
    ? z
      .string({
        required_error: 'تاريخ الاجتماع السابق مطلوب',
        invalid_type_error: 'تاريخ الاجتماع السابق يجب أن يكون نصاً',
      })
      .min(1, 'تاريخ الاجتماع السابق مطلوب')
      .refine(
        (val) => {
          if (!val || val === '') return false;
          return /^\d{4}-\d{2}-\d{2}$/.test(val);
        },
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      )
    : z
      .string({
        invalid_type_error: 'تاريخ الاجتماع السابق يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val || val === '') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(val);
        },
        'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
      );

  // Conditional: file - required by default, optional if category is BILATERAL_MEETING, PRIVATE_MEETING, GOVERNMENT_CENTER_TOPICS, or confidentiality is CONFIDENTIAL
  const isFileOptional =
    (data.meetingCategory &&
      (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(data.meetingCategory)) ||
    data.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL;

  const fileValidationBase = z
    .instanceof(File, {
      message: 'الملف مطلوب',
    })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      'حجم الملف يتجاوز 20 ميجابايت'
    )
    .refine(
      (file) => {
        const acceptedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const acceptedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        return (
          acceptedTypes.includes(file.type) ||
          acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
        );
      },
      'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL'
    );

  const fileSchema = isFileOptional
    ? fileValidationBase.optional()
    : fileValidationBase;

  // Conditional: sector - required if meetingType is INTERNAL
  const requiresSector = data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;

  const sectorSchema = requiresSector
    ? z
      .string({
        required_error: 'القطاع مطلوب',
        invalid_type_error: 'القطاع يجب أن يكون نصاً',
      })
      .min(1, 'القطاع مطلوب')
    : z
      .string({
        invalid_type_error: 'القطاع يجب أن يكون نصاً',
      })
      .optional()
      .or(z.literal(''));

  return baseSchema.extend({
    meetingReason: meetingReasonSchema,
    relatedTopic: relatedTopicSchema,
    dueDate: dueDateSchema,
    meetingAgenda: meetingAgendaSchema,
    previousMeetingDate: previousMeetingDateSchema,
    file: fileSchema,
    sector: sectorSchema,
  });
};

/**
 * Validates form data with conditional rules
 */
export const validateStep1 = (data: Partial<Step1FormData>) => {
  const schema = createConditionalSchema(data);
  return schema.safeParse(data);
};

/**
 * Extracts validation errors in a structured format
 */
export const extractValidationErrors = (
  validationResult: z.SafeParseError<Partial<Step1FormData>>,
  inputData?: Partial<Step1FormData>
) => {
  const formErrors: Partial<Record<keyof Step1FormData, string>> = {};
  const tableErrors: Record<string, Record<string, string>> = {};
  const data = inputData || {};

  validationResult.error.errors.forEach((err) => {
    const path = err.path;

    // Handle nested array errors (for tables)
    if (path.length > 1) {
      const arrayField = path[0] as string;
      const index = path[1] as number;
      const field = path[2] as string;

      if (['meetingGoals', 'meetingAgenda', 'ministerSupport', 'relatedDirectives'].includes(arrayField)) {
        const arrayData = (data as any)?.[arrayField];
        const item = arrayData?.[index];
        if (item?.id && field) {
          if (!tableErrors[item.id]) {
            tableErrors[item.id] = {};
          }
          tableErrors[item.id][field] = err.message;
        }
      }
    } else {
      // Regular form field errors
      const field = path[0] as keyof Step1FormData;
      if (field) {
        formErrors[field] = err.message;
      }
    }
  });

  return { formErrors, tableErrors };
};

/**
 * Determines if a field is required based on current form data
 */
export const isFieldRequired = (
  field: keyof Step1FormData,
  data: Partial<Step1FormData>
): boolean => {
  switch (field) {
    case 'meetingSubject':
    case 'meetingType':
    case 'meetingCategory':
    case 'meetingClassification1':
    case 'meetingConfidentiality':
      return true;

    case 'meetingReason':
      return (
        !!data.meetingCategory &&
        (CATEGORIES_REQUIRING_REASON as readonly string[]).includes(data.meetingCategory)
      );

    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_REQUIRING_TOPIC_AND_DUE_DATE;

    case 'previousMeetingDate':
      return data.wasDiscussedPreviously === true;

    case 'file':
      const isFileOptional =
        (data.meetingCategory &&
          (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(data.meetingCategory)) ||
        data.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL;
      return !isFileOptional;

    case 'meetingAgenda':
      return !!data.file;

    case 'meetingGoals':
    case 'ministerSupport':
      return true; // Always required

    case 'sector':
      return data.meetingType === MEETING_TYPE_REQUIRING_SECTOR;

    default:
      return false;
  }
};
