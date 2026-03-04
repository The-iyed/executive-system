import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { AttendanceMechanism } from '@/modules/shared/types';
import { User } from 'lucide-react';

/** API may return extra invitee fields */
type InviteeDisplay = MeetingApiResponse['invitees'][number] & {
  position?: string | null;
  mobile?: string | null;
  attendance_mechanism?: string | null;
  access_permission?: string | null;
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

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {/* ─── قائمة المدعوين ─── */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
              <User className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-bold text-[#1F2937]">قائمة المدعوين</span>
              {invitees.length > 0 && (
                <span className="text-xs text-[#6B7280] bg-[#F3F4F6] rounded-full px-2.5 py-0.5 font-medium">
                  {invitees.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="p-0">
          {invitees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    <th className="px-5 py-3 text-right font-semibold text-[#6B7280] w-10">#</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الاسم</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">المنصب</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجهة</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">البريد</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجوال</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الحضور</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">صلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F9FAFB]">
                  {invitees.map((row, idx) => {
                    const isConsultant = (row as any).is_consultant === true;
                    const name = row.external_name || '-';
                    const position = row.position || '-';
                    const sector = (row as any).sector || '-';
                    const email = row.external_email || '-';
                    const mobile = row.mobile ?? (row as { phone?: string }).phone ?? '-';
                    const attendVal =
                      row.attendance_mechanism ??
                      (row as { attendance_channel?: string }).attendance_channel ??
                      'PHYSICAL';
                    const attendanceLabel = getAttendanceLabel(attendVal);
                    const accessChecked = !!row.access_permission;

                    return (
                      <tr
                        key={row.id || idx}
                        className={`transition-colors ${isConsultant ? 'bg-[#F0FDF9]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        <td className="px-5 py-3 text-[#9CA3AF] font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                                isConsultant
                                  ? 'bg-[#ECFDF5] border border-[#048F86]/20'
                                  : 'bg-[#F3F4F6]'
                              }`}
                            >
                              <User
                                className={`h-3.5 w-3.5 ${isConsultant ? 'text-[#048F86]' : 'text-[#9CA3AF]'}`}
                                strokeWidth={1.8}
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-[#1F2937] truncate">{name}</span>
                              {isConsultant && (
                                <span className="text-[10px] text-[#048F86] font-medium">مستشار</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#374151]">{position}</td>
                        <td className="px-4 py-3 text-sm text-[#374151]">{sector}</td>
                        <td className="px-4 py-3 text-sm text-[#374151] truncate max-w-[180px]">{email}</td>
                        <td className="px-4 py-3 text-sm text-[#374151]" dir="ltr">{mobile}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              String(attendVal).toUpperCase() === 'REMOTE' ||
                              String(attendVal).toUpperCase() === 'VIRTUAL'
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#EFF6FF] text-[#3B82F6]'
                            }`}
                          >
                            {attendanceLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              accessChecked
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : 'bg-[#F3F4F6] text-[#6B7280]'
                            }`}
                          >
                            {accessChecked ? 'نعم' : 'لا'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-[#6B7280] text-sm">لا يوجد مدعوين</div>
          )}
        </div>
      </section>
    </div>
  );
};
