import React, { useMemo, useRef, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, toISOStringWithTimezone } from '@/lib/ui';

import {
  MeetingTitleField,
  MeetingDateField,
  MeetingChannelField,
  LocationField,
  ProposersField,
} from '@/modules/shared/features/meeting-request-form/shared/fields';
import { MeetingLocation } from '@/modules/shared/features/meeting-request-form/shared/types/enums';
import { MeetingModalShell } from '@/modules/shared/features/meeting-request-form/shared/components';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const calendarMeetingSchema = z.object({
  meeting_title: z.string().trim().min(1, "عنوان الاجتماع مطلوب"),
  meeting_start_date: z.string().min(1, "موعد البداية مطلوب"),
  meeting_end_date: z.string().min(1, "موعد النهاية مطلوب"),
  meeting_channel: z.string().min(1, "آلية انعقاد الاجتماع مطلوب"),
  meeting_location: z.string().default(""),
  meeting_location_custom: z.string().default(""),
  proposers: z.array(z.any()).default([]),
}).superRefine((data, ctx) => {
  const needsLocation = data.meeting_channel === 'PHYSICAL' || data.meeting_channel === 'HYBRID';
  if (needsLocation && (!data.meeting_location || data.meeting_location.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['meeting_location'], message: 'الموقع مطلوب' });
  }
  if (needsLocation && data.meeting_location === 'OTHER' && (!data.meeting_location_custom || data.meeting_location_custom.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['meeting_location_custom'], message: 'يرجى تحديد الموقع' });
  }
});

type FormValues = z.infer<typeof calendarMeetingSchema>;

/**
 * LocationCustomField with inline error display for calendar form.
 * The shared LocationCustomField relies on FormField which reads errors[name],
 * but superRefine errors may not always propagate. This wrapper ensures the error is shown.
 */
function CalendarLocationCustomField({ disabled }: { disabled?: boolean }) {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  const err = errors.meeting_location_custom;
  const hasError = !!err;
  return (
    <div className="space-y-1.5">
      <label className={cn("text-sm font-medium", hasError && "text-destructive")}>
        تحديد الموقع (موقع آخر)
        <span className="mr-0.5 text-destructive">*</span>
      </label>
      <input
        placeholder="أدخل الموقع"
        disabled={disabled}
        className={cn(
          "flex w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background transition-all h-10",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          hasError ? "border-destructive" : "border-input"
        )}
        {...register("meeting_location_custom")}
      />
      {err?.message && (
        <p role="alert" className="text-xs text-destructive animate-in slide-in-from-top-1">
          {err.message as string}
        </p>
      )}
    </div>
  );
}

export const CalendarSlotMeetingForm: React.FC<CalendarSlotMeetingFormProps> = ({
  open,
  onOpenChange,
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
    resolver: zodResolver(calendarMeetingSchema),
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
  const formSubmitRef = useRef<(() => void) | null>(null);

  return (
    <FormProvider {...methods}>
      <CalendarFormInner
        open={open}
        onOpenChange={onOpenChange}
        mode={mode}
        inviteesRef={inviteesRef}
        formSubmitRef={formSubmitRef}
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  inviteesRef: React.RefObject<DynamicTableFormHandle | null>;
  formSubmitRef: React.MutableRefObject<(() => void) | null>;
  initialInvitees?: Array<Record<string, unknown>>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: CalendarSlotMeetingFormSubmitValues) => void;
  onCancel: () => void;
}

function CalendarFormInner({
  open,
  onOpenChange,
  mode,
  inviteesRef,
  formSubmitRef,
  initialInvitees,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: InnerProps) {
  const { handleSubmit, watch, trigger, formState: { isSubmitted } } = useFormContext<FormValues>();
  const meetingChannel = watch('meeting_channel');

  const showLocation = meetingChannel === 'PHYSICAL' || meetingChannel === 'HYBRID';
  const meetingLocation = watch('meeting_location');
  const isOther = meetingLocation === MeetingLocation.OTHER;

  // Re-validate location fields when their visibility/value changes after first submit
  React.useEffect(() => {
    if (isSubmitted) {
      trigger(['meeting_location', 'meeting_location_custom']);
    }
  }, [meetingChannel, meetingLocation, isSubmitted, trigger]);

  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const doSubmit = useCallback(
    (data: FormValues) => {
      const start = data.meeting_start_date ? new Date(data.meeting_start_date).getTime() : 0;
      if (start <= Date.now()) return;

      const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
      if (!inviteesPayload) return;

      let meeting_location: string | undefined;
      if (showLocation) {
        if (data.meeting_location === MeetingLocation.OTHER) {
          meeting_location = data.meeting_location_custom?.trim() || undefined;
        } else {
          meeting_location = data.meeting_location || undefined;
        }
      }

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

  // Expose form submit trigger via ref
  formSubmitRef.current = handleSubmit(doSubmit);

  const handleModalSubmit = useCallback(() => {
    formSubmitRef.current?.();
  }, [formSubmitRef]);

  return (
    <MeetingModalShell
      open={open}
      onOpenChange={onOpenChange}
      currentStep={1}
      onStepClick={() => {}}
      saving={isSubmitting}
      submitLabel={mode === 'edit' ? 'تحديث' : 'حفظ'}
      cancelLabel="إلغاء"
      onNext={handleModalSubmit}
      onPrev={() => {}}
      onSubmit={handleModalSubmit}
      onSaveAsDraft={() => {}}
      hideSteps
      steps={[{ number: 1, label: "معلومات الاجتماع" }]}
      title={mode === 'edit' ? 'تعديل الاجتماع' : 'إنشاء اجتماع جديد'}
      subtitle="يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع"
    >
      <div className="flex flex-col gap-5">
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
            {isOther && <CalendarLocationCustomField />}
          </>
        )}

        <div className="border-t border-border/60 my-1" />

        <ProposersField />

        <div className="border-t border-border/60 my-1" />

        <InviteesTableForm
          tableRef={inviteesRef}
          initialInvitees={(initialInvitees ?? []) as any}
          meetingChannel={meetingChannel}
          showAiSuggest={false}
        />

        {submitError && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}
      </div>
    </MeetingModalShell>
  );
}

export default CalendarSlotMeetingForm;
