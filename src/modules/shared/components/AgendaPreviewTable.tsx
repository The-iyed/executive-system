import React from 'react';

/** Agenda item row for preview (API shape) */
export interface AgendaItemPreview {
  id?: string;
  agenda_item?: string;
  minister_support_type?: string;
  presentation_duration_minutes?: number | string;
  minister_support_other?: string;
}

/** Labels for minister_support_type – same as MEETING_AGENDA_COLUMNS options */
const MINISTER_SUPPORT_LABELS: Record<string, string> = {
  'إحاطة': 'إحاطة',
  'تحديث': 'تحديث',
  'قرار': 'قرار',
  'توجيه': 'توجيه',
  'اعتماد': 'اعتماد',
  'أخرى': 'أخرى (يقوم بالإدخال)',
};

/** Labels for presentation_duration_minutes – same as PRESENTATION_DURATION_MINUTES_OPTIONS */
const DURATION_LABELS: Record<string, string> = {
  '5': '5 دقائق',
  '10': '10 دقائق',
  '15': '15 دقيقة',
  '20': '20 دقيقة',
  '25': '25 دقيقة',
  '30': '30 دقيقة',
  '45': '45 دقيقة',
  '60': '60 دقيقة',
  '90': '90 دقيقة',
  '120': '120 دقيقة',
  '180': '180 دقيقة',
};

function formatDuration(val: number | string | undefined): string {
  if (val === undefined || val === null) return '-';
  const s = String(val);
  return DURATION_LABELS[s] ?? (s ? `${s} دقيقة` : '-');
}

function formatMinisterSupport(val: string | undefined): string {
  if (!val || !val.trim()) return '-';
  return MINISTER_SUPPORT_LABELS[val] ?? val;
}

export interface AgendaPreviewTableProps {
  /** Title above the table (e.g. "أجندة الاجتماع") */
  title?: string;
  /** Agenda items (same shape as API / FormTable rows) */
  items?: AgendaItemPreview[] | null;
  /** Optional class for wrapper */
  className?: string;
  /** RTL */
  dir?: 'rtl' | 'ltr';
}

/**
 * Read-only table for أجندة الاجتماع with same columns as Step1 MEETING_AGENDA_COLUMNS:
 * #, الأجندة, الدعم المطلوب من الوزير, مدة العرض (بالدقائق), نص الدعم (عند اختيار أخرى).
 */
export function AgendaPreviewTable({
  title = 'أجندة الاجتماع',
  items = [],
  className = '',
  dir = 'rtl',
}: AgendaPreviewTableProps) {
  const list = Array.isArray(items) ? items : [];
  const hasItems = list.length > 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`} dir={dir}>
      <label
        className="text-md font-medium text-gray-700 text-right"
        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
      >
        {title}
      </label>
      {hasItems ? (
        <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-[#F9FAFB]">
          <table className="w-full text-sm text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            <thead>
              <tr className="border-b border-gray-300 bg-[#F2F4F7]">
                <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-24 text-center">#</th>
                <th className="px-4 py-3 text-[#475467] font-semibold">الأجندة</th>
                <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[180px] text-center">الدعم المطلوب من الوزير</th>
                <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[140px] text-center">مدة العرض (بالدقائق)</th>
                <th className="px-4 py-3 text-[#475467] font-semibold">نص الدعم (عند اختيار أخرى)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className={idx < list.length - 1 ? 'border-b border-gray-200' : ''}
                >
                  <td className="px-4 py-3 text-[#475467] text-center">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#101828]">{item.agenda_item ?? '-'}</td>
                  <td className="px-4 py-3 text-[#475467] text-center">
                    {formatMinisterSupport(item.minister_support_type)}
                  </td>
                  <td className="px-4 py-3 text-[#475467] text-center">
                    {formatDuration(item.presentation_duration_minutes)}
                  </td>
                  <td className="px-4 py-3 text-[#101828]">{item.minister_support_other ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
          -
        </div>
      )}
    </div>
  );
}
