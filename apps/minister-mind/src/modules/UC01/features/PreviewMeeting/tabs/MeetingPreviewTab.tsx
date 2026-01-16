import React from 'react';
import { MeetingPreviewCard } from '../MeetingPreviewCard';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { MeetingType, MeetingTypeLabels, MeetingClassificationType, MeetingClassificationTypeLabels } from '@shared/types';

interface MeetingPreviewTabProps {
  meeting: MeetingApiResponse;
}

export const MeetingPreviewTab: React.FC<MeetingPreviewTabProps> = ({ meeting }) => {
  // Get meeting type label
  const meetingTypeLabel = MeetingTypeLabels[meeting.meeting_type as MeetingType] || meeting.meeting_type;
  
  // Get meeting classification type label
  const classificationTypeLabel = MeetingClassificationTypeLabels[meeting.meeting_classification_type as MeetingClassificationType] || meeting.meeting_classification_type;

  return (
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
  );
};
