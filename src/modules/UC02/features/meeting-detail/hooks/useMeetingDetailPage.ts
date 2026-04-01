/**
 * Main hook for UC02 Meeting Detail page.
 * Encapsulates: data fetching, mutations, form state, computed values, tab logic.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MeetingStatus,
  MeetingStatusLabels,
  MeetingOwnerType,
  hasUseCaseAccess,
  toISOStringWithTimezone,
} from '@/modules/shared';
import { useAuth } from '@/modules/auth';
import {
  getMeetingRequestById,
  getMeetingById,
  rejectMeeting,
  cancelMeeting,
  sendToContent,
  sendToContentScheduled,
  returnMeetingForInfo,
  approveMeetingUpdate,
  scheduleMeeting,
  rescheduleMeeting,
  moveToWaitingList,
  updateMeetingRequest,
} from '../../../data/meetingsApi';
import { deleteDraft } from '../../../data/draftApi';
import { PATH as UC02_PATH } from '../../../routes/paths';
import { PATH as UC01_PATH } from '../../../../UC01/routes/paths';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/lib/ui/components/use-toast';
import { getMeetingLocationDropdownValue } from '@/modules/shared';
import { getGeneralNotesList } from '../utils/meetingDetailHelpers';
import { fieldLabels, TABS_HIDDEN_WHEN_SCHEDULED } from '../constants';

/* ─── Schedule form type ─── */
export interface ScheduleFormState {
  scheduled_at: string;
  scheduled_end_at: string;
  meeting_channel: 'PHYSICAL' | 'PHYSICAL_LOCATION_1' | 'PHYSICAL_LOCATION_2' | 'PHYSICAL_LOCATION_3' | 'VIRTUAL' | 'HYBRID';
  is_preliminary_booking: boolean;
  protocol_type: string | null;
  protocol_type_text: string;
  is_data_complete: boolean;
  notes: string;
  location: string;
  location_option: string;
  selected_time_slot_id: string | null;
}

const INITIAL_SCHEDULE_FORM: ScheduleFormState = {
  scheduled_at: '',
  scheduled_end_at: '',
  meeting_channel: 'PHYSICAL',
  requires_protocol: false,
  protocol_type: null,
  protocol_type_text: '',
  is_data_complete: true,
  notes: '',
  location: '',
  location_option: '',
  selected_time_slot_id: null,
};




export function useMeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isScheduleOfficer = hasUseCaseAccess(user?.use_cases, 'UC-02');

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<string>('request-info');

  /* ── Modal open states ── */
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isDeleteDraftModalOpen, setIsDeleteDraftModalOpen] = useState(false);
  const [isWaitingListConfirmOpen, setIsWaitingListConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSendToContentModalOpen, setIsSendToContentModalOpen] = useState(false);
  const [isApproveUpdateModalOpen, setIsApproveUpdateModalOpen] = useState(false);
  const [isReturnForInfoModalOpen, setIsReturnForInfoModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleConfirmModalOpen, setScheduleConfirmModalOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [actionsBarOpen, setActionsBarOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);

  /* ── Form states ── */
  const [rejectForm, setRejectForm] = useState({ reason: '', notes: '' });
  
  const [sendToContentForm, setSendToContentForm] = useState({ notes: '' });
  const [approveUpdateForm, setApproveUpdateForm] = useState({ notes: '' });
  const [returnForInfoNotes, setReturnForInfoNotes] = useState('');
  const [returnForInfoNotesError, setReturnForInfoNotesError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);

  /* ── Schedule form ── */
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(INITIAL_SCHEDULE_FORM);
  const scheduleFormInitRef = useRef<ScheduleFormState | null>(null);
  const lastInitializedMeetingIdRef = useRef<string | null>(null);

  /* ── Refreshing-after-edit flag ── */
  const [isRefreshingAfterEdit, setIsRefreshingAfterEdit] = useState(false);

  // Reset schedule form init ref when refreshing after edit so it re-syncs
  useEffect(() => {
    if (isRefreshingAfterEdit) {
      lastInitializedMeetingIdRef.current = null;
    }
  }, [isRefreshingAfterEdit]);

  /* ── Data fetching ── */
  const { data: meeting, isLoading, isFetching, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  // Auto-reset refreshing flag once refetch completes
  useEffect(() => {
    if (isRefreshingAfterEdit && !isFetching) {
      setIsRefreshingAfterEdit(false);
    }
  }, [isFetching, isRefreshingAfterEdit]);

  useEffect(() => {
    if (meeting?.id) {
      trackEvent('UC-02', 'uc02_meeting_detail_viewed', { meeting_id: meeting.id });
    }
  }, [meeting?.id]);

  const previousMeetingId = (meeting?.previous_meeting?.meeting_id ?? (meeting as any)?.previous_meeting_id ?? null) as string | null;
  const { data: previousMeeting } = useQuery({
    queryKey: ['meeting', previousMeetingId],
    queryFn: () => getMeetingById(previousMeetingId!),
    enabled: !!previousMeetingId && !!id && previousMeetingId !== id,
  });

  /* ── Initialize schedule form from meeting ── */
  useEffect(() => {
    if (!meeting?.id) return;
    if (lastInitializedMeetingIdRef.current === meeting.id) return;
    lastInitializedMeetingIdRef.current = meeting.id;

    const validChannels = ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'] as const;
    const ch = meeting.meeting_channel;
    const meetingChannel = validChannels.includes(ch as any) ? (ch as ScheduleFormState['meeting_channel']) : 'PHYSICAL';

    const init: ScheduleFormState = {
      scheduled_at: (meeting as any).scheduled_start ?? meeting.meeting_start_date ?? '',
      scheduled_end_at: (meeting as any).scheduled_end ?? (meeting as any).scheduled_end_at ?? (meeting as any).meeting_end_date ?? '',
      meeting_channel: meetingChannel,
      is_preliminary_booking: (meeting as any).is_preliminary_booking ?? !meeting.requires_protocol ?? false,
      protocol_type: meeting.protocol_type || null,
      protocol_type_text: meeting.protocol_type || '',
      is_data_complete: meeting.is_data_complete ?? true,
      notes: '',
      location: (meeting as any).meeting_location ?? (meeting as any).location ?? '',
      location_option: getMeetingLocationDropdownValue((meeting as any).meeting_location ?? (meeting as any).location ?? undefined, undefined) ?? '',
      selected_time_slot_id: meeting.selected_time_slot_id || null,
    };
    setScheduleForm(init);
    scheduleFormInitRef.current = { ...init };
  }, [meeting]);

  /* ── Computed data ── */
  const meetingStatus = (meeting?.status as MeetingStatus) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = MeetingStatusLabels[meetingStatus] || meeting?.status || 'قيد المراجعة';

  const meetingInfoNotes = useMemo(() => {
    if (!meeting) return undefined;
    const notesList = getGeneralNotesList(meeting.general_notes);
    return notesList.length > 0 ? notesList.map((n) => (n?.text ?? '').trim()).filter(Boolean).join('\n\n') : undefined;
  }, [meeting]);

  const meetingInfoExtraFields = useMemo(() => {
    if (!meeting) return [];
    const yesNo = (v?: boolean) => v === true ? 'نعم' : v === false ? 'لا' : '—';
    const fields = [
      { key: 'is_sequential', label: 'اجتماع متسلسل؟', value: yesNo(meeting.is_sequential) },
    ];
    if (meeting.is_sequential) {
      const m = meeting as any;
      fields.push({
        key: 'previous_meeting_id',
        label: 'الاجتماع السابق',
        value: m.prev_ext_meeting_title ?? meeting.previous_meeting?.meeting_title ?? '—',
      });
    }
    fields.push({
      key: 'sequential_number',
      label: 'الرقم التسلسلي',
      value: meeting.sequential_number != null
        ? String(meeting.sequential_number)
        : (meeting.is_sequential && previousMeeting?.sequential_number != null
            ? String((previousMeeting.sequential_number ?? 0) + 1)
            : 'غير موجود'),
    });
    return fields;
  }, [meeting, previousMeeting?.sequential_number]);

  /* ── Changed payload (schedule form only) ── */
  const changedPayload = useMemo(() => {
    if (!scheduleFormInitRef.current) return {};
    const orig = scheduleFormInitRef.current;
    const payload: any = {};
    if (scheduleForm.meeting_channel !== orig.meeting_channel) payload.meeting_channel = scheduleForm.meeting_channel;
    payload.meeting_location = scheduleForm.location || null;
    if (scheduleForm.is_preliminary_booking !== orig.is_preliminary_booking) {
      payload.is_preliminary_booking = scheduleForm.is_preliminary_booking;
      payload.requires_protocol = !scheduleForm.is_preliminary_booking;
    }
    if (scheduleForm.protocol_type_text !== orig.protocol_type_text) payload.protocol_type = scheduleForm.protocol_type_text;
    if (scheduleForm.is_data_complete !== orig.is_data_complete) payload.is_data_complete = scheduleForm.is_data_complete;
    if ((scheduleForm.selected_time_slot_id || null) !== (orig.selected_time_slot_id || null)) payload.selected_time_slot_id = scheduleForm.selected_time_slot_id;
    return payload;
  }, [scheduleForm]);

  const hasChanges = Object.keys(changedPayload).length > 0;

  /* ── Effective schedule dates ── */
  const getEffectiveScheduleDates = useCallback(
    (m: typeof meeting, form: ScheduleFormState): { start: string | undefined; end: string | undefined } => {
      if (!m) return { start: undefined, end: undefined };
      const start = (m as any).scheduled_start ?? (m as any).meeting_start_date ?? (form.scheduled_at || undefined);
      const end = (m as any).scheduled_end ?? (m as any).scheduled_end_at ?? (m as any).meeting_end_date ?? (form.scheduled_end_at || undefined);
      if (start && end) return { start, end };
      const slotId = form.selected_time_slot_id ?? (m as any).selected_time_slot_id;
      if (!slotId) return { start, end };
      const allSlots = [(m as any).alternative_time_slot_1, (m as any).alternative_time_slot_2, (m as any).selected_time_slot].filter(Boolean);
      const slot = allSlots.find((s: any) => s?.id === slotId);
      if (!slot?.slot_start) return { start, end };
      const slotEnd = slot.slot_end ?? toISOStringWithTimezone(new Date(new Date(slot.slot_start).getTime() + 3600000));
      return { start: start ?? slot.slot_start, end: end ?? slotEnd };
    },
    []
  );

  /* ── Tabs ── */
  const tabs = useMemo(() => {
    const all = [
      { id: 'request-info', label: 'معلومات الطلب' },
      { id: 'request-notes', label: 'الملاحظات على الطلب' },
      { id: 'meeting-info', label: 'معلومات الاجتماع' },
      { id: 'content', label: 'المحتوى' },
      ...(isScheduleOfficer
        ? [{ id: 'schedule', label: 'الجدولة' }]
        : [{ id: 'attendees', label: 'المدعوون' }]),
      { id: 'scheduling-consultation', label: 'استشارة الجدولة' },
      { id: 'directive', label: 'استشارة المكتب التنفيذي' },
    ];
    if (meetingStatus === MeetingStatus.SCHEDULED) {
      const filtered = all.filter((t) => !TABS_HIDDEN_WHEN_SCHEDULED.includes(t.id));
      return [...filtered, { id: 'meeting-documentation', label: 'توثيق الاجتماع' }];
    }
    if (meetingStatus === MeetingStatus.CLOSED) {
      return [...all, { id: 'directives', label: 'التوجيهات' }];
    }
    return all;
  }, [meetingStatus, isScheduleOfficer]);

  // Auto-switch tabs when status changes
  useEffect(() => {
    if (meetingStatus === MeetingStatus.SCHEDULED && TABS_HIDDEN_WHEN_SCHEDULED.includes(activeTab)) setActiveTab('request-info');
    else if (meetingStatus !== MeetingStatus.SCHEDULED && activeTab === 'meeting-documentation') setActiveTab('request-info');
    else if (meetingStatus !== MeetingStatus.CLOSED && activeTab === 'directives') setActiveTab('request-info');
    else if (isScheduleOfficer && activeTab === 'attendees') setActiveTab('schedule');
    else if (!isScheduleOfficer && activeTab === 'schedule') setActiveTab('request-info');
  }, [meetingStatus, activeTab, isScheduleOfficer]);

  /* ── Permission tooltip ── */
  const permissionTooltip = useMemo(() => {
    if (meetingStatus === MeetingStatus.UNDER_REVIEW || meetingStatus === MeetingStatus.UNDER_GUIDANCE) {
      return { title: 'تعديل كامل', description: 'يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب، بالإضافة إلى الجدولة والرفض وإرجاع الطلب للمعلومات.' };
    }
    const scheduledStatuses = [MeetingStatus.SCHEDULED, MeetingStatus.SCHEDULED_SCHEDULING, MeetingStatus.SCHEDULED_CONTENT, MeetingStatus.SCHEDULED_ADDITIONAL_INFO, MeetingStatus.SCHEDULED_DELAYED];
    if (scheduledStatuses.includes(meetingStatus)) {
      return { title: 'عرض وتوثيق', description: 'تم جدولة الاجتماع. يمكنك إضافة توثيق الاجتماع وإعادة الجدولة وإضافته لقائمة الانتظار.' };
    }
    if (meetingStatus === MeetingStatus.CLOSED || meetingStatus === MeetingStatus.REJECTED || meetingStatus === MeetingStatus.CANCELLED) {
      return { title: 'عرض فقط', description: 'الطلب مغلق. العرض للقراءة فقط ولا يمكن إجراء أي تعديلات.' };
    }
    return { title: 'الصلاحيات', description: 'يمكنك عرض تفاصيل طلب الاجتماع.' };
  }, [meetingStatus]);

  /* ─── Mutations ─── */
  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] });
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      setIsDeleteDraftModalOpen(false);
      navigate(isScheduleOfficer ? UC02_PATH.WORK_BASKET : UC01_PATH.MEETINGS);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; notes: string }) => rejectMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsRejectModalOpen(false);
      setRejectForm({ reason: '', notes: '' });
      navigate(-1);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { reason?: string; notes?: string }) => cancelMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsCancelModalOpen(false);
      
      navigate(-1);
    },
  });

  const sendToContentMutation = useMutation({
    mutationFn: (payload: { notes: string; is_draft?: boolean; consultant_user_id?: string }) => {
      if (meeting?.status === MeetingStatus.SCHEDULED_SCHEDULING) {
        return sendToContentScheduled(id!, { notes: payload.notes || undefined, consultant_user_id: payload.consultant_user_id });
      }
      return sendToContent(id!, { notes: payload.notes, is_draft: payload.is_draft });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsSendToContentModalOpen(false);
      setSendToContentForm({ notes: '' });
      if (!variables.is_draft) navigate(-1);
    },
  });

  const returnForInfoMutation = useMutation({
    mutationFn: (payload: { notes: string }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoNotesError(null);
      setReturnForInfoNotes('');
      navigate(-1);
    },
  });

  const approveUpdateMutation = useMutation({
    mutationFn: (payload: { notes?: string }) => approveMeetingUpdate(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsApproveUpdateModalOpen(false);
      setApproveUpdateForm({ notes: '' });
      navigate(-1);
    },
  });

  const moveToWaitingListMutation = useMutation({
    mutationFn: () => moveToWaitingList(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      navigate(-1);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (payload: any) =>
      meeting?.status === MeetingStatus.SCHEDULED
        ? rescheduleMeeting(id!, payload)
        : scheduleMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsScheduleModalOpen(false);
      setScheduleConfirmModalOpen(false);
      setScheduleForm(INITIAL_SCHEDULE_FORM);
      toast({ title: "تم جدولة الاجتماع بنجاح", description: "تمت عملية الجدولة بنجاح" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ payload }: { payload: any }) => {
      setUpdateErrorMessage(null);
      await updateMeetingRequest(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsEditConfirmOpen(false);
      setUpdateErrorMessage(null);
    },
    onError: (err: any) => {
      setUpdateErrorMessage(typeof err === 'string' ? err : err?.message || 'حدث خطأ أثناء الحفظ.');
    },
  });

  /* ── Schedule submit handler ── */
  const handleScheduleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { start: startSource, end: endSource } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
    if (!startSource || !endSource) { setValidationError('يرجى تحديد تاريخ ووقت البداية والنهاية'); return; }
    const scheduledAt = new Date(startSource);
    const scheduledEndAt = new Date(endSource);
    if (scheduledAt.getTime() <= Date.now()) { setValidationError('لقد انتهى وقت هذا الاجتماع. يرجى تحديث موعد البداية لجدولته مجدداً'); return; }
    if (scheduledEndAt.getTime() <= scheduledAt.getTime()) { setValidationError('وقت النهاية يجب أن يكون بعد وقت البداية'); return; }
    setValidationError(null);
    const meetingChannel = (meeting?.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel)) ? meeting.meeting_channel : scheduleForm.meeting_channel;
    scheduleMutation.mutate({
      scheduled_start: toISOStringWithTimezone(scheduledAt),
      scheduled_end: toISOStringWithTimezone(scheduledEndAt),
      meeting_channel: meetingChannel,
      requires_protocol: !scheduleForm.is_preliminary_booking,
      is_preliminary_booking: scheduleForm.is_preliminary_booking,
      protocol_type: !scheduleForm.is_preliminary_booking ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
      is_data_complete: scheduleForm.is_data_complete,
      notes: scheduleForm.notes || 'Meeting scheduled successfully',
      location: scheduleForm.location || undefined,
      minister_attendees: [],
    });
  }, [meeting, scheduleForm, getEffectiveScheduleDates, scheduleMutation]);

  /* ── Sync schedule dates from selected slot ── */
  useEffect(() => {
    if (!scheduleConfirmModalOpen || !meeting || scheduleForm.scheduled_at) return;
    const slotId = scheduleForm.selected_time_slot_id ?? (meeting as any).selected_time_slot_id;
    if (!slotId) return;
    const allSlots = [meeting.alternative_time_slot_1, meeting.alternative_time_slot_2, meeting.selected_time_slot].filter(Boolean);
    const selectedSlot = allSlots.find((s: any) => s?.id === slotId);
    if (!selectedSlot?.slot_start) return;
    const toLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const startLocal = toLocal(selectedSlot.slot_start);
    const endLocal = selectedSlot.slot_end ? toLocal(selectedSlot.slot_end) : (() => { const s = new Date(selectedSlot.slot_start); return toLocal(new Date(s.getTime() + 3600000).toISOString()); })();
    setScheduleForm((prev) => ({ ...prev, scheduled_at: startLocal, scheduled_end_at: endLocal }));
  }, [scheduleConfirmModalOpen, meeting, scheduleForm.scheduled_at, scheduleForm.selected_time_slot_id]);

  /* ── Pre-validate dates when confirm modal opens ── */
  useEffect(() => {
    if (!scheduleConfirmModalOpen) return;
    const { start: startSource, end: endSource } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
    if (!startSource || !endSource) {
      setValidationError('يرجى تحديد تاريخ ووقت البداية والنهاية');
      return;
    }
    const scheduledAt = new Date(startSource);
    const scheduledEndAt = new Date(endSource);
    if (scheduledAt.getTime() <= Date.now()) {
      setValidationError('لقد انتهى وقت هذا الاجتماع. يرجى تحديث موعد البداية لجدولته مجدداً');
      return;
    }
    if (scheduledEndAt.getTime() <= scheduledAt.getTime()) {
      setValidationError('وقت النهاية يجب أن يكون بعد وقت البداية');
      return;
    }
    setValidationError(null);
  }, [scheduleConfirmModalOpen, meeting, scheduleForm, getEffectiveScheduleDates]);

  return {
    // IDs & navigation
    id,
    navigate,
    isScheduleOfficer,

    // Data
    meeting,
    isLoading,
    isFetching,
    error,
    previousMeeting,
    meetingStatus,
    statusLabel,
    meetingInfoExtraFields,
    meetingInfoNotes,

    // Tab
    activeTab,
    setActiveTab,
    tabs,

    // Schedule form
    scheduleForm,
    setScheduleForm,
    INITIAL_SCHEDULE_FORM,
    changedPayload,
    hasChanges,
    getEffectiveScheduleDates,
    handleScheduleSubmit,

    // Modal states
    meetingFormOpen, setMeetingFormOpen,
    isQualityModalOpen, setIsQualityModalOpen,
    isDeleteDraftModalOpen, setIsDeleteDraftModalOpen,
    isWaitingListConfirmOpen, setIsWaitingListConfirmOpen,
    isRejectModalOpen, setIsRejectModalOpen,
    isCancelModalOpen, setIsCancelModalOpen,
    isSendToContentModalOpen, setIsSendToContentModalOpen,
    isApproveUpdateModalOpen, setIsApproveUpdateModalOpen,
    isReturnForInfoModalOpen, setIsReturnForInfoModalOpen,
    isScheduleModalOpen, setIsScheduleModalOpen,
    scheduleConfirmModalOpen, setScheduleConfirmModalOpen,
    isEditConfirmOpen, setIsEditConfirmOpen,
    actionsBarOpen, setActionsBarOpen,
    previewAttachment, setPreviewAttachment,

    // Form states
    rejectForm, setRejectForm,
    
    sendToContentForm, setSendToContentForm,
    approveUpdateForm, setApproveUpdateForm,
    returnForInfoNotes, setReturnForInfoNotes,
    returnForInfoNotesError, setReturnForInfoNotesError,
    validationError, setValidationError,
    updateErrorMessage, setUpdateErrorMessage,

    // Mutations
    deleteDraftMutation,
    rejectMutation,
    cancelMutation,
    sendToContentMutation,
    returnForInfoMutation,
    approveUpdateMutation,
    moveToWaitingListMutation,
    scheduleMutation,
    updateMutation,

    // Permission
    permissionTooltip,

    // Refresh-after-edit
    isRefreshingAfterEdit,
    setIsRefreshingAfterEdit,
  };
}
