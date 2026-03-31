import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import {
  getAssignedConsultationRequests,
  type ConsultationRequestApiResponse,
  type GetConsultationRequestsParams,
} from '../data/consultationsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { trackEvent } from '@/lib/analytics';

const ConsultationRequests: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('UC-03', 'uc03_consultation_requests_viewed');
  }, []);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetConsultationRequestsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getAssignedConsultationRequests(apiParams);
  }, []);

  return (
    <MeetingListLayout<ConsultationRequestApiResponse>
      title="طلبات الاستشارات"
      description="يمكنك تقديم الاستشارات للطلبات المحالة إليك"
      headerIcon="solar:chat-round-check-bold"
      queryKey={['consultation-requests', 'uc03']}
      queryFn={queryFn}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(`/consultation-request/${item.id}`)}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد طلبات"
    />
  );
};

export default ConsultationRequests;
