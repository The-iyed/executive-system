import React, { useState, useCallback } from 'react';
import { FormTable, FormInput } from '@shared';
import { createEmptyStep3InviteeRow, INVITEES_TABLE_COLUMNS } from '../features/MeetingForm/utils';
import { InviteeFormRow } from '../features/MeetingForm/schemas/step3.schema';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/** Format Date + "HH:00" to datetime-local value "YYYY-MM-DDTHH:mm" */
function toDatetimeLocal(date: Date, time: string): string {
  const [h = 0] = time.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
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
  const startDefault = toDatetimeLocal(slotDate, slotTime);
  const endDefault = (() => {
    const [h = 0] = slotTime.split(':').map(Number);
    const d = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), h, 0, 0, 0);
    d.setHours(d.getHours() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${hh}:${mm}`;
  })();
  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(endDefault);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
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
            عنوان الاجتماع
          </label>
          <FormInput
            id="calendar-slot-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الاجتماع"
            fullWidth
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="calendar-slot-start" className="text-sm font-medium text-gray-900 text-right">
              تاريخ ووقت البداية
            </label>
            <input
              id="calendar-slot-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4848] focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="calendar-slot-end" className="text-sm font-medium text-gray-900 text-right">
              تاريخ ووقت النهاية
            </label>
            <input
              id="calendar-slot-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4848] focus:border-transparent"
            />
          </div>
        </div>

        <FormTable
          title="قائمة المدعوين من جهة الوزير"
          columns={INVITEES_TABLE_COLUMNS}
          rows={ministerRows}
          onAddRow={handleAddMinisterInvitee}
          onDeleteRow={handleDeleteMinisterInvitee}
          onUpdateRow={handleUpdateMinisterInvitee}
          addButtonLabel="إضافة مدعو للوزير"
          emptyStateMessage="لا يوجد مدعوون من الوزير"
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
            disabled={isSubmitting}
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
