import { z } from "zod";
import {
  MeetingType,
  AttendanceMechanism,
  MeetingClassification,
  MeetingLocation,
  MeetingConfidentiality,
  BOOL,
  MeetingNature,
} from "../shared/types/enums";
import { agendaItemSchema, validateAgendaItems, validateAgendaDuration } from "../shared/schema";

/* ─── Submitter Step 1 Schema ─── */

const meetingUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  givenName: z.string().optional(),
  mail: z.string().optional(),
  objectGUID: z.string().optional(),
}).passthrough();

export const submitterStep1Schema = z.object({
  meeting_nature: z.enum(
    [MeetingNature.NORMAL, MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC] as [string, ...string[]],
    { required_error: "طبيعة الاجتماع مطلوبة", invalid_type_error: "طبيعة الاجتماع غير صالحة" }
  ) as z.ZodType<MeetingNature>,
  previous_meeting_id: z.string().optional(),
  group_id: z.number().nullable().optional(),
  prev_ext_original_title: z.string().nullable().optional(),
  prev_ext_meeting_title: z.string().nullable().optional(),
  meeting_title: z.string().min(1, "عنوان الاجتماع مطلوب").max(200, "الحد الأقصى 200 حرف"),
  meeting_subject: z.string().optional(),
  description: z.string().max(2000, "الحد الأقصى 2000 حرف").optional(),
  meeting_type: z.nativeEnum(MeetingType, { required_error: "نوع الاجتماع مطلوب" }),
  sector: z.string().optional(),
  meeting_classification: z.string().min(1, "فئة الاجتماع مطلوبة"),
  meeting_sub_category: z.string().optional(),
  meeting_justification: z.string().optional(),
  related_topic: z.string().optional(),
  deadline: z.string().optional(),
  meeting_classification_type: z.string().optional(),
  meeting_confidentiality: z.nativeEnum(MeetingConfidentiality, { required_error: "مستوى السرية مطلوب" }),
  meeting_channel: z.nativeEnum(AttendanceMechanism, { required_error: "آلية الانعقاد مطلوبة" }),
  meeting_location: z.string().optional(),
  meeting_location_custom: z.string().optional(),
  is_urgent: z.enum([BOOL.TRUE, BOOL.FALSE]),
  urgent_reason: z.string().optional(),
  is_on_behalf_of: z.enum([BOOL.TRUE, BOOL.FALSE]),
  meeting_owner: meetingUserSchema.nullable().optional(),
  meeting_start_date: z.string().optional(),
  meeting_end_date: z.string().optional(),
  agenda_items: z.array(agendaItemSchema).default([]),
  note: z.string().max(1000, "الحد الأقصى 1000 حرف").optional(),
  is_based_on_directive: z.enum([BOOL.TRUE, BOOL.FALSE]),
  directive_method: z.enum(["PREVIOUS_MEETING", "DIRECT_DIRECTIVE"]).optional(),
  previous_meeting_minutes_file_content: z.any().optional(),
  directive_text: z.string().optional(),
  /* ── Scheduler-only fields (optional, used when isSchedulerEdit) ── */
  submitter: meetingUserSchema.nullable().optional(),
  requires_protocol: z.enum([BOOL.TRUE, BOOL.FALSE]).optional(),
  related_directive: z.string().optional(),
  is_scheduler_edit: z.boolean().optional(),
}).superRefine((data, ctx) => {
  /* ── Conditional required ── */
  if (!data.is_scheduler_edit && data.meeting_type === MeetingType.INTERNAL && !data.sector) {
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
  if (data.is_on_behalf_of === BOOL.TRUE && !data.meeting_owner) {
    ctx.addIssue({ code: "custom", path: ["meeting_owner"], message: "يرجى تحديد مالك الاجتماع" });
  }
  if ([MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC].includes(data.meeting_nature) && !data.previous_meeting_id) {
    ctx.addIssue({ code: "custom", path: ["previous_meeting_id"], message: "الاجتماع السابق مطلوب" });
  }
  if (!data.meeting_start_date) {
    ctx.addIssue({ code: "custom", path: ["meeting_start_date"], message: "موعد الاجتماع مطلوب" });
  }
  if (!data.meeting_end_date) {
    ctx.addIssue({ code: "custom", path: ["meeting_end_date"], message: "موعد نهاية الاجتماع مطلوب" });
  }

  /* ── Agenda ── */
  const isPrivate = data.meeting_classification === MeetingClassification.PRIVATE_MEETING;
  if (!data.is_scheduler_edit && !isPrivate && (!data.agenda_items || data.agenda_items.length === 0)) {
    ctx.addIssue({ code: "custom", path: ["agenda_items"], message: "يجب إضافة عنصر أجندة واحد على الأقل" });
  }
  if (data.agenda_items?.length > 0) {
    validateAgendaItems(data.agenda_items, ctx);
  }
  validateAgendaDuration(data.agenda_items ?? [], data.meeting_start_date, data.meeting_end_date, ctx);

  /* ── Category-dependent ── */
  if ([MeetingClassification.PRIVATE_MEETING, MeetingClassification.BILATERAL_MEETING].includes(data.meeting_classification as MeetingClassification) && !data.meeting_justification) {
    ctx.addIssue({ code: "custom", path: ["meeting_justification"], message: "مبرر اللقاء مطلوب" });
  }
  if (data.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS && !data.related_topic) {
    ctx.addIssue({ code: "custom", path: ["related_topic"], message: "موضوع التكليف المرتبط مطلوب" });
  }
  if (data.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS && !data.deadline) {
    ctx.addIssue({ code: "custom", path: ["deadline"], message: "تاريخ الاستحقاق مطلوب" });
  }

  /* ── Directive (only validate children when parent is active) ── */
  if (data.is_based_on_directive === BOOL.TRUE) {
    if (!data.directive_method) {
      ctx.addIssue({ code: "custom", path: ["directive_method"], message: "طريقة التوجيه مطلوبة" });
    }
    if (data.directive_method === "PREVIOUS_MEETING" && !(data.previous_meeting_minutes_file_content instanceof File)) {
      ctx.addIssue({ code: "custom", path: ["previous_meeting_minutes_file_content"], message: "ملف المحضر مطلوب" });
    }
    if (data.directive_method === "DIRECT_DIRECTIVE" && !data.directive_text) {
      ctx.addIssue({ code: "custom", path: ["directive_text"], message: "نص التوجيه مطلوب" });
    }
  }
});

export type SubmitterStep1Values = z.infer<typeof submitterStep1Schema>;