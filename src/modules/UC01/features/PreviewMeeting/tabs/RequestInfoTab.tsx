import React from 'react';
import type { MeetingApiResponse } from '@/modules/shared/types/meeting';
import { MeetingStatus, MeetingStatusLabels } from '@/modules/shared/types';
import { formatDateArabic } from '@/modules/shared/utils';
const labelClass = 'text-sm font-medium text-gray-700';
const valueClass = 'w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right';
const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

interface RequestInfoTabProps {
  meeting: MeetingApiResponse;
}

export const RequestInfoTab: React.FC<RequestInfoTabProps> = ({ meeting }) => {
  const statusLabel =
    MeetingStatusLabels[meeting?.status as MeetingStatus] || meeting?.status;

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full p-[20px]">
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>رقم الطلب</label>
          <div className={valueClass} style={fontStyle}>
            {meeting?.request_number ?? '-'}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>تاريخ الطلب</label>
          <div className={valueClass} style={fontStyle}>
            {formatDateArabic((meeting as { submitted_at?: string; created_at?: string })?.submitted_at ?? (meeting as { created_at?: string })?.created_at) || '-'}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>حالة الطلب</label>
          <div className={valueClass} style={fontStyle}>
            {statusLabel}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>مقدم الطلب</label>
          <div className={valueClass} style={fontStyle}>
            {meeting?.submitter_name ?? '-'}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>مالك الاجتماع</label>
          <div className={valueClass} style={fontStyle}>
            {(meeting as { meeting_owner_name?: string })?.meeting_owner_name ?? (typeof meeting?.meeting_owner === 'object' && meeting?.meeting_owner ? (meeting.meeting_owner.name ?? meeting.meeting_owner.username ?? '-') : (meeting?.meeting_owner ?? '-'))}
          </div>
        </div>
      </div>
    </div>
  );
};
