import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import {
  getAssignedContentConsultationRequests,
  type ContentConsultationRequestApiResponse,
  type GetContentConsultationRequestsParams,
} from '../data/contentConsultantApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';

const ContentConsultationRequests: React.FC = () => {
  const navigate = useNavigate();

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetContentConsultationRequestsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    return getAssignedContentConsultationRequests(apiParams);
  }, []);

  return (
    <MeetingListLayout<ContentConsultationRequestApiResponse>
      title="تقديم استشارة المحتوى"
      description="يمكنك تقديم استشارة المحتوى للطلبات المحالة إليك"
      headerIcon="solar:chat-round-check-bold"
      queryKey={['content-consultation-requests', 'uc06']}
      queryFn={queryFn}
      mapToCard={mapContentConsultationRequestToCardData}
      onCardClick={(item) => navigate(`/content-consultation-request/${item.id}`)}
      searchPlaceholder="بحث في الطلبات..."
      emptyMessage="لا توجد طلبات"
    />
  );
};

export default ContentConsultationRequests;
