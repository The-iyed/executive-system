/**
 * Request info tab – رقم الطلب، تاريخ الطلب، حالة الطلب، مقدم الطلب، مالك الاجتماع.
 */
import { ReadOnlyField, StatusBadge } from '@/modules/shared';
import { formatDateArabic } from '@/modules/shared/utils';
import type { MeetingApiResponse } from '../../../data/meetingsApi';
import { Hash, Calendar, User, Building2 } from 'lucide-react';

function resolveUserLabel(obj: unknown, fallback?: string | null): string {
  if (obj && typeof obj === 'object') {
    const u = obj as Record<string, unknown>;
    if (u.email && typeof u.email === 'string') return u.email;
    if (u.username && typeof u.username === 'string') return u.username;
    if (u.name && typeof u.name === 'string') return u.name;
    if (u.ar_name && typeof u.ar_name === 'string') return u.ar_name;
    const first = u.first_name ?? '';
    const last = u.last_name ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }
  if (fallback) return fallback;
  return '-';
}

export interface RequestInfoTabProps {
  meeting: MeetingApiResponse | undefined;
  statusLabel: string;
}

export function RequestInfoTab({ meeting, statusLabel }: RequestInfoTabProps) {
  const m = meeting as unknown as Record<string, unknown> | undefined;
  const requestDate = formatDateArabic(meeting?.submitted_at ?? meeting?.created_at) || '-';
  const submitterLabel = resolveUserLabel(m?.submitter, meeting?.submitter_name);
  const ownerLabel = resolveUserLabel(m?.meeting_owner, meeting?.meeting_owner_name);
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto" dir="rtl">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F0FDF9] border border-[#D0F0ED]">
          <Hash className="w-5 h-5 text-[#048F86]" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#101828]">معلومات الطلب</h3>
          <p className="text-[13px] text-[#667085]">البيانات الأساسية للطلب</p>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        <ReadOnlyField
          label="رقم الطلب"
          value={meeting?.request_number ?? '-'}
          icon={<Hash className="w-4 h-4" />}
        />
        <ReadOnlyField
          label="تاريخ الطلب"
          value={requestDate}
          icon={<Calendar className="w-4 h-4" />}
        />
        <ReadOnlyField
          label="حالة الطلب"
          value={statusLabel}
        />
        <ReadOnlyField
          label="مقدم الطلب"
          value={submitterLabel}
          icon={<User className="w-4 h-4" />}
        />
        <ReadOnlyField
          label="مالك الاجتماع"
          value={ownerLabel}
          icon={<Building2 className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}
