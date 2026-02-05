import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { MeetingPreviewCard } from '../MeetingPreviewCard';
import {
  AttendanceMechanism,
  getInviteeResponseStatusLabel,
  getInviteeSourceLabel,
} from '@shared/types';

interface InviteesTabProps {
  meeting: MeetingApiResponse;
}

/** API may return extra invitee fields (position, mobile, attendance_mechanism) */
type InviteeDisplay = MeetingApiResponse['invitees'][number] & {
  position?: string | null;
  mobile?: string | null;
  attendance_mechanism?: string | null;
};

function getAttendanceLabel(value: string | null | undefined): string {
  if (!value) return '-';
  if (value === AttendanceMechanism.PHYSICAL) return AttendanceMechanism.PHYSICAL;
  if (value === AttendanceMechanism.VIRTUAL) return AttendanceMechanism.VIRTUAL;
  return value;
}

export const InviteesTab: React.FC<InviteesTabProps> = ({ meeting }) => {
  const invitees = (meeting.invitees ?? []) as InviteeDisplay[];

  if (invitees.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <MeetingPreviewCard title="قائمة المدعوين:">
          <div>• لا يوجد مدعوين</div>
        </MeetingPreviewCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MeetingPreviewCard title="قائمة المدعوين:">
        <div className="w-full overflow-x-auto -m-1 p-1">
          <table className="min-w-full table-auto text-right border-collapse">
            <thead>
              <tr className="text-[#475467] text-sm font-medium border-b border-[#E6E6E6]">
                <th className="py-2 px-3 min-w-[80px]">رقم البند</th>
                <th className="py-2 px-3 min-w-[180px]">الإسم</th>
                <th className="py-2 px-3 min-w-[180px]">المنصب</th>
                <th className="py-2 px-3 min-w-[140px]">الجوال</th>
                <th className="py-2 px-3 min-w-[200px]">البريد الإلكتروني</th>
                <th className="py-2 px-3 min-w-[120px]">آلية الحضور</th>
                <th className="py-2 px-3 min-w-[100px]">حالة الرد</th>
                <th className="py-2 px-3 min-w-[100px]">مصدر المدعو</th>
              </tr>
            </thead>
            <tbody>
              {invitees.map((invitee, index) => (
                <tr
                  key={invitee.id}
                  className="text-[#101828] text-sm border-b border-[#E6E6E6] last:border-b-0"
                >
                  <td className="py-3 px-3">{index + 1}</td>
                  <td className="py-3 px-3">
                    {invitee.external_name || '-'}
                  </td>
                  <td className="py-3 px-3">
                    {invitee.position ?? '-'}
                  </td>
                  <td className="py-3 px-3">
                    {invitee.mobile ?? '-'}
                  </td>
                  <td className="py-3 px-3">
                    {invitee.external_email || '-'}
                  </td>
                  <td className="py-3 px-3">
                    {getAttendanceLabel(invitee.attendance_mechanism)}
                  </td>
                  <td className="py-3 px-3">
                    {getInviteeResponseStatusLabel(invitee.response_status)}
                  </td>
                  <td className="py-3 px-3">
                    {getInviteeSourceLabel(invitee.attendee_source)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MeetingPreviewCard>
    </div>
  );
};
