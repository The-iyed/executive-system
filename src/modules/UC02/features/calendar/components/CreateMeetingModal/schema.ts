import { z } from "zod";
import {
  MeetingType,
  AttendanceMechanism,
  MeetingLocation,
  MeetingConfidentiality,
  BOOL,
} from "@/modules/shared/features/meeting-request-form/shared/types/enums";

/**
 * Simplified schema for calendar quick-create meeting.
 * Uses the same field names as the shared submitter schema so shared field components work.
 */
export const calendarMeetingSchema = z.object({
  meeting_title: z.string().min(1, "عنوان الاجتماع مطلوب").max(200, "الحد الأقصى 200 حرف"),
  description: z.string().max(2000, "الحد الأقصى 2000 حرف").optional(),
  meeting_type: z.nativeEnum(MeetingType, { required_error: "نوع الاجتماع مطلوب" }),
  sector: z.string().optional(),
  meeting_channel: z.nativeEnum(AttendanceMechanism, { required_error: "آلية الانعقاد مطلوبة" }),
  meeting_location: z.string().optional(),
  meeting_location_custom: z.string().optional(),
  meeting_confidentiality: z.nativeEnum(MeetingConfidentiality, { required_error: "مستوى السرية مطلوب" }),
  meeting_classification: z.string().min(1, "فئة الاجتماع مطلوبة"),
  is_urgent: z.enum([BOOL.TRUE, BOOL.FALSE]),
  urgent_reason: z.string().optional(),
  meeting_start_date: z.string().min(1, "موعد الاجتماع مطلوب"),
  meeting_end_date: z.string().min(1, "موعد نهاية الاجتماع مطلوب"),
  note: z.string().max(1000, "الحد الأقصى 1000 حرف").optional(),
}).superRefine((data, ctx) => {
  if (data.meeting_type === MeetingType.INTERNAL && !data.sector) {
    ctx.addIssue({ code: "custom", path: ["sector"], message: "القطاع مطلوب للاجتماع الداخلي" });
  }
  if ([AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(data.meeting_channel) && !data.meeting_location) {
    ctx.addIssue({ code: "custom", path: ["meeting_location"], message: "الموقع مطلوب للاجتماع الحضوري" });
  }
  if ([AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(data.meeting_channel) && data.meeting_location === MeetingLocation.OTHER && !data.meeting_location_custom) {
    ctx.addIssue({ code: "custom", path: ["meeting_location_custom"], message: "يرجى تحديد الموقع" });
  }
  if (data.is_urgent === BOOL.TRUE && !data.urgent_reason) {
    ctx.addIssue({ code: "custom", path: ["urgent_reason"], message: "سبب الاستعجال مطلوب" });
  }
  // Validate start date is in the future
  if (data.meeting_start_date) {
    const start = new Date(data.meeting_start_date).getTime();
    if (start <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["meeting_start_date"], message: "لا يمكن إنشاء اجتماع في وقت مضى" });
    }
  }
});

export type CalendarMeetingValues = z.infer<typeof calendarMeetingSchema>;
