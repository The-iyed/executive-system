import React from 'react';
import type { MeetingApiResponse } from '@/modules/shared/types/meeting';
import { formatDateArabic } from '@/modules/shared/utils';
import {
  MeetingType,
  MeetingTypeLabels,
  MeetingClassificationType,
  MeetingClassificationTypeLabels,
  MeetingClassification,
  MeetingClassificationLabels,
  MeetingConfidentiality,
  MeetingConfidentialityLabels,
  SectorLabels,
  Sector,
} from '@/modules/shared/types';

const labelClass = 'text-sm font-medium text-gray-700 text-[#344054]';
const valueClass = 'w-full min-h-[25.9px] py-[5.89px] px-[8.24px] flex items-center bg-gray-50 border border-[#D0D5DD] rounded-[4.71px] text-right text-[#667085]';
const fontStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

interface MeetingPreviewTabProps {
  meeting: MeetingApiResponse;
}

function getMeetingOwnerLabel(meeting: MeetingApiResponse): string {
  const ownerName = meeting.meeting_owner_name;
  if (ownerName) return ownerName;
  const raw = meeting.meeting_owner;
  if (!raw) return '-';
  if (typeof raw === 'string') return raw;
  return raw.name ?? raw.username ?? '-';
}

export const MeetingPreviewTab: React.FC<MeetingPreviewTabProps> = ({ meeting }) => {
  const meetingTypeLabel = MeetingTypeLabels[meeting.meeting_type as MeetingType] || meeting.meeting_type;
  const classificationTypeLabel = MeetingClassificationTypeLabels[meeting.meeting_classification_type as MeetingClassificationType] || meeting.meeting_classification_type;
  const classificationLabel = MeetingClassificationLabels[meeting.meeting_classification as MeetingClassification] || meeting.meeting_classification;
  const confidentialityLabel = MeetingConfidentialityLabels[meeting.meeting_confidentiality as MeetingConfidentiality] || meeting.meeting_confidentiality;
  const meetingOwnerName = getMeetingOwnerLabel(meeting);

  return (
    <div className="flex flex-col gap-[14px] items-end w-full" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[15px] gap-y-[14px] w-full">
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>مالك الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{meetingOwnerName}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>عنوان الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{meeting.meeting_title || '-'}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>وصف الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{meeting.description || '-'}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>القطاع</label>
          <div className={valueClass} style={fontStyle}>{SectorLabels[meeting.sector as Sector] || '-'}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>نوع الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{meetingTypeLabel}</div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={fontStyle}>السبب</label>
          <div className="w-full min-h-11 px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right resize-none" style={fontStyle}>
            {meeting.meeting_justification || '-'}
          </div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>فئة الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{classificationLabel}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>موضوع التكليف المرتبط</label>
          <div className={valueClass} style={fontStyle}>{meeting.related_topic ?? '-'}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>تاريخ الاستحقاق</label>
          <div className={valueClass} style={fontStyle}>
            {meeting.deadline ? formatDateArabic(meeting.deadline) : '-'}
          </div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>تصنيف الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{classificationTypeLabel}</div>
        </div>
        <div className="flex flex-col gap-[3.53px]">
          <label className={labelClass} style={fontStyle}>سريّة الاجتماع</label>
          <div className={valueClass} style={fontStyle}>{confidentialityLabel}</div>
        </div>
      </div>
        <div className="flex flex-col w-full">
          <label className="text-sm font-medium text-gray-700 text-right" style={fontStyle}>
            ملاحظات
          </label>
          <div
            className="w-full min-h-[100px] px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right resize-none"
            style={fontStyle}
          >
            {meeting.note ?? '-'}
          </div>
        </div>

      {/* الأهداف */}
      <div className="flex flex-col gap-[10px] w-full">
        <h3 className="text-right text-[12.69px] leading-[19px] text-[#101828]" style={fontStyle}>الأهداف</h3>
        {meeting.objectives && meeting.objectives.length > 0 ? (
          <div className="border border-[#EAECF0] rounded-[11.38px] overflow-hidden bg-white">
            <ul className="list-none p-4 space-y-2 text-right text-sm text-[#475467]" style={fontStyle}>
              {meeting.objectives.map((obj, i) => (
                <li key={obj.id || i}>{obj.objective}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="w-full min-h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right text-[#667085]" style={fontStyle}>
            لا توجد أهداف محددة
          </div>
        )}
      </div>

      {/* أجندة الاجتماع */}
      <div className="flex flex-col gap-[10px] w-full">
        <h3 className="text-right text-[12.69px] leading-[38px] text-[#101828]" style={fontStyle}>أجندة الاجتماع</h3>
        {meeting.agenda_items && meeting.agenda_items.length > 0 ? (
          <div className="border border-[#EAECF0] rounded-[11.38px] overflow-hidden bg-white">
            <ul className="list-none p-4 space-y-2 text-right text-sm text-[#475467]" style={fontStyle}>
              {meeting.agenda_items.map((item, i) => (
                <li key={item.id || i}>{item.agenda_item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="w-full min-h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right text-[#667085]" style={fontStyle}>
            لا توجد بنود محددة
          </div>
        )}
      </div>
    </div>
  );
};
