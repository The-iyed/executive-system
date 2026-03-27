import React from 'react';
import type { MeetingApiResponse } from '@/modules/shared/types/meeting';
import { RequestInfo, mapMeetingToRequestInfo } from '@/modules/shared/features/request-info';
import { MeetingOwnerType } from '@/modules/shared/types';

interface RequestInfoTabProps {
  meeting: MeetingApiResponse;
}

export const RequestInfoTab: React.FC<RequestInfoTabProps> = ({ meeting }) => {
  const data = mapMeetingToRequestInfo(meeting);
  return <RequestInfo data={data} role={MeetingOwnerType.SUBMITTER} />;
};
