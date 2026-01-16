import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMeetingById } from '../../../UC02/data/meetingsApi';
import { MeetingPreviewCard } from './MeetingPreviewCard';
import { GoBackHeader, EditButton } from '../../components';
import { MeetingStatus, MeetingStatusLabels, MeetingType, MeetingTypeLabels, MeetingClassificationType, MeetingClassificationTypeLabels } from '@shared/types';
import { PATH } from '../../routes/paths';

const PreviewMeeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch meeting data using React Query
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id, 'preview'],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  // Get status label
  const statusLabel = MeetingStatusLabels[meeting.status as MeetingStatus] || meeting.status;
  
  // Get meeting type label
  const meetingTypeLabel = MeetingTypeLabels[meeting.meeting_type as MeetingType] || meeting.meeting_type;
  
  // Get meeting classification type label
  const classificationTypeLabel = MeetingClassificationTypeLabels[meeting.meeting_classification_type as MeetingClassificationType] || meeting.meeting_classification_type;

  // Handle navigation back to meetings list
  const handleBack = () => {
    navigate(PATH.MEETINGS);
  };

  // Handle edit button click
  const handleEdit = () => {
    navigate(PATH.MEETING_DETAIL.replace(':id', id!));
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll pb-15">
        <div className="w-full flex items-center justify-between mb-8">
          <GoBackHeader
            title={`عرض الطلب (${meeting?.request_number})`}
            status={meeting.status}
            statusLabel={statusLabel}
            onBack={handleBack}
          />
          <EditButton onClick={handleEdit} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 justify-center">
            <MeetingPreviewCard title="عنوان الاجتماع:">
              <div>• {meeting.meeting_title || 'غير محدد'}</div>
            </MeetingPreviewCard>
            
            <MeetingPreviewCard title="نوع الاجتماع:">
              <div>• {meetingTypeLabel}</div>
            </MeetingPreviewCard>
            
            <MeetingPreviewCard title="تصنيف الاجتماع:">
              <div>• {classificationTypeLabel}</div>
            </MeetingPreviewCard>
          </div>
          <div className="flex gap-4 justify-center">
            <MeetingPreviewCard title="موضوع الاجتماع:">
              <div>• {meeting.meeting_subject || 'غير محدد'}</div>
            </MeetingPreviewCard>
          </div>

          <div className="flex gap-6 justify-center">
            <MeetingPreviewCard title="الأهداف:">
              {meeting.objectives && meeting.objectives.length > 0 ? (
                <ul className="list-none space-y-1">
                  {meeting.objectives.map((objective, index) => (
                    <li key={objective.id || index}>• {objective.objective}</li>
                  ))}
                </ul>
              ) : (
                <div>• لا توجد أهداف محددة</div>
              )}
            </MeetingPreviewCard>
            
            <MeetingPreviewCard title="بنود الأجندة:">
              {meeting.agenda_items && meeting.agenda_items.length > 0 ? (
                <ul className="list-none space-y-1">
                  {meeting.agenda_items.map((item, index) => (
                    <li key={item.id || index}>
                      • {item.agenda_item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div>• لا توجد بنود محددة</div>
              )}
            </MeetingPreviewCard>
          </div>
        </div>
      </div>
    </div> 
  );
};

export default PreviewMeeting;