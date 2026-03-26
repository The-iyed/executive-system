import React from 'react';
import type { MeetingApiResponse } from '@/modules/shared/types/meeting';
import { MeetingStatus, MeetingStatusLabels } from '@/modules/shared/types';
import { formatDateArabic } from '@/modules/shared/utils';
const labelClass = 'text-sm font-medium text-gray-700';
const valueClass = 'w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right';
const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

function resolveUserLabel(obj: unknown, fallback?: string | null): string {
  if (fallback) return fallback;
  if (!obj || typeof obj !== 'object') return '-';
  const u = obj as Record<string, unknown>;
  if (u.name && typeof u.name === 'string') return u.name;
  if (u.username && typeof u.username === 'string') return u.username;
  if (u.email && typeof u.email === 'string') return u.email;
  if (u.ar_name && typeof u.ar_name === 'string') return u.ar_name;
  const first = u.first_name ?? '';
  const last = u.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return '-';
}

interface RequestInfoTabProps {
  meeting: MeetingApiResponse;
}

export const RequestInfoTab: React.FC<RequestInfoTabProps> = ({ meeting }) => {
  const statusLabel =
    MeetingStatusLabels[meeting?.status as MeetingStatus] || meeting?.status;
  const m = meeting as unknown as Record<string, unknown>;
  const submitterLabel = resolveUserLabel(m?.submitter, meeting?.submitter_name);
  const ownerLabel = resolveUserLabel(m?.meeting_owner, (meeting as any)?.meeting_owner_name);

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
            {formatDateArabic((meeting as any)?.submitted_at ?? (meeting as any)?.created_at) || '-'}
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
            {submitterLabel}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass} style={fontStyle}>مالك الاجتماع</label>
          <div className={valueClass} style={fontStyle}>
            {ownerLabel}
          </div>
        </div>
      </div>
    </div>
  );
};