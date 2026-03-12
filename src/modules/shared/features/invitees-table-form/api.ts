// ── Types ────────────────────────────────────────────────────────────────────

export interface SuggestMeetingAttendeesPayload {
  meeting_subject: string;
  meeting_category: string;
  meeting_justification: string;
  related_topic: string;
  meeting_classification: string;
  meeting_objective: string;
  meeting_agenda: string;
  minister_support_required: string;
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
    objectives?: Array<{ objective: string }>;
    agenda_items?: Array<{ agenda_item: string }>;
    minister_support?: Array<{ support_description: string }>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = "https://invitee.builtop.com/meeting-suggestions/suggest";

export function buildSuggestionPayload(
  meeting: UseSuggestMeetingAttendeesParams["meeting"],
): SuggestMeetingAttendeesPayload {
  return {
    meeting_subject: meeting.meeting_subject || "",
    meeting_category: meeting.meeting_type || "",
    meeting_justification: meeting.meeting_justification || "",
    related_topic: meeting.related_topic || "",
    meeting_classification: meeting.meeting_classification || "",
    meeting_objective: (meeting.objectives || []).map((o) => o.objective).join("; "),
    meeting_agenda: (meeting.agenda_items || []).map((i) => i.agenda_item).join("; "),
    minister_support_required: (meeting.minister_support || []).map((s) => s.support_description).join("; "),
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
  const url = new URL(API_URL);
  url.searchParams.append("max_suggestions", count.toString());

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSuggestionPayload(meeting)),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawSuggestions: Record<string, unknown>[] =
    data?.suggestions ?? (Array.isArray(data) ? data : []);

  const suggestions: SuggestedAttendee[] = rawSuggestions.map((s) => ({
    ...(s as unknown as SuggestedAttendee),
    scores: normalizeScores((s.scores ?? s) as Record<string, unknown>),
  }));

  return { suggestions };
}
