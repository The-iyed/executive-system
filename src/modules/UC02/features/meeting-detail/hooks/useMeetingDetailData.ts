/**
 * Data fetching for meeting detail: meeting, consultation records, guidance records, content officer notes, previous meeting.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import {
  getMeetingById,
  getConsultationRecordsWithParams,
  getGuidanceRecords,
  getContentOfficerNotesRecords,
} from '../../../data/meetingsApi';
import type { MeetingApiResponse } from '../../../data/meetingsApi';
type ConsultationRecord = any;
type GuidanceRecord = any;
type ContentOfficerNoteRecord = any;
import { getGeneralNotesList } from '../utils/meetingDetailHelpers';

export interface UseMeetingDetailDataParams {
  meetingId: string | undefined;
  activeTab: string;
  previousMeetingId: string | null;
}

export interface UseMeetingDetailDataResult {
  meeting: MeetingApiResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  generalNotesList: ReturnType<typeof getGeneralNotesList>;
  consultationRecords: { items: ConsultationRecord[]; total: number; skip: number; limit: number; has_next: boolean; has_previous: boolean } | undefined;
  isLoadingConsultationRecords: boolean;
  guidanceRecords: { items: GuidanceRecord[]; total: number; skip: number; limit: number; has_next: boolean; has_previous: boolean } | undefined;
  isLoadingGuidanceRecords: boolean;
  contentOfficerNotesRecords: { items: ContentOfficerNoteRecord[]; total: number; skip: number; limit: number; has_next: boolean; has_previous: boolean } | undefined;
  isLoadingContentOfficerNotes: boolean;
  previousMeeting: MeetingApiResponse | undefined;
  queryClient: ReturnType<typeof useQueryClient>;
}

export function useMeetingDetailData({
  meetingId,
  activeTab,
  previousMeetingId,
}: UseMeetingDetailDataParams): UseMeetingDetailDataResult {
  const queryClient = useQueryClient();

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => getMeetingById(meetingId!),
    enabled: !!meetingId,
  });

  const generalNotesList = useMemo(
    () => getGeneralNotesList(meeting?.general_notes),
    [meeting?.general_notes]
  );

  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', meetingId, 'SCHEDULING'],
    queryFn: () => getConsultationRecordsWithParams(meetingId!, { consultation_type: 'SCHEDULING' }),
    enabled: !!meetingId && activeTab === 'scheduling-consultation',
  });

  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', meetingId],
    queryFn: () => getGuidanceRecords(meetingId!),
    enabled: !!meetingId && activeTab === 'directive',
  });

  const { data: contentOfficerNotesRecordsRaw, isLoading: isLoadingContentOfficerNotes } = useQuery({
    queryKey: ['content-officer-notes-records', meetingId, 'CONTENT'],
    queryFn: () =>
      getContentOfficerNotesRecords(meetingId!, {
        skip: 0,
        limit: 100,
        consultation_type: 'CONTENT',
      }),
    enabled: !!meetingId && activeTab === 'content-consultation',
    placeholderData: undefined,
  });

  const contentOfficerNotesRecords = useMemo(() => {
    if (activeTab !== 'content-consultation') return undefined;
    return contentOfficerNotesRecordsRaw;
  }, [activeTab, contentOfficerNotesRecordsRaw]);

  const { data: previousMeeting } = useQuery({
    queryKey: ['meeting', previousMeetingId],
    queryFn: () => getMeetingById(previousMeetingId!),
    enabled: !!previousMeetingId && !!meetingId && previousMeetingId !== meetingId,
  });

  useEffect(() => {
    if (activeTab !== 'content-consultation') {
      queryClient.removeQueries({ queryKey: ['content-officer-notes-records', meetingId, 'CONTENT'] });
    }
  }, [activeTab, meetingId, queryClient]);

  return {
    meeting,
    isLoading,
    error: error as Error | null,
    generalNotesList,
    consultationRecords,
    isLoadingConsultationRecords,
    guidanceRecords,
    isLoadingGuidanceRecords,
    contentOfficerNotesRecords,
    isLoadingContentOfficerNotes,
    previousMeeting,
    queryClient,
  };
}
