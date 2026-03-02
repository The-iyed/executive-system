import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FormTable, FormInput, FormField, MeetingRangePicker, type MeetingRangeValue, OptionType, FormAsyncSelectV2, FormCheckbox, FormSelect } from '@/modules/shared';
import { createEmptyStep3InviteeRow } from '../features/MeetingForm/utils';
import type { InviteeFormRow } from '../features/MeetingForm/schemas/step3.schema';
import {
  MEETING_CHANNEL_OPTIONS,
  MEETING_LOCATION_OPTIONS,
  LOCATION_OPTIONS,
  MINISTER_INVITEES_TABLE_COLUMNS,
  getLocationDropdownValue,
  showLocationOtherInput,
} from '../features/MeetingForm/utils/constants';
import { createWebexMeeting } from '../data/meetingsApi';
import { searchByEmail } from '../data/adIntegrationApi';
import { X } from 'lucide-react';
import { cn } from '@sanad-ai/ui';

/** Display in UTC so scheduled_start/scheduled_end match what the user sees (timeline uses UTC). */
function isoRangeToMeetingRange(startISO: string, endISO: string): MeetingRangeValue {
  if (!startISO || !endISO) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { date: null, startTime: '09:00', endTime: '10:00', isFullDay: false };
  }
  const toHHmmUTC = (d: Date) =>
    `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return {
    date: start,
    startTime: toHHmmUTC(start),
    endTime: toHHmmUTC(end),
    isFullDay: false,
  };
}

/** Build ISO in UTC so 13:00–14:00 displayed is sent as 13:00–14:00 UTC (no -1h). */
function meetingRangeToIso(value: MeetingRangeValue): { start: string; end: string } | null {
  if (!value.date) return null;
  const [sh, sm] = value.startTime.split(':').map(Number);
  const [eh, em] = value.endTime.split(':').map(Number);
  // Use local calendar day (picker gives midnight local) + time as UTC
  const y = value.date.getFullYear();
  const mo = value.date.getMonth();
  const d = value.date.getDate();
  const start = new Date(Date.UTC(y, mo, d, sh, sm, 0, 0));
  const end = new Date(Date.UTC(y, mo, d, eh, em, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

const MANUAL_ENTRY_VALUE = '__manual__';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/** Build ISO in UTC so slot time (e.g. 13:00) is sent as 13:00 UTC; matches timeline. */
function toISOStart(date: Date, time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0));
  return d.toISOString();
}

export interface CalendarSlotMeetingFormSubmitValues {
  title: string;
  start_date: string;
  end_date: string;
  meeting_channel: string;
  meeting_location?: string;
  meeting_link?: string;
  proposer_user_ids?: string[];
  minister_invitees: InviteeFormRow[];
}

export interface CalendarSlotMeetingFormProps {
  /** Initial slot: date and time string "HH:00" */
  slotDate: Date;
  slotTime: string;
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
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
}) => {
  const [title, setTitle] = useState('');
  const startDefault = toISOStart(slotDate, slotTime);
  const endDefault = useMemo(() => {
    const [h = 0, m = 0] = slotTime.split(':').map(Number);
    const d = new Date(Date.UTC(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), h + 1, m, 0, 0));
    return d.toISOString();
  }, [slotDate, slotTime]);
  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(endDefault);
  const [meetingChannel, setMeetingChannel] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingLocationOption, setMeetingLocationOption] = useState('');
  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [ministerInvitees, setMinisterInvitees] = useState<InviteeFormRow[]>([]);
  const [proposerSelections, setProposerSelections] = useState<{ id: string; label: string; email?: string }[]>([]);

  const loadProposerAdOptions = useCallback(
    async (search: string, _skip: number, limit: number) => {
      const trimmed = search?.trim() ?? '';
      if (trimmed.length < 1) {
        return { items: [], total: 0, skip: 0, limit, has_next: false, has_previous: false };
      }
      try {
        const users = await searchByEmail(trimmed, limit);
        const selectedIds = new Set(proposerSelections.map((p) => p.id));
        const items = users
          .filter((u) => !selectedIds.has(u.objectGUID ?? u.mail ?? ''))
          .map((u) => {
            const fullName = u.displayNameAR ?? u.displayNameEN ?? u.displayName ?? '';
            const email = u.mail ?? '';
            const id = u.objectGUID ?? email ?? `ad-${email}`;
            return {
              value: id,
              label: fullName ? `${fullName} (${email})` : email,
              email,
            };
          });
        return {
          items,
          total: items.length,
          skip: 0,
          limit,
          has_next: false,
          has_previous: false,
        };
      } catch {
        return { items: [], total: 0, skip: 0, limit, has_next: false, has_previous: false };
      }
    },
    [proposerSelections]
  );

  const addProposer = useCallback((opt: { value: string; label: string; email?: string }) => {
    setProposerSelections((prev) => {
      if (prev.some((p) => p.id === opt.value)) return prev;
      return [...prev, { id: opt.value, label: opt.label, email: opt.email }];
    });
  }, []);

  const removeProposer = useCallback((id: string) => {
    setProposerSelections((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const loadAdOptionsByEmail = useCallback(
    async (search: string, skip: number, limit: number) => {
      const trimmed = search?.trim() ?? '';
      if (trimmed.length < 1) {
        return { items: [], total: 0, skip: 0, limit, has_next: false, has_previous: false };
      }
      try {
        const users = await searchByEmail(trimmed, limit);
        const items = users.map((u) => {
          const fullName = u.displayNameAR ?? u.displayNameEN ?? u.displayName ?? '';
          const email = u.mail ?? '';
          return {
            value: u.objectGUID ?? email ?? `ad-${email}`,
            label: fullName ? `${fullName} (${email})` : email,
            email,
            full_name: fullName,
            position_title: u.title ?? '',
            mobile_number: u.mobile ?? '',
            sector: u.department ?? u.company ?? '',
          };
        });
        const manualOption = {
          value: MANUAL_ENTRY_VALUE,
          label: 'إدخال يدوي (بريد غير مسجل)',
        };
        return {
          items: skip === 0 ? [...items, manualOption] : items,
          total: skip === 0 ? items.length + 1 : items.length,
          skip: 0,
          limit,
          has_next: false,
          has_previous: false,
        };
      } catch {
        return { items: [], total: 0, skip: 0, limit, has_next: false, has_previous: false };
      }
    },
    []
  );

  const ministerEmailCellRender = useCallback(
    (params: import('@/modules/shared').CustomCellRenderParams) => {
      const { row, onUpdateRow, disabled = false } = params;
      const isManual = row._isManual === true;

      if (isManual) {
        return (
          <FormInput
            type="email"
            inputMode="email"
            value={row.email ?? ''}
            onChange={(e) => onUpdateRow('email', e.target.value)}
            placeholder="البريد"
            fullWidth
            disabled={disabled}
          />
        );
      }

      const value: OptionType | null =
        row.email
          ? { value: (row as { _adUserId?: string })._adUserId || row.email, label: row.full_name ? `${row.full_name} (${row.email})` : row.email }
          : null;

      return (
        <FormAsyncSelectV2
          value={value}
          onValueChange={(opt) => {
            if (!opt) {
              onUpdateRow('full_name', '');
              onUpdateRow('position_title', '');
              onUpdateRow('mobile_number', '');
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              onUpdateRow('_isManual', false);
              onUpdateRow('_adUserId', '');
              return;
            }
            if (opt.value === MANUAL_ENTRY_VALUE) {
              onUpdateRow('_isManual', true);
              onUpdateRow('_adUserId', '');
              onUpdateRow('full_name', '');
              onUpdateRow('position_title', '');
              onUpdateRow('mobile_number', '');
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              return;
            }
            const u = opt as { full_name?: string; position_title?: string; mobile_number?: string; email?: string; sector?: string };
            onUpdateRow('_isManual', false);
            onUpdateRow('_adUserId', opt.value);
            onUpdateRow('full_name', u.full_name ?? '');
            onUpdateRow('position_title', u.position_title ?? '');
            onUpdateRow('mobile_number', u.mobile_number ?? '');
            onUpdateRow('email', u.email ?? '');
            onUpdateRow('sector', u.sector ?? '');
          }}
          loadOptions={loadAdOptionsByEmail}
          placeholder="ابحث بالبريد أو أدخل يدوياً"
          isClearable
          fullWidth
          isSearchable
          limit={10}
          defaultOptions={false}
          searchPlaceholder="اكتب البريد للبحث..."
          emptyMessage="لم يتم العثور على مستخدمين"
        />
      );
    },
    [loadAdOptionsByEmail]
  );

  const handleAddMinisterInvitee = useCallback(() => {
    setMinisterInvitees((prev) => [...prev, createEmptyStep3InviteeRow()]);
  }, []);

  const handleDeleteMinisterInvitee = useCallback((id: string) => {
    setMinisterInvitees((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUpdateMinisterInvitee = useCallback((id: string, field: string, value: unknown) => {
    setMinisterInvitees((prev) => {
      if (field === 'isOwner' && value === true) {
        return prev.map((r) => ({
          ...r,
          isOwner: r.id === id,
        }));
      }
      return prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    });
  }, []);

  const ministerRows = ministerInvitees.map((row) => ({ ...row, id: row.id }));

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
  const [webexMeetingLink, setWebexMeetingLink] = useState<string | null>(null);
  const [webexError, setWebexError] = useState<string | null>(null);

  const isRemote = meetingChannel === 'VIRTUAL' || meetingChannel === 'HYBRID';

  const handleMeetingChannelChange = useCallback((value: string) => {
    setMeetingChannel(value);
    if (value !== 'PHYSICAL') {
      setMeetingLocation('');
      setMeetingLocationOption('');
    }
    if (value === 'PHYSICAL') {
      setWebexMeetingLink(null);
      setWebexError(null);
    }
  }, []);

  const handleLocationOptionChange = useCallback((value: string) => {
    setMeetingLocationOption(value);
    setMeetingLocation(
      value === LOCATION_OPTIONS.ALIYA || value === LOCATION_OPTIONS.GHADEER ? value : ''
    );
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

  // Clear Webex link when date/time change so we recreate with new slot
  useEffect(() => {
    if (isRemote && (webexMeetingLink || webexError)) {
      setWebexMeetingLink(null);
      setWebexError(null);
    }
  }, [isRemote, startDate, endDate]);

  const getMeetingLocationForSubmit = useCallback((): string | undefined => {
    if (!isPhysical) return undefined;
    const loc = meetingLocation?.trim() ?? '';
    if (loc === LOCATION_OPTIONS.ALIYA || loc === LOCATION_OPTIONS.GHADEER) return loc;
    if (loc !== '') return loc;
    if (locationDropdownValue === LOCATION_OPTIONS.ALIYA || locationDropdownValue === LOCATION_OPTIONS.GHADEER) {
      return locationDropdownValue;
    }
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

    const meeting_location = getMeetingLocationForSubmit();

    onSubmit({
      title: titleTrimmed,
      start_date: startDate,
      end_date: endDate,
      meeting_channel: meetingChannel,
      meeting_location,
      meeting_link: webexMeetingLink ?? undefined,
      proposer_user_ids: proposerSelections.length > 0 ? proposerSelections.map((p) => p.id) : undefined,
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

        <FormField className="w-full min-w-0" label="موعد الاجتماع" required>
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
            defaultOptions={false}
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
                      {p.email ? ` (${p.email})` : ''}
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

        <FormTable
          title="قائمة المدعوين (الوزير)"
          columns={MINISTER_INVITEES_TABLE_COLUMNS}
          rows={ministerRows}
          onAddRow={handleAddMinisterInvitee}
          onDeleteRow={handleDeleteMinisterInvitee}
          onUpdateRow={handleUpdateMinisterInvitee}
          addButtonLabel="إضافة مدعو للوزير"
          emptyStateMessage="لا يوجد مدعوون من الوزير"
          customCellRender={{
            email: ministerEmailCellRender,
            isOwner: ({ row, onUpdateRow, disabled }) => (
              <div className="flex justify-center" title="اختيار مالك الاجتماع">
                <FormCheckbox
                  checked={!!row.isOwner}
                  onCheckedChange={(checked) => {
                    if (disabled) return;
                    onUpdateRow('isOwner', checked);
                  }}
                  label=""
                  className="!flex-row !items-center !gap-0"
                />
              </div>
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
