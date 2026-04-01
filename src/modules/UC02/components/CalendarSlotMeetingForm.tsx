import React, { useMemo, useRef, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Settings } from 'lucide-react';
import { cn, toISOStringWithTimezone } from '@/lib/ui';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/lib/ui';

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

interface InviteeFormRow {
  id?: string;
  name?: string;
  entity?: string;
  job_title?: string;
  attendance_mechanism?: string;
  [key: string]: unknown;
}
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
  requires_protocol?: boolean;
  is_data_complete?: boolean;
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
  /** Hide the proposed meeting date/time fields (used for quick meeting) */
  hideProposedTime?: boolean;
}

const calendarMeetingSchema = z.object({
  meeting_title: z.string().trim().min(1, "عنوان الاجتماع مطلوب"),
  meeting_start_date: z.string().min(1, "موعد البداية مطلوب"),
  meeting_end_date: z.string().min(1, "موعد النهاية مطلوب"),
  meeting_channel: z.string().min(1, "آلية انعقاد الاجتماع مطلوب"),
  meeting_location: z.string().default(""),
  meeting_location_custom: z.string().default(""),
  proposers: z.array(z.any()).default([]),
  requires_protocol: z.boolean().default(false),
  is_data_complete: z.boolean().default(false),
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
  hideProposedTime = false,
}) => {
  const startDefault = slotTime ? toISOStart(slotDate, slotTime) : '';
  const endDefault = useMemo(() => {
    if (!slotTime) return '';
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
      requires_protocol: false,
      is_data_complete: false,
    },
  });

  // Stabilize initialInvitees reference to prevent useEffect reset in InviteesTableForm
  const stableInitialInvitees = useMemo(
    () => initialInvitees ?? [],
    [initialInvitees]
  );

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
        initialInvitees={stableInitialInvitees}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={onCancel}
        hideProposedTime={hideProposedTime}
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
  initialInvitees: Array<Record<string, unknown>>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: CalendarSlotMeetingFormSubmitValues) => void;
  onCancel: () => void;
  hideProposedTime?: boolean;
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
  hideProposedTime = false,
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
      if (!hideProposedTime && start <= Date.now()) return;

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
        requires_protocol: data.requires_protocol,
        is_data_complete: data.is_data_complete,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-right text-[17px] font-bold text-foreground">
              {mode === 'edit' ? 'تعديل الاجتماع' : 'إنشاء اجتماع جديد'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground mt-1 text-right">
            يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع
          </p>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          {/* Basic info section */}
          <div className="flex flex-col gap-4">
            <MeetingTitleField />

            {!hideProposedTime && (
              <MeetingDateField
                startName="meeting_start_date"
                endName="meeting_end_date"
                required
                minDate={minStartDate}
              />
            )}

            <MeetingChannelField />

            {showLocation && (
              <>
                <LocationField />
                {isOther && <LocationCustomField />}
              </>
            )}
          </div>

          <div className="border-t border-border/40" />

          {/* Proposers section */}
          <ProposersField />

          <div className="border-t border-border/40" />

          {/* Scheduling Settings */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-[14px] font-semibold text-foreground">إعدادات الجدولة</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="requires_protocol"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all text-right',
                      !field.value
                        ? 'border-border/60 bg-background hover:bg-muted/30'
                        : 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                      field.value ? 'bg-primary border-primary' : 'border-border'
                    )}>
                      {field.value && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-foreground">مبدئي</span>
                      <span className="text-[11px] text-muted-foreground">يتطلب بروتوكول</span>
                    </div>
                  </button>
                )}
              />
              <Controller
                name="is_data_complete"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all text-right',
                      field.value
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/60 bg-background hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                      field.value ? 'bg-primary border-primary' : 'border-border'
                    )}>
                      {field.value && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-foreground">البيانات مكتملة</span>
                      <span className="text-[11px] text-muted-foreground">جميع البيانات جاهزة</span>
                    </div>
                  </button>
                )}
              />
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Invitees section */}
          <InviteesTableForm
            tableRef={inviteesRef}
            initialInvitees={initialInvitees as any}
            meetingChannel={meetingChannel}
            showAiSuggest={false}
          />

          {submitError && (
            <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20">
              <p className="text-[13px] text-destructive text-right font-medium">{submitError}</p>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex flex-row-reverse items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleModalSubmit}
            className="px-6 py-2.5 text-[13px] font-bold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'جاري الحفظ...' : mode === 'edit' ? 'تحديث' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-[13px] font-medium text-muted-foreground bg-background border border-border/60 rounded-xl hover:bg-muted/40 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CalendarSlotMeetingForm;
