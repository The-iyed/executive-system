import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import {
  getInviteeResponseStatusLabel,
  getInviteeSourceLabel,
} from '@shared/types';
import { AttendanceMechanism } from '@shared/types';

const fontStyle = { fontFamily: "'Ping AR + LT', sans-serif" } as const;

/** API may return extra invitee fields */
type InviteeDisplay = MeetingApiResponse['invitees'][number] & {
  position?: string | null;
  mobile?: string | null;
  attendance_mechanism?: string | null;
};

function getAttendanceLabel(value: string | null | undefined): string {
  if (!value) return '-';
  const v = String(value).toUpperCase();
  if (v === 'PHYSICAL' || value === AttendanceMechanism.PHYSICAL) return 'حضوري';
  if (v === 'REMOTE' || v === 'VIRTUAL' || value === AttendanceMechanism.VIRTUAL) return 'عن بعد';
  return value;
}

interface InviteesTabProps {
  meeting: MeetingApiResponse;
}

export const InviteesTab: React.FC<InviteesTabProps> = ({ meeting }) => {
  const invitees = (meeting.invitees ?? []) as InviteeDisplay[];

  if (invitees.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full" dir="rtl">
        <h2 className="text-right font-bold text-[#101828]" style={{ ...fontStyle, fontSize: '22px', lineHeight: '38px' }}>
          قائمة المدعوين
        </h2>
        <div className="w-full min-h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right text-[#667085]" style={fontStyle}>
          لا يوجد مدعوين
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-6 w-full" dir="rtl">
      <div className="flex flex-col gap-2">
        <h2 className="text-right font-bold text-[#101828]" style={{ ...fontStyle, fontSize: '22px', lineHeight: '38px' }}>
          قائمة المدعوين
        </h2>
        <div className="w-full overflow-x-auto table-scroll">
          <div className="min-w-full border border-[#EAECF0] rounded-[11.38px] overflow-hidden shadow-[0px_0.95px_2.85px_rgba(16,24,40,0.1),0px_0.95px_1.9px_rgba(16,24,40,0.06)] bg-white">
            <table className="min-w-full table-auto text-right border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>رقم البند</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>الإسم</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>المنصب</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>الجوال</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>البريد الإلكتروني</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>آلية الحضور</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>حالة الرد</th>
                  <th className="py-3 px-3 text-sm font-medium text-[#344054]" style={fontStyle}>مصدر المدعو</th>
                </tr>
              </thead>
              <tbody>
                {invitees.map((invitee, index) => (
                  <tr
                    key={invitee.id}
                    className="text-sm text-[#475467] border-b border-[#EAECF0] last:border-b-0"
                    style={fontStyle}
                  >
                    <td className="py-3 px-3">{index + 1}</td>
                    <td className="py-3 px-3">{invitee.external_name || '-'}</td>
                    <td className="py-3 px-3">{invitee.position ?? '-'}</td>
                    <td className="py-3 px-3">{invitee.mobile ?? (invitee as { phone?: string }).phone ?? '-'}</td>
                    <td className="py-3 px-3">{invitee.external_email || '-'}</td>
                    <td className="py-3 px-3">{getAttendanceLabel(invitee.attendance_mechanism ?? (invitee as { attendance_channel?: string }).attendance_channel)}</td>
                    <td className="py-3 px-3">{getInviteeResponseStatusLabel(invitee.response_status)}</td>
                    <td className="py-3 px-3">{getInviteeSourceLabel(invitee.attendee_source)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
