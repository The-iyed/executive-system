import type { PreviousMeetingSummary } from '../types/step1.types';
import type { Step1FormData } from '../schemas/step1.schema';

/** Placeholder: replace with real API when backend endpoint is available */
export async function getPreviousMeetingById(
  _meetingId: string
): Promise<PreviousMeetingSummary | null> {
  // TODO: call e.g. GET /api/meeting-requests/:id or GET /api/meetings/:id
  return null;
}

export function mapPreviousMeetingToFormData(
  previous: PreviousMeetingSummary
): Partial<Step1FormData> {
  return {
    meetingSubject: previous.meeting_title ?? previous.meeting_subject ?? '',
    meetingSubjectOptional: previous.meeting_subject ?? '',
    sector: previous.sector ?? '',
    meetingType: previous.meeting_type ?? '',
    meetingCategory: previous.meeting_category ?? '',
    meetingClassification1: previous.meeting_classification ?? '',
    meetingConfidentiality: previous.meeting_confidentiality ?? '',
    requester: previous.submitter_id
      ? { value: previous.submitter_id, label: '' }
      : undefined,
  };
}
