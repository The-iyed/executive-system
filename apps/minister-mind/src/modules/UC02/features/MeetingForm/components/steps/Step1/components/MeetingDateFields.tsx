import { useMemo } from 'react';
import { FormField, MeetingRangePicker, type MeetingRangeValue } from '@shared';
import type { Step1FormData } from '../../../../schemas/step1.schema';

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
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  isFieldDisabled: (field: keyof Step1FormData) => boolean;
  /** When true, main meeting date is not required (e.g. urgent meetings). */
  mainDateRequired?: boolean;
}

export function MeetingDateFields({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  isFieldDisabled,
  mainDateRequired = true,
}: MeetingDateFieldsProps) {
  const minDate = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return formData.isUrgent ? startOfToday : oneWeekFromNow;
  }, [formData.isUrgent]);

  const meetingError =
    (touched.meetingStartDate || touched.meetingEndDate) &&
    (errors.meetingStartDate || errors.meetingEndDate);
  const alt1Error =
    (touched.alternative1StartDate || touched.alternative1EndDate) &&
    (errors.alternative1StartDate || errors.alternative1EndDate);
  const alt2Error =
    (touched.alternative2StartDate || touched.alternative2EndDate) &&
    (errors.alternative2StartDate || errors.alternative2EndDate);

  return (
    <>
      <FormField
        className="w-full min-w-0"
        label="موعد الاجتماع"
        required={mainDateRequired}
        error={
          meetingError ? errors.meetingStartDate || errors.meetingEndDate : undefined
        }
      >
        <MeetingRangePicker
          value={isoRangeToMeetingRange(
            formData.meetingStartDate ?? '',
            formData.meetingEndDate ?? ''
          )}
          onChange={(v) => {
            const iso = meetingRangeToIso(v);
            if (iso) {
              handleChange('meetingStartDate', iso.start);
              handleChange('meetingEndDate', iso.end);
            } else {
              handleChange('meetingStartDate', '');
              handleChange('meetingEndDate', '');
            }
          }}
          onBlur={() => {
            handleBlur('meetingStartDate');
            handleBlur('meetingEndDate');
          }}
          minDate={minDate}
          disabled={isFieldDisabled('meetingStartDate')}
          error={
            !!(touched.meetingStartDate && errors.meetingStartDate) ||
            !!(touched.meetingEndDate && errors.meetingEndDate)
          }
          placeholder="اختر التاريخ والوقت"
        />
      </FormField>

      <FormField
        className="w-full min-w-0"
        label="الموعد البديل الأول"
        error={
          alt1Error
            ? errors.alternative1StartDate || errors.alternative1EndDate
            : undefined
        }
      >
        <MeetingRangePicker
          value={isoRangeToMeetingRange(
            formData.alternative1StartDate ?? '',
            formData.alternative1EndDate ?? ''
          )}
          onChange={(v) => {
            const iso = meetingRangeToIso(v);
            if (iso) {
              handleChange('alternative1StartDate', iso.start);
              handleChange('alternative1EndDate', iso.end);
            } else {
              handleChange('alternative1StartDate', '');
              handleChange('alternative1EndDate', '');
            }
          }}
          onBlur={() => {
            handleBlur('alternative1StartDate');
            handleBlur('alternative1EndDate');
          }}
          minDate={minDate}
          disabled={isFieldDisabled('alternative1StartDate')}
          error={
            !!(touched.alternative1StartDate && errors.alternative1StartDate) ||
            !!(touched.alternative1EndDate && errors.alternative1EndDate)
          }
          placeholder="اختر التاريخ والوقت"
        />
      </FormField>

      <FormField
        className="w-full min-w-0"
        label="الموعد البديل الثاني"
        error={
          alt2Error
            ? errors.alternative2StartDate || errors.alternative2EndDate
            : undefined
        }
      >
        <MeetingRangePicker
          value={isoRangeToMeetingRange(
            formData.alternative2StartDate ?? '',
            formData.alternative2EndDate ?? ''
          )}
          onChange={(v) => {
            const iso = meetingRangeToIso(v);
            if (iso) {
              handleChange('alternative2StartDate', iso.start);
              handleChange('alternative2EndDate', iso.end);
            } else {
              handleChange('alternative2StartDate', '');
              handleChange('alternative2EndDate', '');
            }
          }}
          onBlur={() => {
            handleBlur('alternative2StartDate');
            handleBlur('alternative2EndDate');
          }}
          minDate={minDate}
          disabled={isFieldDisabled('alternative2StartDate')}
          error={
            !!(touched.alternative2StartDate && errors.alternative2StartDate) ||
            !!(touched.alternative2EndDate && errors.alternative2EndDate)
          }
          placeholder="اختر التاريخ والوقت"
        />
      </FormField>
    </>
  );
}
