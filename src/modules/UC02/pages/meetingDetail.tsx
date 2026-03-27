/**
 * Meeting detail page – UC02 scheduling officer view.
 * Refactored: thin shell delegating to tab components. No MinisterAttendee code.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertCircle } from 'lucide-react';
import {
  MeetingStatus,
  MeetingStatusLabels,
  MeetingConfidentiality,
  MeetingClassificationType,
  StatusBadge,
  DetailPageHeader,
  AIGenerateButton,
  FormField,
  FormSwitch,
  FormTextArea,
  FormDatePicker,
  FormSelect,
  FormDateTimePicker,
  formatDateArabic,
  toISOStringWithTimezone,
  MeetingOwnerType,
  MeetingChannelLabels,
  type MeetingInfoData,
  type MeetingInfoFieldSpec,
  MeetingActionsBar,
  hasUseCaseAccess,
  Drawer,
  AttachmentPreviewDrawer,
  MINISTER_SUPPORT_TYPE_OPTIONS,
} from '@/modules/shared';
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
  updateMeetingRequestWithAttachments,
} from '../data/meetingsApi';
import { deleteDraft } from '../data/draftApi';
import { PATH as UC02_PATH } from '../routes/paths';
import { PATH as UC01_PATH } from '../../UC01/routes/paths';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  DateTimePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui';
import QualityModal from '../components/qualityModal';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/modules/auth';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';
import { NotesTab } from '@/modules/UC01/features/PreviewMeeting/tabs/NotesTab';
import {
  RequestInfoTab,
  MeetingInfoTab,
  DirectivesTab,
  MeetingDocumentationTab,
} from '../features/meeting-detail';
import { ScheduleTab } from '../features/meeting-detail/tabs/ScheduleTab';
import { InviteesTab } from '../features/meeting-detail/tabs/InviteesTab';
import { SchedulingConsultationChatTab } from '../features/meeting-detail/tabs/SchedulingConsultationChatTab';
import { DirectiveChatTab } from '../features/meeting-detail/tabs/DirectiveChatTab';
import { ContentTab } from '../features/meeting-detail/tabs/ContentTab';
import { fieldLabels, EDITABLE_FIELD_IDS, TABS_HIDDEN_WHEN_SCHEDULED } from '../features/meeting-detail/constants';
import { getGeneralNotesList } from '../features/meeting-detail/utils/meetingDetailHelpers';
import {
  MEETING_LOCATION_OPTIONS,
  getMeetingLocationDropdownValue,
  showMeetingLocationOtherInput,
  isPresetMeetingLocation,
} from '../../UC01/features/MeetingForm/utils/constants';
import { FormInput } from '@/modules/shared';

/* ─── Schedule form type ─── */
interface ScheduleFormState {
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

/* ─── Component ─── */
const MeetingDetail: React.FC = () => {
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
  const [returnForInfoForm, setReturnForInfoForm] = useState<{
    notes: string;
    editable_fields: Record<string, boolean>;
  }>({
    notes: '',
    editable_fields: EDITABLE_FIELD_IDS.reduce((acc, fid) => ({ ...acc, [fid]: false }), {} as Record<string, boolean>),
  });
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
    mutationFn: (payload: { notes: string; editable_fields: string[] }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoNotesError(null);
      setReturnForInfoForm({
        notes: '',
        editable_fields: EDITABLE_FIELD_IDS.reduce((acc, fid) => ({ ...acc, [fid]: false }), {} as Record<string, boolean>),
      });
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
  const handleScheduleSubmit = async (e: React.FormEvent) => {
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
  };

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

  /* ─── Loading / Error states ─── */
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-semibold text-foreground">جاري تحميل بيانات الاجتماع</p>
            <p className="text-[13px] text-muted-foreground">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-[15px] font-bold text-foreground">حدث خطأ أثناء تحميل البيانات</p>
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors shadow-sm">
            العودة
          </button>
        </div>
      </div>
    );
  }

  /* ─── Tab content ─── */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'request-info':
        return <RequestInfoTab meeting={meeting} statusLabel={statusLabel} />;
      case 'request-notes':
        return <div className="w-full max-w-4xl mx-auto" dir="rtl"><NotesTab meeting={meeting} /></div>;
      case 'meeting-info':
        return (
          <MeetingInfoTab
            data={meetingInfoData}
            canEdit={false}
            extraGridSpecs={meeting.is_sequential ? UC02_EXTRA_MEETING_INFO_SPECS : [UC02_EXTRA_MEETING_INFO_SPECS[0], UC02_EXTRA_MEETING_INFO_SPECS[2]]}
          />
        );
      case 'content':
        return <ContentTab meeting={meeting} onPreviewAttachment={(att) => setPreviewAttachment(att)} />;
      case 'schedule':
        return isScheduleOfficer ? (
          <ScheduleTab
            scheduleForm={{ requires_protocol: scheduleForm.requires_protocol, is_data_complete: scheduleForm.is_data_complete, notes: scheduleForm.notes }}
            onScheduleFormChange={(updates) => setScheduleForm((prev) => ({ ...prev, ...updates }))}
            invitees={meeting?.invitees}
            validationError={validationError}
            scheduleMutationSuccess={scheduleMutation.isSuccess}
          />
        ) : null;
      case 'attendees':
        return !isScheduleOfficer ? <InviteesTab invitees={meeting?.invitees} /> : null;
      case 'scheduling-consultation':
        return <SchedulingConsultationChatTab meetingId={id!} meetingStatus={meetingStatus} />;
      case 'directive':
        return <DirectiveChatTab meetingId={id!} meetingStatus={meetingStatus} />;
      case 'directives':
        return meetingStatus === MeetingStatus.CLOSED ? <DirectivesTab meeting={meeting} /> : null;
      case 'meeting-documentation':
        return <MeetingDocumentationTab meetingTitle={meeting?.meeting_title ?? undefined} />;
      default:
        return <RequestInfoTab meeting={meeting} statusLabel={statusLabel} />;
    }
  };

  /* ─── Render ─── */
  return (
    <div className="w-full h-full flex flex-col overflow-hidden overflow-x-hidden min-w-0" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-3 pr-5 min-w-0">
        {/* Header */}
        <div className="flex flex-col flex-shrink-0 min-w-0 gap-2">
          <DetailPageHeader
            title={`${meeting.meeting_title} (${meeting.request_number})`}
            subtitle="مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة."
            onBack={() => navigate(-1)}
            statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} className="flex-shrink-0" />}
            hasChanges={hasChanges}
            editAction={{
              visible: true,
              hasChanges,
              opensForm: true,
              tooltip: 'فتح نموذج التعديل',
              onClick: () => setMeetingFormOpen(true),
            }}
            secondaryAction={
              meetingStatus === MeetingStatus.DRAFT ? (
                <Button type="button" variant="outline" onClick={() => setIsDeleteDraftModalOpen(true)} disabled={deleteDraftMutation.isPending} className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                </Button>
              ) : undefined
            }
            primaryAction={<AIGenerateButton label="تقييم جاهزية الاجتماع" onClick={() => setIsQualityModalOpen(true)} />}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            helpTooltip={permissionTooltip}
          />
        </div>

        {/* Content card */}
        <div className="w-full flex-1 min-h-0 min-w-0 flex flex-row overflow-y-auto overflow-x-hidden px-8 py-8 gap-6 rounded-2xl bg-background justify-center border border-border" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-full flex-1 min-h-0 min-w-0 flex flex-row justify-center">
            {renderTabContent()}
          </div>
        </div>

        {/* Actions bar */}
        {meeting && (meeting.status === MeetingStatus.UNDER_REVIEW || meeting.status === MeetingStatus.UNDER_GUIDANCE || meeting.status === MeetingStatus.WAITING || meeting.status === MeetingStatus.SCHEDULED || meeting.status === MeetingStatus.SCHEDULED_SCHEDULING) && (
          <MeetingActionsBar
            meetingStatus={meetingStatus}
            open={actionsBarOpen}
            onOpenChange={setActionsBarOpen}
            onOpenSchedule={isScheduleOfficer ? () => setScheduleConfirmModalOpen(true) : () => setIsScheduleModalOpen(true)}
            onOpenReject={() => setIsRejectModalOpen(true)}
            onOpenCancel={meeting.status === MeetingStatus.SCHEDULED ? () => setIsCancelModalOpen(true) : undefined}
            onOpenEditConfirm={() => setIsEditConfirmOpen(true)}
            onOpenReturnForInfo={() => setIsReturnForInfoModalOpen(true)}
            onOpenSendToContent={() => setIsSendToContentModalOpen(true)}
            onOpenApproveUpdate={meeting.status === MeetingStatus.SCHEDULED_SCHEDULING ? () => setIsApproveUpdateModalOpen(true) : undefined}
            onAddToWaitingList={() => moveToWaitingListMutation.mutate()}
            isAddToWaitingListPending={moveToWaitingListMutation.isPending}
            hasChanges={hasChanges}
            hasContent={true}
            hideEdit
          />
        )}
      </div>

      {/* ─── Modals / Drawers ─── */}
      <SubmitterModal callerRole={MeetingOwnerType.SCHEDULING} open={meetingFormOpen} onOpenChange={setMeetingFormOpen} editMeetingId={meeting.id} showAiSuggest />

      {/* Delete draft */}
      <Dialog open={isDeleteDraftModalOpen} onOpenChange={(open) => !deleteDraftMutation.isPending && setIsDeleteDraftModalOpen(open)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-border bg-background shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <DialogTitle className="text-xl font-semibold text-foreground">حذف المسودة</DialogTitle>
            <DialogDescription className="text-right text-base text-muted-foreground pt-1">هل أنت متأكد من حذف هذه المسودة؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDraftModalOpen(false)} className="min-w-[100px]" disabled={deleteDraftMutation.isPending}>إلغاء</Button>
            <Button type="button" onClick={() => id && deleteDraftMutation.mutate(id)} className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white" disabled={deleteDraftMutation.isPending}>
              {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality modal */}
      <QualityModal isOpen={isQualityModalOpen} onOpenChange={setIsQualityModalOpen} meetingId={id || ''} />

      {/* Reject */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">رفض طلب الاجتماع</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (rejectForm.reason.trim()) rejectMutation.mutate({ reason: rejectForm.reason, notes: rejectForm.notes }); }}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">سبب الرفض <span className="text-red-500">*</span></label>
                <Input type="text" value={rejectForm.reason} onChange={(e) => setRejectForm((p) => ({ ...p, reason: e.target.value }))} placeholder="الطلب غير مناسب للجدولة" className="w-full text-right" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">ملاحظات إضافية</label>
                <Textarea value={rejectForm.notes} onChange={(e: any) => setRejectForm((p) => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية" className="w-full min-h-[100px] text-right" />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button type="button" onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">تراجع</button>
              <button type="submit" disabled={!rejectForm.reason.trim() || rejectMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{rejectMutation.isPending ? 'جاري الإرسال...' : 'رفض'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إلغاء الاجتماع</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); cancelMutation.mutate({ reason: cancelForm.reason.trim() || undefined, notes: cancelForm.notes.trim() || undefined }); }}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">سبب الإلغاء</label>
                <Input type="text" value={cancelForm.reason} onChange={(e) => setCancelForm((p) => ({ ...p, reason: e.target.value }))} placeholder="سبب إلغاء الاجتماع" className="w-full text-right" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">ملاحظات إضافية</label>
                <Textarea value={cancelForm.notes} onChange={(e: any) => setCancelForm((p) => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية" className="w-full min-h-[100px] text-right" />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button type="button" onClick={() => { setIsCancelModalOpen(false); setCancelForm({ reason: '', notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">تراجع</button>
              <button type="submit" disabled={cancelMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{cancelMutation.isPending ? 'جاري الإلغاء...' : 'إلغاء الاجتماع'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit confirm */}
      <Dialog open={isEditConfirmOpen} onOpenChange={(open) => { setIsEditConfirmOpen(open); if (!open) { setValidationError(null); setUpdateErrorMessage(null); } }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تأكيد التعديلات</DialogTitle></DialogHeader>
          <div className="py-4">
            {(validationError || updateErrorMessage) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-right text-sm text-red-600">{updateErrorMessage || validationError}</p>
              </div>
            )}
            <p className="text-right text-sm text-muted-foreground">سيتم إرسال الحقول التالية للتعديل:</p>
            <ul className="mt-3 list-disc list-inside text-right text-sm text-foreground">
              {Object.keys(changedPayload).map((k) => <li key={k}>{fieldLabels[k] || k}</li>)}
            </ul>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={() => setIsEditConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-border text-foreground bg-background hover:bg-muted transition-colors">إلغاء</button>
            <button type="button" onClick={() => { setValidationError(null); updateMutation.mutate({ payload: changedPayload }); }} disabled={!hasChanges || updateMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50">
              {updateMutation.isPending ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to content drawer */}
      <Drawer open={isSendToContentModalOpen} onOpenChange={setIsSendToContentModalOpen} title={<span className="text-right">إرسال للمحتوى</span>} side="left" width={500} bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsSendToContentModalOpen(false); setSendToContentForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            {meeting?.status !== MeetingStatus.SCHEDULED_SCHEDULING && (
              <button type="button" onClick={() => sendToContentMutation.mutate({ notes: sendToContentForm.notes, is_draft: true })} disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            )}
            <button type="submit" form="send-to-content-form" disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}</button>
          </div>
        }
      >
        <form id="send-to-content-form" onSubmit={(e) => { e.preventDefault(); sendToContentMutation.mutate({ notes: sendToContentForm.notes }); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات</label>
            <Textarea value={sendToContentForm.notes} onChange={(e: any) => setSendToContentForm({ notes: e.target.value })} placeholder="يرجى مراجعة المحتوى قبل الجدولة" className="w-full min-h-[100px] text-right" />
          </div>
        </form>
      </Drawer>

      {/* Approve update drawer */}
      <Drawer open={isApproveUpdateModalOpen} onOpenChange={(open) => { if (!open) setApproveUpdateForm({ notes: '' }); setIsApproveUpdateModalOpen(open); }} title={<span className="text-right">إعتماد التحديث</span>} side="left" width={500} bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsApproveUpdateModalOpen(false); setApproveUpdateForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="submit" form="approve-update-form" disabled={approveUpdateMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{approveUpdateMutation.isPending ? 'جاري الإرسال...' : 'إعتماد التحديث'}</button>
          </div>
        }
      >
        <form id="approve-update-form" onSubmit={(e) => { e.preventDefault(); approveUpdateMutation.mutate({ notes: approveUpdateForm.notes.trim() || undefined }); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات (اختياري)</label>
            <Textarea value={approveUpdateForm.notes} onChange={(e: any) => setApproveUpdateForm({ notes: e.target.value })} placeholder="تم اعتماد التحديث" className="w-full min-h-[100px] text-right" />
          </div>
        </form>
      </Drawer>

      {/* Return for info drawer */}
      <Drawer open={isReturnForInfoModalOpen} onOpenChange={(open) => { setIsReturnForInfoModalOpen(open); if (!open) setReturnForInfoNotesError(null); }} title={<span className="text-right">إعادة للطلب</span>} side="left" width={500}
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => setIsReturnForInfoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="submit" form="return-for-info-form" disabled={returnForInfoMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{returnForInfoMutation.isPending ? 'جاري الإرسال...' : 'إعادة'}</button>
          </div>
        }
      >
        <form id="return-for-info-form" onSubmit={(e) => { e.preventDefault(); const notesTrimmed = returnForInfoForm.notes.trim(); if (!notesTrimmed) { setReturnForInfoNotesError('الملاحظات مطلوبة'); return; } setReturnForInfoNotesError(null); returnForInfoMutation.mutate({ notes: notesTrimmed, editable_fields: EDITABLE_FIELD_IDS.filter((fid) => returnForInfoForm.editable_fields[fid]) }); }} className="flex flex-col gap-4" dir="rtl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات <span className="text-red-500">*</span></label>
            <Textarea value={returnForInfoForm.notes} onChange={(e: any) => setReturnForInfoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="يرجى تعديل البيانات المطلوبة" className="w-full min-h-[100px] text-right" />
            {returnForInfoNotesError && <p className="text-sm text-red-600 text-right">{returnForInfoNotesError}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">الحقول المطلوب تعديلها</label>
            <div className="grid grid-cols-2 gap-2">
              {EDITABLE_FIELD_IDS.map((fid) => (
                <label key={fid} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={returnForInfoForm.editable_fields[fid] ?? false} onChange={(e) => setReturnForInfoForm((p) => ({ ...p, editable_fields: { ...p.editable_fields, [fid]: e.target.checked } }))} className="rounded border-border" />
                  {fieldLabels[fid] || fid}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Schedule drawer (non-schedule-officer) */}
      {!isScheduleOfficer && (
        <Drawer open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen} title={<span className="text-right">جدولة الاجتماع</span>} side="left" width={500} bodyClassName="dir-rtl"
          footer={
            <div className="flex flex-row-reverse gap-2">
              <button type="button" onClick={() => { setIsScheduleModalOpen(false); setScheduleForm(INITIAL_SCHEDULE_FORM); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
              <button type="submit" form="schedule-meeting-form" disabled={!scheduleForm.scheduled_at || !scheduleForm.scheduled_end_at || scheduleMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{scheduleMutation.isPending ? 'جاري التحميل...' : 'جدولة'}</button>
            </div>
          }
        >
          <form id="schedule-meeting-form" onSubmit={handleScheduleSubmit} className="flex flex-col gap-6">
            {validationError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-right text-sm text-red-600">{validationError}</p></div>}
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت البداية <span className="text-red-500">*</span></label>
                <DateTimePicker value={scheduleForm.scheduled_at ? new Date(scheduleForm.scheduled_at).toISOString() : undefined} onChange={(iso) => { const d = new Date(iso); const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; setScheduleForm((p) => ({ ...p, scheduled_at: dtl, ...((!p.scheduled_end_at || new Date(p.scheduled_end_at) < d) ? { scheduled_end_at: `${new Date(d.getTime()+3600000).getFullYear()}-${String(new Date(d.getTime()+3600000).getMonth()+1).padStart(2,'0')}-${String(new Date(d.getTime()+3600000).getDate()).padStart(2,'0')}T${String(new Date(d.getTime()+3600000).getHours()).padStart(2,'0')}:${String(new Date(d.getTime()+3600000).getMinutes()).padStart(2,'0')}` } : {}) })); }} placeholder="اختر تاريخ ووقت البداية" className="w-full" required minDate={(() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت النهاية <span className="text-red-500">*</span></label>
                <DateTimePicker value={scheduleForm.scheduled_end_at ? new Date(scheduleForm.scheduled_end_at).toISOString() : undefined} onChange={(iso) => { const d = new Date(iso); const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; setScheduleForm((p) => ({ ...p, scheduled_end_at: dtl })); }} placeholder="اختر تاريخ ووقت النهاية" className="w-full" required minDate={scheduleForm.scheduled_at ? new Date(scheduleForm.scheduled_at) : undefined} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-2">
              <label className="text-[14px] font-medium text-foreground text-right">قناة الاجتماع <span className="text-red-500">*</span></label>
              <Select value={scheduleForm.meeting_channel} onValueChange={(v) => setScheduleForm((p) => ({ ...p, meeting_channel: v as any }))}>
                <SelectTrigger className="w-full h-11 bg-background border border-border rounded-lg text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="PHYSICAL">حضوري</SelectItem>
                  <SelectItem value="VIRTUAL">عن بُعد</SelectItem>
                  <SelectItem value="HYBRID">مختلط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
              <FormField label="مبدئي" className="w-full max-w-none h-auto"><FormSwitch checked={!scheduleForm.requires_protocol} onCheckedChange={(c) => setScheduleForm((p) => ({ ...p, requires_protocol: !c }))} /></FormField>
              <FormField label="البيانات مكتملة" className="w-full max-w-none h-auto"><FormSwitch checked={scheduleForm.is_data_complete} onCheckedChange={(c) => setScheduleForm((p) => ({ ...p, is_data_complete: c }))} /></FormField>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <FormTextArea label="ملاحظات" value={scheduleForm.notes} onChange={(e: any) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Meeting scheduled successfully" containerClassName="!px-0 !mx-0" fullWidth={false} />
            </div>
          </form>
        </Drawer>
      )}

      {/* Schedule confirm modal (schedule officer) */}
      <Dialog open={scheduleConfirmModalOpen} onOpenChange={setScheduleConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تأكيد الجدولة</DialogTitle></DialogHeader>
          <div className="py-4">
            {(() => {
              const { start, end } = getEffectiveScheduleDates(meeting, scheduleForm);
              return (
                <div className="flex flex-col gap-2 text-sm text-foreground">
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">البداية</span><span>{start ? formatDateArabic(start) : '—'}</span></div>
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">النهاية</span><span>{end ? formatDateArabic(end) : '—'}</span></div>
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">القناة</span><span>{MeetingChannelLabels[meeting?.meeting_channel as string] ?? MeetingChannelLabels[scheduleForm.meeting_channel] ?? '—'}</span></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={() => setScheduleConfirmModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="button" disabled={scheduleMutation.isPending} onClick={() => handleScheduleSubmit({ preventDefault: () => {} } as any)} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
              {scheduleMutation.isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDrawer open={!!previewAttachment} onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }} attachment={previewAttachment} />
    </div>
  );
};

export default MeetingDetail;
