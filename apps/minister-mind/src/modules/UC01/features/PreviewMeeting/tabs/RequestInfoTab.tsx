import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { MeetingPreviewCard } from '../MeetingPreviewCard';

interface RequestInfoTabProps {
  meeting: MeetingApiResponse;
}

export const RequestInfoTab: React.FC<RequestInfoTabProps> = ({ meeting }) => {
  const statusLabel =
    MeetingStatusLabels[meeting.status as MeetingStatus] || meeting.status;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-center">
        <MeetingPreviewCard title="رقم الطلب:">
          <div>• {meeting.request_number || 'غير محدد'}</div>
        </MeetingPreviewCard>

        <MeetingPreviewCard title="حالة الطلب:">
          <div>• {statusLabel}</div>
        </MeetingPreviewCard>
      </div>

      <div className="flex gap-4 justify-center">
        <MeetingPreviewCard title="مقدم الطلب:">
          <div>• {meeting.submitter_name || 'غير محدد'}</div>
        </MeetingPreviewCard>

        <MeetingPreviewCard title="جهة مقدم الطلب:">
          <div>• {meeting.submitter_sector || 'غير محدد'}</div>
        </MeetingPreviewCard>
      </div>
    </div>
  );
};


