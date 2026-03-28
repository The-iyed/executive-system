import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import { getWaitingList, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { mapMeetingToCardData } from '../../utils/meetingMapper';
import { PATH } from '../../routes/paths';

const WaitingListFeature: React.FC = () => {
  const navigate = useNavigate();

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetMeetingsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getWaitingList(apiParams);
  }, []);

  return (
    <MeetingListLayout<MeetingApiResponse>
      title="قائمة الانتظار"
      description="الاطلاع على طلبات قائمة الانتظار"
      headerIcon="solar:clock-circle-bold"
      queryKey={['waiting-list', 'uc02']}
      queryFn={queryFn}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(PATH.MEETING_DETAIL.replace(':id', item.id))}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد طلبات"
    />
  );
};

export default WaitingListFeature;
