import { useState } from 'react';

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

      // Make API call - using fetch directly without base URL as requested
      // Pass max_suggestions as a query parameter
      const url = new URL('https://invitee.builtop.com/meeting-suggestions/suggest');
      url.searchParams.append('max_suggestions', numberOfAttendees.toString());

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);
      return data;
    } catch (err: any) {
      const errorMessage = err?.message || 'حدث خطأ أثناء اقتراح المدعوين';
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
