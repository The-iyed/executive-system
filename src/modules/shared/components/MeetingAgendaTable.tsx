import React, { useEffect, useMemo, useRef } from 'react';
import { FormTable, type FormTableColumn, type FormTableRow } from './form';
import { MINISTER_SUPPORT_TYPE_OPTIONS, PRESENTATION_DURATION_MINUTES_OPTIONS } from '../types/meeting-types';
import { getAgendaTotalDurationMinutes } from '../utils/agendaDuration';

export interface MeetingAgendaTableProps {
  rows: FormTableRow[];
  required: boolean;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onUpdateRow: (id: string, field: string, value: unknown) => void;
  errors: Record<string, Record<string, string>>;
  touched: Record<string, Record<string, boolean>>;
  errorMessage?: string;
  disabled?: boolean;
  scrollToRowId?: string | null;
  onScrolledToRow?: () => void;
  meetingDurationMinutes?: number | null;
}

const BASE_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-24' },
  { id: 'agenda_item', header: 'الأجندة', type: 'text', placeholder: 'عنصر الأجندة', width: 'w-full' },
  { id: 'minister_support_type', header: 'الدعم المطلوب من الوزير', type: 'select', selectOptions: MINISTER_SUPPORT_TYPE_OPTIONS, placeholder: 'إحاطة / تحديث / قرار / توجيه / اعتماد / أخرى', width: 'w-full' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض (بالدقائق)', type: 'select', selectOptions: PRESENTATION_DURATION_MINUTES_OPTIONS, placeholder: 'اختر المدة', width: 'w-full' },
  { id: 'minister_support_other', header: 'نص الدعم (عند اختيار أخرى)', type: 'text', placeholder: 'أدخل نص الدعم', width: 'w-full', showWhen: { field: 'minister_support_type', value: 'أخرى' } },
  { id: 'action', header: '', width: 'w-[60px]' },
];

const DURATION_MISMATCH_MESSAGE = (agendaTotal: number, meetingMinutes: number) =>
  `مجموع مدة عناصر الأجندة (${agendaTotal} دقيقة) يجب أن يساوي أو يقل عن مدة الاجتماع (${meetingMinutes} دقيقة)`;

export const MeetingAgendaTable: React.FC<MeetingAgendaTableProps> = ({
  rows,
  required,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
  errors,
  touched,
  errorMessage,
  disabled,
  scrollToRowId,
  onScrolledToRow,
  meetingDurationMinutes,
}) => {
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const totalAgendaMinutes = useMemo(() => getAgendaTotalDurationMinutes(rows), [rows]);

  const hideAddButton =
    meetingDurationMinutes == null || totalAgendaMinutes >= meetingDurationMinutes;

  const columns = useMemo(() => {
    if (meetingDurationMinutes == null) return BASE_AGENDA_COLUMNS;
    const total = getAgendaTotalDurationMinutes(rows);
    const getDurationOptions: FormTableColumn['selectOptions'] = (_rowIndex, row, _allRows) => {
      const currentRowMinutes = parseInt(String(row.presentation_duration_minutes ?? ''), 10) || 0;
      const remaining = meetingDurationMinutes - total + currentRowMinutes;
      if (remaining <= 0) return [];
      return PRESENTATION_DURATION_MINUTES_OPTIONS.filter((opt) => {
        const min = parseInt(opt.value, 10);
        return !Number.isNaN(min) && min >= 0 && min <= remaining;
      });
    };
    return BASE_AGENDA_COLUMNS.map((col) =>
      col.id === 'presentation_duration_minutes'
        ? { ...col, selectOptions: getDurationOptions }
        : col
    );
  }, [meetingDurationMinutes, rows]);

  const durationMismatchError =
    meetingDurationMinutes != null &&
    rows.length > 0 &&
    totalAgendaMinutes > meetingDurationMinutes
      ? DURATION_MISMATCH_MESSAGE(totalAgendaMinutes, meetingDurationMinutes)
      : undefined;
  const effectiveErrorMessage = errorMessage ?? durationMismatchError;

  const showDurationSummary =
    meetingDurationMinutes != null && meetingDurationMinutes >= 0;

  useEffect(() => {
    if (!scrollToRowId || !tableWrapperRef.current || !onScrolledToRow) return undefined;
    const el = tableWrapperRef.current.querySelector(
      `[data-row-id="${scrollToRowId}"]`
    ) as HTMLElement | null;
    if (el) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        requestAnimationFrame(() => onScrolledToRow());
      });
      return () => {
        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      };
    }
    onScrolledToRow();
    return undefined;
  }, [scrollToRowId, onScrolledToRow]);

  return (
    <div ref={tableWrapperRef} className="w-full flex flex-col gap-2">
      <FormTable
        title="أجندة الاجتماع"
        description={showDurationSummary ? 'مجموع مدة الأجندة يجب أن يساوي أو يقل عن مدة الاجتماع' : undefined}
        required={required}
        columns={columns}
        rows={rows}
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        onUpdateRow={onUpdateRow}
        addButtonLabel="إضافة عنصر"
        errors={errors}
        touched={touched}
        errorMessage={effectiveErrorMessage}
        disabled={disabled}
        hideAddButton={hideAddButton}
      />
      {hideAddButton && meetingDurationMinutes == null && (
        <p className="text-sm text-right text-[#667085]" dir="rtl">
          يجب تحديد مدة الاجتماع (تاريخ ووقت البداية والنهاية) أولاً لإضافة عناصر الأجندة.
        </p>
      )}
    </div>
  );
};
