import { z } from "zod";
import { MeetingType, AttendanceMechanism, MeetingClassification, MeetingLocation, BOOL, MeetingNature, MeetingConfidentiality } from "../shared/types/enums";
import { agendaItemSchema, validateAgendaItems, validateAgendaDuration } from "../shared/schema";

const meetingUserSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  givenName: z.string().optional(),
  mail: z.string().optional(),
  objectGUID: z.string().optional(),
}).passthrough();

export const schedulerStep1Schema = z.object({
  meeting_nature: z.enum(
    [MeetingNature.NORMAL, MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC] as [string, ...string[]],
    { required_error: "طبيعة الاجتماع مطلوبة", invalid_type_error: "طبيعة الاجتماع غير صالحة" }
  ) as z.ZodType<MeetingNature>,
  previous_meeting_id: z.string().optional(),
  group_id: z.number().nullable().optional(),
  prev_ext_original_title: z.string().nullable().optional(),
  prev_ext_meeting_title: z.string().nullable().optional(),
  submitter: meetingUserSchema.nullable().superRefine((v, ctx) => {
    if (!v) ctx.addIssue({ code: "custom", message: "مقدّم الطلب مطلوب" });
  }),
  meeting_owner: meetingUserSchema.nullable().optional(),
  meeting_title: z.string().min(1, "عنوان الاجتماع مطلوب").max(200, "الحد الأقصى 200 حرف"),
  meeting_subject: z.string().optional(),
  description: z.string().max(2000, "الحد الأقصى 2000 حرف").optional(),
  sector: z.string().optional(),
  meeting_type: z.nativeEnum(MeetingType).optional(),
  is_urgent: z.enum([BOOL.TRUE, BOOL.FALSE]),
  urgent_reason: z.string().optional(),
  meeting_start_date: z.string().optional(),
  meeting_end_date: z.string().optional(),
  meeting_channel: z.nativeEnum(AttendanceMechanism, { required_error: "آلية الانعقاد مطلوبة" }),
  meeting_location: z.string().optional(),
  meeting_location_custom: z.string().optional(),
  requires_protocol: z.enum([BOOL.TRUE, BOOL.FALSE]),
  meeting_classification: z.string().optional(),
  meeting_sub_category: z.string().optional(),
  meeting_justification: z.string().optional(),
  related_topic: z.string().optional(),
  deadline: z.string().optional(),
  meeting_classification_type: z.string().optional(),
  meeting_confidentiality: z.nativeEnum(MeetingConfidentiality).optional(),
  is_on_behalf_of: z.enum([BOOL.TRUE, BOOL.FALSE]).default(BOOL.TRUE),
  agenda_items: z.array(agendaItemSchema).default([]),
  note: z.string().max(1000, "الحد الأقصى 1000 حرف").optional(),
  related_directive: z.string().optional(),
  is_data_complete: z.enum([BOOL.TRUE, BOOL.FALSE]),
}).superRefine((data, ctx) => {
  if ([MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC].includes(data.meeting_nature) && !data.previous_meeting_id) {
    ctx.addIssue({ code: "custom", path: ["previous_meeting_id"], message: "الاجتماع السابق مطلوب" });
  }
  if (data.is_on_behalf_of === BOOL.TRUE && !data.meeting_owner) {
    ctx.addIssue({ code: "custom", path: ["meeting_owner"], message: "يرجى تحديد مالك الاجتماع" });
  }
  if ([AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(data.meeting_channel) && !data.meeting_location) {
    ctx.addIssue({ code: "custom", path: ["meeting_location"], message: "الموقع مطلوب للاجتماع الحضوري" });
  }
  if ([AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(data.meeting_channel) && data.meeting_location === MeetingLocation.OTHER && !data.meeting_location_custom) {
    ctx.addIssue({ code: "custom", path: ["meeting_location_custom"], message: "يرجى تحديد الموقع" });
  }
  if (data.agenda_items?.length > 0) validateAgendaItems(data.agenda_items, ctx);
  validateAgendaDuration(data.agenda_items ?? [], data.meeting_start_date, data.meeting_end_date, ctx);
});

export type SchedulerStep1Values = z.infer<typeof schedulerStep1Schema>;
