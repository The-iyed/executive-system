import React, { useMemo } from 'react';
import { FormField, MeetingRangePicker, type MeetingRangeValue } from '@/modules/shared';
import type { Step1BasicInfoFormData } from '../../schemas/step1BasicInfo.schema';
import type { Step1ErrorKey } from '../../hooks/useStep1BasicInfo';

function isoRangeToMeetingRange(startISO: string, endISO: string): MeetingRangeValue {
  if (!startISO || !endISO) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const toHHmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const startTime = toHHmm(start);
  const endTime = toHHmm(end);
  const isFullDay =
    start.getHours() === 0 &&
    start.getMinutes() === 0 &&
    end.getHours() === 23 &&
    end.getMinutes() >= 59;
  return {
    date: start,
    startTime,
    endTime,
    isFullDay,
  };
}

function meetingRangeToIso(value: MeetingRangeValue): { start: string; end: string } | null {
  if (!value.date) return null;
  const [sh, sm] = value.startTime.split(':').map(Number);
  const [eh, em] = value.endTime.split(':').map(Number);
  const start = new Date(value.date);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(value.date);
  end.setHours(eh, em, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export interface MeetingDateFieldsProps {
  formData: Partial<Step1BasicInfoFormData>;
  errors: Partial<Record<Step1ErrorKey, string>>;
  touched: Partial<Record<Step1ErrorKey, boolean>>;
  handleChange: (field: keyof Step1BasicInfoFormData, value: unknown) => void;
  handleBlur: (field: Step1ErrorKey) => void;
  isFieldDisabled: (field: string) => boolean;
}

export const MeetingDateFields: React.FC<MeetingDateFieldsProps> = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  isFieldDisabled,
}) => {
  const minDate = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return formData.is_urgent ? startOfToday : oneWeekFromNow;
  }, [formData.is_urgent]);

  const meetingError =
    (touched.meeting_start_date || touched.meeting_end_date) &&
    (errors.meeting_start_date || errors.meeting_end_date);

  return (
    <FormField
      className="w-full min-w-0"
      label="موعد الاجتماع المقترح"
      required
      error={
        meetingError ? errors.meeting_start_date || errors.meeting_end_date : undefined
      }
    >
      <MeetingRangePicker
        value={isoRangeToMeetingRange(
          formData.meeting_start_date || '',
          formData.meeting_end_date || ''
        )}
        onChange={(v) => {
          const iso = meetingRangeToIso(v);
          if (iso) {
            handleChange('meeting_start_date', iso.start);
            handleChange('meeting_end_date', iso.end);
          } else {
            handleChange('meeting_start_date', '');
            handleChange('meeting_end_date', '');
          }
        }}
        onBlur={() => {
          handleBlur('meeting_start_date');
          handleBlur('meeting_end_date');
        }}
        minDate={minDate}
        disabled={isFieldDisabled('meeting_start_date')}
        error={
          !!(touched.meeting_start_date && errors.meeting_start_date) ||
          !!(touched.meeting_end_date && errors.meeting_end_date)
        }
        placeholder="اختر التاريخ والوقت"
      />
    </FormField>
  );
};
