import { z } from 'zod';

export const step1Schema = z.object({
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
  
  meetingReason: z
    .string({
      invalid_type_error: 'مبرر اللقاء يجب أن يكون نصاً',
    })
    .optional()
    .or(z.literal('')),
  
  relatedTopic: z
    .string({
      invalid_type_error: 'الموضوع المرتبط يجب أن يكون نصاً',
    })
    .optional()
    .or(z.literal('')),
  
  dueDate: z
    .string({
      invalid_type_error: 'تاريخ الاستحقاق يجب أن يكون نصاً',
    })
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      // Accept ISO date format (YYYY-MM-DD) from HTML5 date input
      return /^\d{4}-\d{2}-\d{2}$/.test(val);
    }, 'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'),
  
  meetingClassification1: z
    .string({
      required_error: 'تصنيف الاجتماع مطلوب',
      invalid_type_error: 'تصنيف الاجتماع يجب أن يكون نصاً',
    })
    .min(1, 'تصنيف الاجتماع مطلوب'),
  
  meetingClassification2: z
    .string({
      required_error: 'تصنيف الاجتماع مطلوب',
      invalid_type_error: 'تصنيف الاجتماع يجب أن يكون نصاً',
    })
    .min(1, 'تصنيف الاجتماع مطلوب'),
  
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
  meetingGoals: z.array(z.object({
    id: z.string(),
    goal: z.string().min(1, 'الهدف مطلوب'),
  })).optional().default([]),

  meetingAgenda: z.array(z.object({
    id: z.string(),
    agenda: z.string().optional(),
    duration: z.string().optional(),
  })).optional().default([]),

  ministerSupport: z.array(z.object({
    id: z.string(),
    support: z.string().min(1, 'الدعم مطلوب'),
  })).optional().default([]),

  relatedDirectives: z.array(z.object({
    id: z.string(),
    directive: z.string().optional(),
    previousMeeting: z.string().optional(),
    directiveDate: z.string().optional(),
    directiveStatus: z.string().optional(),
    dueDate: z.string().optional(),
    responsible: z.string().optional(),
  })).optional().default([]),

  // Toggle and date
  wasDiscussedPreviously: z.boolean().optional().default(false),
  previousMeetingDate: z
    .string({
      invalid_type_error: 'تاريخ الاجتماع السابق يجب أن يكون نصاً',
    })
    .optional()
    .or(z.literal('')),

  // Notes
  notes: z
    .string({
      invalid_type_error: 'الملاحظات يجب أن تكون نصاً',
    })
    .optional()
    .or(z.literal('')),
});

export type Step1FormData = z.infer<typeof step1Schema>;
