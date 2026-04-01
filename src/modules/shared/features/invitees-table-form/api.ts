import { axiosInstance, toError } from "@/modules/shared/features/meeting-request-form/api/config";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SuggestMeetingAttendeesPayload {
  meeting_subject: string;
  meeting_category: string;
  meeting_justification: string;
  related_topic: string;
  meeting_classification: string;
  meeting_agenda: string;
}

/** Scores returned by the suggest API; when all zeros, the backend is not populating them yet. */
export interface SuggestionScores {
  experienceScore: number;
  skillsMatch: number;
  educationScore: number;
  overallScore: number;
}

export interface SuggestedAttendee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_description: string;
  position_name: string;
  department_name: string;
  department_type: string;
  suggestion_reason: string;
  importance_level: string;
  name_ar?: string;
  name_en?: string;
  /** Optional scores from the API (camelCase). API may send snake_case; we normalize in the hook. */
  scores?: SuggestionScores;
}

export interface SuggestMeetingAttendeesResponse {
  suggestions: SuggestedAttendee[];
}

export interface UseSuggestMeetingAttendeesParams {
  meeting: {
    meeting_subject?: string;
    meeting_type?: string;
    meeting_classification?: string;
    meeting_justification?: string;
    related_topic?: string | null;
    agenda_items?: {
      agenda_item?: string;
      presentation_duration_minutes?: number;
      minister_support_type?: string;
      minister_support_other?: string;
  }[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function buildSuggestionPayload(
  meeting: UseSuggestMeetingAttendeesParams["meeting"],
): SuggestMeetingAttendeesPayload {
  return {
    meeting_subject: meeting.meeting_subject || "",
    meeting_category: meeting.meeting_type || "",
    meeting_justification: meeting.meeting_justification || "",
    related_topic: meeting.related_topic || "",
    meeting_classification: meeting.meeting_classification || "",
    meeting_agenda: (meeting.agenda_items || []).map((i) => i.agenda_item).join("; "),
  };
}

function normalizeScores(raw: Record<string, unknown> | undefined): SuggestionScores | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return {
    experienceScore: Number(raw.experienceScore ?? raw.experience_score ?? 0),
    skillsMatch: Number(raw.skillsMatch ?? raw.skills_match ?? 0),
    educationScore: Number(raw.educationScore ?? raw.education_score ?? 0),
    overallScore: Number(raw.overallScore ?? raw.overall_score ?? 0),
  };
}

// ── API function ─────────────────────────────────────────────────────────────

export async function suggestMeetingAttendees(
  count: number,
  meeting: UseSuggestMeetingAttendeesParams["meeting"],
): Promise<SuggestMeetingAttendeesResponse> {
  try {
    const { data } = await axiosInstance.post(
      "/api/v1/meeting-suggestions/suggest",
      buildSuggestionPayload(meeting),
      {
        params: {
          max_suggestions: count,
        },
      },
    );

    const rawSuggestions: Record<string, unknown>[] =
      data?.suggestions ?? (Array.isArray(data) ? data : []);

    const suggestions: SuggestedAttendee[] = rawSuggestions.map((s) => ({
      ...(s as unknown as SuggestedAttendee),
      scores: normalizeScores((s.scores ?? s) as Record<string, unknown>),
    }));

    return { suggestions };
  } catch (err) {
    throw toError("Failed to fetch meeting attendee suggestions", err);
  }
}
