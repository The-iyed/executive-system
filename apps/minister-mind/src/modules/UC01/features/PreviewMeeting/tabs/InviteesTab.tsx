import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { AttendanceMechanism } from '@shared/types';
import { User, Mail, Phone, Trash2, Building2 } from 'lucide-react';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

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

function getAccessLabel(value: string | null | undefined): string {
  if (!value) return 'صلاحية الاطلاع';
  if (value === 'VIEW') return 'صلاحية الاطلاع';
  if (value === 'EDIT') return 'صلاحية التعديل';
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
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ ...fontStyle, fontSize: '16px', lineHeight: '38px' }}>
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
      <div className="flex flex-col gap-4">
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ ...fontStyle, fontSize: '16px', lineHeight: '38px' }}>
          قائمة المدعوين
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4">
          {invitees.map((invitee, idx) => {
            const name = invitee.external_name || '-';
            const position = (invitee as InviteeDisplay).position || '-';
            const sector = (invitee as any).sector || '-';
            const email = invitee.external_email || '-';
            const mobile = (invitee as InviteeDisplay).mobile ?? (invitee as { phone?: string }).phone ?? '-';
            const attendanceLabel = getAttendanceLabel(
              (invitee as InviteeDisplay).attendance_mechanism ??
              (invitee as { attendance_channel?: string }).attendance_channel
            );
            const accessLabel = getAccessLabel((invitee as InviteeDisplay).access_permission);
            const isConsultant = (invitee as any).is_consultant === true;

            return (
              <div
                key={invitee.id || idx}
                className={`group relative overflow-hidden border-[1.5px] ${isConsultant ? 'bg-[rgba(4,143,134,0.04)] border-[#048F86]' : 'bg-white border-[rgba(230,236,245,1)]'}`}
                style={{ borderRadius: '16px', boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)' }}
              >
                {/* Delete strip - overlays on hover (left side in RTL) */}
                <div
                  className="absolute left-0 top-0 bottom-0 z-10 flex w-0 items-center justify-center overflow-hidden transition-all duration-200 ease-in-out group-hover:w-12 hidden"
                  style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(16.62px)' }}
                >
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/40"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-[18px] w-[18px] text-[#D92D20]" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="flex flex-col gap-4 p-5" style={fontStyle}>
                  {/* Top Row: Avatar + Name/Position + Tags */}
                  <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
                        <User className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-bold text-[#101828] truncate leading-5">{name}</span>
                        <span className="text-[12px] text-[#667085] leading-4">{position}</span>
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-[#E6F9F8] px-2.5 py-1 text-[13px] text-[#048F86] whitespace-nowrap">
                        {accessLabel}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#EDF6FF] px-2.5 py-1 text-[13px] text-[#4281BF] whitespace-nowrap">
                        {attendanceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Email + Phone pills */}
                  <div className="flex flex-row items-center gap-2.5 w-full">
                    <div
                      className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                      style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                      >
                        <Mail className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] text-gray-700 leading-3">البريد الإلكتروني</span>
                        <span className="text-[12px] text-gray-700 truncate leading-4">{email}</span>
                      </div>
                    </div>
                    <div
                      className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                      style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                      >
                        <Phone className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] text-gray-700 leading-3">الجوال</span>
                        <span className="text-[12px] text-gray-700 truncate leading-4" dir="ltr">{mobile}</span>
                      </div>
                    </div>
                  </div>
                  {sector !== '-' && (
                    <div className="flex flex-row items-center gap-2.5 w-full">
                      <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
                          <Building2 className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] text-gray-700 leading-3">الجهة</span>
                          <span className="text-[12px] text-gray-700 truncate leading-4">{sector}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
          </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
