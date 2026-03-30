import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import {
  getAssignedContentRequests,
  type ContentRequestApiResponse,
  type GetContentRequestsParams,
} from '../data/contentApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { trackEvent } from '@/lib/analytics';

const ContentRequests: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('UC-05', 'uc05_content_requests_viewed');
  }, []);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetContentRequestsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getAssignedContentRequests(apiParams);
  }, []);

  return (
    <MeetingListLayout<ContentRequestApiResponse>
      title="تقييم المحتوى وإضافة التوجيهات"
      description="يمكنك تقييم المحتوى وإضافة التوجيهات"
      headerIcon="solar:document-text-bold"
      queryKey={['content-requests', 'uc05']}
      queryFn={queryFn}
      mapToCard={mapContentRequestToCardViewData}
      onCardClick={(item) => navigate(`/content-request/${item.id}`)}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد طلبات"
    />
  );
};

export default ContentRequests;
