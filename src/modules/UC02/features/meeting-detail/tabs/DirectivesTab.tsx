/**
 * Directives tab – التوجيهات المرتبطة (only when meeting status is CLOSED).
 */
import React from 'react';
import { Plus } from 'lucide-react';
import { DataTable, formatDateArabic } from '@/modules/shared';
import type { RelatedDirective } from '@/modules/shared/types';
import { translateDirectiveStatus } from '../utils/meetingDetailHelpers';

export interface DirectivesTabProps {
  meeting: {
    related_directives?: RelatedDirective[];
    related_directive_ids?: string[];
  } | undefined;
  onAddDirective?: () => void;
}

export function DirectivesTab({ meeting, onAddDirective }: DirectivesTabProps) {
  const directives = meeting?.related_directives ?? [];
  const hasDirectives = directives.length > 0;
  const hasOnlyIds = !hasDirectives && (meeting?.related_directive_ids?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      <div className="flex flex-row items-center justify-between gap-4">
        <h2 className="text-right font-bold text-[#101828] text-[16px]" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", fontSize: '18px' }}>
          التوجيهات المرتبطة
        </h2>
        <button
          type="button"
          onClick={onAddDirective}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" strokeWidth={1.26} />
          إضافة توجيه
        </button>
      </div>
      {hasDirectives ? (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
          <DataTable
            columns={[
              { id: 'index', header: '#', width: 'w-20', align: 'center', render: (_row: RelatedDirective, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span> },
              { id: 'directive_number', header: 'رقم التوجيه', width: 'w-36', align: 'end', render: (row: RelatedDirective) => <span className="text-sm text-[#475467]">{row.directive_number}</span> },
              { id: 'directive_date', header: 'تاريخ التوجيه', width: 'w-32', align: 'end', render: (row: RelatedDirective) => { const d = row.directive_date ? new Date(row.directive_date) : null; return <span className="text-sm text-[#475467]">{d ? formatDateArabic(d) : '—'}</span>; } },
              { id: 'directive_text', header: 'نص التوجيه', width: 'flex-1', align: 'end', render: (row: RelatedDirective) => <span className="text-sm text-[#475467] whitespace-pre-wrap">{row.directive_text || '—'}</span> },
              { id: 'deadline', header: 'الموعد النهائي', width: 'w-32', align: 'end', render: (row: RelatedDirective) => { const d = row.deadline ? new Date(row.deadline) : null; return <span className="text-sm text-[#475467]">{d ? formatDateArabic(d) : '—'}</span>; } },
              { id: 'responsible_persons', header: 'المسؤولون', width: 'w-48', align: 'end', render: (row: RelatedDirective) => { const names = (row.responsible_persons ?? []).map((p) => p.name).filter(Boolean); return <span className="text-sm text-[#475467]">{names.length ? names.join('، ') : '—'}</span>; } },
              { id: 'directive_status', header: 'الحالة', width: 'w-28', align: 'center', render: (row: RelatedDirective) => <span className="text-sm text-[#475467]">{translateDirectiveStatus(row.directive_status)}</span> },
            ]}
            data={directives}
            rowPadding="py-3"
          />
        </div>
      ) : hasOnlyIds ? (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
          <DataTable
            columns={[
              { id: 'index', header: '#', width: 'w-28', align: 'center', render: (_: { id: string }, i: number) => <span className="text-sm text-[#475467]">{i + 1}</span> },
              { id: 'directive_id', header: 'معرف التوجيه', width: 'flex-1', align: 'end', render: (row: { id: string }) => <span className="text-sm text-[#475467]">{row.id}</span> },
            ]}
            data={(meeting?.related_directive_ids ?? []).map((id) => ({ id }))}
            rowPadding="py-3"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">التوجيهات المرتبطة</p>
            <p className="text-gray-500 text-sm">لا توجد توجيهات مرتبطة. استخدم زر «إضافة توجيه» لإضافة توجيه.</p>
          </div>
        </div>
      )}
    </div>
  );
}
