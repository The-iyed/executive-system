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
  MeetingChannelLabels,
  type MeetingInfoData,
  type MeetingInfoFieldSpec,
  hasUseCaseAccess,
  toISOStringWithTimezone,
  formatDateArabic,
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
import {
  getMeetingLocationDropdownValue,
} from '../../../../UC01/features/MeetingForm/utils/constants';
import { getGeneralNotesList } from '../utils/meetingDetailHelpers';
import { fieldLabels, TABS_HIDDEN_WHEN_SCHEDULED } from '../constants';

/* ─── Schedule form type ─── */
export interface ScheduleFormState {
  scheduled_at: string;
  scheduled_end_at: string;
  meeting_channel: 'PHYSICAL' | 'PHYSICAL_LOCATION_1' | 'PHYSICAL_LOCATION_2' | 'PHYSICAL_LOCATION_3' | 'VIRTUAL' | 'HYBRID';
  requires_protocol: boolean;
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

/* ─── Extra meeting info field specs for UC02 ─── */
const UC02_EXTRA_MEETING_INFO_SPECS: MeetingInfoFieldSpec[] = [
  { key: 'is_sequential', label: 'اجتماع متسلسل؟', getValue: (d) => (d.is_sequential === true ? 'نعم' : d.is_sequential === false ? 'لا' : '—') },
  { key: 'previous_meeting_id', label: 'الاجتماع السابق', getValue: (d) => d.previous_meeting_meeting_title ?? '—' },
  { key: 'sequential_number', label: 'الرقم التسلسلي', getValue: (d) => d.sequential_number_display ?? '—' },
];

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
  const [cancelForm, setCancelForm] = useState({ reason: '', notes: '' });
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

  /* ── Data fetching ── */
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingRequestById(id!),
    enabled: !!id,
  });

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
      requires_protocol: meeting.requires_protocol ?? false,
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

  const meetingInfoData = useMemo((): MeetingInfoData => {
    if (!meeting) return {};
    const m = meeting as any;
    const slot = meeting.selected_time_slot;
    const notesList = getGeneralNotesList(meeting.general_notes);
    const notesText = notesList.length > 0 ? notesList.map((n) => (n?.text ?? '').trim()).filter(Boolean).join('\n\n') : undefined;
    const apiChannel = meeting.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel)
      ? meeting.meeting_channel
      : scheduleForm.meeting_channel;
    const joinUrl = String(m.meeting_url || m.meeting_link || '').trim() || undefined;
    const basedOnDirective = !!(meeting.related_guidance || m.is_based_on_directive === true || (Array.isArray(meeting.related_directive_ids) && meeting.related_directive_ids.length > 0));
    const hasPrevContext = !!(meeting.previous_meeting_attachment || m.prev_ext_id != null || m.previous_meeting_minutes_id);
    const directiveMethod = (m.directive_method || '').trim() || (hasPrevContext && basedOnDirective ? 'PREVIOUS_MEETING' : undefined);

    return {
      is_on_behalf_of: m.is_on_behalf_of ?? undefined,
      meeting_manager_label: meeting.meeting_owner_name ?? undefined,
      meetingSubject: meeting.meeting_title || undefined,
      meetingDescription: meeting.description ?? meeting.meeting_subject ?? undefined,
      sector: meeting.sector || undefined,
      meetingType: meeting.meeting_type || undefined,
      is_urgent: !!m.urgent_reason || !!m.is_urgent,
      urgent_reason: m.urgent_reason ?? meeting.meeting_justification ?? undefined,
      meeting_start_date: m.scheduled_start ?? meeting.meeting_start_date ?? slot?.slot_start ?? undefined,
      meeting_end_date: m.scheduled_end ?? slot?.slot_end ?? undefined,
      meetingChannel: apiChannel || undefined,
      meeting_location: m.location || scheduleForm.location || undefined,
      meeting_link: joinUrl,
      meetingCategory: meeting.meeting_classification || undefined,
      meetingReason: meeting.meeting_justification || undefined,
      relatedTopic: meeting.related_topic || undefined,
      dueDate: meeting.deadline || undefined,
      meetingClassification1: meeting.meeting_classification_type || undefined,
      meetingConfidentiality: meeting.meeting_confidentiality || undefined,
      meetingAgenda: (meeting.agenda_items ?? []).map((item) => {
        const ext = item as typeof item & { minister_support_type?: string; minister_support_other?: string; support_type?: string; support_description?: string };
        return {
          id: item.id,
          agenda_item: item.agenda_item ?? '',
          presentation_duration_minutes: item.presentation_duration_minutes ?? 0,
          minister_support_type: ext.minister_support_type ?? ext.support_type,
          minister_support_other: ext.minister_support_other ?? ext.support_description,
        };
      }),
      is_sequential: meeting.is_sequential ?? false,
      previous_meeting_meeting_title: m.prev_ext_meeting_title ?? meeting.previous_meeting?.meeting_title ?? undefined,
      sequential_number_display: meeting.sequential_number != null ? String(meeting.sequential_number) : (meeting.is_sequential && previousMeeting?.sequential_number != null ? String((previousMeeting.sequential_number ?? 0) + 1) : 'غير موجود'),
      is_based_on_directive: basedOnDirective,
      directive_method: directiveMethod,
      previous_meeting_attachment: meeting.previous_meeting_attachment ?? undefined,
      directive_text: meeting.related_guidance || undefined,
      notes: notesText,
    };
  }, [meeting, scheduleForm.meeting_channel, scheduleForm.location, previousMeeting?.sequential_number]);

  const extraGridSpecs = useMemo(() => {
    if (!meeting) return [];
    return meeting.is_sequential
      ? UC02_EXTRA_MEETING_INFO_SPECS
      : [UC02_EXTRA_MEETING_INFO_SPECS[0], UC02_EXTRA_MEETING_INFO_SPECS[2]];
  }, [meeting?.is_sequential]);

  /* ── Changed payload (schedule form only) ── */
  const changedPayload = useMemo(() => {
    if (!scheduleFormInitRef.current) return {};
    const orig = scheduleFormInitRef.current;
    const payload: any = {};
    if (scheduleForm.meeting_channel !== orig.meeting_channel) payload.meeting_channel = scheduleForm.meeting_channel;
    payload.meeting_location = scheduleForm.location || null;
    if (scheduleForm.requires_protocol !== orig.requires_protocol) payload.requires_protocol = scheduleForm.requires_protocol;
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
      setCancelForm({ reason: '', notes: '' });
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
    if (!startSource || !endSource) return;
    const scheduledAt = new Date(startSource);
    const scheduledEndAt = new Date(endSource);
    if (scheduledAt.getTime() <= Date.now()) { setValidationError('لا يمكن اختيار تاريخ أو وقت البداية في الماضي'); return; }
    if (scheduledEndAt.getTime() <= scheduledAt.getTime()) { setValidationError('وقت النهاية يجب أن يكون بعد وقت البداية'); return; }
    setValidationError(null);
    const meetingChannel = (meeting?.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel)) ? meeting.meeting_channel : scheduleForm.meeting_channel;
    scheduleMutation.mutate({
      scheduled_start: toISOStringWithTimezone(scheduledAt),
      scheduled_end: toISOStringWithTimezone(scheduledEndAt),
      meeting_channel: meetingChannel,
      requires_protocol: scheduleForm.requires_protocol,
      is_preliminary_booking: !scheduleForm.requires_protocol,
      protocol_type: scheduleForm.requires_protocol ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
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

  return {
    // IDs & navigation
    id,
    navigate,
    isScheduleOfficer,

    // Data
    meeting,
    isLoading,
    error,
    previousMeeting,
    meetingStatus,
    statusLabel,
    meetingInfoData,
    extraGridSpecs,

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
    cancelForm, setCancelForm,
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
  };
}
