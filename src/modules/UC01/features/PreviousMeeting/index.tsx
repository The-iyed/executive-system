import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toISOStringWithTimezone } from '@/lib/ui';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import { MeetingStatus } from '@/modules/shared/types';
import { getMeetings, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { PATH } from '../../routes/paths';

const PreviousMeeting: React.FC = () => {
  const navigate = useNavigate();

  const fixedParams = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return {
      status: MeetingStatus.CLOSED,
      date_now: toISOStringWithTimezone(d),
    };
  }, []);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetMeetingsParams = {
      skip: params.skip,
      limit: params.limit,
      status: params.status,
      date_now: params.date_now,
    };
    if (params.search) apiParams.search = params.search;
    return getMeetings(apiParams);
  }, []);

  return (
    <MeetingListLayout<MeetingApiResponse>
      title="الاجتماعات السابقة"
      description="الاطلاع على الاجتماعات السابقة"
      headerIcon="solar:calendar-bold"
      queryKey={['meetings', 'uc01', 'previous']}
      queryFn={queryFn}
      fixedParams={fixedParams}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(PATH.MEETING_PREVIEW.replace(':id', item.id))}
      searchPlaceholder="بحث..."
      emptyMessage="لا توجد بيانات"
    />
  );
};

export default PreviousMeeting;
