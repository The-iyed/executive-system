import { useState } from 'react';
import { getApiTimezoneHeaders } from '@/lib/api/apiTimezone';
import { INVITEE_SUGGESTIONS_URL } from '@/lib/env';

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

export const useSuggestMeetingAttendees = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestAttendees = async (
    numberOfAttendees: number,
    params: UseSuggestMeetingAttendeesParams
  ): Promise<SuggestMeetingAttendeesResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract and format data from meeting
      const { meeting } = params;

      // Combine objectives into a single string
      const meeting_objective = (meeting.objectives || [])
        .map((obj) => obj.objective)
        .join('; ');

      // Combine agenda items into a single string
      const meeting_agenda = (meeting.agenda_items || [])
        .map((item) => item.agenda_item)
        .join('; ');

      // Combine minister support into a single string
      const minister_support_required = (meeting.minister_support || [])
        .map((support) => support.support_description)
        .join('; ');

      const payload: SuggestMeetingAttendeesPayload = {
        meeting_subject: meeting.meeting_subject || '',
        meeting_category: meeting.meeting_type || '',
        meeting_justification: meeting.meeting_justification || '',
        related_topic: meeting.related_topic || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_objective: meeting_objective || '',
        meeting_agenda: meeting_agenda || '',
        minister_support_required: minister_support_required || '',
      };

      // Make API call - using fetch with base URL from env
      // Pass max_suggestions as a query parameter
      const url = new URL(`${INVITEE_SUGGESTIONS_URL}/meeting-suggestions/suggest`);
      url.searchParams.append('max_suggestions', numberOfAttendees.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiTimezoneHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);

      // Normalize suggestions: map snake_case scores to camelCase so UI has a consistent shape.
      // If the API returns all score values as 0, the backend (invitee.builtop.com) must compute and populate them.
      const rawSuggestions = data?.suggestions ?? (Array.isArray(data) ? data : []);
      const suggestions: SuggestedAttendee[] = rawSuggestions.map((s: any) => {
        const rawScores = s?.scores ?? s;
        const scores: SuggestionScores | undefined =
          rawScores && typeof rawScores === 'object'
            ? {
                experienceScore: Number(rawScores.experienceScore ?? rawScores.experience_score ?? 0),
                skillsMatch: Number(rawScores.skillsMatch ?? rawScores.skills_match ?? 0),
                educationScore: Number(rawScores.educationScore ?? rawScores.education_score ?? 0),
                overallScore: Number(rawScores.overallScore ?? rawScores.overall_score ?? 0),
              }
            : undefined;
        return {
          ...s,
          scores,
        };
      });

      return { ...data, suggestions };
    } catch (err: any) {
      const errorMessage = err?.message || 'حدث خطأ أثناء توليد قائمة المدعوين. يرجى المحاولة مرة أخرى لاحقاً';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  return {
    suggestAttendees,
    isLoading,
    error,
  };
};
