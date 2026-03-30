import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import {
  getContentExceptions,
  type GuidanceRequestApiResponse,
  type GetGuidanceRequestsParams,
} from '../data/guidanceApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';

const ExceptionRequest: React.FC = () => {
  const navigate = useNavigate();

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetGuidanceRequestsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getContentExceptions(apiParams);
  }, []);

  return (
    <MeetingListLayout<GuidanceRequestApiResponse>
      title="طلبات الاستثناء"
      description="الاطلاع على طلبات استثناء المحتوى"
      headerIcon="solar:shield-check-bold"
      queryKey={['exception-requests', 'uc04']}
      queryFn={queryFn}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(`/exception-request/${item.id}`)}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد بيانات"
    />
  );
};

export default ExceptionRequest;
