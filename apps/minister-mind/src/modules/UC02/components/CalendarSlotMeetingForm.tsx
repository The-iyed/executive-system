import React, { useState, useCallback, useMemo } from 'react';
import { FormTable, FormInput, MeetingDateTimeRangePicker } from '@shared';
import type { FormTableColumn } from '@shared';
import { createEmptyStep3InviteeRow } from '../../UC08/features/MeetingForm/utils/inviteeMappers';
import type { InviteeFormRow } from '../../UC08/features/MeetingForm/schemas/step3.schema';

/** Minister invitees table: email only (for calendar-slot meeting form). */
const MINISTER_INVITEES_EMAIL_ONLY_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'min-w-[80px]' },
  {
    id: 'email',
    header: 'البريد الإلكتروني',
    type: 'text',
    placeholder: 'البريد الإلكتروني',
    width: 'min-w-[210px]',
  },
  { id: 'action', header: '', width: 'w-[60px]' },
];

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/** Format Date + "HH:00" to ISO string for shared date/time picker */
function toISOStart(date: Date, time: string): string {
  const [h = 0] = time.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0, 0);
  return d.toISOString();
}

export interface CalendarSlotMeetingFormProps {
  /** Initial slot: date and time string "HH:00" */
  slotDate: Date;
  slotTime: string;
  onSubmit: (values: {
    title: string;
    start_date: string;
    end_date: string;
    minister_invitees: InviteeFormRow[];
  }) => void;
  onCancel: () => void;
  /** When true, submit button is disabled (e.g. API in progress). */
  isSubmitting?: boolean;
  /** Error message to show above actions (e.g. API error). */
  submitError?: string | null;
}

export const CalendarSlotMeetingForm: React.FC<CalendarSlotMeetingFormProps> = ({
  slotDate,
  slotTime,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}) => {
  const [title, setTitle] = useState('');
  const startDefault = toISOStart(slotDate, slotTime);
  const endDefault = useMemo(() => {
    const [h = 0] = slotTime.split(':').map(Number);
    const d = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), h, 0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString();
  }, [slotDate, slotTime]);
  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(endDefault);
  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [ministerInvitees, setMinisterInvitees] = useState<InviteeFormRow[]>([]);

  const handleAddMinisterInvitee = useCallback(() => {
    setMinisterInvitees((prev) => [...prev, createEmptyStep3InviteeRow()]);
  }, []);

  const handleDeleteMinisterInvitee = useCallback((id: string) => {
    setMinisterInvitees((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUpdateMinisterInvitee = useCallback((id: string, field: string, value: unknown) => {
    setMinisterInvitees((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const ministerRows = ministerInvitees.map((row) => ({ ...row, id: row.id }));

  const [titleTouched, setTitleTouched] = useState(false);
  const titleTrimmed = title.trim();
  const showTitleError = titleTouched && !titleTrimmed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTitleTouched(true);
    if (!titleTrimmed) return;
    onSubmit({
      title: titleTrimmed,
      start_date: startDate,
      end_date: endDate,
      minister_invitees: ministerInvitees,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-2" dir="rtl" style={fontStyle}>
      <h2 className="text-xl font-bold text-[#101828] text-right">إنشاء اجتماع من الموعد</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="calendar-slot-title" className="text-sm font-medium text-gray-900 text-right">
            عنوان الاجتماع <span className="text-red-500">*</span>
          </label>
          <FormInput
            id="calendar-slot-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            placeholder="عنوان الاجتماع"
            fullWidth
            error={showTitleError}
          />
          {showTitleError && (
            <p className="text-right text-sm text-red-600">عنوان الاجتماع مطلوب</p>
          )}
        </div>

        <MeetingDateTimeRangePicker
          startValue={startDate}
          endValue={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          minStartDate={minStartDate}
          startLabel="تاريخ ووقت البداية"
          endLabel="تاريخ ووقت النهاية"
        />

        <FormTable
          title="قائمة المدعوين من جهة الوزير"
          columns={MINISTER_INVITEES_EMAIL_ONLY_COLUMNS}
          rows={ministerRows}
          onAddRow={handleAddMinisterInvitee}
          onDeleteRow={handleDeleteMinisterInvitee}
          onUpdateRow={handleUpdateMinisterInvitee}
          addButtonLabel="إضافة مدعو للوزير"
          emptyStateMessage="لا يوجد مدعوون من الوزير"
          customCellRender={{
            email: ({ value, onUpdateRow, placeholder, disabled, error }) => (
              <FormInput
                type="email"
                inputMode="email"
                value={value ?? ''}
                onChange={(e) => onUpdateRow('email', e.target.value)}
                placeholder={placeholder}
                fullWidth
                disabled={disabled}
                error={error}
              />
            ),
          }}
        />

        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-right text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex flex-row gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !titleTrimmed}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#1f4848] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalendarSlotMeetingForm;
