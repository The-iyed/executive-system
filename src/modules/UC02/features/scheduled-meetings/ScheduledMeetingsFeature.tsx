import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import { MeetingStatus } from '@/modules/shared';
import { getMeetings, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { mapMeetingToCardData } from '../../utils/meetingMapper';
import { PATH } from '../../routes/paths';

const ScheduledMeetingsFeature: React.FC = () => {
  const navigate = useNavigate();

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetMeetingsParams = {
      skip: params.skip,
      limit: params.limit,
      status: MeetingStatus.CLOSED,
      owner_type: 'SCHEDULING',
    };
    if (params.search) apiParams.search = params.search;
    return getMeetings(apiParams);
  }, []);

  return (
    <MeetingListLayout<MeetingApiResponse>
      title="الاجتماعات السابقة"
      description="الاطلاع على الاجتماعات السابقة"
      headerIcon="solar:calendar-bold"
      queryKey={['scheduled-meetings', 'uc02']}
      queryFn={queryFn}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(PATH.MEETING_DETAIL.replace(':id', item.id))}
      searchPlaceholder="بحث في الاجتماعات..."
      emptyMessage="لا توجد اجتماعات"
    />
  );
};

export default ScheduledMeetingsFeature;
