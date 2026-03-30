/**
 * UC05 Request Info tab – uses shared RequestInfo component.
 */
import { useMemo } from 'react';
import { RequestInfo, mapMeetingToRequestInfo } from '@/modules/shared/features/request-info';
import { MeetingOwnerType } from '@/modules/shared/types';
import type { ContentRequestDetailResponse } from '../../../data/contentApi';

export interface RequestInfoTabProps {
  contentRequest: ContentRequestDetailResponse | undefined;
}

export function RequestInfoTab({ contentRequest }: RequestInfoTabProps) {
  const data = useMemo(() => {
    if (!contentRequest) return mapMeetingToRequestInfo(undefined);
    return mapMeetingToRequestInfo({
      request_number: contentRequest.request_number,
      submitted_at: contentRequest.submitted_at,
      created_at: contentRequest.created_at,
      status: contentRequest.status,
      submitter: (contentRequest as any)?.submitter,
      submitter_name: contentRequest.submitter_name,
      meeting_owner: contentRequest.current_owner_user,
      meeting_owner_name: contentRequest.current_owner_role?.name_ar,
    });
  }, [contentRequest]);

  return <RequestInfo data={data} role={MeetingOwnerType.CONTENT} />;
}
