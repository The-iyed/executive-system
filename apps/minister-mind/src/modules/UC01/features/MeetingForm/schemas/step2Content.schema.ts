import { z } from 'zod';

const CATEGORIES_MAKING_FILE_OPTIONAL = ['BILATERAL_MEETING', 'PRIVATE_MEETING', 'WORKSHOP'] as const;
const CONFIDENTIALITY_MAKING_FILE_OPTIONAL = 'CONFIDENTIAL' as const;

const CATEGORY_HIDING_PRESENTATION = 'DISCUSSION_WITHOUT_PRESENTATION' as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const PDF_TYPES = ['application/pdf'];
const PDF_EXTENSIONS = ['.pdf'];

const ADDITIONAL_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ADDITIONAL_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const optionalString = (invalidTypeMessage: string) =>
  z.string({ invalid_type_error: invalidTypeMessage }).optional().or(z.literal(''));

const dateSchema = (fieldName: string) =>
  optionalString(`${fieldName} يجب أن يكون نصاً`).refine(
    (val) => !val || val === '' || DATE_PATTERN.test(val),
    'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
  );

const requiredDateSchema = (fieldName: string) =>
  z.string({ required_error: `${fieldName} مطلوب` }).refine(
    (val) => val && val !== '' && DATE_PATTERN.test(val),
    'تاريخ غير صحيح. يرجى إدخال تاريخ صالح'
  );

const presentationFileSchema = z
  .instanceof(File, { message: 'الملف مطلوب' })
  .refine((file) => file.size <= MAX_FILE_SIZE, 'حجم الملف يتجاوز 20 ميجابايت')
  .refine(
    (file) =>
      PDF_TYPES.includes(file.type) || PDF_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    'يجب رفع ملف PDF فقط'
  );

const additionalFileSchema = z
  .instanceof(File, { message: 'الملف مطلوب' })
  .refine((file) => file.size <= MAX_FILE_SIZE, 'حجم الملف يتجاوز 20 ميجابايت')
  .refine(
    (file) =>
      ADDITIONAL_FILE_TYPES.includes(file.type) ||
      ADDITIONAL_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL'
  );

const existingFileSchema = z.object({
  id: z.string(),
  file_name: z.string(),
  blob_url: z.string(),
  file_size: z.number().optional(),
  file_type: z.string().optional(),
});

export const step2ContentBaseSchema = z.object({
  presentation_files: z.array(z.instanceof(File)).optional().default([]),
  presentation_attachment_timing: z.string().optional().or(z.literal('')),
  additional_files: z.array(z.instanceof(File)).optional().default([]),
  existingFiles: z.array(existingFileSchema).optional().default([]),
  existingAdditionalFiles: z.array(existingFileSchema).optional().default([]),
  deleted_attachment_ids: z.array(z.string()).optional().default([]),
});

export type Step2ContentFormData = z.infer<typeof step2ContentBaseSchema>;

export interface Step2ContentSchemaOptions {
  meetingCategory?: string;
  meetingConfidentiality?: string;
  isUrgent?: boolean;
}

export const isPresentationHidden = (opts?: Step2ContentSchemaOptions): boolean => {
  return opts?.meetingCategory === CATEGORY_HIDING_PRESENTATION;
};

export const isPresentationRequired = (opts?: Step2ContentSchemaOptions): boolean => {
  if (isPresentationHidden(opts)) return false;
  const isFileOptional =
    (opts?.meetingCategory && (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(opts.meetingCategory)) ||
    opts?.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL ||
    opts?.isUrgent === true;
  return !isFileOptional;
};

export const isAttachmentTimingRequired = (opts?: Step2ContentSchemaOptions): boolean => {
  return opts?.isUrgent === true;
};

export const isAttachmentTimingVisible = (opts?: Step2ContentSchemaOptions): boolean => {
  return opts?.isUrgent === true;
};

export const createStep2ContentSchema = (opts?: Step2ContentSchemaOptions) => {
  const hidden = isPresentationHidden(opts);
  const fileOptional = !hidden && (
    (opts?.meetingCategory && (CATEGORIES_MAKING_FILE_OPTIONAL as readonly string[]).includes(opts.meetingCategory)) ||
    opts?.meetingConfidentiality === CONFIDENTIALITY_MAKING_FILE_OPTIONAL ||
    opts?.isUrgent === true
  );
  const attachmentTimingRequired = isAttachmentTimingRequired(opts);

  return step2ContentBaseSchema.extend({
    presentation_files: hidden
      ? z.array(presentationFileSchema).optional().default([])
      : fileOptional
        ? z.array(presentationFileSchema).optional().default([])
        : z.array(presentationFileSchema).min(1, 'يجب رفع ملف عرض تقديمي واحد على الأقل (PDF)'),
    presentation_attachment_timing: attachmentTimingRequired
      ? requiredDateSchema('متى سيتم إرفاق العرض؟')
      : dateSchema('متى سيتم إرفاق العرض؟'),
    additional_files: z.array(additionalFileSchema).optional().default([]),
  });
};
