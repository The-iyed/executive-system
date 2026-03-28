import React, { useRef, useMemo, useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { startOfDay } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { Button, cn, toISOStringWithTimezone } from "@/lib/ui";
import { Drawer } from "@/modules/shared";
import { DynamicTableFormHandle } from "@/lib/dynamic-table-form";
import { InviteesTableForm } from "@/modules/shared/features/invitees-table-form";
import {
  MeetingTitleField,
  DescriptionField,
  SectorField,
  MeetingTypeField,
  IsUrgentField,
  UrgentReasonField,
  MeetingDateField,
  MeetingChannelField,
  LocationField,
  LocationCustomField,
  MeetingCategoryField,
  ConfidentialityField,
  NoteField,
} from "@/modules/shared/features/meeting-request-form/shared/fields";
import { scrollToFirstError } from "@/modules/shared/features/meeting-request-form/shared/utils/scrollToFirstError";
import { useCalendarMeetingForm } from "./useCalendarMeetingForm";
import type { CalendarMeetingValues } from "./schema";
import type { SlotSelection } from "../../types";

/* ─── Helpers ─── */
function toISOStart(date: Date, time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  return toISOStringWithTimezone(d);
}

/* ─── Props ─── */
export interface CreateMeetingModalProps {
  slot: SlotSelection | null;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function CreateMeetingModal({
  slot,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: CreateMeetingModalProps) {
  if (!slot) return null;

  return (
    <Drawer open={!!slot} onOpenChange={(open) => !open && onClose()} width="100%" bodyClassName="p-0">
      <CreateMeetingModalContent
        slot={slot}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </Drawer>
  );
}

/* ─── Inner Content (separate to reset form on slot change) ─── */
function CreateMeetingModalContent({
  slot,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: Omit<CreateMeetingModalProps, "slot"> & { slot: SlotSelection }) {
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  const startDefault = useMemo(() => toISOStart(slot.date, slot.time), [slot.date, slot.time]);
  const endDefault = useMemo(() => {
    if (slot.endTime) return toISOStart(slot.date, slot.endTime);
    const [h = 0, m = 0] = slot.time.split(":").map(Number);
    const d = new Date(slot.date.getFullYear(), slot.date.getMonth(), slot.date.getDate(), h + 1, m, 0, 0);
    return toISOStringWithTimezone(d);
  }, [slot.date, slot.time, slot.endTime]);

  const { form, visibility, watched } = useCalendarMeetingForm({
    initialStartDate: startDefault,
    initialEndDate: endDefault,
    initialChannel: slot.meetingChannel,
    initialLocation: slot.meetingLocation ?? undefined,
    initialTitle: slot.title,
  });

  const minDate = useMemo(() => startOfDay(new Date()), []);
  const isEdit = slot.mode === "edit";

  const handleFormSubmit = useCallback(
    (data: CalendarMeetingValues) => {
      // Validate invitees
      const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
      if (!inviteesPayload) return;

      onSubmit({
        title: data.meeting_title,
        start_date: data.meeting_start_date,
        end_date: data.meeting_end_date,
        meeting_channel: data.meeting_channel,
        meeting_location:
          data.meeting_location === "موقع آخر"
            ? data.meeting_location_custom
            : data.meeting_location || undefined,
        invitees: inviteesPayload,
      });
    },
    [onSubmit],
  );

  const handleSave = form.handleSubmit(handleFormSubmit, (errors) => scrollToFirstError(form, errors));

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? "تعديل الاجتماع" : "إنشاء اجتماع جديد"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit
              ? "قم بتعديل معلومات الاجتماع ثم اضغط حفظ"
              : "قم بتعبئة معلومات الاجتماع ثم اضغط حفظ لإنشاء الاجتماع"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <FormProvider {...form}>
          <form id="calendar-meeting-form" onSubmit={handleSave}>
            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-5">
              <MeetingTitleField />
              <DescriptionField />
              <MeetingTypeField />
              {visibility.sector && <SectorField required />}
              <IsUrgentField />
              {visibility.urgent_reason && <UrgentReasonField />}
              <MeetingDateField
                startName="meeting_start_date"
                endName="meeting_end_date"
                required
                minDate={minDate}
              />
              <MeetingChannelField />
              {visibility.meeting_location && (
                <>
                  <LocationField />
                  {visibility.meeting_location_custom && <LocationCustomField />}
                </>
              )}
              <MeetingCategoryField meetingType={watched.meeting_type} />
              <ConfidentialityField />
            </div>

            {/* Notes */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
              <NoteField />
            </div>
          </form>
        </FormProvider>

        {/* Invitees Table (outside FormProvider — has its own state) */}
        <div className="mt-8">
          <InviteesTableForm
            tableRef={inviteesRef}
            initialInvitees={(slot.initialInvitees ?? []) as any}
            meetingChannel={watched.meeting_channel}
            showAiSuggest={false}
          />
        </div>

        {/* Error */}
        {submitError && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-right">{submitError}</p>
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 bg-card shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          form="calendar-meeting-form"
          disabled={isSubmitting}
          className="min-w-[120px] bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal))]/90 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              {isEdit ? "جاري التحديث..." : "جاري الحفظ..."}
            </>
          ) : (
            isEdit ? "تحديث" : "حفظ"
          )}
        </Button>
      </div>
    </div>
  );
}
