import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FormTable, FormInput, FormField, MeetingRangePicker, type MeetingRangeValue, OptionType, FormAsyncSelectV2, FormSelect } from '@/modules/shared';
import { createEmptyStep3InviteeRow } from '../features/MeetingForm/utils';
import type { InviteeFormRow } from '../features/MeetingForm/schemas/step3.schema';
import {
  MEETING_CHANNEL_OPTIONS,
  MEETING_LOCATION_OPTIONS,
  LOCATION_OPTIONS,
  INVITEES_TABLE_COLUMNS,
  getLocationDropdownValue,
  showLocationOtherInput,
  isPresetLocation,
} from '../features/MeetingForm/utils/constants';

import { searchByEmail, type ADUserByEmail } from '../data/adIntegrationApi';
import type { CreateScheduledMeetingProposer } from '../data/calendarApi';
import { X } from 'lucide-react';
import { cn, toISOStringWithTimezone } from '@/lib/ui';
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';
import { DynamicTableFormHandle } from '@/lib/dynamic-table-form';

/**
 * Show the same local date/time the user chose on the calendar.
 * startISO/endISO are UTC instants (e.g. from toISOString); local getters match wall clock in the browser.
 */
function isoRangeToMeetingRange(startISO: string, endISO: string): MeetingRangeValue {
  if (!startISO || !endISO) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const toHHmmLocal = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
  return {
    date: dateOnly,
    startTime: toHHmmLocal(start),
    endTime: toHHmmLocal(end),
    isFullDay: false,
  };
}

/** Build ISO with timezone offset for API (e.g. 2026-03-31T09:00:00+03:00). */
function meetingRangeToIso(value: MeetingRangeValue): { start: string; end: string } | null {
  if (!value.date) return null;
  const [sh, sm] = value.startTime.split(':').map(Number);
  const [eh, em] = value.endTime.split(':').map(Number);
  const start = new Date(value.date);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(value.date);
  end.setHours(eh, em, 0, 0);
  return { start: toISOStringWithTimezone(start), end: toISOStringWithTimezone(end) };
}

/** Build ISO in UTC so slot time (e.g. 13:00) is sent as 13:00 UTC; matches timeline. */
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
  /** Full proposer payloads for API */
  proposers?: CreateScheduledMeetingProposer[];
  invitees: InviteeFormRow[];
}

export interface CalendarSlotMeetingFormProps {
  /** Initial slot start (HH:mm) */
  slotDate: Date;
  slotTime: string;
  /** Initial slot end (HH:mm). If set, form shows exact range (e.g. 7:00–7:30). */
  slotEndTime?: string;
  /** Optional initial values when editing an existing scheduled meeting from the calendar */
  initialTitle?: string;
  initialMeetingChannel?: string;
  initialMeetingLocation?: string;
  initialMeetingLink?: string;
  /** From API when editing; send with meeting_link when updating */
  initialWebexMeetingUniqueId?: string;
  /** Pre-fill invitees table when editing (e.g. from event.attendees) */
  initialInvitees?: Array<Record<string, unknown>>;
  onSubmit: (values: CalendarSlotMeetingFormSubmitValues) => void;
  onCancel: () => void;
  /** When true, submit button is disabled (e.g. API in progress). */
  isSubmitting?: boolean;
  /** Error message to show above actions (e.g. API error). */
  submitError?: string | null;
}

export const CalendarSlotMeetingForm: React.FC<CalendarSlotMeetingFormProps> = ({
  slotDate,
  slotTime,
  slotEndTime,
  initialTitle,
  initialMeetingChannel,
  initialMeetingLocation,
  initialMeetingLink,
  initialWebexMeetingUniqueId,
  initialInvitees,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}) => {
  const [title, setTitle] = useState(initialTitle ?? '');
  const startDefault = toISOStart(slotDate, slotTime);
  const endDefault = useMemo(() => {
    if (slotEndTime) return toISOStart(slotDate, slotEndTime);
    const [h = 0, m = 0] = slotTime.split(':').map(Number);
    const d = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), h + 1, m, 0, 0);
    return toISOStringWithTimezone(d);
  }, [slotDate, slotTime, slotEndTime]);
  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(endDefault);
  const [meetingChannel, setMeetingChannel] = useState(initialMeetingChannel ?? '');
  const [meetingLocation, setMeetingLocation] = useState(initialMeetingLocation ?? '');
  const [meetingLocationOption, setMeetingLocationOption] = useState(
    initialMeetingLocation && isPresetLocation(initialMeetingLocation) ? initialMeetingLocation : ''
  );
  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);
  /** Each selected proposer keeps full AD row for API */
  const [proposerSelections, setProposerSelections] = useState<
    (ADUserByEmail & { id: string; label: string })[]
  >([]);

  const proposerAdByIdRef = useRef<Record<string, ADUserByEmail>>({});
  /** Cache from initial load on open; filtering when user types is client-side only (no API). */
  const proposerOptionsCacheRef = useRef<Array<{ value: string; label: string; email?: string }>>([]);

  const loadProposerAdOptions = useCallback(
    async (search: string, _skip: number, limit: number) => {
      const trimmed = search?.trim() ?? '';
      const selectedIds = new Set(proposerSelections.map((p) => p.id));
      const excludeSelected = <T extends { value: string }>(opts: T[]) =>
        opts.filter((o) => !selectedIds.has(o.value));

      if (trimmed.length < 1) {
        try {
          const initialLimit = 200;
          const users = await searchByEmail('', initialLimit);
          users.forEach((u) => {
            const k = u.objectGUID ?? u.mail ?? '';
            if (k) proposerAdByIdRef.current[k] = u;
          });
          const items = users.map((u) => {
            const fullName = u.displayNameAR ?? u.displayNameEN ?? u.displayName ?? '';
            const email = u.mail ?? '';
            const id = u.objectGUID ?? email ?? `ad-${email}`;
            return { value: id, label: fullName ? `${fullName} (${email})` : email, email };
          });
          proposerOptionsCacheRef.current = items;
          const out = excludeSelected(items).slice(0, limit);
          return {
            items: out,
            total: out.length,
            skip: 0,
            limit,
            has_next: false,
            has_previous: false,
          };
        } catch {
          return { items: [], total: 0, skip: 0, limit, has_next: false, has_previous: false };
        }
      }

      const cache = proposerOptionsCacheRef.current;
      const term = trimmed.toLowerCase();
      const filtered = excludeSelected(cache).filter(
        (o) =>
          (o.label && o.label.toLowerCase().includes(term)) ||
          (o.email && o.email.toLowerCase().includes(term))
      );
      const items = filtered.slice(0, limit);
      return {
        items,
        total: filtered.length,
        skip: 0,
        limit,
        has_next: false,
        has_previous: false,
      };
    },
    [proposerSelections]
  );

  const addProposer = useCallback((opt: { value: string; label: string; email?: string }) => {
    const fromMap = proposerAdByIdRef.current[opt.value];
    const base: ADUserByEmail = fromMap ?? {
      objectGUID: opt.value.startsWith('ad-') ? undefined : opt.value,
      mail: opt.email ?? (opt.value.startsWith('ad-') ? opt.value.slice(3) : opt.value),
      displayName: opt.label.split(/\s+\(/)[0]?.trim(),
    };
    const id = base.objectGUID ?? base.mail ?? opt.value;
    setProposerSelections((prev) => {
      if (prev.some((p) => p.id === id)) return prev;
      return [...prev, { ...base, id, label: opt.label }];
    });
  }, []);

  const removeProposer = useCallback((id: string) => {
    setProposerSelections((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const [titleTouched, setTitleTouched] = useState(false);
  const titleTrimmed = title.trim();
  const showTitleError = titleTouched && !titleTrimmed;
  const [pastDateError, setPastDateError] = useState<string | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);

  const isPhysical = meetingChannel === 'PHYSICAL';
  const locationDropdownValue = getLocationDropdownValue(meetingLocation, meetingLocationOption);
  const showLocationOtherInputField = showLocationOtherInput(meetingLocation, meetingLocationOption);
  const locationRequired = isPhysical;
  const locationValid = !locationRequired || (locationDropdownValue === LOCATION_OPTIONS.OTHER ? meetingLocation.trim() !== '' : locationDropdownValue !== '');
  const showLocationError = locationTouched && locationRequired && !locationValid;

  const [isCreatingWebex, setIsCreatingWebex] = useState(false);
  const [webexMeetingLink, setWebexMeetingLink] = useState<string | null>(initialMeetingLink ?? null);
  const [webexMeetingUniqueId, setWebexMeetingUniqueId] = useState<string | null>(initialWebexMeetingUniqueId ?? null);
  const [webexError, setWebexError] = useState<string | null>(null);
  const webexCreatedForSlotRef = React.useRef<string | null>(
    initialMeetingLink && startDefault && endDefault ? `${startDefault}-${endDefault}` : null
  );

  const isRemote = meetingChannel === 'VIRTUAL' || meetingChannel === 'HYBRID';

  const handleMeetingChannelChange = useCallback((value: string) => {
    setMeetingChannel(value);
    if (value !== 'PHYSICAL') {
      setMeetingLocation('');
      setMeetingLocationOption('');
    }
    if (value === 'PHYSICAL') {
      setWebexMeetingLink(null);
      setWebexMeetingUniqueId(null);
      setWebexError(null);
      webexCreatedForSlotRef.current = null;
    }
  }, []);

  const handleLocationOptionChange = useCallback((value: string) => {
    setMeetingLocationOption(value);
    setMeetingLocation(isPresetLocation(value) ? value : '');
  }, []);

  const webexSlotRef = React.useRef<string | null>(null);

  // Auto-create Webex meeting when channel is VIRTUAL/HYBRID and date/time are set
  useEffect(() => {
    if (!isRemote || !startDate || !endDate || webexMeetingLink || isCreatingWebex) return;

    const start = new Date(startDate).getTime();
    if (start <= Date.now()) return;

    const slotKey = `${startDate}-${endDate}`;
    webexSlotRef.current = slotKey;

    const createWebexAsync = async () => {
      setIsCreatingWebex(true);
      setWebexError(null);
      try {
        const startDateUTC = new Date(startDate);
        const year = startDateUTC.getUTCFullYear();
        const month = String(startDateUTC.getUTCMonth() + 1).padStart(2, '0');
        const day = String(startDateUTC.getUTCDate()).padStart(2, '0');
        const hours = String(startDateUTC.getUTCHours()).padStart(2, '0');
        const minutes = String(startDateUTC.getUTCMinutes()).padStart(2, '0');
        const seconds = String(startDateUTC.getUTCSeconds()).padStart(2, '0');
        const webexDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const durationMinutes = Math.max(
          1,
          Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (60 * 1000))
        );

        const response = await createWebexMeeting({
          meeting_title: title.trim() || 'اجتماع',
          start_datetime: webexDateTime,
          time_zone: 'UTC',
          duration_minutes: durationMinutes,
        });

        if (webexSlotRef.current === slotKey) {
          setWebexMeetingLink(response.data.webex_meeting_join_link);
          setWebexMeetingUniqueId(response.data.webex_meeting_unique_identifier);
          webexCreatedForSlotRef.current = slotKey;
        }
      } catch (err) {
        console.error('Failed to create Webex meeting:', err);
        if (webexSlotRef.current === slotKey) {
          setWebexError('فشل في إنشاء اجتماع Webex. يرجى المحاولة مرة أخرى.');
        }
      } finally {
        setIsCreatingWebex(false);
      }
    };

    const timeoutId = setTimeout(createWebexAsync, 500);
    return () => clearTimeout(timeoutId);
  }, [isRemote, startDate, endDate, title, webexMeetingLink, isCreatingWebex]);

  // Clear Webex only when the time slot actually changes (avoids wiping link when MeetingRangePicker re-emits same instant)
  useEffect(() => {
    if (!isRemote) return;
    const slotKey = startDate && endDate ? `${startDate}-${endDate}` : '';
    const prev = webexCreatedForSlotRef.current;
    if (!slotKey || !prev || slotKey === prev) return;
    if (webexMeetingLink || webexError) {
      setWebexMeetingLink(null);
      setWebexMeetingUniqueId(null);
      setWebexError(null);
      webexCreatedForSlotRef.current = null;
    }
  }, [isRemote, startDate, endDate, webexMeetingLink, webexError]);

  const getMeetingLocationForSubmit = useCallback((): string | undefined => {
    if (!isPhysical) return undefined;
    const loc = meetingLocation?.trim() ?? '';
    if (isPresetLocation(loc)) return loc;
    if (loc !== '') return loc;
    if (isPresetLocation(locationDropdownValue)) return locationDropdownValue;
    if (locationDropdownValue === LOCATION_OPTIONS.OTHER && loc !== '') return loc;
    return undefined;
  }, [isPhysical, meetingLocation, locationDropdownValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTitleTouched(true);
    setPastDateError(null);
    setLocationTouched(true);
    if (!titleTrimmed) return;
    if (!meetingChannel.trim()) return;
    const start = startDate ? new Date(startDate).getTime() : 0;
    if (start <= Date.now()) {
      setPastDateError('لا يمكن إنشاء اجتماع في وقت مضى. يرجى اختيار تاريخ ووقت في المستقبل.');
      return;
    }
    if (locationRequired && !locationValid) return;
    if (isRemote && !webexMeetingLink) return;
    const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    const meeting_location = getMeetingLocationForSubmit();

    const proposers: CreateScheduledMeetingProposer[] | undefined =
      proposerSelections.length > 0
        ? proposerSelections.map((p) => ({
            object_guid: p.objectGUID ?? p.mail ?? p.id,
            email: p.mail ?? '',
            name: p.displayNameAR ?? p.displayNameEN ?? p.displayName ?? p.label ?? p.mail ?? '',
            name_ar: p.displayNameAR,
            name_en: p.displayNameEN,
            mobile: p.mobile,
            title: p.title,
            department: p.department,
            company: p.company,
            given_name: p.givenName,
            sn: p.sn,
            cn: p.cn,
          }))
        : undefined;

    onSubmit({
      title: titleTrimmed,
      start_date: startDate,
      end_date: endDate,
      meeting_channel: meetingChannel,
      meeting_location,
      meeting_link: webexMeetingLink ?? undefined,
      webex_meeting_unique_identifier: webexMeetingUniqueId ?? undefined,
      proposers,
      invitees: inviteesPayload,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-2" dir="rtl">
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

        <FormField className="w-full min-w-0" label="موعد الاجتماع المقترح" required>
          <MeetingRangePicker
            value={isoRangeToMeetingRange(startDate, endDate)}
            onChange={(v) => {
              setPastDateError(null);
              const iso = meetingRangeToIso(v);
              if (iso) {
                setStartDate(iso.start);
                setEndDate(iso.end);
              } else {
                setStartDate('');
                setEndDate('');
              }
            }}
            minDate={minStartDate}
            placeholder="اختر التاريخ والوقت"
          />
        </FormField>
        {pastDateError && (
          <p className="text-right text-sm text-red-600">{pastDateError}</p>
        )}

        <FormField className="w-full min-w-0" label="آلية انعقاد الاجتماع" required>
          <FormSelect
            value={meetingChannel}
            onValueChange={handleMeetingChannelChange}
            options={MEETING_CHANNEL_OPTIONS}
            placeholder="حضوري / افتراضي / مختلط"
            error={false}
          />
        </FormField>

        {isRemote && (
          <>
            {isCreatingWebex && (
              <div className="flex items-center gap-2 text-sm text-[#667085]">
                <div className="w-4 h-4 border-2 border-[#008774] border-t-transparent rounded-full animate-spin" />
                <span>جاري إنشاء اجتماع Webex...</span>
              </div>
            )}
            {webexError && (
              <p className="text-right text-sm text-red-600">{webexError}</p>
            )}
            {webexMeetingLink && !isCreatingWebex && (
              <FormField className="w-full min-w-0" label="رابط الاجتماع">
                <FormInput
                  value={webexMeetingLink}
                  readOnly
                  fullWidth
                  className="bg-gray-50"
                />
              </FormField>
            )}
          </>
        )}

        {isPhysical && (
          <>
            <FormField
              className="w-full min-w-0"
              label="الموقع"
              required
              error={showLocationError ? 'الموقع مطلوب' : undefined}
            >
              <FormSelect
                value={locationDropdownValue || undefined}
                onValueChange={(v) => handleLocationOptionChange(v ?? '')}
                options={MEETING_LOCATION_OPTIONS}
                placeholder="اختر الموقع"
                error={showLocationError}
              />
            </FormField>
            {showLocationOtherInputField && (
              <FormField
                className="w-full min-w-0"
                label="تحديد الموقع (موقع آخر)"
                required
                error={showLocationError ? 'الموقع مطلوب' : undefined}
              >
                <FormInput
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  onBlur={() => setLocationTouched(true)}
                  placeholder="أدخل الموقع"
                  error={showLocationError}
                  fullWidth
                />
              </FormField>
            )}
          </>
        )}

        {/* المقترحون — search by email (AD), same as invitees */}
        <div className="w-full flex flex-col gap-3">
          <h3 className="text-right text-[22px] font-bold text-[#101828]">المقترحون</h3>
          <p className="text-right text-[14px] text-[#667085]">
            المستخدمون الذين يتلقون إشعاراً دون إضافتهم كمدعوين (اختياري).
          </p>
          <FormAsyncSelectV2
            key={proposerSelections.length}
            value={null}
            onValueChange={(opt) => {
              if (opt) addProposer(opt);
            }}
            loadOptions={loadProposerAdOptions}
            placeholder="ابحث بالبريد أو اختر..."
            isClearable
            fullWidth
            isSearchable
            limit={10}
            defaultOptions={true}
            searchPlaceholder="اكتب البريد للبحث..."
            emptyMessage="لم يتم العثور على مستخدمين"
          />
          {proposerSelections.length > 0 && (
            <div
              className={cn(
                'w-full border border-[#D0D5DD] rounded-lg overflow-hidden p-4',
                'bg-white max-h-[200px] overflow-y-auto'
              )}
            >
              <ul className="flex flex-col gap-2">
                {proposerSelections.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 justify-end cursor-pointer hover:bg-[#F9FAFB] rounded px-2 py-1.5 -mx-2"
                  >
                    <span className="text-[14px] text-[#344054]">
                      {p.label}
                      {p.mail ? ` (${p.mail})` : ''}
                    </span>
                    <button
                      type="button"
                      aria-label="إزالة"
                      onClick={() => removeProposer(p.id)}
                      className="flex items-center justify-center shrink-0 w-6 h-6 rounded border border-[#D0D5DD] hover:bg-red-50 hover:border-red-300 text-[#667085] hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
{/* 
        <FormTable
          title="المدعوون (مقدم الطلب)"
          columns={INVITEES_TABLE_COLUMNS}
          rows={inviteeRows}
          onAddRow={handleAddInvitee}
          onDeleteRow={handleDeleteInvitee}
          onUpdateRow={handleUpdateInvitee}
          addButtonLabel="إضافة مدعو"
          emptyStateMessage="لا يوجد مدعوون"
          customCellRender={{
            email: inviteeEmailCellRender,
          }}
        /> */}

        <InviteesTableForm
          tableRef={inviteesRef}
          initialInvitees={initialInvitees ?? []}
          showAiSuggest={false}
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
            disabled={
              isSubmitting ||
              !titleTrimmed ||
              !meetingChannel.trim() ||
              (locationRequired && !locationValid) ||
              (isRemote && (!webexMeetingLink || isCreatingWebex))
            }
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
