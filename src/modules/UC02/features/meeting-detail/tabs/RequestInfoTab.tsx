/**
 * Request info tab – thin wrapper around shared RequestInfo component.
 * معلومات الطلب: رقم الطلب، تاريخ الطلب، حالة الطلب، مقدم الطلب، مالك الاجتماع.
 */
import { RequestInfo, mapMeetingToRequestInfo } from '@/modules/shared/features/request-info';
import { MeetingOwnerType } from '@/modules/shared/types';
import type { MeetingApiResponse } from '../../../data/meetingsApi';

export interface RequestInfoTabProps {
  meeting: MeetingApiResponse | undefined;
  statusLabel?: string;
}

export function RequestInfoTab({ meeting }: RequestInfoTabProps) {
  const data = mapMeetingToRequestInfo(meeting);
  return <RequestInfo data={data} role={MeetingOwnerType.SCHEDULING} />;
}
