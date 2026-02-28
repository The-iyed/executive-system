import { z } from 'zod';


const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const optionalFile = z.instanceof(File).optional().nullable();

const fileSchema = z
  .instanceof(File, { message: 'الملف مطلوب' })
  .refine((f) => f.size <= MAX_FILE_SIZE, 'حجم الملف يتجاوز 20 ميجابايت')
  .refine(
    (f) =>
      ACCEPTED_FILE_TYPES.includes(f.type) ||
      ACCEPTED_EXT.some((e) => f.name.toLowerCase().endsWith(e)),
    'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL'
  );

const fileArraySchema = z
  .array(fileSchema)
  .optional()
  .default([])
  .refine(
    (arr) => arr.every((f) => f.size <= MAX_FILE_SIZE),
    'يجب أن يكون حجم جميع الملفات أقل من 20 ميجابايت'
  );

export interface Step2ValidationContext {
  is_urgent: boolean;
  meeting_time_difference_hours: number | null;
  max_allowed_hours_without_presentation: number;
  requirePresentationRequired?: boolean;
}

export const step2BaseSchema = z.object({
  presentation_file: optionalFile,
  presentation_required: z.boolean().optional().nullable(),
  optional_attachments: fileArraySchema,
});

export type Step2FormData = z.infer<typeof step2BaseSchema>;

export const step2Schema = step2BaseSchema;

function step2Refine(
  data: Step2FormData,
  ctx: z.RefinementCtx,
  validationContext: Step2ValidationContext
) {
  const { is_urgent, meeting_time_difference_hours, max_allowed_hours_without_presentation } =
    validationContext;
  const hasPresentationFile =
    data.presentation_file != null &&
    data.presentation_file !== undefined &&
    (data.presentation_file instanceof File ? data.presentation_file.size > 0 : true);

  if (hasPresentationFile) return;
  if (validationContext.requirePresentationRequired === false) return;

  const timeExceedsThreshold =
    meeting_time_difference_hours != null &&
    meeting_time_difference_hours > max_allowed_hours_without_presentation;
  const requiresPresentationRequired = is_urgent || timeExceedsThreshold;

  if (!requiresPresentationRequired) return;

  if (data.presentation_required === undefined || data.presentation_required === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'يجب تحديد ما إذا كان العرض التقديمي مطلوباً عند عدم رفع ملف',
      path: ['presentation_required'],
    });
    return;
  }
  if (data.presentation_required !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'في هذه الحالة (اجتماع عاجل أو موعد قريب) يجب اختيار "نعم" للعرض التقديمي المطلوب إن لم يتم رفع ملف',
      path: ['presentation_required'],
    });
  }
}

export function getStep2ValidationSchema(validationContext: Step2ValidationContext) {
  return step2BaseSchema.superRefine((data, ctx) => {
    step2Refine(data, ctx, validationContext);
  });
}

export function validateStep2(
  data: Partial<Step2FormData>,
  context: Step2ValidationContext
): z.SafeParseReturnType<Step2FormData, Step2FormData> {
  const schema = getStep2ValidationSchema(context);
  return schema.safeParse(data) as z.SafeParseReturnType<Step2FormData, Step2FormData>;
}