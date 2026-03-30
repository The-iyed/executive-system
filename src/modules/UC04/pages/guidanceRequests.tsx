import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import {
  getAssignedGuidanceRequests,
  type GuidanceRequestApiResponse,
  type GetGuidanceRequestsParams,
} from '../data/guidanceApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { trackEvent } from '@/lib/analytics';

const GuidanceRequests: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('UC-04', 'uc04_guidance_requests_viewed');
  }, []);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetGuidanceRequestsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getAssignedGuidanceRequests(apiParams);
  }, []);

  return (
    <MeetingListLayout<GuidanceRequestApiResponse>
      title="طلبات التوجيه"
      description="الاطلاع على طلبات التوجيه المحالة إليك"
      headerIcon="solar:shield-check-bold"
      queryKey={['guidance-requests', 'uc04']}
      queryFn={queryFn}
      mapToCard={mapMeetingToCardData}
      onCardClick={(item) => navigate(`/guidance-request/${item.id}`)}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد بيانات"
    />
  );
};

export default GuidanceRequests;
