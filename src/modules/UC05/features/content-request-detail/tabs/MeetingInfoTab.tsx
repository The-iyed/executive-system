/**
 * UC05 Meeting Info tab – uses shared MeetingInfoView.
 */
import { useMemo } from 'react';
import { MeetingInfoView, mapMeetingToInfo } from '@/modules/shared/features/meeting-info';
import type { ContentRequestDetailResponse } from '../../../data/contentApi';
import { formatRelatedGuidance, getNotesText } from '../utils';

export interface MeetingInfoTabProps {
  contentRequest: ContentRequestDetailResponse | undefined;
}

export function MeetingInfoTab({ contentRequest }: MeetingInfoTabProps) {
  const data = useMemo(() => {
    if (!contentRequest) return mapMeetingToInfo(undefined);
    const cr = contentRequest as unknown as Record<string, unknown>;
    return mapMeetingToInfo({
      is_on_behalf_of: (cr.is_on_behalf_of as boolean) ?? undefined,
      meeting_owner_name: contentRequest.current_owner_user
        ? `${contentRequest.current_owner_user.first_name ?? ''} ${contentRequest.current_owner_user.last_name ?? ''}`.trim()
        : (contentRequest.current_owner_role?.name_ar ?? undefined),
      meeting_title: contentRequest.meeting_title,
      meeting_subject: contentRequest.meeting_subject,
      sector: contentRequest.sector,
      meeting_type: contentRequest.meeting_type,
      is_urgent: contentRequest.is_direct_schedule === true,
      urgent_reason: (cr.meeting_justification as string) ?? contentRequest.meeting_justification ?? undefined,
      meeting_start_date: contentRequest.scheduled_at ?? undefined,
      meeting_channel: contentRequest.meeting_channel ?? undefined,
      meeting_location: (cr.meeting_location as string) ?? undefined,
      meeting_classification: contentRequest.meeting_classification ?? undefined,
      meeting_justification: contentRequest.meeting_justification ?? undefined,
      related_topic: contentRequest.related_topic ?? undefined,
      deadline: contentRequest.deadline ?? undefined,
      meeting_classification_type: (cr.meeting_classification_type as string) ?? undefined,
      meeting_confidentiality: (cr.meeting_confidentiality as string) ?? undefined,
      agenda_items: contentRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(contentRequest.related_directive_ids && contentRequest.related_directive_ids.length > 0),
      directive_method: (cr.directive_method as string) ?? undefined,
      related_guidance: formatRelatedGuidance(contentRequest.related_guidance),
      general_notes: getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes),
    } as any);
  }, [contentRequest]);

  return <MeetingInfoView data={data} className="px-4" />;
}
