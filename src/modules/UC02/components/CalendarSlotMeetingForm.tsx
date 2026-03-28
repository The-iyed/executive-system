import React, { useMemo, useRef, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { Users } from 'lucide-react';
import { cn, toISOStringWithTimezone, Button } from '@/lib/ui';

import {
  MeetingTitleField,
  MeetingDateField,
  MeetingChannelField,
  LocationField,
  LocationCustomField,
  ProposersField,
} from '@/modules/shared/features/meeting-request-form/shared/fields';
import { MeetingLocation } from '@/modules/shared/features/meeting-request-form/shared/types/enums';

import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';
import { DynamicTableFormHandle } from '@/lib/dynamic-table-form';
import type { InviteeFormRow } from '../features/MeetingForm/schemas/step3.schema';
import type { CreateScheduledMeetingProposer } from '../data/calendarApi';
import type { ProposerSelection } from '@/modules/shared/features/meeting-request-form/shared/fields/ProposersSelect';

/** Build ISO preserving timezone so slot time is sent correctly. */
function toISOStart(date: Date, time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  return toISOStringWithTimezone(d);
}

export interface CalendarSlotMeetingFormSubmitValues {
  title: string;
  start_date: string;
  end_date: string;
  meeting_channel: string;
  meeting_location?: string;
  proposers?: CreateScheduledMeetingProposer[];
  invitees: InviteeFormRow[];
}

export interface CalendarSlotMeetingFormProps {
  slotDate: Date;
  slotTime: string;
  slotEndTime?: string;
  initialTitle?: string;
  initialMeetingChannel?: string;
  initialMeetingLocation?: string;
  initialInvitees?: Array<Record<string, unknown>>;
  mode?: 'create' | 'edit';
  onSubmit: (values: CalendarSlotMeetingFormSubmitValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

interface FormValues {
  meeting_title: string;
  meeting_start_date: string;
  meeting_end_date: string;
  meeting_channel: string;
  meeting_location: string;
  meeting_location_custom: string;
  proposers: ProposerSelection[];
}

export const CalendarSlotMeetingForm: React.FC<CalendarSlotMeetingFormProps> = ({
  slotDate,
  slotTime,
  slotEndTime,
  initialTitle,
  initialMeetingChannel,
  initialMeetingLocation,
  initialInvitees,
  mode = 'create',
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}) => {
  const startDefault = toISOStart(slotDate, slotTime);
  const endDefault = useMemo(() => {
    if (slotEndTime) return toISOStart(slotDate, slotEndTime);
    const [h = 0, m = 0] = slotTime.split(':').map(Number);
    const d = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), h + 1, m, 0, 0);
    return toISOStringWithTimezone(d);
  }, [slotDate, slotTime, slotEndTime]);

  const methods = useForm<FormValues>({
    defaultValues: {
      meeting_title: initialTitle ?? '',
      meeting_start_date: startDefault,
      meeting_end_date: endDefault,
      meeting_channel: initialMeetingChannel ?? '',
      meeting_location: initialMeetingLocation ?? '',
      meeting_location_custom: '',
      proposers: [],
    },
  });

  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  return (
    <FormProvider {...methods}>
      <CalendarFormInner
        mode={mode}
        inviteesRef={inviteesRef}
        initialInvitees={initialInvitees}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </FormProvider>
  );
};

/* ─── Inner form (has access to FormProvider context) ─── */

interface InnerProps {
  mode: 'create' | 'edit';
  inviteesRef: React.RefObject<DynamicTableFormHandle | null>;
  initialInvitees?: Array<Record<string, unknown>>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: CalendarSlotMeetingFormSubmitValues) => void;
  onCancel: () => void;
}

function CalendarFormInner({
  mode,
  inviteesRef,
  initialInvitees,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: InnerProps) {
  const { handleSubmit, watch } = useFormContext<FormValues>();
  const meetingChannel = watch('meeting_channel');
  const meetingTitle = watch('meeting_title');

  const showLocation = meetingChannel === 'PHYSICAL' || meetingChannel === 'HYBRID';
  const meetingLocation = watch('meeting_location');
  const meetingLocationCustom = watch('meeting_location_custom');
  const isOther = meetingLocation === MeetingLocation.OTHER;

  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const doSubmit = useCallback(
    (data: FormValues) => {
      // Validate past date
      const start = data.meeting_start_date ? new Date(data.meeting_start_date).getTime() : 0;
      if (start <= Date.now()) return;

      // Validate invitees
      const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
      if (!inviteesPayload) return;

      // Build location
      let meeting_location: string | undefined;
      if (showLocation) {
        if (data.meeting_location === MeetingLocation.OTHER) {
          meeting_location = data.meeting_location_custom?.trim() || undefined;
        } else {
          meeting_location = data.meeting_location || undefined;
        }
      }

      // Build proposers
      const proposerSelections = data.proposers ?? [];
      const proposers: CreateScheduledMeetingProposer[] | undefined =
        proposerSelections.length > 0
          ? proposerSelections.map((p) => ({
              object_guid: p.objectGUID ?? p.mail ?? '',
              email: p.mail ?? '',
              name: p.displayNameAR ?? p.displayNameEN ?? p.displayName ?? p._label ?? p.mail ?? '',
              name_ar: p.displayNameAR ?? undefined,
              name_en: p.displayNameEN ?? undefined,
              mobile: p.mobile ?? undefined,
              title: p.title ?? undefined,
              department: p.department ?? undefined,
              company: p.company ?? undefined,
              given_name: p.givenName,
              sn: p.sn,
              cn: p.cn,
            }))
          : undefined;

      onSubmit({
        title: data.meeting_title.trim(),
        start_date: data.meeting_start_date,
        end_date: data.meeting_end_date,
        meeting_channel: data.meeting_channel,
        meeting_location,
        proposers,
        invitees: inviteesPayload,
      });
    },
    [onSubmit, showLocation, inviteesRef]
  );

  const canSubmit = !isSubmitting && !!meetingTitle?.trim() && !!meetingChannel?.trim();

  return (
    <div className="flex flex-col gap-0 pb-32" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60 px-1 py-4 -mx-1">
        <h2 className="text-lg font-bold text-foreground">
          {mode === 'edit' ? 'تعديل الاجتماع' : 'إنشاء اجتماع من الموعد'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(doSubmit)} className="flex flex-col gap-5 pt-5">
        {/* Shared fields */}
        <MeetingTitleField />

        <MeetingDateField
          startName="meeting_start_date"
          endName="meeting_end_date"
          required
          minDate={minStartDate}
        />

        <MeetingChannelField />

        {showLocation && (
          <>
            <LocationField />
            {isOther && <LocationCustomField />}
          </>
        )}

        {/* Divider */}
        <div className="border-t border-border/60 my-1" />

        {/* Proposers — shared field */}
        <ProposersField />

        {/* Divider */}
        <div className="border-t border-border/60 my-1" />

        {/* Invitees */}
        <InviteesTableForm
          tableRef={inviteesRef}
          initialInvitees={(initialInvitees ?? []) as any}
          meetingChannel={meetingChannel}
          showAiSuggest={false}
        />

        {/* Error */}
        {submitError && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-row gap-3 justify-end pt-6 mt-2 border-t border-border/60">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting
              ? mode === 'edit' ? 'جاري التحديث...' : 'جاري الحفظ...'
              : mode === 'edit' ? 'تحديث' : 'حفظ'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CalendarSlotMeetingForm;
