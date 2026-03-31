import { z } from "zod";
import { MINISTER_SUPPORT_OTHER_VALUE } from "./types/enums";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const fileValidator = (acceptLabel: string, acceptExts: string[]) =>
  z.custom<File>()
    .refine((f) => f instanceof File, "ملف غير صالح")
    .refine((f) => f.size <= MAX_FILE_SIZE, "الحد الأقصى لحجم الملف 20 ميغابايت")
    .refine(
      (f) => acceptExts.some((ext) => f.name.toLowerCase().endsWith(ext)),
      `الملفات المقبولة: ${acceptLabel}`
    );

export const pdfFile = fileValidator("PDF", [".pdf"]);
export const docFile = fileValidator("PDF, Word, Excel", [".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

/* ─── Shared Agenda Item Schema ─── */

export const agendaItemSchema = z.object({
  agenda_item: z.string().default(""),
  presentation_duration_minutes: z.union([z.number(), z.string()])
    .transform((val): number | undefined => {
      if (val === "" || val == null) return undefined;
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    })
    .pipe(
      z.number({ required_error: "المدة مطلوبة", invalid_type_error: "يرجى إدخال رقم صحيح" })
        .int("يرجى إدخال رقم صحيح")
        .min(5, "المدة يجب أن تكون 5 دقائق أو أكثر")
    ),
  minister_support_type: z.string().default(""),
  minister_support_other: z.string().optional(),
});

/* ─── Step 2 Schema (shared across submitter & scheduler) ─── */

export const step2Schema = z.object({
  presentation_files: z.array(pdfFile).default([]),
  additional_files: z.array(docFile).default([]),
});

export type Step2FormValues = z.infer<typeof step2Schema>;

/* ─── Agenda Validation Helpers ─── */

/** Validate individual agenda items (reusable in superRefine) */
export function validateAgendaItems(
  items: z.infer<typeof agendaItemSchema>[],
  ctx: z.RefinementCtx,
) {
  items.forEach((item, i) => {
    if (!item.agenda_item || item.agenda_item.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["agenda_items", i, "agenda_item"], message: "عنوان العنصر مطلوب" });
    }
    if (!item.minister_support_type || item.minister_support_type.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["agenda_items", i, "minister_support_type"], message: "نوع الدعم مطلوب" });
    }
    if (item.minister_support_type === MINISTER_SUPPORT_OTHER_VALUE && !item.minister_support_other) {
      ctx.addIssue({ code: "custom", path: ["agenda_items", i, "minister_support_other"], message: "يرجى تحديد نوع الدعم" });
    }
  });
}

/** Validate agenda total duration matches meeting duration */
export function validateAgendaDuration(
  items: z.infer<typeof agendaItemSchema>[],
  startDate: string | undefined,
  endDate: string | undefined,
  ctx: z.RefinementCtx,
) {
  if (startDate && endDate && items.length > 0) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const meetingDuration = Math.round((end.getTime() - start.getTime()) / 60000);
    if (meetingDuration > 0) {
      const totalAgenda = items.reduce((sum, item) => sum + (Number(item.presentation_duration_minutes) || 0), 0);
      if (totalAgenda !== meetingDuration) {
        ctx.addIssue({
          code: "custom",
          path: ["agenda_items"],
          message: `مجموع مدة عناصر الأجندة (${totalAgenda} دقيقة) يجب أن يساوي مدة الاجتماع (${meetingDuration} دقيقة)`,
        });
      }
    }
  }
}
