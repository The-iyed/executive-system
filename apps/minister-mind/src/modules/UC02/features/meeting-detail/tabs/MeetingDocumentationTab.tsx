/**
 * Meeting documentation tab – توثيق الاجتماع (محضر، الحضور الفعلي، التوجيهات المرتبطة).
 */
import React from 'react';
import { DataTable } from '@shared';
import type { MinisterAttendee } from '../../data/meetingsApi';

export interface MeetingDocumentationTabProps {
  meeting: {
    previous_meeting_minutes_id?: string | null;
    minister_attendees?: (MinisterAttendee & { mobile?: string; attendance_mechanism?: string; attendance_channel?: string; response_status?: string })[];
    content_approval_directives?: string[];
  } | undefined;
  previousMeetingMinutesLabel: string | null;
}

export function MeetingDocumentationTab({ meeting, previousMeetingMinutesLabel }: MeetingDocumentationTabProps) {
  const minutesLabel = meeting?.previous_meeting_minutes_id != null
    ? (previousMeetingMinutesLabel ?? (meeting as { previous_meeting_minutes_id?: string }).previous_meeting_minutes_id ?? '-')
    : '-';

  return (
    <div className="flex flex-col gap-8 w-full" dir="rtl">
      <div className="flex flex-col gap-2">
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '18px' }}>
          محضر الاجتماع
        </h2>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-right">
          {minutesLabel}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '18px' }}>
          الحضور الفعلي
        </h2>
        {meeting?.minister_attendees && meeting.minister_attendees.length > 0 ? (
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
            <DataTable
              columns={[
                { id: 'index', header: '#', width: 'w-20', align: 'center', render: (_row: MinisterAttendee, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span> },
                { id: 'external_name', header: 'الإسم', width: 'w-36', align: 'end', render: (row: MinisterAttendee & { mobile?: string; attendance_mechanism?: string; response_status?: string }) => <span className="text-sm text-[#475467]">{row.external_name || row.username || '-'}</span> },
                { id: 'external_email', header: 'البريد الإلكتروني', width: 'w-44', align: 'end', render: (row: MinisterAttendee) => <span className="text-sm text-[#475467]">{row.external_email || '-'}</span> },
                { id: 'position', header: 'المنصب', width: 'w-32', align: 'end', render: (row: MinisterAttendee) => <span className="text-sm text-[#475467]">{row.position || '-'}</span> },
                { id: 'mobile', header: 'الجوال', width: 'w-28', align: 'end', render: (row: MinisterAttendee & { mobile?: string }) => <span className="text-sm text-[#475467]">{row.mobile || '-'}</span> },
                { id: 'attendance_mechanism', header: 'آلية الحضور', width: 'w-24', align: 'center', render: (row: MinisterAttendee & { attendance_mechanism?: string }) => <span className="text-sm text-[#475467]">{row.attendance_mechanism || (row.attendance_channel === 'REMOTE' ? 'عن بعد' : row.attendance_channel === 'PHYSICAL' ? 'حضوري' : '-')}</span> },
                { id: 'response_status', header: 'حالة الرد', width: 'w-24', align: 'center', render: (row: MinisterAttendee & { response_status?: string }) => <span className="text-sm text-[#475467]">{row.response_status === 'PENDING' ? 'قيد الانتظار' : row.response_status === 'RESPONDED' ? 'تم الرد' : row.response_status || '-'}</span> },
                { id: 'access_permission', header: 'صلاحية الاطلاع', width: 'w-28', align: 'center', render: (row: MinisterAttendee) => <span className="text-sm text-[#475467]">{row.access_permission === 'FULL' ? 'كامل' : row.access_permission === 'READ_ONLY' ? 'قراءة فقط' : row.access_permission || '-'}</span> },
                { id: 'is_required', header: 'مطلوب', width: 'w-24', align: 'center', render: (row: MinisterAttendee) => <span className="text-sm text-[#475467]">{row.is_required != null ? (row.is_required ? 'نعم' : 'لا') : '-'}</span> },
                { id: 'justification', header: 'المبرر', width: 'w-40', align: 'end', render: (row: MinisterAttendee) => <span className="text-sm text-[#475467]">{row.justification || '-'}</span> },
              ]}
              data={meeting.minister_attendees}
              rowPadding="py-3"
            />
          </div>
        ) : (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">لا يوجد حضور مسجل</div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '18px' }}>
          التوجيهات المرتبطة بالاجتماع
        </h2>
        {meeting?.content_approval_directives && meeting.content_approval_directives.length > 0 ? (
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
            <DataTable
              columns={[
                { id: 'index', header: '#', width: 'w-20', align: 'center', render: (_: { text: string }, i: number) => <span className="text-sm text-[#475467]">{i + 1}</span> },
                { id: 'text', header: 'نص التوجيه', width: 'flex-1', align: 'end', render: (row: { text: string }) => <span className="text-sm text-[#475467]">{row.text}</span> },
              ]}
              data={meeting.content_approval_directives.map((text) => ({ text }))}
              rowPadding="py-3"
            />
          </div>
        ) : (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">لا توجد توجيهات مرتبطة</div>
        )}
      </div>
    </div>
  );
}
