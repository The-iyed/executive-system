import { formatDateStringToISO } from "@/modules/shared";
import type { Step1BasicInfoFormData } from "../schemas/step1BasicInfo.schema";
import type { Step2ContentFormData } from "../schemas/step2Content.schema";
import type { Step3InviteesFormData } from "../schemas/step3Invitees.schema";
import { DraftApiResponse } from "../../../data";
import { mapInviteesToFormData } from "./inviteeMappers";
import { getMeetingLocationDropdownValue } from './constants';

function toISOOrDateString(val: string | null | undefined): string {
  if (!val || val.trim() === '') return '';
  const d = new Date(val.trim());
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export const transformDraftToStep1Data = (draft: DraftApiResponse): Partial<Step1BasicInfoFormData> => {
    return {
      meetingSubject: draft.meeting_subject || '',
      meetingType: draft.meeting_type || '',
      meetingCategory: draft.meeting_classification || '',
      meetingReason: draft.meeting_justification || '',
      meetingDescription: draft.description || '',
      relatedTopic: draft.related_topic || '',
      dueDate: formatDateStringToISO(draft.deadline),
      meetingClassification1: draft.meeting_classification_type || '',
      meetingConfidentiality: draft.meeting_confidentiality || '',
      meetingChannel: draft.meeting_channel ?? '',
      meeting_location: draft.meeting_location ?? '',
      meeting_location_option: getMeetingLocationDropdownValue(draft.meeting_location ?? undefined, undefined),
      sector: draft.sector || '',
      meetingAgenda: draft.agenda_items?.map((item: any) => ({
        id: item.id,
        agenda_item: item.agenda_item || '',
        presentation_duration_minutes: String(item.presentation_duration_minutes ?? ''),
        minister_support_type: item.minister_support_type ?? '',
        minister_support_other: item.minister_support_other ?? '',
      })) || [],
      notes: draft?.note ?? '',
      is_urgent: draft.is_urgent ?? false,
      urgent_reason: draft.urgent_reason ?? '',
      meeting_start_date: toISOOrDateString(draft.selected_time_slot?.slot_start ?? draft.meeting_start_date) || '',
      meeting_end_date: toISOOrDateString(draft.selected_time_slot?.slot_end ?? draft.meeting_end_date) || '',
      alternative_1_start_date: toISOOrDateString(draft.alternative_time_slot_1?.slot_start ?? draft.alternative_1_start_date) || '',
      alternative_1_end_date: toISOOrDateString(draft.alternative_time_slot_1?.slot_end ?? draft.alternative_1_end_date) || '',
      alternative_2_start_date: toISOOrDateString(draft.alternative_time_slot_2?.slot_start ?? draft.alternative_2_start_date) || '',
      alternative_2_end_date: toISOOrDateString(draft.alternative_time_slot_2?.slot_end ?? draft.alternative_2_end_date) || '',
    };
};

export const transformDraftToStep2ContentData = (draft: DraftApiResponse): Partial<Step2ContentFormData> => {
    const presentationAttachments = (draft.attachments || []).filter((a) => a.is_presentation);
    const additionalAttachments = (draft.attachments || []).filter((a) => a.is_additional);
    const presentationTiming = (draft as any).presentation_attachment_timing
      ? formatDateStringToISO((draft as any).presentation_attachment_timing)
      : undefined;
    return {
      presentation_files: [],
      presentation_attachment_timing: presentationTiming ?? '',
      additional_files: [],
      existingFiles: presentationAttachments.map((att) => ({
        id: att.id,
        file_name: att.file_name,
        blob_url: att.blob_url,
        file_size: att.file_size,
        file_type: att.file_type,
      })),
      existingAdditionalFiles: additionalAttachments.map((att) => ({
        id: att.id,
        file_name: att.file_name,
        blob_url: att.blob_url,
        file_size: att.file_size,
        file_type: att.file_type,
      })),
    };
};

export const transformDraftToStep3InviteesData = (draft: DraftApiResponse): Partial<Step3InviteesFormData> => {
  return {
    invitees: mapInviteesToFormData(draft.invitees),
  };
};