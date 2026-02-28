/**
 * Request info tab – رقم الطلب، تاريخ الطلب، حالة الطلب، مقدم الطلب، مالك الاجتماع.
 */
import { ReadOnlyField } from '@shared';
import { formatDateArabic } from '@shared/utils';
import type { MeetingApiResponse } from '@shared/types';

export interface RequestInfoTabProps {
  meeting: MeetingApiResponse | undefined;
  statusLabel: string;
}

export function RequestInfoTab({ meeting, statusLabel }: RequestInfoTabProps) {
  const requestDate = formatDateArabic(meeting?.submitted_at ?? meeting?.created_at) || '-';
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <ReadOnlyField label="رقم الطلب" value={meeting?.request_number ?? '-'} />
        <ReadOnlyField label="تاريخ الطلب" value={requestDate} />
        <ReadOnlyField label="حالة الطلب" value={statusLabel} />
        <ReadOnlyField label="مقدم الطلب" value={meeting?.submitter_name ?? '-'} />
        <ReadOnlyField label="مالك الاجتماع" value={meeting?.meeting_owner_name ?? '-'} />
      </div>
    </div>
  );
}
