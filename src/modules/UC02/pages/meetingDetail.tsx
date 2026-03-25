import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileCheck, ClipboardCheck, CalendarMinus, Plus, Pencil, Trash2, Download, Eye, GitCompare, HelpCircle, Clock, Users, Search, Sparkles, Lightbulb, FileText, AlertCircle, Loader2, Check } from 'lucide-react';
import { 
  MeetingStatus, 
  MeetingStatusLabels, 
  MeetingType,
  MeetingTypeLabels,
  MeetingClassification,
  MeetingClassificationLabels,
  MeetingClassificationType,
  MeetingClassificationTypeLabels,
  MeetingConfidentiality,
  MeetingChannelLabels,
  StatusBadge,
  DetailPageHeader,
  type TableColumn,
  AIGenerateButton,
  FormAsyncSelectV2,
  FormDatePicker,
  FormDateTimePicker,
  FormField,
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextArea,
  type OptionType,
  Drawer,
  AttachmentPreviewDrawer,
  SECTOR_OPTIONS,
  PRESENTATION_DURATION_MINUTES_OPTIONS,
  MINISTER_SUPPORT_TYPE_OPTIONS,
  formatDateTimeArabic,
  formatDateArabic,
  formatTimeAgoArabic,
  isValidPhone,
  toISOStringWithTimezone,
  MeetingOwnerType,
} from '@/modules/shared'; 
import {
  getMeetingById,
  getMeetingRequestById,
  getMeetings,
  getMeetingsSearchForPrevious,
  type MeetingSearchResult,
  rejectMeeting,
  cancelMeeting,
  sendToContent,
  requestGuidance,
  getConsultants,
  type ConsultantUser,
  requestSchedulingConsultation,
  returnMeetingForInfo,
  approveMeetingUpdate,
  sendToContentScheduled,
  scheduleMeeting,
  rescheduleMeeting,
  createWebexMeeting,
  type MinisterAttendee,
  getConsultationRecordsWithParams,
  type ConsultationRecord,
  getGuidanceRecords,
  type GuidanceRecord,
  getContentOfficerNotesRecords,
  type GeneralNoteItem,
  moveToWaitingList,
} from '../data/meetingsApi';
import { deleteDraft } from '../data/draftApi';
import { PATH as UC02_PATH } from '../routes/paths';
import { PATH as UC01_PATH } from '../../UC01/routes/paths';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
  DateTimePicker,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/ui';
import { updateMeetingRequest, updateMeetingRequestWithAttachments, runCompareByAttachment, getAttachmentInsightsWithPolling, createSchedulingDirective, type ComparePresentationsResponse, type RelatedDirective, type AttachmentInsightsResponse } from '../data/meetingsApi';
import QualityModal from '../components/qualityModal';
import { MinisterCalendarView, SuggestAttendeesModal } from '../components';
import { MeetingActionsBar, type CalendarEventData, type MeetingInfoData, type MeetingInfoFieldSpec, type MeetingInfoRenderField, hasUseCaseAccess } from '@/modules/shared';
import { type SuggestedAttendee } from '../hooks/useSuggestMeetingAttendees';
import { RequestInfoTab, MeetingInfoTab, DirectivesTab, MeetingDocumentationTab, SchedulingConsultationTab, DirectiveTab } from '../features/meeting-detail';
import { fieldLabels, EDITABLE_FIELD_IDS, DIRECTIVE_METHOD_OPTIONS } from '../features/meeting-detail/constants';
import { translateDirectiveStatus } from '../features/meeting-detail/utils/meetingDetailHelpers';
import {
  MEETING_LOCATION_OPTIONS,
  getMeetingLocationDropdownValue,
  showMeetingLocationOtherInput,
  isPresetMeetingLocation,
} from '../../UC01/features/MeetingForm/utils/constants';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/modules/auth';
import { PdfIcon } from '@/lib/ui/assets/icons/PdfIcon';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';
import { NotesTab } from '@/modules/UC01/features/PreviewMeeting/tabs/NotesTab';
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';
import { TableRow } from '@/lib/dynamic-table-form';

/** Extra meeting info field specs for UC02 meeting detail: sequential meeting, previous meeting select (when sequential), الرقم التسلسلي */
const UC02_EXTRA_MEETING_INFO_SPECS: MeetingInfoFieldSpec[] = [
  { key: 'is_sequential', label: fieldLabels.is_sequential, getValue: (d) => (d.is_sequential === true ? 'نعم' : d.is_sequential === false ? 'لا' : '—') },
  { key: 'previous_meeting_id', label: fieldLabels.previous_meeting_id, getValue: (d) => d.previous_meeting_meeting_title ?? '—' },
  { key: 'sequential_number', label: 'الرقم التسلسلي', getValue: (d) => d.sequential_number_display ?? '—' },
];

/** Map API attendance_mechanism (Arabic) to attendance_channel enum */
function mapAttendanceMechanismToChannel(v: string | null | undefined): 'PHYSICAL' | 'REMOTE' {
  if (!v || typeof v !== 'string') return 'PHYSICAL';
  const s = v.trim().toLowerCase();
  if (s === 'عن بعد' || s === 'remote' || s === 'remot') return 'REMOTE';
  return 'PHYSICAL'; // حضوري, physical, etc.
}

/** Map API minister_attendees (mobile, attendance_mechanism) to form format (phone, attendance_channel) */
function mapApiMinisterAttendeesToForm(list: any[] | undefined): MinisterAttendee[] {
  return (list || []).map((a) => ({
    ...a,
    phone: a.mobile ?? a.mobile ?? '',
    attendance_channel: (a.attendance_channel ?? mapAttendanceMechanismToChannel(a.attendance_mechanism)) as 'PHYSICAL' | 'REMOTE',
  }));
}

/** Normalize minister attendees so all API-required fields are present (no undefined). */
function normalizeMinisterAttendees(list: MinisterAttendee[] | undefined): Array<{
  username: string;
  external_name: string;
  external_email: string;
  is_required: boolean;
  justification: string;
  access_permission: string;
  position: string;
  phone: string;
  attendance_channel: 'PHYSICAL' | 'REMOTE';
  is_consultant: boolean;
}> {
  return (list || []).map((a) => ({
    username: a.username ?? '',
    external_name: a.external_name ?? '',
    external_email: a.external_email ?? '',
    is_required: a.is_required ?? false,
    justification: a.justification ?? '',
    access_permission: a.access_permission ?? 'FULL',
    position: a.position ?? '',
    phone: a.mobile ?? (a as any).mobile ?? '',
    attendance_channel: (a.attendance_channel ?? 'PHYSICAL') as 'PHYSICAL' | 'REMOTE',
    is_consultant: a.is_consultant ?? false,
  }));
}

/** Simple email format validation */
function isValidEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/** Translate comparison API enum-like values to Arabic */
const COMPARE_STATUS: Record<string, string> = { completed: 'مكتمل', pending: 'قيد المعالجة' };
const COMPARE_LEVEL: Record<string, string> = { minor: 'طفيف', moderate: 'متوسط', major: 'كبير' };
const COMPARE_RECOMMENDATION: Record<string, string> = { review: 'مراجعة' };
function translateCompareValue(value: string | undefined | null, map: Record<string, string>): string {
  if (value == null || value === '') return '—';
  return map[String(value).toLowerCase()] ?? value;
}

/** Normalize API general_notes (array of items or legacy string) to a list for display */
function getGeneralNotesList(
  generalNotes: GeneralNoteItem[] | string | null | undefined
): GeneralNoteItem[] {
  if (generalNotes == null) return [];
  if (Array.isArray(generalNotes)) return generalNotes;
  if (typeof generalNotes === 'string' && generalNotes.trim() !== '') {
    return [{ id: '', note_type: 'GENERAL', text: generalNotes, author_id: '', author_type: '', author_name: null, created_at: '', updated_at: '' }];
  }
  return [];
}

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isScheduleOfficer = hasUseCaseAccess(user?.use_cases, 'UC-02');
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [expandedGuidanceId, setExpandedGuidanceId] = useState<string | null>(null);
  const [ meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [isDeleteDraftModalOpen, setIsDeleteDraftModalOpen] = useState(false);
  const openEditForm = () => { setMeetingFormOpen(true); };

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

  const handleDeleteDraftConfirm = useCallback(() => {
    if (id) deleteDraftMutation.mutate(id);
  }, [id, deleteDraftMutation]);

  // Fetch meeting data from API
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

  const generalNotesList = React.useMemo(
    () => getGeneralNotesList(meeting?.general_notes),
    [meeting?.general_notes]
  );

  // Fetch consultation records (استشارة الجدولة tab) – scheduling consultation type
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id, 'SCHEDULING'],
    queryFn: () => getConsultationRecordsWithParams(id!, { consultation_type: 'SCHEDULING' }),
    enabled: !!id && activeTab === 'scheduling-consultation',
  });

  // Fetch guidance records (سؤال tab)
  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', id],
    queryFn: () => getGuidanceRecords(id!),
    enabled: !!id && activeTab === 'directive',
  });

  // Fetch content officer notes records (shown in المحتوى tab)
  const { data: contentOfficerNotesRecordsRaw } = useQuery({
    queryKey: ['content-officer-notes-records', id, 'CONTENT'],
    queryFn: () => getContentOfficerNotesRecords(id!, { skip: 0, limit: 100, consultation_type: 'CONTENT' }),
    enabled: !!id && activeTab === 'content',
    placeholderData: undefined,
  });

  const contentOfficerNotesRecords = activeTab === 'content' ? contentOfficerNotesRecordsRaw : undefined;

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    meeting_type: '',
    meeting_title: '',
    meeting_classification: '',
    meeting_subject: '',
    meeting_owner: '',
    is_on_behalf_of: false,
    is_urgent: false,
    is_sequential: false,
    previous_meeting_ext_id: null as number | null,
    previous_meeting_group_id: null as number | null,
    previous_meeting_original_title: null as string | null,
    previous_meeting_meeting_title: null as string | null,
    is_based_on_directive: false,
    directive_method: '',
    previous_meeting_minutes_id: '',
    related_guidance: '',
    sector: '',
    meeting_justification: '',
    meeting_classification_type: '' as MeetingClassificationType | '',
    related_topic: '',
    deadline: '' as string,
    meeting_confidentiality: '' as MeetingConfidentiality | '',
    previous_meeting_attachment: null as {
      id?: string;
      meeting_request_id?: string;
      file_name?: string;
      file_size?: number;
      file_type?: string;
      content_type?: string;
      uploaded_by?: string;
    } | null,
  });
  /** Selected option for "الاجتماع السابق" async select (value + label) */
  const [previousMeetingOption, setPreviousMeetingOption] = useState<OptionType | null>(null);
  /** Cache of last loaded search results for "الاجتماع السابق" to read original_title/meeting_title on select */
  const previousMeetingSearchCacheRef = useRef<MeetingSearchResult[]>([]);
  /** Selected option for "محضر الاجتماع" async select */
  const [previousMeetingMinutesOption, setPreviousMeetingMinutesOption] = useState<OptionType | null>(null);

  // Fetch previous meeting when الاجتماع السابق is selected (for الرقم التسلسلي = previous + 1); use ext_id (search result id) when set
  const previousMeetingId = (formData.previous_meeting_ext_id != null ? String(formData.previous_meeting_ext_id) : meeting?.previous_meeting?.meeting_id ?? meeting?.previous_meeting_id ?? null) as string | null;
  const { data: previousMeeting } = useQuery({
    queryKey: ['meeting', previousMeetingId],
    queryFn: () => getMeetingById(previousMeetingId!),
    enabled: !!previousMeetingId && !!id && previousMeetingId !== id,
  });

  // Suggested times state (populated from meeting alternative_time_slot_1/2)
  const [suggestedTimes, setSuggestedTimes] = useState<Array<{ id: string; time: string; selected: boolean }>>([]);

  // Populate suggested times when meeting loads (support single object or arrays)
  useEffect(() => {
    if (!meeting) return;
    const slots: Array<{ id: string; time: string; selected: boolean }> = [];

    // Debug: show incoming slot objects
    // DEV-ONLY: helps verify source of displayed times
    // eslint-disable-next-line no-console
    console.debug('meeting slot objects:', {
      selected_time_slot: meeting.selected_time_slot,
      alternative_time_slot_1: meeting.alternative_time_slot_1,
      alternative_time_slot_2: meeting.alternative_time_slot_2,
    });

    const formatSlot = (slot: any) => {
      if (!slot || !slot.slot_start) return null;
      const start = new Date(slot.slot_start);
      const end = slot.slot_end ? new Date(slot.slot_end) : null;
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
          d.getHours()
        ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const timeStr = end ? `${fmt(start)} - ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` : fmt(start);
      return { id: slot.id, time: timeStr, selected: !!slot.is_selected };
    };

    const push = (val: any) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((s) => {
          const r = formatSlot(s);
          if (r) slots.push(r);
        });
      } else {
        const r = formatSlot(val);
        if (r) slots.push(r);
      }
    };

    push(meeting.alternative_time_slot_1);
    push(meeting.alternative_time_slot_2);
    // fallback: if meeting.selected_time_slot exists, include it first
    if (meeting.selected_time_slot) {
      const sel = formatSlot(meeting.selected_time_slot);
      if (sel) {
        // ensure selected slot appears first and marked selected
        sel.selected = true;
        // remove any duplicate by id
        const filtered = slots.filter((s) => s.id !== sel.id);
        setSuggestedTimes([sel, ...filtered]);
        return;
      }
    }

    if (slots.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('suggestedTimes built:', slots);
      setSuggestedTimes(slots);
    }
  }, [meeting]);

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectForm, setRejectForm] = useState({
    reason: '',
    notes: '',
  });

  // Cancel meeting modal state (for SCHEDULED meetings)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    notes: '',
  });

  // Send to content modal state
  const [isSendToContentModalOpen, setIsSendToContentModalOpen] = useState(false);
  const [sendToContentForm, setSendToContentForm] = useState({
    notes: '',
  });

  // Request guidance modal state
  const [isRequestGuidanceModalOpen, setIsRequestGuidanceModalOpen] = useState(false);
  const [requestGuidanceForm, setRequestGuidanceForm] = useState({
    notes: '',
  });

  // Scheduling consultation inline chat state (multiple consultants)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [showConsultantPicker, setShowConsultantPicker] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    consultant_user_ids: [] as string[],
    consultation_question: '',
    search: '',
  });

  // Approve update modal state (مجدول - الجدولة → إعتماد التحديث → مجدول)
  const [isApproveUpdateModalOpen, setIsApproveUpdateModalOpen] = useState(false);
  const [approveUpdateForm, setApproveUpdateForm] = useState({ notes: '' });

  // Return for info modal state (editable_fields: which fields submitter can edit)
  const [isReturnForInfoModalOpen, setIsReturnForInfoModalOpen] = useState(false);
  const [returnForInfoForm, setReturnForInfoForm] = useState<{
    notes: string;
    editable_fields: Record<string, boolean>;
  }>({
    notes: '',
    editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>),
  });
  const [returnForInfoNotesError, setReturnForInfoNotesError] = useState<string | null>(null);

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleConfirmModalOpen, setScheduleConfirmModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
    scheduled_end_at: '',
    meeting_channel: 'PHYSICAL' as 'PHYSICAL' | 'PHYSICAL_LOCATION_1' | 'PHYSICAL_LOCATION_2' | 'PHYSICAL_LOCATION_3' | 'VIRTUAL' | 'HYBRID',
    requires_protocol: false,
    protocol_type: null as string | null,
    protocol_type_text: '',
    is_data_complete: true,
    notes: '',
    location: '',
    location_option: '' as string,
    selected_time_slot_id: null as string | null,
    minister_attendees: [] as MinisterAttendee[],
  });

  // Content tab form state (objectives and agenda items)
  const [contentForm, setContentForm] = useState<{
    objectives: Array<{ id: string; objective: string }>;
    agendaItems: Array<{
      id: string;
      agenda_item: string;
      presentation_duration_minutes?: number;
      minister_support_type?: string;
      minister_support_other?: string;
    }>;
  }>({
    objectives: [],
    agendaItems: [],
  });
  // Attachments state for managing deletions and additions
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [newPresentationAttachments, setNewPresentationAttachments] = useState<File[]>([]);

  // Content tab (المحتوى) editable fields: متى سيتم إرفاق العرض؟ (ملاحظات read-only)
  const [contentTabForm, setContentTabForm] = useState({ when_presentation_attached: '', general_notes: '' });

  // Original snapshot for change detection
  const [originalSnapshot, setOriginalSnapshot] = useState<any>(null);

  // Delete minister attendee confirmation modal state
  const [deleteAttendeeIndex, setDeleteAttendeeIndex] = useState<number | null>(null);
  // Track which minister attendee cards are in edit mode
  const [editingMinisterAttendees, setEditingMinisterAttendees] = useState<Set<number>>(new Set());
  
  // Delete invitee confirmation modal state
  const [deleteInviteeId, setDeleteInviteeId] = useState<string | null>(null);



  // Compare presentations modal (تقييم الاختلاف بين العروض)
  const [isComparePresentationsModalOpen, setIsComparePresentationsModalOpen] = useState(false);
  const [comparePresentationsResult, setComparePresentationsResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareErrorDetail, setCompareErrorDetail] = useState<string | null>(null);
  /** True when user opened compare modal for an attachment that has no previous version (replaces_attachment_id is null). */
  const [compareOpenedWithoutReplace, setCompareOpenedWithoutReplace] = useState(false);
  /** LLM notes/insights modal for a presentation attachment (ملاحظات على العرض) – icon on each attachment */
  const [insightsModalAttachment, setInsightsModalAttachment] = useState<{ id: string; file_name: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);
  /** AbortController for insights polling – abort when modal closes to stop polling */
  const insightsAbortControllerRef = useRef<AbortController | null>(null);
  /** AbortController for compare (تقييم الاختلاف) polling – abort when modal closes */
  const compareAbortControllerRef = useRef<AbortController | null>(null);
  /** Last meeting id we initialized form state for – avoid overwriting user edits on refetch */
  const lastInitializedMeetingIdRef = useRef<string | null>(null);

  // Handle invitee deletion
  const handleDeleteInvitee = () => {
    if (deleteInviteeId) {
      setDeleteInviteeId(null);
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = (attachmentId: string) => {
    setDeletedAttachmentIds((prev) => [...prev, attachmentId]);
  };

  // Handle adding new attachments
  const handleAddAttachments = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setNewAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  // Handle removing a new attachment before upload
  const handleRemoveNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle adding new presentation attachments (العرض التقديمي)
  const handleAddPresentationAttachments = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setNewPresentationAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  const handleRemoveNewPresentationAttachment = (index: number) => {
    setNewPresentationAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Local invitees state for adding new invitees (جدول: رقم البند، الإسم، المنصب، الجوال، البريد، آلية الحضور، صلاحية الاطلاع)
  type AttendanceChannel = 'PHYSICAL' | 'REMOTE';
  const [localInvitees, setLocalInvitees] = useState<Array<{
    id: string;
    external_name?: string;
    external_email?: string;
    is_required: boolean;
    position?: string;
    mobile?: string;
    attendance_channel?: AttendanceChannel;
    access_permission?: boolean;
    isEditing?: boolean;
  }>>([]);

  // Add new invitee
  const addInvitee = () => {
    const newId = `local-${Date.now()}`;
    const newInvitee = {
      id: newId,
      external_name: '',
      external_email: '',
      is_required: false,
      position: '',
      sector: '',
      mobile: '',
      attendance_channel: 'PHYSICAL' as AttendanceChannel,
      access_permission: false,
      isEditing: true,
    };
    setLocalInvitees((prev) => [...prev, newInvitee]);
  };

  /** Effective start/end for schedule confirm modal and submit: from meeting (scheduled_*, meeting_*_date), selected slot, or scheduleForm. */
  const getEffectiveScheduleDates = useCallback(
    (m: typeof meeting, form: typeof scheduleForm): { start: string | undefined; end: string | undefined } => {
      if (!m) return { start: undefined, end: undefined };
      const start =
        (m as any).scheduled_start ?? (m as any).meeting_start_date ?? (form.scheduled_at || undefined);
      const end =
        (m as any).scheduled_end ?? (m as any).scheduled_end_at ?? (m as any).meeting_end_date ?? (form.scheduled_end_at || undefined);
      if (start && end) return { start, end };
      const slotId = form.selected_time_slot_id ?? (m as any).selected_time_slot_id;
      if (!slotId) return { start, end };
      const allSlots = [
        (m as any).alternative_time_slot_1,
        (m as any).alternative_time_slot_2,
        (m as any).selected_time_slot,
      ].filter(Boolean);
      const slot = allSlots.find((s: any) => s?.id === slotId);
      if (!slot?.slot_start) return { start, end };
      const slotEnd = slot.slot_end ?? toISOStringWithTimezone(new Date(new Date(slot.slot_start).getTime() + 3600000));
      return {
        start: start ?? slot.slot_start,
        end: end ?? slotEnd,
      };
    },
    []
  );

  const queryClient = useQueryClient();
  
  // Clear content officer notes cache when leaving المحتوى tab to avoid stale data
  React.useEffect(() => {
    if (activeTab !== 'content') {
      queryClient.removeQueries({ queryKey: ['content-officer-notes-records', id, 'CONTENT'] });
    }
  }, [activeTab, id, queryClient]);
  
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isAddDirectiveOpen, setIsAddDirectiveOpen] = useState(false);
  const [addDirectiveForm, setAddDirectiveForm] = useState({
    directive_date: '',
    directive_text: '',
    related_meeting: '',
    deadline: '',
    responsible_persons: '', // comma or newline separated, parsed to string[]
  });
  /** Deadline picker: no past calendar days; if directive_date is in the future, deadline cannot precede that day. */
  const addDirectiveDeadlineMinDate = React.useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (!addDirectiveForm.directive_date) return startOfToday;
    const dir = new Date(addDirectiveForm.directive_date);
    if (Number.isNaN(dir.getTime())) return startOfToday;
    const startOfDirectiveDay = new Date(dir);
    startOfDirectiveDay.setHours(0, 0, 0, 0);
    return startOfDirectiveDay > startOfToday ? startOfDirectiveDay : startOfToday;
  }, [addDirectiveForm.directive_date]);
  React.useEffect(() => {
    if (!addDirectiveForm.deadline) return;
    const deadlineMs = new Date(addDirectiveForm.deadline).getTime();
    if (Number.isNaN(deadlineMs) || deadlineMs < addDirectiveDeadlineMinDate.getTime()) {
      setAddDirectiveForm((p) => ({ ...p, deadline: '' }));
    }
  }, [addDirectiveDeadlineMinDate, addDirectiveForm.deadline]);
  const [actionsBarOpen, setActionsBarOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);
  /** Validation errors per local invitee id (قائمة المدعوين مقدّم الطلب) */
  const [inviteeValidationErrors, setInviteeValidationErrors] = useState<Record<string, Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile', string>>>>({});
  /** Validation errors per minister attendee index (قائمة المدعوين الوزير) */
  const [ministerAttendeeValidationErrors, setMinisterAttendeeValidationErrors] = useState<Record<number, Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile' | 'justification', string>>>>({});

  // Build payload of changed fields
  const changedPayload = React.useMemo(() => {
    if (!originalSnapshot) return {};
    const payload: any = {};

    // Compare basic info formData
    if (formData.meeting_type !== originalSnapshot.formData.meeting_type) payload.meeting_type = formData.meeting_type;
    if (formData.meeting_title !== originalSnapshot.formData.meeting_title) payload.meeting_title = formData.meeting_title;
    if (formData.meeting_subject !== originalSnapshot.formData.meeting_subject) payload.meeting_subject = formData.meeting_subject;
    if (formData.meeting_classification !== originalSnapshot.formData.meeting_classification) payload.meeting_classification = formData.meeting_classification;
    if ((formData.meeting_owner || '') !== (originalSnapshot.formData.meeting_owner || '')) payload.meeting_owner = formData.meeting_owner || undefined;
    if (formData.is_sequential !== originalSnapshot.formData.is_sequential) payload.is_sequential = formData.is_sequential;
    if ((formData.previous_meeting_ext_id ?? null) !== (originalSnapshot.formData.previous_meeting_ext_id ?? null) || (formData.previous_meeting_group_id ?? null) !== (originalSnapshot.formData.previous_meeting_group_id ?? null)) {
      payload.prev_ext_id = formData.previous_meeting_ext_id ?? 0;
      payload.group_id = formData.previous_meeting_group_id ?? 0;
      payload.prev_ext_original_title = formData.previous_meeting_original_title ?? null;
      payload.prev_ext_meeting_title = formData.previous_meeting_meeting_title ?? null;
    }
    if (formData.is_based_on_directive !== originalSnapshot.formData.is_based_on_directive) payload.is_based_on_directive = formData.is_based_on_directive;
    if ((formData.directive_method || '') !== (originalSnapshot.formData.directive_method || '')) payload.directive_method = formData.directive_method || null;
    if ((formData.previous_meeting_minutes_id || '') !== (originalSnapshot.formData.previous_meeting_minutes_id || '')) payload.previous_meeting_minutes_id = formData.previous_meeting_minutes_id || null;
    if ((formData.related_guidance || '') !== (originalSnapshot.formData.related_guidance || '')) payload.related_guidance = formData.related_guidance || null;
    if (formData.is_on_behalf_of !== originalSnapshot.formData.is_on_behalf_of) payload.is_on_behalf_of = formData.is_on_behalf_of;
    if (formData.is_urgent !== originalSnapshot.formData.is_urgent) payload.is_urgent = formData.is_urgent;
    if ((formData.sector || '') !== (originalSnapshot.formData.sector || '')) payload.sector = formData.sector || undefined;
    if ((formData.meeting_justification || '') !== (originalSnapshot.formData.meeting_justification || '')) payload.meeting_justification = formData.meeting_justification || undefined;
    if ((formData.meeting_classification_type || '') !== (originalSnapshot.formData.meeting_classification_type || '')) payload.meeting_classification_type = formData.meeting_classification_type || undefined;
    if ((formData.related_topic || '') !== (originalSnapshot.formData.related_topic || '')) payload.related_topic = formData.related_topic || null;
    if ((formData.deadline || '') !== (originalSnapshot.formData.deadline || '')) payload.deadline = formData.deadline || null;
    if ((formData.meeting_confidentiality || '') !== (originalSnapshot.formData.meeting_confidentiality || '')) payload.meeting_confidentiality = formData.meeting_confidentiality || undefined;

    // Compare content tab (objectives and agenda items) as arrays
    if (JSON.stringify(contentForm.objectives || []) !== JSON.stringify(originalSnapshot.contentForm.objectives || [])) {
      payload.objectives = contentForm.objectives
        .filter((obj) => obj.objective.trim().length > 0)
        .map((obj) => ({ objective: obj.objective.trim() }));
    }

    if (JSON.stringify(contentForm.agendaItems || []) !== JSON.stringify(originalSnapshot.contentForm.agendaItems || [])) {
      const filtered = contentForm.agendaItems.filter((item) => item.agenda_item.trim().length > 0);
      const otherTypeValue = MINISTER_SUPPORT_TYPE_OPTIONS[MINISTER_SUPPORT_TYPE_OPTIONS.length - 1]?.value ?? 'أخرى';
      payload.agenda_items = filtered.map((item) => {
        const supportType = (item.minister_support_type ?? '').trim();
        const isOther = supportType === otherTypeValue;
        const rawOther = item.minister_support_other;
        const customText =
          typeof rawOther === 'string' ? rawOther.trim() : rawOther != null ? String(rawOther).trim() : '';
        return {
          agenda_item: item.agenda_item.trim(),
          presentation_duration_minutes: item.presentation_duration_minutes,
          minister_support_type: item.minister_support_type ?? '',
          minister_support_other: isOther ? (customText || null) : null,
        };
      });
    }

    // scheduleForm comparisons against snapshot (meeting_channel = آلية انعقاد الاجتماع enum)
    if ((scheduleForm.meeting_channel || '') !== (originalSnapshot.scheduleForm.meeting_channel || '')) payload.meeting_channel = scheduleForm.meeting_channel;
    // Always send meeting_location: preset (العليا/الغدير) or custom text when "other" is selected
    payload.meeting_location = scheduleForm.location || null;
    if ((scheduleForm.requires_protocol ?? false) !== (originalSnapshot.scheduleForm.requires_protocol ?? false)) payload.requires_protocol = scheduleForm.requires_protocol;
    if ((scheduleForm.protocol_type_text || '') !== (originalSnapshot.scheduleForm.protocol_type_text || '')) payload.protocol_type = scheduleForm.protocol_type_text;
    if ((scheduleForm.is_data_complete ?? true) !== (originalSnapshot.scheduleForm.is_data_complete ?? true)) payload.is_data_complete = scheduleForm.is_data_complete;
    if ((scheduleForm.selected_time_slot_id || null) !== (originalSnapshot.scheduleForm.selected_time_slot_id || null)) payload.selected_time_slot_id = scheduleForm.selected_time_slot_id;

    // minister attendees (قائمة المدعوين الوزير) – all fields required in payload
    if (JSON.stringify(scheduleForm.minister_attendees || []) !== JSON.stringify(originalSnapshot.scheduleForm.minister_attendees || [])) {
      payload.minister_attendees = normalizeMinisterAttendees(scheduleForm.minister_attendees);
    }

    if ((contentTabForm.general_notes || '') !== (originalSnapshot.contentTabForm?.general_notes || '')) {
      payload.general_notes = contentTabForm.general_notes || null;
    }

    // Track attachment deletions
    if (deletedAttachmentIds.length > 0) {
      payload.deleted_attachment_ids = deletedAttachmentIds;
    }

    // Note: New attachments will need to be uploaded separately via file upload API
    // For now, we track them in state but they won't be in the payload
    // The actual upload should happen in a separate API call

    return payload;
  }, [originalSnapshot, formData, contentForm, contentTabForm, scheduleForm, localInvitees, deletedAttachmentIds]);

  const hasChanges = Object.keys(changedPayload).length > 0 || deletedAttachmentIds.length > 0 || newAttachments.length > 0 || newPresentationAttachments.length > 0;

  /** Validate local invitees (قائمة المدعوين مقدّم الطلب): all required, email and phone format. Returns true if valid. */
  const validateInvitees = useCallback((): boolean => {
    const errors: Record<string, Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile', string>>> = {};
    localInvitees.forEach((inv) => {
      const row: Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile', string>> = {};
      const name = (inv.external_name ?? '').trim();
      const email = (inv.external_email ?? '').trim();
      const position = (inv.position ?? '').trim();
      const phone = (inv.mobile ?? '').trim();
      if (!name) row.external_name = 'مطلوب';
      if (!email) row.external_email = 'مطلوب';
      else if (!isValidEmail(email)) row.external_email = 'صيغة بريد إلكتروني غير صحيحة';
      if (!position) row.position = 'مطلوب';
      if (phone && !isValidPhone(phone)) row.mobile = 'الجوال: صيغة غير صحيحة (أرقام فقط، مع إمكانية + في البداية)';
      if (Object.keys(row).length > 0) errors[inv.id] = row;
    });
    setInviteeValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localInvitees]);

  /** Validate minister attendees (قائمة المدعوين الوزير): all required, email and phone format. Returns true if valid. */
  const validateMinisterAttendees = useCallback((): boolean => {
    const errors: Record<number, Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile' | 'justification', string>>> = {};
    (scheduleForm.minister_attendees || []).forEach((att, index) => {
      const row: Partial<Record<'external_name' | 'external_email' | 'position' | 'mobile' | 'justification', string>> = {};
      const name = (att.external_name ?? '').trim();
      const email = (att.external_email ?? '').trim();
      const position = (att.position ?? '').trim();
      const phone = (att.mobile ?? (att as any).mobile ?? '').trim();
      const justification = (att.justification ?? '').trim();
      if (!name) row.external_name = 'مطلوب';
      if (!email) row.external_email = 'مطلوب';
      else if (!isValidEmail(email)) row.external_email = 'صيغة بريد إلكتروني غير صحيحة';
      if (!position) row.position = 'مطلوب';
      if (phone && !isValidPhone(phone)) row.mobile = 'الجوال: صيغة غير صحيحة (أرقام فقط، مع إمكانية + في البداية)';
      if (!justification) row.justification = 'مطلوب';
      if (Object.keys(row).length > 0) errors[index] = row;
    });
    setMinisterAttendeeValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [scheduleForm.minister_attendees]);

  const updateMutation = useMutation({
    mutationFn: async ({ payload, presentationFiles }: { payload: any; presentationFiles?: File[] }) => {
      setUpdateErrorMessage(null);
      if (presentationFiles && presentationFiles.length > 0) {
        if (payload && Object.keys(payload).length > 0) {
          await updateMeetingRequest(id!, payload);
        }
        await updateMeetingRequestWithAttachments(id!, presentationFiles);
      } else {
        await updateMeetingRequest(id!, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsEditConfirmOpen(false);
      setNewPresentationAttachments([]);
      setUpdateErrorMessage(null);
    },
    onError: (err: unknown) => {
      const data = err && typeof err === 'object' && 'detail' in err ? (err as { detail?: unknown; type?: string }) : null;
      const detail = Array.isArray(data?.detail) ? data.detail[0] : null;
      const msg = detail && typeof detail === 'object' && 'msg' in detail ? String((detail as { msg: unknown }).msg) : '';
      const isMultipartRejection =
        data?.type === 'ValidationError' &&
        (msg.includes('valid dictionary') || msg.includes('object to extract fields from'));
      if (isMultipartRejection) {
        setUpdateErrorMessage(
          'رفع العروض التقديمية غير مدعوم من الخادم حالياً. يرجى تحديث واجهة الخادم (API) لدعم طلبات multipart/form-data على نقطة التحديث، أو إزالة ملفات العرض والتأكيد بدونها.'
        );
      } else {
        setUpdateErrorMessage(typeof err === 'string' ? err : (data && (data as { message?: string }).message) || 'حدث خطأ أثناء الحفظ.');
      }
    },
  });

  const addDirectiveMutation = useMutation({
    mutationFn: async (payload: {
      directive_date: string;
      directive_text: string;
      related_meeting: string;
      deadline: string;
      responsible_persons: string[];
    }) => {
      await createSchedulingDirective(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsAddDirectiveOpen(false);
      setAddDirectiveForm({
        directive_date: '',
        directive_text: '',
        related_meeting: '',
        deadline: '',
        responsible_persons: '',
      });
    },
  });

  // Move to waiting list mutation
  const moveToWaitingListMutation = useMutation({
    mutationFn: () => moveToWaitingList(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      navigate(-1); // Navigate back after successful move
    },
  });

  // Compare by attachment (تقييم الاختلاف بين العروض) – enabled when attachment has presentation_sequence > 1; stops when modal closes (signal aborted)
  const compareByAttachmentMutation = useMutation({
    mutationFn: (payload: { attachmentId: string; signal?: AbortSignal }) =>
      runCompareByAttachment(payload.attachmentId, { signal: payload.signal }),
    onSuccess: (data) => {
      setComparePresentationsResult(data);
      setCompareErrorDetail(null);
      setIsComparePresentationsModalOpen(true);
    },
    onError: (err: unknown) => {
      if ((err as DOMException)?.name !== 'AbortError') {
      console.error('Compare presentations error:', err);
      setComparePresentationsResult(null);
      const e = err as { response?: { data?: { detail?: string } }; detail?: string };
      const detail = typeof e?.response?.data?.detail === 'string' ? e.response.data.detail : typeof e?.detail === 'string' ? e.detail : null;
      setCompareErrorDetail(detail);
      setIsComparePresentationsModalOpen(true);
      }
    },
  });

  // LLM notes/insights for presentation attachment (ملاحظات على العرض) – poll until ready; stops when modal closes (signal aborted)
  const insightsMutation = useMutation({
    mutationFn: (payload: { attachmentId: string; signal?: AbortSignal }) =>
      getAttachmentInsightsWithPolling(payload.attachmentId, { signal: payload.signal }),
    onError: (err) => {
      if ((err as DOMException)?.name !== 'AbortError') {
        console.error('Attachment insights error:', err);
      }
    },
  });

  // Reject meeting mutation
  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; notes: string }) => rejectMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsRejectModalOpen(false);
      setRejectForm({ reason: '', notes: '' });
      navigate(-1); // Navigate back after successful rejection
    },
  });

  // Cancel meeting mutation (for SCHEDULED meetings)
  const cancelMutation = useMutation({
    mutationFn: (payload: { reason?: string; notes?: string }) => cancelMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsCancelModalOpen(false);
      setCancelForm({ reason: '', notes: '' });
      navigate(-1); // Navigate back after successful cancel
    },
  });

  // Send to content mutation (uses send-to-content-scheduled when status is SCHEDULED_SCHEDULING)
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

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectForm.reason.trim()) {
      rejectMutation.mutate({
        reason: rejectForm.reason,
        notes: rejectForm.notes,
      });
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cancelMutation.mutate({
      reason: cancelForm.reason.trim() || undefined,
      notes: cancelForm.notes.trim() || undefined,
    });
  };

  const handleSendToContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendToContentMutation.mutate({ notes: sendToContentForm.notes });
  };

  const handleSendToContentDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    sendToContentMutation.mutate({ notes: sendToContentForm.notes, is_draft: true });
  };

  // Request guidance mutation
  const requestGuidanceMutation = useMutation({
    mutationFn: (payload: { notes: string; is_draft?: boolean }) => requestGuidance(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['guidance-records', id] });
      setIsRequestGuidanceModalOpen(false);
      setRequestGuidanceForm({ notes: '' });
    },
  });

  const handleRequestGuidanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestGuidanceMutation.mutate({
      notes: requestGuidanceForm.notes || 'يرجى توفير التوجيهات اللازمة حول هذا الطلب',
    });
  };

  // Consultants query for async select (طلب استشارة جدولة) – EXECUTIVE_OFFICE_MANAGER only
  const {
    data: consultantsResponse,
    isLoading: isLoadingConsultants,
  } = useQuery({
    queryKey: ['consultants', consultationForm.search, 'SCHEDULING_CONSULTANT'],
    queryFn: () =>
      getConsultants({
        search: consultationForm.search,
        role_code: 'SCHEDULING_CONSULTANT',
        page: 1,
        limit: 50,
      }),
    enabled: activeTab === 'scheduling-consultation',
  });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // Scheduling consultation mutation (single request with consultant_user_ids array)
  const consultationMutation = useMutation({
    mutationFn: (payload: {
      consultant_user_ids: string[];
      consultation_question: string;
    }) =>
      requestSchedulingConsultation(id!, {
        consultant_user_ids: payload.consultant_user_ids,
        consultation_question: payload.consultation_question,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records', id, 'SCHEDULING'] });
      setShowConsultantPicker(false);
      setConsultationForm({
        consultant_user_ids: [],
        consultation_question: '',
        search: '',
      });
    },
  });

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consultationForm.consultant_user_ids.length === 0) return;
    const questionTrimmed = consultationForm.consultation_question.trim();
    if (!questionTrimmed) return;
    consultationMutation.mutate({
      consultant_user_ids: consultationForm.consultant_user_ids,
      consultation_question: questionTrimmed,
    });
  };

  const toggleConsultantSelection = (userId: string) => {
    setConsultationForm((prev) =>
      prev.consultant_user_ids.includes(userId)
        ? { ...prev, consultant_user_ids: prev.consultant_user_ids.filter((id) => id !== userId) }
        : { ...prev, consultant_user_ids: [...prev.consultant_user_ids, userId] }
    );
  };

  // Return for info mutation (POST with notes + editable_fields)
  const returnForInfoMutation = useMutation({
    mutationFn: (payload: { notes: string; editable_fields: string[] }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoNotesError(null);
      setReturnForInfoForm({
        notes: '',
        editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>),
      });
      navigate(-1);
    },
  });

  const handleReturnForInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const notesTrimmed = returnForInfoForm.notes.trim();
    if (!notesTrimmed) {
      setReturnForInfoNotesError('الملاحظات مطلوبة');
      return;
    }
    setReturnForInfoNotesError(null);
    const editable_fields = EDITABLE_FIELD_IDS.filter((id) => returnForInfoForm.editable_fields[id]);
    returnForInfoMutation.mutate({
      notes: notesTrimmed,
      editable_fields,
    });
  };

  // Approve update mutation (مجدول - الجدولة → مجدول)
  const approveUpdateMutation = useMutation({
    mutationFn: (payload: { notes?: string }) => approveMeetingUpdate(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsApproveUpdateModalOpen(false);
      setApproveUpdateForm({ notes: '' });
      navigate(-1);
    },
  });

  const handleApproveUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    approveUpdateMutation.mutate({ notes: approveUpdateForm.notes.trim() || undefined });
  };

  // Schedule meeting mutation (uses reschedule API when meeting is already SCHEDULED)
  const scheduleMutation = useMutation({
    mutationFn: (payload: {
      scheduled_start: string;
      scheduled_end: string;
      meeting_channel: string;
      requires_protocol: boolean;
      protocol_type: string | null;
      is_data_complete: boolean;
      notes: string;
      location?: string;
      meeting_url?: string;
      minister_attendees: MinisterAttendee[];
    }) =>
      meeting?.status === MeetingStatus.SCHEDULED
        ? rescheduleMeeting(id!, payload)
        : scheduleMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      // Close the form; do not navigate
        setIsScheduleModalOpen(false);
        setScheduleConfirmModalOpen(false);
        setScheduleForm({
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
          minister_attendees: [],
        });
    },
  });

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { start: startSource, end: endSource } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
    if (!startSource || !endSource) return;

    const scheduledAt = new Date(startSource);
    const scheduledEndAt = new Date(endSource);

    // Reject past date/time
    if (scheduledAt.getTime() <= Date.now()) {
      setValidationError('لا يمكن اختيار تاريخ أو وقت البداية في الماضي');
      return;
    }
    if (scheduledEndAt.getTime() <= scheduledAt.getTime()) {
      setValidationError('وقت النهاية يجب أن يكون بعد وقت البداية');
      return;
    }

    // Validate minister attendees (قائمة المدعوين الوزير)
    if ((scheduleForm.minister_attendees?.length ?? 0) > 0 && !validateMinisterAttendees()) {
      setValidationError('يرجى تصحيح الأخطاء في المدعوون (الوزير) — جميع الحقول مطلوبة والبريد يجب أن يكون صالحاً');
      return;
    }

    setValidationError(null);

    // Convert to ISO strings with timezone for schedule API (e.g. 2026-03-31T09:00:00+03:00)
    const scheduled_start = toISOStringWithTimezone(scheduledAt);
    const scheduled_end = toISOStringWithTimezone(scheduledEndAt);

    // Meeting channel: from meeting or form (schedule tab hides the field but we still send it)
    const meetingChannel = (meeting?.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel as string))
      ? meeting.meeting_channel
      : scheduleForm.meeting_channel;

    // If meeting channel is VIRTUAL or HYBRID, use the already-created Webex meeting link
    let meetingLink: string | undefined = undefined;
    if (meetingChannel === 'VIRTUAL' || meetingChannel === 'HYBRID') {
      if (!webexMeetingDetails) {
        setValidationError('يرجى الانتظار حتى يتم إنشاء اجتماع Webex');
        return;
      }
      meetingLink = webexMeetingDetails.join_link;
    } else {
      // Clear Webex details if channel is not VIRTUAL or HYBRID
      setWebexMeetingDetails(null);
    }

    const schedulePayload = {
      scheduled_start,
      scheduled_end,
      meeting_channel: meetingChannel,
      requires_protocol: scheduleForm.requires_protocol,
      is_preliminary_booking: !scheduleForm.requires_protocol,
      protocol_type: scheduleForm.requires_protocol ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
      is_data_complete: scheduleForm.is_data_complete,
      notes: scheduleForm.notes || 'Meeting scheduled successfully',
      location: scheduleForm.location || undefined,
      meeting_url: meetingLink,
      ...(webexMeetingDetails?.webex_meeting_unique_identifier && { webex_meeting_unique_identifier: webexMeetingDetails.webex_meeting_unique_identifier }),
      minister_attendees: normalizeMinisterAttendees(scheduleForm.minister_attendees),
    };

    scheduleMutation.mutate(schedulePayload);
  };

  const removeMinisterAttendee = (index: number) => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: prev.minister_attendees.filter((_, i) => i !== index),
    }));
    setEditingMinisterAttendees((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => { if (i < index) next.add(i); else if (i > index) next.add(i - 1); });
      return next;
    });
  };

  const updateMinisterAttendee = (index: number, field: string, value: any) => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: prev.minister_attendees.map((attendee, i) =>
        i === index ? { ...attendee, [field]: value } : attendee
      ),
    }));
    setMinisterAttendeeValidationErrors((prev) => {
      const row = prev[index];
      if (!row || !(field in row)) return prev;
      const nextRow = { ...row };
      delete (nextRow as any)[field];
      if (Object.keys(nextRow).length === 0) {
        const { [index]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [index]: nextRow };
    });
  };

  // Initialize form data when meeting loads (only when meeting id changes, not on refetch)
  React.useEffect(() => {
    if (!meeting?.id) {
      lastInitializedMeetingIdRef.current = null;
      return;
    }
    if (lastInitializedMeetingIdRef.current === meeting.id) return;
    lastInitializedMeetingIdRef.current = meeting.id;
    {
      const ownerDisplay = meeting.current_owner_user
        ? `${(meeting.current_owner_user.first_name || '').trim()} ${(meeting.current_owner_user.last_name || '').trim()}`.trim() || meeting.current_owner_user.username || ''
        : meeting.current_owner_role?.name_ar || '';
      const rawExtId = (meeting as any).prev_ext_id ?? meeting.previous_meeting?.meeting_id ?? null;
      const rawGroupId = (meeting as any).group_id ?? null;
      const prevExtId = rawExtId != null && !Number.isNaN(Number(rawExtId)) ? Number(rawExtId) : null;
      const prevGroupId = rawGroupId != null && !Number.isNaN(Number(rawGroupId)) ? Number(rawGroupId) : null;
      const prevMeetingLabel = (meeting as any).prev_ext_meeting_title ?? meeting.previous_meeting?.meeting_title ?? (prevExtId != null ? String(prevExtId) : '') ?? '';
      const basedOnDirective = !!(
        meeting.related_guidance ||
        (meeting as any).is_based_on_directive === true ||
        (meeting as any).is_based_on_directive === 'true' ||
        (Array.isArray(meeting.related_directive_ids) && meeting.related_directive_ids.length > 0)
      );
      const directiveMethodRaw = (meeting as any).directive_method || '';
      const minutesId = (meeting as any).previous_meeting_minutes_id || '';
      const hasPreviousMeetingContext = !!(meeting.previous_meeting_attachment || prevExtId != null || minutesId);
      const directiveMethod =
        directiveMethodRaw.trim() ||
        (hasPreviousMeetingContext && basedOnDirective ? 'PREVIOUS_MEETING' : '');
      const guidance = meeting.related_guidance ?? '';
      setFormData({
        description: meeting.description ?? '',
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.description ?? meeting.meeting_subject ?? '',
        meeting_owner: meeting.meeting_owner_name ?? ownerDisplay ?? '',
        is_on_behalf_of: (meeting as any)?.is_on_behalf_of ?? false,
        is_urgent: (meeting as any)?.is_urgent ?? false,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_ext_id: prevExtId,
        previous_meeting_group_id: prevGroupId,
        previous_meeting_original_title: (meeting as any).prev_ext_original_title ?? null,
        previous_meeting_meeting_title: (meeting as any).prev_ext_meeting_title ?? meeting.previous_meeting?.meeting_title ?? null,
        is_based_on_directive: basedOnDirective,
        directive_method: directiveMethod,
        previous_meeting_minutes_id: minutesId,
        related_guidance: guidance,
        sector: meeting.sector ?? '',
        meeting_justification: meeting.meeting_justification ?? '',
        meeting_classification_type: (meeting.meeting_classification_type as MeetingClassificationType) ?? '',
        related_topic: meeting.related_topic ?? '',
        deadline: meeting.deadline ? meeting.deadline.slice(0, 10) : '',
        meeting_confidentiality: (meeting.meeting_confidentiality as MeetingConfidentiality) ?? '',
        previous_meeting_attachment: meeting.previous_meeting_attachment ?? null,
      });
      setPreviousMeetingOption(prevExtId != null && prevGroupId != null ? { value: `${prevExtId}:${prevGroupId}`, label: prevMeetingLabel || String(prevExtId) } : null);
      setPreviousMeetingMinutesOption(minutesId ? { value: minutesId, label: minutesId } : null);

      // Initialize content tab form (objectives and agenda items)
      setContentForm({
        objectives: (meeting.objectives || []).map((obj) => ({
          id: obj.id || `obj-${Date.now()}-${Math.random()}`,
          objective: obj.objective,
        })),
        agendaItems: (meeting.agenda_items || []).map((item, idx) => {
          const ext = item as typeof item & { minister_support_type?: string; minister_support_other?: string; support_description?: string };
          const support = (meeting as any).minister_support?.[idx];
          const supportDesc = ext.support_description ?? support?.support_description ?? '';
          const isSupportType = MINISTER_SUPPORT_TYPE_OPTIONS.some((o) => o.value === supportDesc);
          return {
          id: item.id || `agenda-${Date.now()}-${Math.random()}`,
          agenda_item: item.agenda_item,
          presentation_duration_minutes: item.presentation_duration_minutes,
            minister_support_type: ext.minister_support_type ?? (isSupportType ? supportDesc : ''),
            minister_support_other: ext.minister_support_other ?? (isSupportType ? '' : supportDesc),
          };
        }),
      });
      setContentTabForm({
        when_presentation_attached: (meeting as any).when_presentation_attached ?? '',
        general_notes: '', // new note to add; existing notes come from meeting.general_notes (array)
      });

      const schedStart = (meeting as any).scheduled_start ?? meeting.scheduled_at;
      const schedEnd = (meeting as any).scheduled_end ?? (meeting as any).scheduled_end_at;
      const toDatetimeLocal = (iso: string | null | undefined) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      const ch = meeting.meeting_channel;
      const validChannel =
        ch && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(ch)
          ? (ch as typeof scheduleForm.meeting_channel)
          : scheduleForm.meeting_channel;
      setScheduleForm((prev) => ({
        ...prev,
        scheduled_at: toDatetimeLocal(schedStart) || prev.scheduled_at,
        scheduled_end_at: toDatetimeLocal(schedEnd) || prev.scheduled_end_at,
        meeting_channel: validChannel,
        location: (meeting as any).location ?? prev.location,
      }));
      const joinUrl = ((meeting as any).meeting_url || (meeting as any).meeting_link || '').trim();
      const webexId = (meeting as any).webex_meeting_unique_identifier ?? '';
      if ((ch === 'VIRTUAL' || ch === 'HYBRID') && joinUrl) {
        setWebexMeetingDetails({
          join_link: joinUrl,
          webex_meeting_unique_identifier: webexId,
          meeting_number: '',
          password: '',
          sip_address: '',
          host_key: '',
        });
      }
    }
  }, [meeting]);

  /** Refetch may add meeting_url after calendar create — keep Webex block in sync without re-running full init. */
  useEffect(() => {
    if (!meeting?.id) return;
    const m = meeting as any;
    const url = String(m.meeting_url || m.meeting_link || '').trim();
    const webexId = m.webex_meeting_unique_identifier ?? '';
    if ((meeting.meeting_channel === 'VIRTUAL' || meeting.meeting_channel === 'HYBRID') && url) {
      setWebexMeetingDetails((prev) =>
        prev?.join_link === url ? prev : { join_link: url, webex_meeting_unique_identifier: webexId, meeting_number: '', password: '', sip_address: '', host_key: '' }
      );
    }
  }, [meeting?.id, (meeting as any)?.meeting_url, (meeting as any)?.meeting_link, meeting?.meeting_channel]);

  // Auto-create Webex meeting when VIRTUAL or HYBRID channel is selected and date/time is set
  useEffect(() => {
      // Only create if modal is open, channel is VIRTUAL or HYBRID, start date is set, and we don't already have details
    const needsWebex = scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID';
    if (
      !isScheduleModalOpen ||
      !needsWebex ||
      !scheduleForm.scheduled_at ||
      webexMeetingDetails ||
      isCreatingWebex
    ) {
      return;
    }

    const createWebexMeetingAsync = async () => {
      setIsCreatingWebex(true);
      try {
        // Convert datetime-local to ISO string (UTC)
        const scheduledAtISO = new Date(scheduleForm.scheduled_at).toISOString();
        const scheduledDateUTC = new Date(scheduledAtISO);

        // Format datetime for Webex API: "YYYY-MM-DD HH:mm:ss" in UTC
        const year = scheduledDateUTC.getUTCFullYear();
        const month = String(scheduledDateUTC.getUTCMonth() + 1).padStart(2, '0');
        const day = String(scheduledDateUTC.getUTCDate()).padStart(2, '0');
        const hours = String(scheduledDateUTC.getUTCHours()).padStart(2, '0');
        const minutes = String(scheduledDateUTC.getUTCMinutes()).padStart(2, '0');
        const seconds = String(scheduledDateUTC.getUTCSeconds()).padStart(2, '0');
        const webexDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const meetingTitle = meeting?.meeting_title || 'اجتماع';
        const durationMinutes =
          scheduleForm.scheduled_end_at && scheduleForm.scheduled_at
            ? Math.max(1, Math.round((new Date(scheduleForm.scheduled_end_at).getTime() - new Date(scheduleForm.scheduled_at).getTime()) / (60 * 1000)))
            : (meeting?.presentation_duration || 60);

        const webexResponse = await createWebexMeeting({
          meeting_title: meetingTitle,
          start_datetime: webexDateTime,
          time_zone: 'UTC',
          duration_minutes: durationMinutes,
        });

        // Store Webex meeting details for display in the modal
        setWebexMeetingDetails({
          join_link: webexResponse.data.webex_meeting_join_link,
          webex_meeting_unique_identifier: webexResponse.data.webex_meeting_unique_identifier,
          meeting_number: webexResponse.data.meeting_access_details.meeting_number,
          password: webexResponse.data.meeting_access_details.password,
          sip_address: webexResponse.data.meeting_access_details.sip_address,
          host_key: webexResponse.data.meeting_access_details.host_key,
        });
      } catch (error) {
        console.error('Failed to create Webex meeting:', error);
        setValidationError('فشل في إنشاء اجتماع Webex. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsCreatingWebex(false);
      }
    };

    // Debounce the creation to avoid creating multiple meetings
    const timeoutId = setTimeout(() => {
      createWebexMeetingAsync();
    }, 500); // Wait 500ms after user stops typing/selecting

    return () => clearTimeout(timeoutId);
  }, [isScheduleModalOpen, scheduleForm.meeting_channel, scheduleForm.scheduled_at, scheduleForm.scheduled_end_at, webexMeetingDetails, isCreatingWebex, meeting]);

  /** Create Webex meeting (for confirm modal or when VIRTUAL/HYBRID and no link yet). Uses meeting or scheduleForm for start/end. */
  const createWebexLink = useCallback(async () => {
    const { start: startSource, end: endSource } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
    if (!startSource || !endSource) {
      setValidationError('يجب تحديد تاريخ ووقت البداية والنهاية لإنشاء رابط Webex.');
      return;
    }
    setIsCreatingWebex(true);
    setValidationError(null);
    try {
      const scheduledAtISO = new Date(startSource).toISOString();
      const scheduledDateUTC = new Date(scheduledAtISO);
      const year = scheduledDateUTC.getUTCFullYear();
      const month = String(scheduledDateUTC.getUTCMonth() + 1).padStart(2, '0');
      const day = String(scheduledDateUTC.getUTCDate()).padStart(2, '0');
      const hours = String(scheduledDateUTC.getUTCHours()).padStart(2, '0');
      const minutes = String(scheduledDateUTC.getUTCMinutes()).padStart(2, '0');
      const seconds = String(scheduledDateUTC.getUTCSeconds()).padStart(2, '0');
      const webexDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      const durationMinutes = Math.max(1, Math.round((new Date(endSource).getTime() - new Date(startSource).getTime()) / (60 * 1000)));
      const webexResponse = await createWebexMeeting({
        meeting_title: meeting?.meeting_title || 'اجتماع',
        start_datetime: webexDateTime,
        time_zone: 'UTC',
        duration_minutes: durationMinutes,
      });
      setWebexMeetingDetails({
        join_link: webexResponse.data.webex_meeting_join_link,
        webex_meeting_unique_identifier: webexResponse.data.webex_meeting_unique_identifier,
        meeting_number: webexResponse.data.meeting_access_details.meeting_number,
        password: webexResponse.data.meeting_access_details.password,
        sip_address: webexResponse.data.meeting_access_details.sip_address,
        host_key: webexResponse.data.meeting_access_details.host_key,
      });
    } catch (error) {
      console.error('Failed to create Webex meeting:', error);
      setValidationError('فشل في إنشاء اجتماع Webex. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCreatingWebex(false);
    }
  }, [meeting, scheduleForm.scheduled_at, scheduleForm.scheduled_end_at, getEffectiveScheduleDates]);

  // When schedule modal opens and موعد الاجتماع has a selected slot, set تاريخ ووقت البداية/النهاية from that slot by default
  useEffect(() => {
    if (!isScheduleModalOpen || !scheduleForm.selected_time_slot_id || !meeting) return;
    const slotId = scheduleForm.selected_time_slot_id;
    if (!slotId) return;
    const allSlots = [
      meeting.alternative_time_slot_1,
      meeting.alternative_time_slot_2,
      meeting.selected_time_slot,
    ].filter(Boolean);
    const selectedSlot = allSlots.find((s: any) => s?.id === slotId);
    if (!selectedSlot?.slot_start) return;
    const toDatetimeLocal = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const startLocal = toDatetimeLocal(selectedSlot.slot_start);
    const endLocal = selectedSlot.slot_end ? toDatetimeLocal(selectedSlot.slot_end) : (() => {
      const start = new Date(selectedSlot.slot_start);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return toDatetimeLocal(end.toISOString());
    })();
    setScheduleForm((prev) => ({
      ...prev,
      scheduled_at: startLocal,
      scheduled_end_at: endLocal,
    }));
  }, [isScheduleModalOpen, scheduleForm.selected_time_slot_id, meeting]);

  // When Scheduling Officer opens confirm modal and موعد has a selected slot but form has no dates, sync from slot
  useEffect(() => {
    if (!scheduleConfirmModalOpen || !meeting || scheduleForm.scheduled_at) return;
    const slotId = scheduleForm.selected_time_slot_id ?? (meeting as any).selected_time_slot_id;
    if (!slotId) return;
    const allSlots = [
      meeting.alternative_time_slot_1,
      meeting.alternative_time_slot_2,
      meeting.selected_time_slot,
    ].filter(Boolean);
    const selectedSlot = allSlots.find((s: any) => s?.id === slotId);
    if (!selectedSlot?.slot_start) return;
    const toDatetimeLocal = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const startLocal = toDatetimeLocal(selectedSlot.slot_start);
    const endLocal = selectedSlot.slot_end
      ? toDatetimeLocal(selectedSlot.slot_end)
      : (() => {
          const start = new Date(selectedSlot.slot_start);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          return toDatetimeLocal(end.toISOString());
        })();
    setScheduleForm((prev) => ({
      ...prev,
      scheduled_at: startLocal,
      scheduled_end_at: endLocal,
    }));
  }, [scheduleConfirmModalOpen, meeting, scheduleForm.scheduled_at, scheduleForm.selected_time_slot_id]);

  // Initialize scheduleForm and original snapshot when meeting loads
  useEffect(() => {
    if (!meeting) return;
    setScheduleForm((prev) => {
      const validChannels: Array<'PHYSICAL' | 'PHYSICAL_LOCATION_1' | 'PHYSICAL_LOCATION_2' | 'PHYSICAL_LOCATION_3' | 'VIRTUAL' | 'HYBRID'> = 
        ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'];
      const meetingChannel = validChannels.includes(meeting.meeting_channel as any) 
        ? (meeting.meeting_channel as typeof prev.meeting_channel)
        : prev.meeting_channel;
      
      return {
        ...prev,
        scheduled_at: meeting.scheduled_start ?? meeting.meeting_start_date ?? '',
        scheduled_end_at: meeting.scheduled_end ?? (meeting as any).scheduled_end_at ?? (meeting as any).meeting_end_date ?? '',
        meeting_channel: meetingChannel,
        requires_protocol: meeting.requires_protocol ?? prev.requires_protocol,
        protocol_type: meeting.protocol_type || prev.protocol_type,
        protocol_type_text: meeting.protocol_type || prev.protocol_type_text,
        is_data_complete: meeting.is_data_complete ?? prev.is_data_complete,
        location: (meeting as any).meeting_location ?? (meeting as any).location ?? prev.location ?? '',
        location_option: getMeetingLocationDropdownValue((meeting as any).meeting_location ?? (meeting as any).location ?? undefined, prev.location_option || undefined) ?? '',
        selected_time_slot_id: meeting.selected_time_slot_id || null,
        minister_attendees: mapApiMinisterAttendeesToForm((meeting as any).minister_attendees) || prev.minister_attendees,
      };
    });
    
    // Reset attachment state when meeting loads
    setDeletedAttachmentIds([]);
    setNewAttachments([]);
    setNewPresentationAttachments([]);

    const ownerDisplay = meeting.current_owner_user
      ? `${(meeting.current_owner_user.first_name || '').trim()} ${(meeting.current_owner_user.last_name || '').trim()}`.trim() || meeting.current_owner_user.username || ''
      : meeting.current_owner_role?.name_ar || '';
    const rawExtId = (meeting as any).prev_ext_id ?? meeting.previous_meeting?.meeting_id ?? null;
    const rawGroupId = (meeting as any).group_id ?? null;
    const prevExtId = rawExtId != null && !Number.isNaN(Number(rawExtId)) ? Number(rawExtId) : null;
    const prevGroupId = rawGroupId != null && !Number.isNaN(Number(rawGroupId)) ? Number(rawGroupId) : null;
    const basedOnDirective = !!(
      meeting.related_guidance ||
      (meeting as any).is_based_on_directive === true ||
      (meeting as any).is_based_on_directive === 'true' ||
      (Array.isArray(meeting.related_directive_ids) && meeting.related_directive_ids.length > 0)
    );
    const directiveMethodRaw = (meeting as any).directive_method || '';
    const minutesId = (meeting as any).previous_meeting_minutes_id || '';
    const hasPreviousMeetingContext = !!(meeting.previous_meeting_attachment || prevExtId != null || minutesId);
    const directiveMethod =
      directiveMethodRaw.trim() ||
      (hasPreviousMeetingContext && basedOnDirective ? 'PREVIOUS_MEETING' : '');
    const guidance = meeting.related_guidance ?? '';
    setOriginalSnapshot({
      formData: {
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.description ?? meeting.meeting_subject ?? '',
        meeting_owner: meeting.meeting_owner_name ?? ownerDisplay ?? '',
        is_on_behalf_of: (meeting as any)?.is_on_behalf_of ?? false,
        is_urgent: (meeting as any)?.is_urgent ?? false,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_ext_id: prevExtId,
        previous_meeting_group_id: prevGroupId,
        previous_meeting_original_title: (meeting as any).prev_ext_original_title ?? null,
        previous_meeting_meeting_title: (meeting as any).prev_ext_meeting_title ?? meeting.previous_meeting?.meeting_title ?? null,
        is_based_on_directive: basedOnDirective,
        directive_method: directiveMethod,
        previous_meeting_minutes_id: minutesId,
        related_guidance: guidance,
        sector: meeting.sector ?? '',
        meeting_justification: meeting.meeting_justification ?? '',
        meeting_classification_type: (meeting.meeting_classification_type as MeetingClassificationType) ?? '',
        related_topic: meeting.related_topic ?? '',
        deadline: meeting.deadline ? meeting.deadline.slice(0, 10) : '',
        meeting_confidentiality: (meeting.meeting_confidentiality as MeetingConfidentiality) ?? '',
      },
      scheduleForm: {
        selected_time_slot_id: meeting.selected_time_slot_id || null,
        requires_protocol: meeting.requires_protocol ?? false,
        protocol_type_text: meeting.protocol_type || '',
        is_data_complete: meeting.is_data_complete ?? true,
        location: (meeting as any).meeting_location ?? (meeting as any).location ?? '',
        location_option: getMeetingLocationDropdownValue((meeting as any).meeting_location ?? (meeting as any).location ?? undefined, undefined) ?? '',
        meeting_channel: ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel) ? meeting.meeting_channel : 'PHYSICAL',
        minister_attendees: mapApiMinisterAttendeesToForm((meeting as any).minister_attendees) || [],
      },
      contentForm: {
        objectives: (meeting.objectives || []).map((obj) => ({
          id: obj.id || `obj-${Date.now()}-${Math.random()}`,
          objective: obj.objective,
        })),
        agendaItems: (meeting.agenda_items || []).map((item, idx) => {
          const ext = item as typeof item & { minister_support_type?: string; minister_support_other?: string; support_description?: string };
          const support = (meeting as any).minister_support?.[idx];
          const supportDesc = ext.support_description ?? support?.support_description ?? '';
          const isSupportType = MINISTER_SUPPORT_TYPE_OPTIONS.some((o) => o.value === supportDesc);
          return {
          id: item.id || `agenda-${Date.now()}-${Math.random()}`,
          agenda_item: item.agenda_item,
          presentation_duration_minutes: item.presentation_duration_minutes,
            minister_support_type: ext.minister_support_type ?? (isSupportType ? supportDesc : ''),
            minister_support_other: ext.minister_support_other ?? (isSupportType ? '' : supportDesc),
          };
        }),
      },
      contentTabForm: {
        when_presentation_attached: (meeting as any).when_presentation_attached ?? '',
        general_notes: '',
      },
      localInvitees: [],
    });
  }, [meeting]);

  // Map status to MeetingStatus enum
  const meetingStatus = meeting?.status as MeetingStatus || MeetingStatus.UNDER_REVIEW;
  const statusLabel = MeetingStatusLabels[meetingStatus] || meeting?.status || 'قيد المراجعة';
  /** Meeting detail is read-only; all edits happen in UC01 EditMeeting form (opened via Edit button). */
  const canEdit = false;

  /** Tooltip content for help icon - shows permissions based on current status */
  const permissionTooltip = useMemo(() => {
    const status = meetingStatus;
    if (status === MeetingStatus.UNDER_REVIEW || status === MeetingStatus.UNDER_GUIDANCE) {
      return {
        title: 'تعديل كامل',
        description: 'يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب، بالإضافة إلى الجدولة والرفض وإرجاع الطلب للمعلومات.',
      };
    }
    const scheduledStatuses = [
      MeetingStatus.SCHEDULED,
      MeetingStatus.SCHEDULED_SCHEDULING,
      MeetingStatus.SCHEDULED_CONTENT,
      MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
      MeetingStatus.SCHEDULED_DELAYED,
    ];
    if (scheduledStatuses.includes(status)) {
      return {
        title: 'عرض وتوثيق',
        description: 'تم جدولة الاجتماع. يمكنك إضافة توثيق الاجتماع (المحضر، الحضور الفعلي، التوجيهات) وإعادة الجدولة وإضافته لقائمة الانتظار.',
      };
    }
    if (status === MeetingStatus.WAITING) {
      return {
        title: 'عرض وتوثيق',
        description: 'الطلب في قائمة الانتظار. يمكنك إضافة توثيق الاجتماع وإعادة الجدولة.',
      };
    }
    if (status === MeetingStatus.CLOSED || status === MeetingStatus.REJECTED || status === MeetingStatus.CANCELLED) {
      return {
        title: 'عرض فقط',
        description: 'الطلب مغلق. العرض للقراءة فقط ولا يمكن إجراء أي تعديلات.',
      };
    }
    if (
      status === MeetingStatus.UNDER_CONTENT_REVIEW
    ) {
      return {
        title: 'قيد المراجعة',
        description: 'الطلب قيد المراجعة من قبل مسؤول آخر (الجدولة أو المحتوى). يمكنك عرض التفاصيل فقط.',
      };
    }
    if (status === MeetingStatus.DRAFT || status === MeetingStatus.RETURNED_FROM_SCHEDULING || status === MeetingStatus.RETURNED_FROM_CONTENT) {
      return {
        title: 'مرحلة مقدم الطلب',
        description: 'الطلب في مرحلة مقدم الطلب. يمكنك عرض التفاصيل فقط.',
      };
    }
    return {
      title: 'الصلاحيات',
      description: 'يمكنك عرض تفاصيل طلب الاجتماع.',
    };
  }, [meetingStatus]);

  // المحتوى: objectives/agenda and at least one presentation file (العرض التقديمي)
  const presentationAttachments = (meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id));
  const hasPresentation = presentationAttachments.length > 0 || newPresentationAttachments.length > 0;
  const hasObjectivesOrAgenda = (contentForm.objectives?.length ?? 0) > 0 || (contentForm.agendaItems?.length ?? 0) > 0;
  const hasContent = hasObjectivesOrAgenda && hasPresentation;

  /** Optional attachments (مرفقات اختيارية): exclude presentation, executive summary, and previous_meeting_attachment (محضر الاجتماع – shown only in its dedicated card) */
  const optionalAttachmentsList = useMemo(() => {
    const prevId = meeting?.previous_meeting_attachment?.id ?? null;
    return (meeting?.attachments || []).filter(
      (a) =>
        !a.is_presentation &&
        !a.is_executive_summary &&
        !deletedAttachmentIds.includes(a.id) &&
        (prevId == null || a.id !== prevId)
    );
  }, [meeting?.attachments, meeting?.previous_meeting_attachment?.id, deletedAttachmentIds]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /** Async load options for "الاجتماع السابق" – GET /api/v1/business-cards/meetings-search; value = "id:group_id"; cache items for original_title/meeting_title on select */
  const loadPreviousMeetingSearchOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const res = await getMeetingsSearchForPrevious({
        q: search?.trim() ?? '',
        skip,
        limit: Math.min(Math.max(limit, 1), 100),
      });
      previousMeetingSearchCacheRef.current = res.items;
      const items = res.items.map((m) => ({
        value: `${m.id}:${m.group_id}`,
        label: (m.meeting_title || m.original_title || String(m.id)).trim(),
      }));
      return {
        items,
        total: res.total,
        skip: res.skip,
        limit: res.limit,
        has_next: res.skip + res.limit < res.total,
        has_previous: res.skip > 0,
      };
    },
    []
  );

  /** Async load options for "محضر الاجتماع" – getMeetings (meetings as minutes source) */
  const loadPreviousMeetingMinutesOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const res = await getMeetings({
        search: search || undefined,
        skip,
        limit,
      });
      const currentId = meeting?.id;
      const items = res.items
        .filter((m) => m.id !== currentId)
        .map((m) => ({
          value: m.id,
          label: (m.meeting_subject || m.meeting_title || 'غير محدد').trim(),
        }));
      return {
        items,
        total: res.total,
        skip: res.skip,
        limit: res.limit,
        has_next: res.skip + res.limit < res.total,
        has_previous: res.skip > 0,
      };
    },
    [meeting?.id]
  );

  // Tabs per Excel "الجدولة - مراجعة الطلب": التبويب (column التبويب)
  // When status is SCHEDULED (مجدول), hide 4 tabs and add "توثيق الاجتماع"
  // For schedule officer (UC-02): replace Invitees tab with Schedule tab in same position
  const TABS_HIDDEN_WHEN_SCHEDULED = ['scheduling-consultation', 'directive'];
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

  // Normalize content_approval_directives for table (same columns as DirectivesTab: رقم التوجيه، تاريخ التوجيه، نص التوجيه، الموعد النهائي، المسؤولون، الحالة)
  // API may return string[] or object[] with title/text/due_date/status/assignees/directive_number
  interface ContentApprovalDirectiveRow {
    directive_number?: string;
    directive_date?: string;
    directive_text: string;
    deadline?: string;
    responsible_persons?: string;
    directive_status?: string;
  }
  const contentApprovalDirectivesRows = useMemo((): ContentApprovalDirectiveRow[] => {
    const raw = meeting?.content_approval_directives;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((item: string | { title?: string; text?: string; due_date?: string; deadline?: string; status?: string; assignees?: string[] | Array<{ name?: string }>; directive_number?: string; [key: string]: unknown }) => {
      if (typeof item === 'string') return { directive_text: item };
      if (item && typeof item === 'object') {
        const t = (item as { title?: string; text?: string }).title ?? (item as { text?: string }).text;
        const text = t != null && typeof t === 'string' ? t : String(item);
        const dueDate = (item as { due_date?: string }).due_date ?? (item as { deadline?: string }).deadline;
        const status = (item as { status?: string }).status;
        const assignees = (item as { assignees?: string[] | Array<{ name?: string }> }).assignees;
        const responsiblePersons = Array.isArray(assignees)
          ? assignees.map((a) => (typeof a === 'string' ? a : (a && typeof a === 'object' && 'name' in a ? String((a as { name?: string }).name ?? a) : String(a)))).filter(Boolean).join('، ') || undefined
          : undefined;
        return {
          directive_number: (item as { directive_number?: string }).directive_number,
          directive_date: dueDate,
          directive_text: text,
          deadline: dueDate,
          responsible_persons: responsiblePersons,
          directive_status: status,
        };
      }
      return { directive_text: String(item) };
    });
  }, [meeting?.content_approval_directives]);

  // Content officer notes for المحتوى tab (from meeting.content_officer_notes or contentOfficerNotesRecords)
  const contentOfficerNotesDisplay = useMemo(() => {
    const raw: unknown = meeting?.content_officer_notes;
    if (raw != null) {
      if (typeof raw === 'string') return raw.trim() || '—';
      if (Array.isArray(raw)) return raw.map((n: { text?: string }) => (n?.text ?? '').trim()).filter(Boolean).join('\n\n') || '—';
      if (typeof raw === 'object' && 'text' in raw) return ((raw as { text?: string }).text ?? '—').trim() || '—';
    }
    const fromRecords = contentOfficerNotesRecords?.items?.find((n) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY');
    const t = (fromRecords as { text?: string; note_answer?: string } | undefined)?.text ?? (fromRecords as { note_answer?: string } | undefined)?.note_answer;
    return (t != null && String(t).trim() !== '') ? String(t).trim() : '—';
  }, [meeting?.content_officer_notes, contentOfficerNotesRecords]);

  // When status is SCHEDULED and current tab is hidden, switch to request-info; when not SCHEDULED and on meeting-documentation, switch away
  useEffect(() => {
    if (meetingStatus === MeetingStatus.SCHEDULED && TABS_HIDDEN_WHEN_SCHEDULED.includes(activeTab)) {
      setActiveTab('request-info');
    } else if (meetingStatus !== MeetingStatus.SCHEDULED && activeTab === 'meeting-documentation') {
      setActiveTab('request-info');
    } else if (meetingStatus !== MeetingStatus.CLOSED && activeTab === 'directives') {
      setActiveTab('request-info');
    } else if (isScheduleOfficer && activeTab === 'attendees') {
      setActiveTab('schedule');
    } else if (!isScheduleOfficer && activeTab === 'schedule') {
      setActiveTab('request-info');
    }
  }, [meetingStatus, activeTab, isScheduleOfficer]);

  /** Data for MeetingInfo (read-only) – built from meeting + form state so read-only tab can use shared component without modifying it. */
  const meetingInfoData = useMemo((): MeetingInfoData => {
    if (!meeting) return {};
    const slot = meeting.selected_time_slot;
    const notesList = getGeneralNotesList(meeting.general_notes);
    const notesText = notesList.length > 0 ? notesList.map((n) => (n?.text ?? '').trim()).filter(Boolean).join('\n\n') : undefined;
    const apiChannel =
      meeting.meeting_channel &&
      ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(
        meeting.meeting_channel
      )
        ? meeting.meeting_channel
        : scheduleForm.meeting_channel;
    const m = meeting as any;
    const joinUrl = String(m.meeting_url || m.meeting_link || '').trim() || undefined;
    return {
      is_on_behalf_of: formData.is_on_behalf_of,
      meeting_manager_label: formData.meeting_owner || undefined,
      meetingSubject: formData.meeting_title || undefined,
      meetingDescription: formData.meeting_subject || undefined,
      sector: formData.sector || undefined,
      meetingType: formData.meeting_type || undefined,
      is_urgent: formData.is_urgent,
      urgent_reason: formData.meeting_justification || undefined,
      meeting_start_date: (meeting as any).scheduled_start ?? meeting.meeting_start_date ?? slot?.slot_start ?? undefined,
      meeting_end_date: (meeting as any).scheduled_end ?? slot?.slot_end ?? undefined,
      meetingChannel: apiChannel || undefined,
      meeting_location: m.location || scheduleForm.location || undefined,
      meeting_link: joinUrl,
      meetingCategory: formData.meeting_classification || undefined,
      meetingReason: formData.meeting_justification || undefined,
      relatedTopic: formData.related_topic || undefined,
      dueDate: formData.deadline || undefined,
      meetingClassification1: formData.meeting_classification_type || undefined,
      meetingConfidentiality: formData.meeting_confidentiality || undefined,
      meetingAgenda: (contentForm.agendaItems ?? meeting.agenda_items ?? []).map((item) => ({
        id: (item as any).id,
        agenda_item: (item as any).agenda_item,
        presentation_duration_minutes: (item as any).presentation_duration_minutes,
        minister_support_type: (item as any).minister_support_type,
        minister_support_other: (item as any).minister_support_other,
      })),
      is_sequential: formData.is_sequential,
      previous_meeting_meeting_title: formData.previous_meeting_meeting_title ?? undefined,
      sequential_number_display:
        meeting?.sequential_number != null
          ? String(meeting.sequential_number)
          : formData.is_sequential && formData.previous_meeting_ext_id != null
            ? previousMeeting?.sequential_number != null
              ? String((previousMeeting.sequential_number ?? 0) + 1)
              : 'غير موجود (إجباري)'
            : 'غير موجود',
      is_based_on_directive: formData.is_based_on_directive,
      directive_method:
        formData.directive_method ||
        (formData.previous_meeting_attachment || formData.previous_meeting_ext_id != null ? 'PREVIOUS_MEETING' : undefined),
      previous_meeting_attachment: formData.previous_meeting_attachment ?? undefined,
      previous_meeting_minutes_file: previousMeetingMinutesOption ? { name: previousMeetingMinutesOption.label ?? previousMeetingMinutesOption.value } : undefined,
      directive_text: formData.related_guidance || undefined,
      notes: notesText,
    };
  }, [
    meeting,
    formData,
    scheduleForm.meeting_channel,
    scheduleForm.location,
    contentForm.agendaItems,
    previousMeetingMinutesOption,
    previousMeeting?.sequential_number,
    (meeting as any)?.meeting_url,
    (meeting as any)?.meeting_link,
    (meeting as any)?.location,
    meeting?.meeting_channel,
  ]);
  /** When canEdit: render each MeetingInfo field with optional قابل للتعديل checkbox + editable input. Dynamic from MeetingInfo field config. */
  const meetingInfoRenderField = useCallback<MeetingInfoRenderField>(
    (key, label, value, spec) => {
      const showCheckbox = !!key && EDITABLE_FIELD_IDS.includes(key) && (meetingStatus === MeetingStatus.UNDER_REVIEW || meetingStatus === MeetingStatus.UNDER_GUIDANCE);
      const isChecked = showCheckbox ? (returnForInfoForm.editable_fields[key] ?? false) : false;
      const inputClass = 'w-full min-h-11 px-3 py-2 bg-white border border-[#D0D5DD] rounded-lg text-right text-sm';
      const renderInput = () => {
        if (!canEdit) return <div className={`${inputClass} bg-gray-50`}>{value ?? '—'}</div>;
        switch (key) {
          case 'is_on_behalf_of':
            return (
              <div className="flex items-center gap-2 justify-start">
                <span className="text-sm text-[#667085]">{formData.is_on_behalf_of ? 'نعم' : 'لا'}</span>
                <button type="button" onClick={() => setFormData((p) => ({ ...p, is_on_behalf_of: !p.is_on_behalf_of }))} className={`w-7 h-[15.34px] rounded-full flex transition-all p-[1.28px] ${formData.is_on_behalf_of ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'}`}><div className="w-3 h-3 rounded-full bg-white shadow-sm" /></button>
              </div>
            );
          case 'meeting_owner':
            return <Input type="text" value={formData.meeting_owner} onChange={(e) => handleFieldChange('meeting_owner', e.target.value)} className={inputClass} placeholder={label} />;
          case 'meeting_title':
            return <Input type="text" value={formData.meeting_title} onChange={(e) => handleFieldChange('meeting_title', e.target.value)} className={inputClass} placeholder={label} />;
          case 'meeting_subject':
            return <Input type="text" value={formData.meeting_subject} onChange={(e) => handleFieldChange('meeting_subject', e.target.value)} className={inputClass} placeholder={label} />;
          case 'sector':
            return (
              <Select value={formData.sector || ''} onValueChange={(v) => handleFieldChange('sector', v)}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{SECTOR_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'meeting_type':
            return (
              <Select value={formData.meeting_type || ''} onValueChange={(v) => handleFieldChange('meeting_type', v)}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{Object.values(MeetingType).map((t) => <SelectItem key={t} value={t}>{MeetingTypeLabels[t]}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'is_urgent':
            return (
              <div className="flex items-center gap-2 justify-start">
                <span className="text-sm text-[#667085]">{formData.is_urgent ? 'نعم' : 'لا'}</span>
                <button type="button" onClick={() => setFormData((p) => ({ ...p, is_urgent: !p.is_urgent }))} className={`w-7 h-[15.34px] rounded-full flex transition-all p-[1.28px] ${formData.is_urgent ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'}`}><div className="w-3 h-3 rounded-full bg-white shadow-sm" /></button>
              </div>
            );
          case 'urgent_reason':
          case 'meeting_justification':
            return <Textarea value={formData.meeting_justification} onChange={(e) => handleFieldChange('meeting_justification', e.target.value)} className={inputClass} placeholder={label} />;
          case 'selected_time_slot_id':
            return <div className={`${inputClass} bg-gray-50`}>{value ?? '—'}</div>;
          case 'meeting_channel':
            return (
              <Select value={scheduleForm.meeting_channel} onValueChange={(v) => setScheduleForm((p) => ({ ...p, meeting_channel: v as typeof p.meeting_channel }))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{Object.entries(MeetingChannelLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'meeting_location': {
            const locDropdownValue = getMeetingLocationDropdownValue(scheduleForm.location, scheduleForm.location_option) || undefined;
            const showOtherInput = showMeetingLocationOtherInput(scheduleForm.location, scheduleForm.location_option);
            return (
              <div className="flex flex-col gap-4 w-full">
                <FormSelect
                  value={locDropdownValue}
                  onValueChange={(value) => {
                    const v = value ?? '';
                    if (isPresetMeetingLocation(v)) {
                      setScheduleForm((p) => ({ ...p, location_option: v, location: v }));
                    } else {
                      setScheduleForm((p) => ({ ...p, location_option: v, location: '' }));
                    }
                  }}
                  options={MEETING_LOCATION_OPTIONS}
                  placeholder="اختر الموقع"
                />
                {showOtherInput && (
                  <FormField className="w-full min-w-0" label="تحديد الموقع (موقع آخر)">
                    <FormInput
                      value={scheduleForm.location || ''}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="أدخل الموقع"
                      fullWidth
                    />
                  </FormField>
                )}
              </div>
            );
          }
          case 'meeting_classification_type':
            return (
              <Select value={formData.meeting_classification_type || ''} onValueChange={(v) => handleFieldChange('meeting_classification_type', v)}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{Object.values(MeetingClassificationType).map((c) => <SelectItem key={c} value={c}>{MeetingClassificationTypeLabels[c]}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'related_topic':
            return <Input type="text" value={formData.related_topic} onChange={(e) => handleFieldChange('related_topic', e.target.value)} className={inputClass} placeholder={label} />;
          case 'deadline':
            return <FormDatePicker value={formData.deadline} onChange={(v) => handleFieldChange('deadline', v)} placeholder="dd/mm/yyyy" fullWidth className={`h-11 ${inputClass}`} />;
          case 'meeting_classification':
            return (
              <Select value={formData.meeting_classification} onValueChange={(v) => handleFieldChange('meeting_classification', v)}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{Object.values(MeetingClassification).map((c) => <SelectItem key={c} value={c}>{MeetingClassificationLabels[c]}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'meeting_confidentiality':
            return (
              <div className="flex items-center gap-2 justify-start">
                <span className="text-sm text-[#667085]">{formData.meeting_confidentiality === MeetingConfidentiality.CONFIDENTIAL ? 'سرّي' : 'عادي'}</span>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    const next = formData.meeting_confidentiality !== MeetingConfidentiality.CONFIDENTIAL;
                    handleFieldChange('meeting_confidentiality', next ? MeetingConfidentiality.CONFIDENTIAL : MeetingConfidentiality.NORMAL);
                  }}
                  className={`w-7 h-[15.34px] rounded-full flex transition-all p-[1.28px] ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${formData.meeting_confidentiality === MeetingConfidentiality.CONFIDENTIAL ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            );
          case 'is_sequential':
            return (
              <div className="flex items-center gap-2 justify-start">
                <span className="text-sm text-[#667085]">{formData.is_sequential ? 'نعم' : 'لا'}</span>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    const next = !formData.is_sequential;
                    setFormData((p) => ({
                      ...p,
                      is_sequential: next,
                      ...(next ? {} : { previous_meeting_ext_id: null, previous_meeting_group_id: null, previous_meeting_original_title: null, previous_meeting_meeting_title: null }),
                    }));
                    if (!next) setPreviousMeetingOption(null);
                  }}
                  className={`w-7 h-[15.34px] rounded-full flex transition-all p-[1.28px] ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${formData.is_sequential ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            );
          case 'previous_meeting_id':
            return (
              <FormAsyncSelectV2
                value={previousMeetingOption}
                onValueChange={(opt) => {
                  setPreviousMeetingOption(opt);
                  if (!opt?.value) {
                    setFormData((p) => ({
                      ...p,
                      previous_meeting_ext_id: null,
                      previous_meeting_group_id: null,
                      previous_meeting_original_title: null,
                      previous_meeting_meeting_title: null,
                    }));
                    return;
                  }
                  const [idPart, groupPart] = String(opt.value).split(':');
                  const extId = idPart ? parseInt(idPart, 10) : null;
                  const groupId = groupPart ? parseInt(groupPart, 10) : null;
                  const cached = previousMeetingSearchCacheRef.current.find((m) => `${m.id}:${m.group_id}` === opt.value);
                  setFormData((p) => ({
                    ...p,
                    previous_meeting_ext_id: Number.isNaN(extId) ? null : extId,
                    previous_meeting_group_id: Number.isNaN(groupId) ? null : groupId,
                    previous_meeting_original_title: cached?.original_title ?? null,
                    previous_meeting_meeting_title: cached?.meeting_title ?? cached?.original_title ?? opt.label ?? null,
                  }));
                }}
                loadOptions={loadPreviousMeetingSearchOptions}
                placeholder="اختر الاجتماع السابق..."
                searchPlaceholder="ابحث بالعنوان..."
                emptyMessage="لا توجد نتائج"
                limit={20}
                isDisabled={!canEdit}
                fullWidth
                className="text-right"
              />
            );
          case 'sequential_number':
            return (
              <div className={`${inputClass} bg-gray-50`} title="غير قابل للتعديل. إذا كان الاجتماع السابق متسلسلاً يُضاف 1 للرقم الحالي؛ وإلا يُعطى السابق 1 والحالي 2.">
                {value ?? '—'}
              </div>
            );
          case 'is_based_on_directive':
            return (
              <div className="flex items-center gap-2 justify-start">
                <span className="text-sm text-[#667085]">{formData.is_based_on_directive ? 'نعم' : 'لا'}</span>
                <button type="button" onClick={() => setFormData((p) => ({ ...p, is_based_on_directive: !p.is_based_on_directive, ...(!p.is_based_on_directive ? {} : { directive_method: '' }) }))} className={`w-7 h-[15.34px] rounded-full flex transition-all p-[1.28px] ${formData.is_based_on_directive ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'}`}><div className="w-3 h-3 rounded-full bg-white shadow-sm" /></button>
              </div>
            );
          case 'directive_method':
            return (
              <Select value={formData.directive_method || ''} onValueChange={(v) => handleFieldChange('directive_method', v)}>
                <SelectTrigger className={inputClass}><SelectValue placeholder={label} /></SelectTrigger>
                <SelectContent dir="rtl">{DIRECTIVE_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            );
          case 'previous_meeting_minutes_id':
            return (
              <FormAsyncSelectV2 value={previousMeetingMinutesOption} onValueChange={(opt) => { setPreviousMeetingMinutesOption(opt); setFormData((p) => ({ ...p, previous_meeting_minutes_id: opt?.value ?? '' })); }} loadOptions={loadPreviousMeetingMinutesOptions} placeholder={label} searchPlaceholder="ابحث..." emptyMessage="لا توجد نتائج" isDisabled={!canEdit} fullWidth className="text-right" />
            );
          case 'related_guidance':
            return <Textarea value={formData.related_guidance} onChange={(e) => handleFieldChange('related_guidance', e.target.value)} className={`${inputClass} min-h-[80px]`} placeholder={label} />;
          case 'agenda_items':
            if (!canEdit) return <div className="w-full">{value}</div>;
            const agendaList = contentForm.agendaItems ?? [];
            return (
              <div className="w-full flex flex-col gap-2" dir="rtl">
                <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-[#F9FAFB]">
                  {agendaList.length > 0 ? (
                    <table className="w-full text-sm text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      <thead>
                        <tr className="border-b border-gray-300 bg-[#F2F4F7]">
                          <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-24 text-center">#</th>
                          <th className="px-4 py-3 text-[#475467] font-semibold">الأجندة</th>
                          <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[180px] text-center">الدعم المطلوب من الوزير</th>
                          <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[140px] text-center">مدة العرض (بالدقائق)</th>
                          <th className="px-4 py-3 text-[#475467] font-semibold">نص الدعم (عند اختيار أخرى)</th>
                          <th className="px-4 py-3 text-[#475467] font-semibold w-20 text-center" />
                        </tr>
                      </thead>
                      <tbody>
                        {agendaList.map((item, idx) => (
                        <tr key={item.id} className={idx < agendaList.length - 1 ? 'border-b border-gray-200' : ''}>
                          <td className="px-4 py-3 text-[#475467] text-center align-middle">{idx + 1}</td>
                          <td className="px-4 py-2 align-middle">
                            <Input
                              type="text"
                              value={item.agenda_item ?? ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setContentForm((p) => ({
                                  ...p,
                                  agendaItems: (p.agendaItems ?? []).map((i) =>
                                    i.id === item.id ? { ...i, agenda_item: newValue } : i
                                  ),
                                }));
                              }}
                              placeholder="عنصر الأجندة"
                              className="w-full h-9 text-right bg-white border border-[#D0D5DD] rounded-lg text-sm"
                              dir="rtl"
                            />
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <Select
                              value={item.minister_support_type ?? ''}
                              onValueChange={(v) =>
                                setContentForm((p) => ({
                                  ...p,
                                  agendaItems: (p.agendaItems ?? []).map((i) =>
                                    i.id === item.id ? { ...i, minister_support_type: v } : i
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger className="w-full min-w-[140px] h-9 text-right bg-white border border-[#D0D5DD] rounded-lg text-sm">
                                <SelectValue placeholder="اختر" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {MINISTER_SUPPORT_TYPE_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <Select
                              value={item.presentation_duration_minutes != null ? String(item.presentation_duration_minutes) : ''}
                              onValueChange={(v) =>
                                setContentForm((p) => ({
                                  ...p,
                                  agendaItems: (p.agendaItems ?? []).map((i) =>
                                    i.id === item.id ? { ...i, presentation_duration_minutes: v ? Number(v) : undefined } : i
                                  ),
                                }))
                              }
                            >
                              <SelectTrigger className="w-full min-w-[100px] h-9 text-right bg-white border border-[#D0D5DD] rounded-lg text-sm">
                                <SelectValue placeholder="اختر" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {PRESENTATION_DURATION_MINUTES_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <Input
                              type="text"
                              value={item.minister_support_other ?? ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const rowIndex = idx;
                                setContentForm((p) => {
                                  const next = (p.agendaItems ?? []).map((i, iIdx) =>
                                    iIdx === rowIndex ? { ...i, minister_support_other: newValue } : i
                                  );
                                  return { ...p, agendaItems: next };
                                });
                              }}
                              placeholder="نص الدعم"
                              className="w-full h-9 text-right bg-white border border-[#D0D5DD] rounded-lg text-sm"
                              dir="rtl"
                            />
                          </td>
                          <td className="px-2 py-2 align-middle text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setContentForm((p) => ({
                                  ...p,
                                  agendaItems: (p.agendaItems ?? []).filter((i) => i.id !== item.id),
                                }))
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFF4F4] hover:bg-[#FFE5E5] transition-colors inline-flex"
                              aria-label="حذف بند الأجندة"
                            >
                              <Trash2 className="w-4 h-4 text-[#CA4545]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="min-h-[44px] flex items-center px-4 py-3 text-sm text-[#475467] text-right">
                      لا توجد بنود
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() =>
                      setContentForm((p) => ({
                        ...p,
                        agendaItems: [
                          ...(p.agendaItems ?? []),
                          {
                            id: `agenda-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            agenda_item: '',
                            presentation_duration_minutes: undefined,
                            minister_support_type: '',
                            minister_support_other: '',
                          },
                        ],
                      }))
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg shadow-sm text-[#344054] font-medium text-sm hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة بند أجندة
                  </button>
                </div>
              </div>
            );
          case 'general_notes':
            return <Textarea value={contentTabForm.general_notes} onChange={(e) => setContentTabForm((p) => ({ ...p, general_notes: e.target.value }))} className={`${inputClass} min-h-[80px]`} placeholder={label} />;
          default:
            return <div className={`${inputClass} bg-gray-50`}>{value ?? '—'}</div>;
        }
      };
      return (
        <div className={`flex flex-col gap-2 w-full ${spec.className ?? ''}`}>
          <label className="text-sm font-medium text-gray-700 text-right flex flex-row items-center justify-between gap-2 w-full" style={{ fontFamily: "'Almarai', sans-serif" }}>
           
            <span className="text-sm font-medium text-gray-700 text-right flex-1 min-w-0 truncate">{label}</span>
            {showCheckbox && (
            <div className="flex flex-row items-center justify-end">
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={`قابل للتعديل: ${label}`}
                onClick={() => setReturnForInfoForm((p) => ({ ...p, editable_fields: { ...p.editable_fields, [key]: !(p.editable_fields[key] ?? false) } }))}
                className={`inline-flex items-center gap-2 cursor-pointer flex-shrink-0 px-2.5 py-1 rounded-full border transition-all duration-200 ${isChecked ? 'bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]' : 'bg-gray-100/80 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'}`}
              >
                <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? 'border-[#048F86] bg-[#048F86]' : 'border-gray-400 bg-white'}`} aria-hidden>
                  {isChecked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="text-xs font-medium whitespace-nowrap">قابل للتعديل</span>
              </button>
            </div>
          )}
          </label>
       
          {renderInput()}
        </div>
      );
    },
    [canEdit, meetingStatus, returnForInfoForm, formData, scheduleForm, contentTabForm.general_notes, contentForm.agendaItems, previousMeetingMinutesOption, previousMeetingOption, loadPreviousMeetingSearchOptions, loadPreviousMeetingMinutesOptions, handleFieldChange, setFormData, setScheduleForm, setContentForm, setContentTabForm, setReturnForInfoForm, setPreviousMeetingMinutesOption]
  );

  /** Renders a field label with an optional "editable when return for info" checkbox beside it (when status is UNDER_REVIEW or UNDER_GUIDANCE) */
  const renderFieldLabel = (fieldId: string, labelContent: React.ReactNode, labelClassName?: string) => {
    const baseLabelClass = labelClassName ?? 'text-sm font-medium text-gray-700 text-[#344054]';
    const showEditable = (meetingStatus === MeetingStatus.UNDER_REVIEW || meetingStatus === MeetingStatus.UNDER_GUIDANCE) && EDITABLE_FIELD_IDS.includes(fieldId);
    const isChecked = returnForInfoForm.editable_fields[fieldId] ?? false;
    if (!showEditable) {
      return <label className={baseLabelClass}>{labelContent}</label>;
    }
    return (
      <div className="flex flex-row items-center justify-end gap-3 w-full min-w-0 flex-nowrap">
        <span className={`${baseLabelClass} flex-1 min-w-0 truncate`} style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{labelContent}</span>
        <button
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          aria-label={`قابل للتعديل: ${typeof labelContent === 'string' ? labelContent : fieldId}`}
          onClick={() => {
            setReturnForInfoForm((p) => ({
              ...p,
              editable_fields: { ...p.editable_fields, [fieldId]: !(p.editable_fields[fieldId] ?? false) },
            }));
          }}
          className={`
            inline-flex items-center gap-2 cursor-pointer flex-shrink-0
            px-2.5 py-1 rounded-full border transition-all duration-200
            ${isChecked
              ? 'bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]'
              : 'bg-gray-100/80 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
            }
          `}
        
        >
          <span
            className={`
              w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${isChecked ? 'border-[#048F86] bg-[#048F86]' : 'border-gray-400 bg-white'}
            `}
            aria-hidden
          >
            {isChecked && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          <span className="text-xs font-medium whitespace-nowrap">قابل للتعديل</span>
        </button>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#EAECF0] border-t-[#048F86] animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-semibold text-[#344054]">جاري تحميل بيانات الاجتماع</p>
            <p className="text-[13px] text-[#667085]">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !meeting) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-bold text-[#101828]">حدث خطأ أثناء تحميل البيانات</p>
            <p className="text-[13px] text-[#667085]">تعذر تحميل بيانات الاجتماع. يرجى المحاولة مرة أخرى.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-xl border border-[#D0D5DD] bg-white text-[#344054] text-sm font-semibold hover:bg-[#F9FAFB] transition-colors shadow-sm"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden overflow-x-hidden min-w-0" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-3 pr-5 min-w-0">
        {/* Head: shared detail page header */}
        <div className="flex flex-col flex-shrink-0 min-w-0 gap-2">
          <DetailPageHeader
            title={` ${meeting.meeting_title}  (${meeting.request_number})`}
            subtitle="مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة."
            onBack={() => navigate(-1)}
            statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} className="flex-shrink-0" />}
            hasChanges={hasChanges}
            editAction={{
              visible:true,
              hasChanges,
              opensForm: true,
              tooltip: 'فتح نموذج التعديل',
              onClick: () => openEditForm(),
            }}
            secondaryAction={
              meetingStatus === MeetingStatus.DRAFT ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDraftModalOpen(true)}
                  disabled={deleteDraftMutation.isPending}
                  className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                </Button>
              ) : undefined
            }
            primaryAction={
              <AIGenerateButton
                label="تقييم جاهزية الاجتماع"
                onClick={() => setIsQualityModalOpen(true)}
              />
            }
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            helpTooltip={permissionTooltip}
          />
        </div>

        {/* Content card */}
        <div
          className="w-full flex-1 min-h-0 min-w-0 flex flex-row overflow-y-auto overflow-x-hidden px-8 py-8 gap-6 rounded-2xl bg-white justify-center border border-[#EAECF0]"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}
        >
          {/* Edit button: in tab content area; opens UC01 EditMeeting form */}
          {/* {meeting && id && (meeting.status === MeetingStatus.UNDER_REVIEW || meeting.status === MeetingStatus.UNDER_GUIDANCE || meeting.status === MeetingStatus.SCHEDULED) && (
            <div className="flex justify-end flex-shrink-0" dir="rtl">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <button
                        type="button"
                        onClick={() => setIsEditMeetingOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-all shadow-sm hover:opacity-90"
                        style={{ fontFamily: "'Almarai', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.26} />
                        تعديل
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-right">
                    <p>فتح نموذج التعديل</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )} */}

          {/* Tab content wrapper: flex-1 so it takes remaining space */}
          <div className="w-full flex-1 min-h-0 min-w-0 flex flex-row justify-center">
          {/* Tab: معلومات الطلب */}
          {activeTab === 'request-info' && (
            <RequestInfoTab meeting={meeting} statusLabel={statusLabel} />
          )}

          {activeTab === 'request-notes' && meeting && (
            <div className="w-full max-w-4xl mx-auto" dir="rtl">
              <NotesTab meeting={meeting} />
            </div>
          )}

          {/* Tab: معلومات الاجتماع – MeetingInfo (read-only when !canEdit; with قابل للتعديل + editable when canEdit) */}
          {activeTab === 'meeting-info' && (
            <MeetingInfoTab
              data={meetingInfoData}
              canEdit={canEdit}
              renderField={meetingInfoRenderField}
              extraGridSpecs={formData.is_sequential ? UC02_EXTRA_MEETING_INFO_SPECS : [UC02_EXTRA_MEETING_INFO_SPECS[0], UC02_EXTRA_MEETING_INFO_SPECS[2]]}
            />
          )}

          {/* Tab: المحتوى – العرض التقديمي، متى سيتم إرفاق العرض؟، مرفقات اختيارية، الملخّص التنفيذي، ملاحظات (chronological order) */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6 w-full min-w-0 max-w-full self-stretch" dir="rtl" style={{ width: '100%', minWidth: 0, flex: '1 1 0%' }}>

              {/* ─── التوجيهات المرتبطة بالاجتماع ─── */}
              {contentApprovalDirectivesRows.length > 0 && (
                <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                      <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1F2937]">التوجيهات المرتبطة بالاجتماع</h3>
                  </div>
                  <div className="p-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F3F4F6]">
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-12">#</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">التوجيه</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-32">الموعد النهائي</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-28">الحالة</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280] min-w-[120px]">المعينون</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F9FAFB]">
                        {contentApprovalDirectivesRows.map((row, index) => {
                          const d = row.deadline ? new Date(row.deadline) : null;
                          const assigneesList = (row.responsible_persons ?? '')
                            .split(/[،,]/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          return (
                            <tr key={index} className="group hover:bg-[#F9FAFB] transition-colors">
                              <td className="px-4 py-3.5 text-[#9CA3AF] font-medium">{index + 1}</td>
                              <td className="px-4 py-3.5 text-[#374151]" dir="rtl">{row.directive_text || '—'}</td>
                              <td className="px-4 py-3.5 text-[#6B7280]">{d ? formatDateArabic(d) : '—'}</td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F3F4F6] text-[#374151] text-xs font-medium">
                                  {translateDirectiveStatus(row.directive_status)}
                                </span>
                              </td>
                              <td className="px-4 py-3.5" dir="rtl">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {assigneesList.length === 0 ? (
                                    <span className="text-[#9CA3AF]">—</span>
                                  ) : (
                                    assigneesList.map((email, i) => (
                                      <span
                                        key={`${email}-${i}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#048F86]/8 text-[#048F86] text-xs font-medium"
                                      >
                                        {email}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* ─── العرض التقديمي ─── */}
              <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                      <FileCheck className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1F2937]">العرض التقديمي</h3>
                  </div>
                  {canEdit && ((meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).length > 0 || newPresentationAttachments.length > 0) && (
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#048F86] text-white hover:bg-[#037A72] cursor-pointer transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                      إضافة عرض
                      <input type="file" multiple onChange={(e) => { handleAddPresentationAttachments(e.target.files); e.target.value = ''; }} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
                    </label>
                  )}
                </div>
                <div className="p-6">
                  <TooltipProvider>
                    <div className="flex flex-col gap-3">
                      {(() => {
                        const presentationAttachments = (meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id));
                        return presentationAttachments.map((att) => {
                          const seq = att.presentation_sequence ?? 0;
                          const showCompare = seq > 1;
                          const compareDisabledReason =
                            presentationAttachments.length < 2
                              ? "يجب وجود عرضين تقديميين على الأقل للمقارنة"
                              : "المقارنة متاحة عندما يكون رقم التسلسل أكبر من 1";
                          return (
                          <div key={att.id} className="group flex items-center gap-4 px-5 py-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#048F86]/40 hover:shadow-[0_2px_12px_rgba(4,143,134,0.08)] transition-all duration-200">
                          {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon />: <div className="w-11 h-11 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                          <div className="flex flex-col items-end min-w-0 flex-1">
                            <div className="flex items-center gap-2 w-full justify-end flex-wrap">
                              {seq > 0 && (
                                <span className="text-[10px] font-medium text-[#048F86] bg-[#048F86]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                  نسخة {seq}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-[#1F2937] truncate">{att.file_name}</span>
                            </div>
                            <span className="text-xs text-[#9CA3AF] mt-0.5">{Math.round((att.file_size || 0) / 1024)} KB</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!showCompare || compareByAttachmentMutation.isPending) return;
                                      compareAbortControllerRef.current?.abort();
                                      compareAbortControllerRef.current = new AbortController();
                                      setComparePresentationsResult(null);
                                      setCompareErrorDetail(null);
                                      setIsComparePresentationsModalOpen(true);
                                      compareByAttachmentMutation.mutate({
                                        attachmentId: att.id,
                                        signal: compareAbortControllerRef.current.signal,
                                      });
                                    }}
                                    disabled={compareByAttachmentMutation.isPending}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#048F86]/35 bg-[#048F86]/5 hover:bg-[#048F86]/12 text-[#048F86] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                    style={!showCompare ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
                                    aria-label={showCompare ? "مقارنة هذا العرض بالنسخة السابقة بالذكاء الاصطناعي" : compareDisabledReason}
                                  >
                                    <GitCompare className="w-4 h-4 flex-shrink-0" strokeWidth={2} aria-hidden />
                                    <span>مقارنة بالذكاء الاصطناعي</span>
                                  </button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-right">
                                <p>{showCompare ? "مقارنة هذا العرض مع النسخة السابقة (فروقات ودرجة التطابق)" : compareDisabledReason}</p>
                              </TooltipContent>
                            </Tooltip>
                            <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#048F86]/8 text-[#048F86] transition-colors"><Download className="w-4 h-4" /></a>
                            <button type="button" onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                            <button type="button" disabled={!canEdit} onClick={() => handleDeleteAttachment(att.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          {/* AI insights button */}
                          <button
                            onClick={() => {
                              insightsAbortControllerRef.current?.abort();
                              insightsAbortControllerRef.current = new AbortController();
                              setInsightsModalAttachment({ id: att.id, file_name: att.file_name });
                              insightsMutation.reset();
                              insightsMutation.mutate({
                                attachmentId: att.id,
                                signal: insightsAbortControllerRef.current.signal,
                              });
                            }}
                            disabled={insightsMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-l from-[#048F86] to-[#34C3BA] shadow-[0_2px_8px_rgba(4,143,134,0.25)] hover:shadow-[0_4px_16px_rgba(4,143,134,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                          >
                            <span>ملاحظات بالذكاء الاصطناعي</span>
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.25398 4.43574C2.31098 4.48358 2.38555 4.51001 2.46286 4.50976C2.53984 4.50958 2.61395 4.48297 2.67057 4.43517C2.72718 4.38737 2.76217 4.32187 2.76864 4.25158C2.84188 3.81496 3.06712 3.41171 3.41081 3.10189C3.7545 2.79208 4.19824 2.59229 4.67592 2.5323C4.7458 2.51964 4.80871 2.48515 4.85393 2.43473C4.89915 2.38431 4.92387 2.32107 4.92387 2.25581C4.92387 2.19055 4.89915 2.12731 4.85393 2.07688C4.80871 2.02646 4.7458 1.99197 4.67592 1.97931C4.19728 1.92156 3.7522 1.7225 3.40806 1.41229C3.06392 1.10207 2.83945 0.697576 2.76864 0.260034C2.76264 0.189272 2.72773 0.123188 2.67087 0.0749826C2.61401 0.026777 2.5394 0 2.46193 0C2.38447 0 2.30985 0.026777 2.253 0.0749826C2.19614 0.123188 2.16123 0.189272 2.15523 0.260034C2.08199 0.696656 1.85675 1.09991 1.51306 1.40972C1.16937 1.71954 0.725625 1.91932 0.247945 1.97931C0.178069 1.99197 0.115154 2.02646 0.0699358 2.07688C0.024718 2.12731 0 2.19055 0 2.25581C0 2.32107 0.024718 2.38431 0.0699358 2.43473C0.115154 2.48515 0.178069 2.51964 0.247945 2.5323C0.72659 2.59006 1.17167 2.78911 1.51581 3.09933C1.85995 3.40955 2.08442 3.81404 2.15523 4.25158C2.16172 4.32216 2.19698 4.3879 2.25398 4.43574Z" fill="white"/>
                              <path d="M8.89539 12.4012C8.82392 12.4014 8.75502 12.377 8.70255 12.3328C8.65008 12.2887 8.61793 12.2282 8.61257 12.1634C8.59673 11.974 8.16938 7.50891 3.17558 6.48248C3.11281 6.46975 3.0567 6.43796 3.01648 6.39235C2.97626 6.34675 2.95435 6.29004 2.95435 6.23159C2.95435 6.17315 2.97626 6.11644 3.01648 6.07083C3.0567 6.02522 3.11281 5.99343 3.17558 5.98071C8.17985 4.95248 8.60861 0.346806 8.61228 0.299765C8.61778 0.235032 8.65003 0.174589 8.70255 0.130576C8.75506 0.0865641 8.82396 0.0622444 8.89539 0.062502C8.96691 0.0623238 9.03585 0.0867798 9.08833 0.130947C9.1408 0.175113 9.17292 0.235709 9.17821 0.300536C9.19405 0.489987 9.6214 4.95505 14.6152 5.98148C14.678 5.99421 14.7341 6.026 14.7743 6.0716C14.8145 6.11721 14.8364 6.17392 14.8364 6.23236C14.8364 6.29081 14.8145 6.34752 14.7743 6.39313C14.7341 6.43873 14.678 6.47052 14.6152 6.48325C9.61093 7.51148 9.18217 12.1171 9.1785 12.1642C9.17293 12.2289 9.14065 12.2893 9.08814 12.3332C9.03563 12.3772 8.96678 12.4015 8.89539 12.4012Z" fill="white"/>
                            </svg>
                          </button>
                        </div>
                          );
                        });
                      })()}

                      {/* New presentation attachments (not yet saved) */}
                      {newPresentationAttachments.map((file, idx) => (
                        <div key={`new-pres-${idx}`} className="flex items-center gap-3 px-5 py-4 bg-[#F0FDF9] border border-dashed border-[#048F86]/50 rounded-xl">
                          {file.name.toLowerCase().endsWith('pdf') ? <PdfIcon /> : <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626]">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>}
                          <div className="flex flex-col items-end flex-1 min-w-0">
                            <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{file.name}</span>
                            <span className="text-xs text-[#048F86] font-semibold">جديد</span>
                          </div>
                          <button type="button" disabled={!canEdit} onClick={() => handleRemoveNewPresentationAttachment(idx)} className="p-2 rounded-lg hover:bg-red-50 text-[#DC2626] disabled:opacity-40 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}

                      {/* Empty state - compact like Notes section */}
                      {(meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).length === 0 && newPresentationAttachments.length === 0 && (
                        <div className="flex flex-col rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] py-6 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                              <FileCheck className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.2} />
                            </div>
                            <div>
                              <p className="font-semibold text-[15px] text-[#374151]">لا يوجد عرض تقديمي</p>
                              <p className="text-sm text-[#9CA3AF] mt-0.5">أضف عرضاً تقديمياً للاجتماع</p>
                            </div>
                          </div>
                          {canEdit && (
                            <label className="mt-3 flex items-center gap-2 w-fit px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#048F86] text-white hover:bg-[#037A72] cursor-pointer transition-colors shadow-sm">
                              <Plus className="w-4 h-4" />
                              إضافة عرض تقديمي
                              <input type="file" multiple onChange={(e) => { handleAddPresentationAttachments(e.target.files); e.target.value = ''; }} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </section>

              {/* ─── مرفقات اختيارية ─── */}
              <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                      <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1F2937]">مرفقات اختيارية</h3>
                  </div>
                  {canEdit && (optionalAttachmentsList.length > 0 || newAttachments.length > 0) && (
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#048F86]/30 text-[#048F86] bg-[#048F86]/5 hover:bg-[#048F86]/10 cursor-pointer transition-colors">
                      <Plus className="w-4 h-4" />
                      إضافة مرفق
                      <input type="file" multiple onChange={(e) => handleAddAttachments(e.target.files)} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
                    </label>
                  )}
                </div>
                <div className="p-6">
                  {(() => {
                    const hasAnyOptional = optionalAttachmentsList.length > 0 || newAttachments.length > 0;
                  return hasAnyOptional ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {optionalAttachmentsList.map((att) => (
                        <div key={att.id} className="group flex items-center gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#048F86]/30 hover:shadow-sm transition-all duration-200">
                          {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon />: <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                          <div className="flex flex-col items-end min-w-0 flex-1">
                            <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{att.file_name}</span>
                            <span className="text-xs text-[#9CA3AF]">{Math.round((att.file_size || 0) / 1024)} KB</span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#048F86]/8 text-[#048F86] transition-colors"><Download className="w-4 h-4" /></a>
                            <button type="button" onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                            <button type="button" disabled={!canEdit} onClick={() => handleDeleteAttachment(att.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#DC2626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                      {newAttachments.map((file, idx) => (
                        <div key={`new-${idx}`} className="flex items-center gap-3 px-4 py-3 bg-[#F0FDF9] border border-dashed border-[#048F86]/50 rounded-xl">
                          <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                          <div className="flex flex-col items-end flex-1 min-w-0">
                            <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{file.name}</span>
                            <span className="text-xs text-[#048F86] font-semibold">جديد</span>
                          </div>
                          <button type="button" disabled={!canEdit} onClick={() => handleRemoveNewAttachment(idx)} className="p-2 rounded-lg hover:bg-red-50 text-[#DC2626] disabled:opacity-40 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] py-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.2} />
                        </div>
                        <div>
                          <p className="font-semibold text-[15px] text-[#374151]">لا توجد مرفقات اختيارية</p>
                          <p className="text-sm text-[#9CA3AF] mt-0.5">يمكنك إرفاق مستندات إضافية إن رغبت</p>
                        </div>
                      </div>
                      {canEdit && (
                        <label className="mt-3 flex items-center gap-2 w-fit px-5 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-[#048F86]/40 text-[#048F86] bg-[#048F86]/5 hover:bg-[#048F86]/10 cursor-pointer transition-colors">
                          <Plus className="w-4 h-4" />
                          إضافة مرفق
                          <input type="file" multiple onChange={(e) => handleAddAttachments(e.target.files)} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
                        </label>
                      )}
                    </div>
                  );
                  })()}
                </div>
              </section>

              {/* ─── الملخّص التنفيذي ─── */}
              <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                  <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                    <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1F2937]">الملخّص التنفيذي</h3>
                </div>
                <div className="p-6">
                  {(() => {
                    const execSummaryText = meeting?.executive_summary != null && String(meeting.executive_summary).trim() !== '' ? String(meeting.executive_summary) : null;
                    const execSummaryAttachments = (meeting?.attachments ?? []).filter((a) => a.is_executive_summary === true && !deletedAttachmentIds.includes(a.id));
                    const hasExec = execSummaryText || execSummaryAttachments.length > 0;
                    if (!hasExec) {
                      return (
                        <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                          </div>
                          <p className="text-sm text-[#6B7280]">لا يوجد ملخّص تنفيذي</p>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-4">
                        {execSummaryText && (
                          <div className="w-full px-5 py-4 bg-[#FFFBEB]/50 border border-[#FDE68A]/40 rounded-xl text-right text-[#78350F] leading-relaxed text-sm whitespace-pre-wrap">
                            {execSummaryText}
                          </div>
                        )}
                        {execSummaryAttachments.length > 0 && (
                          <div className="grid grid-cols-1 gap-3">
                            {execSummaryAttachments.map((att) => (
                              <div key={att.id} className="group flex items-center gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#92400E]/30 hover:shadow-sm transition-all duration-200">
                                {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon /> : <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                                <div className="flex flex-col items-end min-w-0 flex-1">
                                  <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{att.file_name}</span>
                                  <span className="text-xs text-[#9CA3AF]">{Math.round((att.file_size || 0) / 1024)} KB</span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#92400E]/8 text-[#92400E] transition-colors"><Download className="w-4 h-4" /></a>
                                  <button type="button" onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </section>

              {/* ─── متى سيتم إرفاق العرض؟ (only when there is no presentation) ─── */}
              {/* {((meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).length === 0 && newPresentationAttachments.length === 0) && (
                <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                    <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                      <Clock className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1F2937]">متى سيتم إرفاق العرض؟</h3>
                  </div>
                  <div className="p-6">
                    <Input type="text" value={contentTabForm.when_presentation_attached} onChange={(e) => setContentTabForm((p) => ({ ...p, when_presentation_attached: e.target.value }))} disabled={!canEdit} className="w-full h-11 bg-white border border-[#D1D5DD] rounded-xl text-right placeholder:text-[#9CA3AF] focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86]/20" placeholder="متى سيتم إرفاق العرض؟" />
                    {!contentTabForm.when_presentation_attached?.trim() && (
                      <div className="flex items-center gap-3 mt-4 py-4 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                        <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-[#6B7280]">لم يتم تحديد موعد إرفاق العرض بعد</p>
                      </div>
                    )}
                  </div>
                </section>
              )} */}

              {/* ─── ملاحظات ─── */}
              <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                  <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                    <ClipboardCheck className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1F2937]">ملاحظات</h3>
                </div>
                <div className="p-6">
                  {(() => {
                    const notesText = generalNotesList.length > 0 ? generalNotesList.map((n) => n.text).join('\n\n') : (contentTabForm.general_notes || '').trim();
                    const hasGeneralNotes = generalNotesList.length > 0 || (notesText !== '' && notesText !== '—' && !/^[\s—\-]+$/.test(notesText));
                    const hasContentOfficerNotes = contentOfficerNotesDisplay && contentOfficerNotesDisplay !== '—';
                    const isEmptyNotes = !hasGeneralNotes && !hasContentOfficerNotes;
                    if (isEmptyNotes) {
                      return (
                        <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                            <ClipboardCheck className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#374151]">لا توجد ملاحظات</p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">لم تتم إضافة أي ملاحظات لهذا الطلب</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <>
                        {hasGeneralNotes && (
                          <div className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-right text-[#374151] leading-relaxed whitespace-pre-wrap text-sm">
                            {generalNotesList.length > 0 ? generalNotesList.map((n) => n.text).join('\n\n') : contentTabForm.general_notes}
                          </div>
                        )}
                        {hasContentOfficerNotes && (
                          <div className={hasGeneralNotes ? 'mt-5 pt-5 border-t border-[#F3F4F6]' : ''}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-md bg-[#F59E0B]/10 flex items-center justify-center">
                                <ClipboardCheck className="w-3.5 h-3.5 text-[#D97706]" strokeWidth={2} />
                              </div>
                              <span className="text-sm font-semibold text-[#92400E]">ملاحظات مسؤول المحتوى</span>
                            </div>
                            <div className="w-full px-5 py-4 bg-[#FFFBEB]/60 border border-[#FDE68A]/40 rounded-xl text-right text-[#78350F] whitespace-pre-wrap text-sm leading-relaxed">
                              {contentOfficerNotesDisplay}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </section>

              {/* Compare presentations result modal (تقييم الاختلاف بين العروض) */}
              <Dialog open={isComparePresentationsModalOpen} onOpenChange={(open) => { if (!open) { compareAbortControllerRef.current?.abort(); compareAbortControllerRef.current = null; setCompareOpenedWithoutReplace(false); setComparePresentationsResult(null); setCompareErrorDetail(null); } setIsComparePresentationsModalOpen(!!open); }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right">
                      تقييم الاختلاف بين العروض
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4 text-right">
                    {compareByAttachmentMutation.isPending ? (
                      <p className="text-center text-gray-500 py-6">جاري تقييم الاختلاف بين العروض...</p>
                    ) : compareOpenedWithoutReplace ? (
                      <p className="text-center text-gray-600 py-6">المقارنة متاحة فقط للعروض التي تحل محل نسخة سابقة.</p>
                    ) : compareByAttachmentMutation.isError ? (
                      <div className="text-center py-4">
                        <p className="text-red-600 font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                        {compareErrorDetail ? <p className="text-gray-700 text-sm mt-2 text-right">{compareErrorDetail}</p> : <p className="text-gray-600 text-sm mt-2">يرجى المحاولة لاحقاً.</p>}
                      </div>
                    ) : comparePresentationsResult ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500">معرف التقييم</span>
                            <span className="font-medium text-gray-900">{comparePresentationsResult.comparison_id || '—'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500">الدرجة الإجمالية</span>
                            <span className="font-medium text-gray-900">{comparePresentationsResult.overall_score ?? '—'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500">مستوى الاختلاف</span>
                            <span className="font-medium text-gray-900">{translateCompareValue(comparePresentationsResult.difference_level, COMPARE_LEVEL)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500">الحالة</span>
                            <span className="font-medium text-gray-900">{translateCompareValue(comparePresentationsResult.status, COMPARE_STATUS)}</span>
                          </div>
                        </div>
                        {comparePresentationsResult.regeneration_recommendation ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 text-sm">توصية إعادة التوليد</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{translateCompareValue(comparePresentationsResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}</p>
                          </div>
                        ) : null}
                        {comparePresentationsResult.summary ? (
                          <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <span className="text-gray-700 font-medium">ملخص الشرائح</span>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span>الشرائح الأصلية: {comparePresentationsResult.summary.total_slides_original ?? '—'}</span>
                              <span>الشرائح الجديدة: {comparePresentationsResult.summary.total_slides_new ?? '—'}</span>
                              <span>فرق العدد: {comparePresentationsResult.summary.slide_count_difference ?? '—'}</span>
                              <span>بدون تغيير: {comparePresentationsResult.summary.unchanged_slides ?? '—'}</span>
                              <span>تغييرات طفيفة: {comparePresentationsResult.summary.minor_changes ?? '—'}</span>
                              <span>تغييرات متوسطة: {comparePresentationsResult.summary.moderate_changes ?? '—'}</span>
                              <span>تغييرات كبيرة: {comparePresentationsResult.summary.major_changes ?? '—'}</span>
                              <span>شرائح جديدة: {comparePresentationsResult.summary.new_slides ?? '—'}</span>
                            </div>
                          </div>
                        ) : null}
                        {comparePresentationsResult.ai_insights && Object.keys(comparePresentationsResult.ai_insights).length > 0 ? (
                          <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <span className="text-gray-700 font-medium">رؤى الذكاء الاصطناعي</span>
                            {(() => {
                              const ai = comparePresentationsResult.ai_insights as {
                                main_topics?: string[];
                                business_impact?: string;
                                risk_assessment?: string;
                                presentation_coherence?: string;
                                slide_count_comparison?: { original_count?: number; new_count?: number; difference?: number };
                              };
                              return (
                                <div className="flex flex-col gap-2 text-sm text-right">
                                  {ai.main_topics && Array.isArray(ai.main_topics) && ai.main_topics.length > 0 ? (
                          <div className="flex flex-col gap-1">
                                      <span className="text-gray-500">المواضيع الرئيسية</span>
                                      <ul className="list-disc list-inside text-gray-900">
                                        {ai.main_topics.map((t, i) => (
                                          <li key={i}>{t}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                  {ai.business_impact != null && ai.business_impact !== '' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-gray-500">الأثر على الأعمال</span>
                                      <span className="text-gray-900">{String(ai.business_impact)}</span>
                                    </div>
                                  ) : null}
                                  {ai.risk_assessment != null && ai.risk_assessment !== '' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-gray-500">تقييم المخاطر</span>
                                      <span className="text-gray-900">{String(ai.risk_assessment)}</span>
                                    </div>
                                  ) : null}
                                  {ai.presentation_coherence != null && ai.presentation_coherence !== '' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-gray-500">تماسك العرض</span>
                                      <span className="text-gray-900">{String(ai.presentation_coherence)}</span>
                                    </div>
                                  ) : null}
                                  {ai.slide_count_comparison && typeof ai.slide_count_comparison === 'object' ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-gray-500">مقارنة عدد الشرائح</span>
                                      <div className="grid grid-cols-2 gap-2 text-gray-900">
                                        <span>الأصلي: {ai.slide_count_comparison.original_count ?? '—'}</span>
                                        <span>الجديد: {ai.slide_count_comparison.new_count ?? '—'}</span>
                                        <span>الفرق: {ai.slide_count_comparison.difference != null ? ai.slide_count_comparison.difference : '—'}</span>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-gray-500">لا توجد نتيجة لعرضها.</p>
                    )}
                  </div>
                  <DialogFooter className="flex-row-reverse gap-2">
                    <button
                      type="button"
                      onClick={() => { compareAbortControllerRef.current?.abort(); compareAbortControllerRef.current = null; setIsComparePresentationsModalOpen(false); setComparePresentationsResult(null); setCompareErrorDetail(null); setCompareOpenedWithoutReplace(false); }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    
                    >
                      إغلاق
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Attachment LLM notes/insights modal (ملاحظات على العرض) – triggered by icon on each presentation */}
              <Dialog open={!!insightsModalAttachment} onOpenChange={(open) => { if (!open) { insightsAbortControllerRef.current?.abort(); insightsAbortControllerRef.current = null; setInsightsModalAttachment(null); insightsMutation.reset(); } }}>
                <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden p-0" dir="rtl">
                  {/* Header with gradient accent */}
                  <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-[#048F86] via-[#06B6A4] to-[#A6D8C1]" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#048F86] to-[#06B6A4]">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <DialogHeader className="p-0">
                          <DialogTitle className="text-right text-[16px] font-bold text-[#101828]">
                            تحليل العرض التقديمي
                          </DialogTitle>
                        </DialogHeader>
                        {insightsModalAttachment?.file_name && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <FileText className="h-3.5 w-3.5 text-[#667085] flex-shrink-0" />
                            <span className="text-[13px] text-[#667085] truncate">
                              {insightsModalAttachment.file_name}
                            </span>
            </div>
          )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)', fontFamily: "'Almarai', sans-serif" }}>
                    {insightsMutation.isPending ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="relative">
                          <div className="h-14 w-14 rounded-full bg-[#E6F9F8] flex items-center justify-center">
                            <Loader2 className="h-7 w-7 text-[#048F86] animate-spin" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[15px] font-semibold text-[#101828]">جاري التحليل...</span>
                          <span className="text-[13px] text-[#667085]">يتم تحليل العرض التقديمي بواسطة الذكاء الاصطناعي</span>
                        </div>
                      </div>
                    ) : insightsMutation.isError ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[15px] font-semibold text-[#101828]">تعذّر إتمام التحليل</span>
                          <span className="text-[13px] text-[#667085]">حدث خطأ أثناء جلب الملاحظات. يرجى المحاولة لاحقاً.</span>
                        </div>
                      </div>
                    ) : insightsMutation.data != null && insightsModalAttachment?.id === insightsMutation.variables?.attachmentId ? (
                      (() => {
                        const d = insightsMutation.data as AttachmentInsightsResponse & Record<string, unknown>;
                        const notes: string[] = Array.isArray(d.llm_notes) ? d.llm_notes : (d.llm_notes != null ? [].concat(d.llm_notes as any) : []);
                        const rawSuggestions = d.llm_suggestions ?? d.suggestions;
                        const suggestions: string[] = Array.isArray(rawSuggestions) ? rawSuggestions.map((x: unknown) => (typeof x === 'string' ? x : String(x ?? ''))) : (rawSuggestions != null ? [].concat(rawSuggestions as any).map((x: unknown) => (typeof x === 'string' ? x : String(x ?? ''))) : []);
                        if (notes.length === 0 && suggestions.length === 0) {
                                return (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                              <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                                <Check className="h-6 w-6 text-[#667085]" />
                              </div>
                              <span className="text-[14px] text-[#667085]">لا توجد ملاحظات أو اقتراحات على هذا العرض.</span>
                                  </div>
                                );
                              }
                                return (
                          <div className="flex flex-col gap-5">
                            {notes.length > 0 && (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                                    <FileText className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <span className="text-[14px] font-bold text-[#101828]">الملاحظات</span>
                                  <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">{notes.length}</span>
                                </div>
                                <div className="flex flex-col gap-2 mr-1">
                                  {notes.map((note, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-[#FFFBF5] border border-amber-100">
                                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold mt-0.5">{idx + 1}</span>
                                      <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">{note}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {suggestions.length > 0 && (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F9F8]">
                                    <Lightbulb className="h-4 w-4 text-[#048F86]" />
                                  </div>
                                  <span className="text-[14px] font-bold text-[#101828]">الاقتراحات</span>
                                  <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">{suggestions.length}</span>
                                </div>
                                <div className="flex flex-col gap-2 mr-1">
                                  {suggestions.map((s, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-[#F6FFFE] border border-[#D0F0ED]">
                                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#D0F0ED] text-[#048F86] text-[11px] font-bold mt-0.5">{idx + 1}</span>
                                      <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">{s}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                                  </div>
                                );
                      })()
                    ) : !insightsMutation.isPending && !insightsMutation.isError ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                          <FileText className="h-6 w-6 text-[#98A2B3]" />
                        </div>
                        <span className="text-[14px] text-[#667085]">لا توجد ملاحظات.</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                                <button
                                  type="button"
                      onClick={() => { insightsAbortControllerRef.current?.abort(); insightsAbortControllerRef.current = null; setInsightsModalAttachment(null); insightsMutation.reset(); }}
                      className="px-5 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] transition-colors text-[14px] font-semibold shadow-sm"
                    
                    >
                      إغلاق
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {/* Tab: قائمة المدعوين (non–schedule officer) OR الجدولة (schedule officer: إعدادات + مدعوون) */}
          {((activeTab === 'attendees' && !isScheduleOfficer) || (activeTab === 'schedule' && isScheduleOfficer)) && (
            <div className="flex flex-col gap-6 w-full" dir="rtl">
              {/* إعدادات الجدولة – only when schedule tab + schedule officer */}
              {activeTab === 'schedule' && isScheduleOfficer && (
                <section className="rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                    <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                      <CalendarMinus className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#1F2937]">إعدادات الجدولة</h2>
                  </div>
                  <div className="p-6">
                    {validationError && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-right text-sm text-red-600">{validationError}</p>
                      </div>
                    )}
                    {scheduleMutation.isSuccess && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-right text-sm text-green-600">تم جدولة الاجتماع بنجاح</p>
                      </div>
                    )}
                    {(scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID') && isCreatingWebex && (
                      <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl mb-4">
                        <div className="w-5 h-5 border-2 border-[#048F86] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-sm text-[#374151]">جاري إنشاء اجتماع Webex...</span>
                      </div>
                    )}
                    {(scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID') && webexMeetingDetails && !isCreatingWebex && (
                      <div className="flex flex-col gap-2 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl mb-4">
                        <label className="text-sm font-semibold text-[#1F2937] text-right">تفاصيل اجتماع Webex</label>
                        <div className="flex gap-2">
                          <Input type="text" value={webexMeetingDetails.join_link} readOnly className="flex-1 h-9 bg-white border border-[#D0D5DD] rounded-lg text-right text-sm" />
                          <button type="button" onClick={() => navigator.clipboard.writeText(webexMeetingDetails.join_link)} className="px-3 py-1.5 text-xs bg-[#048F86] text-white rounded-lg hover:bg-[#037A72] transition-colors">نسخ</button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-4">
                      <FormField label="مبدئي" className="w-full max-w-none h-auto">
                        <FormSwitch checked={!scheduleForm.requires_protocol} onCheckedChange={(checked) => setScheduleForm((prev) => ({ ...prev, requires_protocol: !checked }))} />
                      </FormField>
                      <FormField label="البيانات مكتملة" className="w-full max-w-none h-auto">
                        <FormSwitch checked={scheduleForm.is_data_complete} onCheckedChange={(checked) => setScheduleForm((prev) => ({ ...prev, is_data_complete: checked }))} />
                      </FormField>
                      <FormTextArea label="ملاحظات" value={scheduleForm.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Meeting scheduled successfully" containerClassName="!px-0 !mx-0" fullWidth={false} />
                    </div>
                  </div>
                  <InviteesTableForm initialInvitees={meeting?.invitees} mode='view' />
                </section>
              )}
            </div>
          )}

          {/* استشارة الجدولة – Chat-style like executive consultation */}
          {activeTab === 'scheduling-consultation' && (
            <div className="flex flex-col w-full max-h-[600px] rounded-2xl border border-[#E5E7EB] bg-white" dir="rtl">
              {/* Scrollable messages area */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoadingConsultationRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#048F86]" />
                  </div>
                ) : consultationRecords && consultationRecords.items.length > 0 ? (
                  <div className="flex flex-col pb-4">
                    {[...consultationRecords.items].reverse().map((row: ConsultationRecord, index: number) => {
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                      const consultationStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };
                      const recordQuestion = row.question || row.consultation_question || '';
                      const requesterName = row.consultant_name || '-';

                      // Collect all responses
                      const flatItems: Array<{id: string; text: string; status: string; name: string; respondedAt: string | null}> = [];
                      if (row.assignees?.length) {
                        row.assignees.forEach(a => {
                          if (a.answers?.length) {
                            a.answers.forEach(ans => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at }));
                          } else {
                            flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at });
                          }
                        });
                      } else if (row.consultation_answers?.length) {
                        row.consultation_answers.forEach(a => flatItems.push({ id: a.consultation_id || a.external_id || `ans-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at }));
                      } else if (row.assignee_sections?.length) {
                        row.assignee_sections.forEach(a => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at }));
                      }

                      const recordId = row.id || row.consultation_id || `${index}`;

                      return (
                        <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                          {/* Question bubble (sent) */}
                          <div className="px-5 pt-5 pb-3">
                            <div className="flex items-start gap-3" dir="rtl">
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#048F86]">{requesterName?.charAt(0)?.toUpperCase() || '?'}</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[#1F2937]">{requesterName}</span>
                                  <span className="text-[11px] text-[#9CA3AF]">{requestDate}</span>
                                  {row.status && <StatusBadge status={row.status} label={consultationStatusLabels[row.status] || row.status} />}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">{recordQuestion || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Response bubbles */}
                          <div className="px-5 pb-5 pt-1">
                            {flatItems.length > 0 ? (
                              <div className="flex flex-col gap-3">
                                {flatItems.map((item) => (
                                  <div key={item.id} className="flex items-start gap-3" dir="ltr">
                                    <div className="flex-shrink-0">
                                      <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                                        <span className="text-xs font-bold text-[#92400E]">{item.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-[#1F2937]">{item.name || '-'}</span>
                                        {item.respondedAt && <span className="text-[11px] text-[#9CA3AF]">{formatTimeAgoArabic(item.respondedAt)}</span>}
                                        <StatusBadge status={item.status} label={consultationStatusLabels[item.status] || item.status} />
                                      </div>
                                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                        <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">{item.text?.trim() || '—'}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit" dir="ltr">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                                <p className="text-sm text-[#9CA3AF]">لا يوجد رد بعد</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">استشارة الجدولة</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات بعد</p>
                  </div>
                )}
              </div>

              {/* Inline chat input – consultant picker + question */}
              {meetingStatus !== MeetingStatus.WAITING && meetingStatus !== MeetingStatus.CLOSED && meetingStatus !== MeetingStatus.UNDER_CONTENT_REVIEW && meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT && meetingStatus !== MeetingStatus.REJECTED && (
                <div className="flex-shrink-0 border-t border-[#F3F4F6] bg-[#FAFAFA] rounded-b-2xl">
                  {/* Consultant picker (expandable) */}
                  {showConsultantPicker && (
                    <div className="px-5 pt-4 pb-2 border-b border-[#F3F4F6]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#344054]">اختر المستشارين</span>
                        {consultationForm.consultant_user_ids.length > 0 && (
                          <span className="text-xs text-[#048F86] font-medium bg-[#048F86]/10 px-2 py-0.5 rounded-full">
                            {consultationForm.consultant_user_ids.length} مستشار
                          </span>
                        )}
                      </div>
                      <div className="relative mb-2">
                        <Input
                          type="text"
                          value={consultationForm.search}
                          onChange={(e) => setConsultationForm((prev) => ({ ...prev, search: e.target.value }))}
                          placeholder="ابحث بالاسم أو البريد..."
                          className="h-9 text-right text-sm rounded-lg border-[#E5E7EB] bg-white pr-3 pl-8"
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      </div>
                      <div className="max-h-[160px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white">
                        {isLoadingConsultants ? (
                          <div className="py-4 text-center">
                            <Loader2 className="w-4 h-4 animate-spin text-[#048F86] mx-auto" />
                          </div>
                        ) : consultants.length === 0 ? (
                          <div className="py-4 text-center text-sm text-[#9CA3AF]">لا توجد نتائج</div>
                        ) : (
                          <div className="py-1">
                            {consultants.map((user) => {
                              const isSelected = consultationForm.consultant_user_ids.includes(user.id);
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => toggleConsultantSelection(user.id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-right transition-colors hover:bg-[#F9FAFB] ${isSelected ? 'bg-[#048F86]/5' : ''}`}
                                >
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#048F86] border-[#048F86]' : 'border-[#D1D5DB] bg-white'}`}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-[#048F86]/15 text-[#048F86]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                      {user.first_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 text-right">
                                    <span className="text-sm text-[#1F2937]">{user.first_name} {user.last_name}</span>
                                    <span className="text-[11px] text-[#9CA3AF] mr-1.5">{user.email}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {/* Selected consultant chips */}
                      {consultationForm.consultant_user_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {consultationForm.consultant_user_ids.map((uid) => {
                            const user = consultants.find((c) => c.id === uid);
                            return (
                              <span key={uid} className="inline-flex items-center gap-1 bg-[#048F86]/10 text-[#048F86] text-xs font-medium px-2 py-1 rounded-full">
                                {user ? `${user.first_name} ${user.last_name}` : uid}
                                <button type="button" onClick={() => toggleConsultantSelection(uid)} className="hover:text-[#037A72]">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input row */}
                  <form
                    onSubmit={handleConsultationSubmit}
                    className="flex items-end gap-3 px-5 py-4"
                  >
                    {/* Toggle consultant picker */}
                    <button
                      type="button"
                      onClick={() => setShowConsultantPicker((v) => !v)}
                      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors border ${showConsultantPicker ? 'bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#048F86]/40 hover:text-[#048F86]'}`}
                      title="اختيار المستشارين"
                    >
                      <Users className="w-5 h-5" />
                      {consultationForm.consultant_user_ids.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#048F86] text-white text-[9px] font-bold flex items-center justify-center">
                          {consultationForm.consultant_user_ids.length}
                        </span>
                      )}
                    </button>
                    <div className="flex-1 relative">
                      <Textarea
                        value={consultationForm.consultation_question}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm((prev) => ({ ...prev, consultation_question: e.target.value }))}
                        placeholder={consultationForm.consultant_user_ids.length === 0 ? 'اختر المستشارين أولاً ثم اكتب سؤالك...' : 'اكتب سؤال الاستشارة...'}
                        className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-[#E5E7EB] bg-white resize-none focus:border-[#048F86] focus:ring-[#048F86]/20"
                        rows={1}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (consultationForm.consultant_user_ids.length > 0 && consultationForm.consultation_question.trim()) {
                              handleConsultationSubmit(e as any);
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={consultationForm.consultant_user_ids.length === 0 || !consultationForm.consultation_question.trim() || consultationMutation.isPending}
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#048F86] hover:bg-[#037A72] text-white"
                    >
                      {consultationMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-180">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* سؤال tab – Chat-style Q&A */}
          {activeTab === 'directive' && (
            <div className="flex flex-col w-full max-h-[600px] rounded-2xl border border-[#E5E7EB] bg-white" dir="rtl">
              {/* Scrollable messages area */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoadingGuidanceRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#048F86]" />
                  </div>
                ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
                  <div className="flex flex-col pb-4">
                    {[...guidanceRecords.items].reverse().map((row: GuidanceRecord, index: number) => {
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                      const guidanceStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

                      return (
                        <div key={`guidance-${row.guidance_id}-${index}`} className="flex flex-col gap-0">
                          <div className="px-5 pt-5 pb-3">
                            <div className="flex items-start gap-3" dir="rtl">
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#048F86]">{row.requested_by_name?.charAt(0)?.toUpperCase() || '?'}</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[#1F2937]">{row.requested_by_name || '-'}</span>
                                  <span className="text-[11px] text-[#9CA3AF]">{requestDate}</span>
                                  {row.status && <StatusBadge status={row.status} label={guidanceStatusLabels[row.status] || row.status} />}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">{row.guidance_question || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-5 pb-5 pt-1">
                            {row.guidance_answer ? (
                              <div className="flex items-start gap-3" dir="ltr">
                                <div className="flex-shrink-0">
                                  <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                                    <span className="text-xs font-bold text-[#92400E]">{row.responded_by_name?.charAt(0)?.toUpperCase() || '?'}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {row.responded_by_name && <span className="text-sm font-semibold text-[#1F2937]">{row.responded_by_name}</span>}
                                    {row.responded_at && <span className="text-[11px] text-[#9CA3AF]">{formatTimeAgoArabic(row.responded_at)}</span>}
                                  </div>
                                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                    <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">{row.guidance_answer}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit" dir="ltr">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                                <p className="text-sm text-[#9CA3AF]">لا يوجد رد بعد</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">استشارة المكتب التنفيذي</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات بعد</p>
                  </div>
                )}
              </div>

              {/* Input – hidden when meeting is rejected (scheduling officer cannot ask for guidance) */}
              {meetingStatus !== MeetingStatus.REJECTED && (
                <div className="flex-shrink-0 border-t border-[#F3F4F6] px-5 py-4 bg-[#FAFAFA] rounded-b-2xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!requestGuidanceForm.notes.trim()) return;
                      handleRequestGuidanceSubmit(e);
                    }}
                    className="flex items-end gap-3"
                  >
                    <div className="flex-1">
                      <Textarea
                        value={requestGuidanceForm.notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestGuidanceForm({ notes: e.target.value })}
                        placeholder="اكتب سؤالك هنا..."
                        className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-[#E5E7EB] bg-white resize-none focus:border-[#048F86] focus:ring-[#048F86]/20"
                        rows={1}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (requestGuidanceForm.notes.trim()) {
                              handleRequestGuidanceSubmit(e as any);
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!requestGuidanceForm.notes.trim() || requestGuidanceMutation.isPending}
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#048F86] hover:bg-[#037A72] text-white"
                    >
                      {requestGuidanceMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-180">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* التوجيهات tab – only when meeting is CLOSED */}
          {activeTab === 'directives' && meetingStatus === MeetingStatus.CLOSED && (
            <DirectivesTab meeting={meeting} onAddDirective={() => setIsAddDirectiveOpen(true)} />
          )}

          {/* Tab: توثيق الاجتماع (only when status is SCHEDULED) – uses GET /api/v1/adam-meetings/search/{title} */}
          {activeTab === 'meeting-documentation' && (
            <MeetingDocumentationTab meetingTitle={meeting?.meeting_title ?? undefined} />
          )}

        </div>

        {/* Edit button moved to DetailPageHeader */}

        {/* Centered FAB: tap to show action bubbles in half-circle above */}
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
            hasContent={hasContent}
            hideEdit
          />
        )}
      </div>

      <SubmitterModal callerRole={MeetingOwnerType.SCHEDULING} open={meetingFormOpen} onOpenChange={setMeetingFormOpen} editMeetingId={meeting.id} showAiSuggest />

      {/* Delete draft confirmation (Draft status only) */}
      <Dialog open={isDeleteDraftModalOpen} onOpenChange={(open) => !deleteDraftMutation.isPending && setIsDeleteDraftModalOpen(open)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-gray-200/80 bg-white shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              حذف المسودة
            </DialogTitle>
            <DialogDescription className="text-right text-base text-gray-600 pt-1">
              هل أنت متأكد من حذف هذه المسودة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDraftModalOpen(false)}
              className="min-w-[100px]"
              disabled={deleteDraftMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleDeleteDraftConfirm}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDraftMutation.isPending}
            >
              {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Quality Modal */}
     <QualityModal 
       isOpen={isQualityModalOpen} 
       onOpenChange={setIsQualityModalOpen} 
       meetingId={id || ''}
     />

      {/* Reject Meeting Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
            
            >
              رفض طلب الاجتماع
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                
                >
                  سبب الرفض <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="الطلب غير مناسب للجدولة"
                  className="w-full text-right"
                
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                
                >
                  ملاحظات إضافية
                </label>
                <Textarea
                  value={rejectForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="تفاصيل إضافية حول سبب الرفض"
                  className="w-full min-h-[100px] text-right"
                
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectForm({ reason: '', notes: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!rejectForm.reason.trim() || rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              
              >
                {rejectMutation.isPending ? 'جاري الرفض...' : 'رفض الطلب'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule confirm modal (schedule officer): show details before submitting */}
      <Dialog open={scheduleConfirmModalOpen} onOpenChange={(open) => { setScheduleConfirmModalOpen(open); if (!open) setValidationError(null); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              تأكيد الجدولة
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{validationError}</p>
              </div>
            )}
            {(() => {
              const { start: startSource, end: endSource } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
              const meetingChannel = (meeting?.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel as string)) ? meeting.meeting_channel : scheduleForm.meeting_channel;
              const channelLabels: Record<string, string> = { PHYSICAL: 'حضوري', PHYSICAL_LOCATION_1: 'حضوري - الموقع 1', PHYSICAL_LOCATION_2: 'حضوري - الموقع 2', PHYSICAL_LOCATION_3: 'حضوري - الموقع 3', VIRTUAL: 'عن بُعد', HYBRID: 'مختلط' };
              const formatDt = (s: string) => {
                if (!s) return '—';
                const d = new Date(s);
                if (Number.isNaN(d.getTime())) return '—';
                const datePart = d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric', calendar: 'gregory', numberingSystem: 'latn' });
                const timePart = d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: false, numberingSystem: 'latn' });
                return `${datePart}، ${timePart}`;
              };
              return (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280] font-medium">تاريخ ووقت البداية</span>
                      <span className="text-[#1F2937] font-medium">{formatDt(startSource)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280] font-medium">تاريخ ووقت النهاية</span>
                      <span className="text-[#1F2937] font-medium">{formatDt(endSource)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280] font-medium">قناة الاجتماع</span>
                      <span className="text-[#1F2937] font-medium">{channelLabels[meetingChannel as string] ?? meetingChannel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280] font-medium">مبدئي</span>
                      <span className="text-[#1F2937] font-medium">{!scheduleForm.requires_protocol ? 'نعم' : 'لا'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280] font-medium">البيانات مكتملة</span>
                      <span className="text-[#1F2937] font-medium">{scheduleForm.is_data_complete ? 'نعم' : 'لا'}</span>
                    </div>
                    {scheduleForm.location && (
                      <div className="flex justify-between items-start py-2 border-b border-[#F3F4F6] gap-2">
                        <span className="text-[#6B7280] font-medium flex-shrink-0">الموقع</span>
                        <span className="text-[#1F2937] font-medium text-left break-words">{scheduleForm.location}</span>
                      </div>
                    )}
                    {(scheduleForm.minister_attendees?.length ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6]">
                        <span className="text-[#6B7280] font-medium">مدعوو الوزير</span>
                        <span className="text-[#1F2937] font-medium">{scheduleForm.minister_attendees!.length} مدعو</span>
                      </div>
                    )}
                    {scheduleForm.notes && scheduleForm.notes !== 'Meeting scheduled successfully' && (
                      <div className="flex flex-col gap-1 py-2 border-b border-[#F3F4F6]">
                        <span className="text-[#6B7280] font-medium">ملاحظات</span>
                        <p className="text-[#1F2937] text-sm leading-relaxed whitespace-pre-wrap">{scheduleForm.notes}</p>
                      </div>
                    )}
                    {(meetingChannel === 'VIRTUAL' || meetingChannel === 'HYBRID') && webexMeetingDetails?.join_link && (
                      <div className="flex flex-col gap-1 py-2 border-b border-[#F3F4F6]">
                        <span className="text-[#6B7280] font-medium">رابط Webex</span>
                        <p className="text-[#048F86] text-sm truncate" dir="ltr">{webexMeetingDetails.join_link}</p>
                      </div>
                    )}
                    {(meetingChannel === 'VIRTUAL' || meetingChannel === 'HYBRID') && !webexMeetingDetails && (
                      <div className="flex flex-col gap-3 py-3 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                        <span className="text-[#6B7280] font-medium text-right">رابط Webex</span>
                        {isCreatingWebex ? (
                          <div className="flex items-center gap-2 text-[#374151] text-sm">
                            <div className="w-4 h-4 border-2 border-[#048F86] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            جاري إنشاء اجتماع Webex...
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => createWebexLink()}
                            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#048F86] rounded-lg hover:bg-[#037A72] transition-colors"
                          >
                            إنشاء رابط Webex
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => setScheduleConfirmModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            {(() => {
              const { start: effStart, end: effEnd } = getEffectiveScheduleDates(meeting ?? undefined, scheduleForm);
              const meetingCh = (meeting?.meeting_channel && ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel as string)) ? meeting.meeting_channel : scheduleForm.meeting_channel;
              const canConfirm = !!(effStart && effEnd && ((meetingCh !== 'VIRTUAL' && meetingCh !== 'HYBRID') || webexMeetingDetails));
              return (
                <button
                  type="button"
                  disabled={scheduleMutation.isPending || !canConfirm}
                  onClick={() => {
                    const e = { preventDefault: () => {} } as React.FormEvent;
                    handleScheduleSubmit(e);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#048F86] rounded-lg hover:bg-[#037A72] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scheduleMutation.isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
                </button>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Modal (SCHEDULED meetings only) */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              إلغاء الاجتماع
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCancelSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right">
                  سبب الإلغاء
                </label>
                <Input
                  type="text"
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="سبب إلغاء الاجتماع"
                  className="w-full text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right">
                  ملاحظات إضافية
                </label>
                <Textarea
                  value={cancelForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="تفاصيل إضافية"
                  className="w-full min-h-[100px] text-right"
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelForm({ reason: '', notes: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                تراجع
              </button>
              <button
                type="submit"
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'جاري الإلغاء...' : 'إلغاء الاجتماع'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit confirmation modal */}
      <Dialog open={isEditConfirmOpen} onOpenChange={(open) => {
        if (open) {
          // Run validation when dialog opens so invalid data (e.g. bad mobile) is caught before confirm
          let hasErrors = false;
          if (localInvitees.length > 0 && !validateInvitees()) {
            setValidationError('يرجى تصحيح الأخطاء في المدعوون (مقدم الطلب) — جميع الحقول مطلوبة والبريد والجوال بصيغة صحيحة');
            setActiveTab('attendees');
            hasErrors = true;
          }
          if ((scheduleForm.minister_attendees?.length ?? 0) > 0 && !validateMinisterAttendees()) {
            setValidationError('يرجى تصحيح الأخطاء في المدعوون (الوزير) — جميع الحقول مطلوبة والبريد والجوال بصيغة صحيحة');
            setActiveTab('attendees');
            hasErrors = true;
          }
          if (hasErrors) {
            setIsEditConfirmOpen(false);
            return;
          }
        }
        setIsEditConfirmOpen(open);
        if (!open) {
          setValidationError(null);
          setUpdateErrorMessage(null);
        }
      }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              تأكيد التعديلات
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(validationError || updateErrorMessage) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-right text-sm text-red-600">
                  {updateErrorMessage || validationError}
                </p>
              </div>
            )}
            <p className="text-right text-sm text-[#475467]">
              سيتم إرسال الحقول التالية للتعديل:
            </p>
            <ul className="mt-3 list-disc list-inside text-right text-sm text-gray-700">
              {(() => {
                const PREVIOUS_MEETING_KEYS = ['prev_ext_id', 'group_id', 'prev_ext_original_title', 'prev_ext_meeting_title'];
                const hasPreviousMeetingChange = PREVIOUS_MEETING_KEYS.some((key) => key in changedPayload);
                const otherKeys = Object.keys(changedPayload).filter((k) => !PREVIOUS_MEETING_KEYS.includes(k));
                const keysToShow = otherKeys;
                return (
                  <>
                    {keysToShow.map((k) => (
                      <li key={k}>{fieldLabels[k] || k}</li>
                    ))}
                    {hasPreviousMeetingChange && (
                      <li key="previous_meeting">
                        {fieldLabels.previous_meeting_id || 'الاجتماع السابق'}
                        {formData.previous_meeting_meeting_title && (
                          <span className="text-[#667085]"> — {formData.previous_meeting_meeting_title}</span>
                        )}
                      </li>
                    )}
                  </>
                );
              })()}
              {newPresentationAttachments.length > 0 && (
                <li key="new_presentation_attachments">
                  إضافة عروض تقديمية ({newPresentationAttachments.length} {newPresentationAttachments.length === 1 ? 'ملف' : 'ملفات'})
                  {newPresentationAttachments.length <= 5 ? (
                    <ul className="mt-1 list-[circle] list-inside text-[#667085]">
                      {newPresentationAttachments.map((f, i) => (
                        <li key={i}>{f.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[#667085]"> — {newPresentationAttachments.slice(0, 3).map((f) => f.name).join('، ')} و{newPresentationAttachments.length - 3} ملفات أخرى</span>
                  )}
                </li>
              )}
            </ul>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => setIsEditConfirmOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                // Validate invitees (قائمة المدعوين مقدّم الطلب) whenever there are local invitees
                if (localInvitees.length > 0 && !validateInvitees()) {
                  setValidationError('يرجى تصحيح الأخطاء في المدعوون (مقدم الطلب) — جميع الحقول مطلوبة والبريد والجوال بصيغة صحيحة');
                  setIsEditConfirmOpen(false);
                  setActiveTab('attendees');
                  return;
                }
                // Validate minister attendees (قائمة المدعوين الوزير) whenever any exist
                if ((scheduleForm.minister_attendees?.length ?? 0) > 0 && !validateMinisterAttendees()) {
                  setValidationError('يرجى تصحيح الأخطاء في المدعوون (الوزير) — جميع الحقول مطلوبة والبريد والجوال بصيغة صحيحة');
                  setIsEditConfirmOpen(false);
                  setActiveTab('attendees');
                  return;
                }
                setValidationError(null);
                setInviteeValidationErrors({});
                setMinisterAttendeeValidationErrors({});
                const hasPresentationFiles = newPresentationAttachments.length > 0;
                // Build payload at click time so agenda_items uses latest contentForm (avoids stale closure)
                const payload = { ...changedPayload };
                const agendaChanged =
                  JSON.stringify(contentForm.agendaItems ?? []) !==
                  JSON.stringify(originalSnapshot?.contentForm?.agendaItems ?? []);
                if (agendaChanged) {
                  const filtered = contentForm.agendaItems.filter((item) => (item.agenda_item ?? '').trim().length > 0);
                  payload.agenda_items = filtered.map((item) => {
                    return {
                      agenda_item: (item.agenda_item ?? '').trim(),
                      presentation_duration_minutes: item.presentation_duration_minutes,
                      minister_support_type: item.minister_support_type ?? '',
                      minister_support_other: item?.minister_support_other ,
                    };
                  });
                }
                updateMutation.mutate({
                  payload,
                  presentationFiles: hasPresentationFiles ? newPresentationAttachments : undefined,
                });
              }}
                disabled={!hasChanges || updateMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#048F86] text-white hover:bg-[#047a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add related directive – POST /api/scheduling/directives */}
      <Dialog
        open={isAddDirectiveOpen}
        onOpenChange={(open) => {
          setIsAddDirectiveOpen(open);
          if (open && id) setAddDirectiveForm((p) => ({ ...p, related_meeting: id }));
          if (!open) setAddDirectiveForm({ directive_date: '', directive_text: '', related_meeting: '', deadline: '', responsible_persons: '' });
        }}
      >
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              إضافة توجيه مرتبط
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 text-right">تاريخ التوجيه</label>
              <FormDateTimePicker
                value={addDirectiveForm.directive_date || undefined}
                onChange={(isoString) => setAddDirectiveForm((p) => ({ ...p, directive_date: isoString || '' }))}
                placeholder="اختر تاريخ ووقت التوجيه"
                className="w-full"
                fullWidth
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 text-right">نص التوجيه</label>
              <Textarea
                value={addDirectiveForm.directive_text}
                onChange={(e) => setAddDirectiveForm((p) => ({ ...p, directive_text: e.target.value }))}
                placeholder="أدخل نص التوجيه..."
                className="w-full min-h-[80px] text-right"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 text-right">الموعد النهائي</label>
              <FormDateTimePicker
                value={addDirectiveForm.deadline || undefined}
                onChange={(isoString) => setAddDirectiveForm((p) => ({ ...p, deadline: isoString || '' }))}
                placeholder="اختر الموعد النهائي"
                className="w-full"
                fullWidth
                minDate={addDirectiveDeadlineMinDate}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 text-right">المسؤولون (مفصولون بفاصلة أو سطر جديد)</label>
              <Textarea
                value={addDirectiveForm.responsible_persons}
                onChange={(e) => setAddDirectiveForm((p) => ({ ...p, responsible_persons: e.target.value }))}
                placeholder="أدخل أسماء المسؤولين..."
                className="w-full min-h-[60px] text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddDirectiveOpen(false);
                setAddDirectiveForm({ directive_date: '', directive_text: '', related_meeting: '', deadline: '', responsible_persons: '' });
              }}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors"
            
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                const meetingId = id || addDirectiveForm.related_meeting;
                if (!meetingId || !addDirectiveForm.directive_text.trim()) return;
                const directiveDate = addDirectiveForm.directive_date ? toISOStringWithTimezone(new Date(addDirectiveForm.directive_date)) : toISOStringWithTimezone(new Date());
                const deadlineMs = addDirectiveForm.deadline ? new Date(addDirectiveForm.deadline).getTime() : NaN;
                if (addDirectiveForm.deadline && (Number.isNaN(deadlineMs) || deadlineMs < addDirectiveDeadlineMinDate.getTime())) return;
                const deadline = addDirectiveForm.deadline ? toISOStringWithTimezone(new Date(addDirectiveForm.deadline)) : toISOStringWithTimezone(new Date());
                const persons = addDirectiveForm.responsible_persons
                  .split(/[\n,،]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                addDirectiveMutation.mutate({
                  directive_date: directiveDate,
                  directive_text: addDirectiveForm.directive_text.trim(),
                  related_meeting: meetingId,
                  deadline,
                  responsible_persons: persons,
                });
              }}
              disabled={!addDirectiveForm.directive_text.trim() || !addDirectiveForm.directive_date || !addDirectiveForm.deadline || addDirectiveMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#048F86] text-white hover:bg-[#047a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            
            >
              {addDirectiveMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Content – Drawer */}
      {/* مجدول - الجدولة (SCHEDULED_SCHEDULING): POST /api/meeting-requests/{id}/send-to-content-scheduled (no draft) */}
      <Drawer
        open={isSendToContentModalOpen}
        onOpenChange={setIsSendToContentModalOpen}
        title={<span className="text-right">إرسال للمحتوى</span>}
        side="left"
        width={500}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsSendToContentModalOpen(false); setSendToContentForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
            {meeting?.status !== MeetingStatus.SCHEDULED_SCHEDULING && (
              <button type="button" onClick={handleSendToContentDraft} disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            )}
            <button type="submit" form="send-to-content-form" disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}</button>
          </div>
        }
      >
        <form id="send-to-content-form" onSubmit={handleSendToContentSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right">
                  ملاحظات
                </label>
                <Textarea
              value={sendToContentForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendToContentForm({ notes: e.target.value })}
              placeholder="يرجى مراجعة المحتوى قبل الجدولة"
                  className="w-full min-h-[100px] text-right"
            
                />
              </div>
          </form>
      </Drawer>

      <AttachmentPreviewDrawer
        open={!!previewAttachment}
        onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}
        attachment={previewAttachment}
      />

      {/* Request Guidance – now inline in chat, drawer removed */}

      {/* Scheduling Consultation – now inline in chat, drawer removed */}

      {/* Approve Update – Drawer (مجدول - الجدولة → مجدول) */}
      <Drawer
        open={isApproveUpdateModalOpen}
        onOpenChange={(open) => {
          if (!open) setApproveUpdateForm({ notes: '' });
          setIsApproveUpdateModalOpen(open);
        }}
        title={<span className="text-right">إعتماد التحديث</span>}
        side="left"
        width={500}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsApproveUpdateModalOpen(false); setApproveUpdateForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
            <button type="submit" form="approve-update-form" disabled={approveUpdateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{approveUpdateMutation.isPending ? 'جاري الإرسال...' : 'إعتماد التحديث'}</button>
          </div>
        }
      >
        <form id="approve-update-form" onSubmit={handleApproveUpdateSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right">ملاحظات (اختياري)</label>
            <Textarea
              value={approveUpdateForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApproveUpdateForm({ notes: e.target.value })}
              placeholder="تم اعتماد التحديث"
              className="w-full min-h-[100px] text-right"
            />
          </div>
        </form>
      </Drawer>

      {/* Return for Info – Drawer (notes + editable_fields for POST return-for-info) */}
      <Drawer
        open={isReturnForInfoModalOpen}
        onOpenChange={(open) => {
          setIsReturnForInfoModalOpen(open);
          if (!open) setReturnForInfoNotesError(null);
        }}
        title={<span className="text-right">إعادة للطلب</span>}
        side="left"
        width={500}
        // bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => setIsReturnForInfoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
            <button type="submit" form="return-for-info-form" disabled={returnForInfoMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{returnForInfoMutation.isPending ? 'جاري الإرسال...' : 'إعادة للطلب'}</button>
          </div>
        }
      >
        <form id="return-for-info-form" onSubmit={handleReturnForInfoSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right">
              ملاحظات <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={returnForInfoForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setReturnForInfoForm((p) => ({ ...p, notes: e.target.value }));
                if (returnForInfoNotesError) setReturnForInfoNotesError(null);
              }}
              placeholder="يرجى توفير معلومات إضافية حول الموضوع"
              className={`w-full min-h-[100px] text-right ${returnForInfoNotesError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              aria-invalid={!!returnForInfoNotesError}
              aria-describedby={returnForInfoNotesError ? 'return-for-info-notes-error' : undefined}
            />
            {returnForInfoNotesError && (
              <p id="return-for-info-notes-error" className="text-sm text-red-500 text-right">
                {returnForInfoNotesError}
              </p>
            )}
          </div>
        </form>
      </Drawer>

      {/* Schedule Meeting – Drawer (hidden for schedule officer; they use the Schedule tab and Submit) */}
      {!isScheduleOfficer && (
      <Drawer
        open={isScheduleModalOpen}
        onOpenChange={(open: boolean) => {
          setIsScheduleModalOpen(open);
          if (!open) {
            setValidationError(null);
            setWebexMeetingDetails(null);
          }
        }}
        title={<span className="text-right">جدولة الاجتماع</span>}
        side="left"
        width={700}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            {scheduleMutation.isSuccess && webexMeetingDetails ? (
              <button
                type="button"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setScheduleForm({
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
                    minister_attendees: [],
                  });
                  setWebexMeetingDetails(null);
                  navigate(-1);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity"
              >
                تم
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setScheduleForm({
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
                      minister_attendees: [],
                    });
                    setWebexMeetingDetails(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                  form="schedule-meeting-form"
                  disabled={
                    !scheduleForm.scheduled_at ||
                    !scheduleForm.scheduled_end_at ||
                    scheduleMutation.isPending ||
                    isCreatingWebex ||
                    ((scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID') && !webexMeetingDetails)
                  }
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isCreatingWebex ? 'جاري إنشاء اجتماع Webex...' : scheduleMutation.isPending ? 'جاري التحميل...' : 'جدولة'}
              </button>
              </>
            )}
          </div>
        }
      >
        <form id="schedule-meeting-form" onSubmit={handleScheduleSubmit} className="flex flex-col gap-6">
              {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-right text-sm text-red-600">
                    {validationError}
                  </p>
                </div>
              )}
              {scheduleMutation.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-right text-sm text-green-600">
                    تم جدولة الاجتماع بنجاح
                  </p>
                </div>
              )}

          {/* Scheduled Date/Time – Start and End */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#344054] text-right">
                تاريخ ووقت البداية <span className="text-red-500">*</span>
              </label>
                <DateTimePicker
                  value={scheduleForm.scheduled_at ? (scheduleForm.scheduled_at.includes('T') && !scheduleForm.scheduled_at.includes('Z') ? new Date(scheduleForm.scheduled_at).toISOString() : scheduleForm.scheduled_at) : undefined}
                  onChange={(isoString) => {
                      const date = new Date(isoString);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
                      setScheduleForm((prev) => {
                        const next = { ...prev, scheduled_at: datetimeLocal };
                        if (!prev.scheduled_end_at || new Date(prev.scheduled_end_at).getTime() < date.getTime()) {
                          const endDefault = new Date(date.getTime() + 60 * 60 * 1000);
                          const endYear = endDefault.getFullYear();
                          const endMonth = String(endDefault.getMonth() + 1).padStart(2, '0');
                          const endDay = String(endDefault.getDate()).padStart(2, '0');
                          const endHours = String(endDefault.getHours()).padStart(2, '0');
                          const endMinutes = String(endDefault.getMinutes()).padStart(2, '0');
                          next.scheduled_end_at = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
                        }
                        return next;
                      });
                    }}
                    placeholder="اختر تاريخ ووقت البداية"
                  className="w-full"
                  required
                  minDate={(() => {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    return d;
                  })()}
                />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#344054] text-right">
                تاريخ ووقت النهاية <span className="text-red-500">*</span>
              </label>
                  <DateTimePicker
                    value={scheduleForm.scheduled_end_at ? (scheduleForm.scheduled_end_at.includes('T') && !scheduleForm.scheduled_end_at.includes('Z') ? new Date(scheduleForm.scheduled_end_at).toISOString() : scheduleForm.scheduled_end_at) : undefined}
                    onChange={(isoString) => {
                      const date = new Date(isoString);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
                      setScheduleForm((prev) => ({ ...prev, scheduled_end_at: datetimeLocal }));
                    }}
                    placeholder="اختر تاريخ ووقت النهاية"
                    className="w-full"
                    required
                    minDate={scheduleForm.scheduled_at ? (() => {
                      const d = new Date(scheduleForm.scheduled_at);
                      d.setSeconds(0, 0);
                      return d;
                    })() : undefined}
                  />
            </div>
          </div>

          {/* Meeting Channel */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[#344054] text-right">
              قناة الاجتماع <span className="text-red-500">*</span>
            </label>
            <Select
                  value={scheduleForm.meeting_channel}
                    onValueChange={(value) => {
                    setScheduleForm((prev) => ({ ...prev, meeting_channel: value as typeof prev.meeting_channel }));
                    // Clear Webex details when channel changes to non-remote
                    if (value !== 'VIRTUAL' && value !== 'HYBRID') {
                      setWebexMeetingDetails(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-11 bg-white border border-[#D0D5DD] rounded-lg text-right flex-row-reverse">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="PHYSICAL">حضوري</SelectItem>
                    <SelectItem value="PHYSICAL_LOCATION_1">حضوري - الموقع 1</SelectItem>
                    <SelectItem value="PHYSICAL_LOCATION_2">حضوري - الموقع 2</SelectItem>
                    <SelectItem value="PHYSICAL_LOCATION_3">حضوري - الموقع 3</SelectItem>
                    <SelectItem value="VIRTUAL">عن بُعد</SelectItem>
                    <SelectItem value="HYBRID">مختلط</SelectItem>
                  </SelectContent>
                </Select>
          </div>

          {/* Webex Meeting Loading - Show when creating (VIRTUAL or HYBRID) */}
              {(scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID') && isCreatingWebex && (
                <div className="flex flex-col gap-2 p-4 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#048F86] border-t-transparent rounded-full animate-spin"></div>
                    <label className="text-sm font-medium text-gray-700 text-right">
                      جاري إنشاء اجتماع Webex...
                    </label>
                  </div>
                </div>
              )}

              {/* Webex Meeting Details - Show when VIRTUAL or HYBRID channel and details are available */}
              {(scheduleForm.meeting_channel === 'VIRTUAL' || scheduleForm.meeting_channel === 'HYBRID') && webexMeetingDetails && !isCreatingWebex && (
                <div className="flex flex-col gap-4 p-4 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD]"></div>
                    <label className="text-sm font-semibold text-gray-700 text-right">
                      تفاصيل اجتماع Webex
                    </label>
                  </div>
                  
                  {/* Join Link */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-600 text-right">
                      رابط الانضمام
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={webexMeetingDetails.join_link}
                        readOnly
                        className="flex-1 h-9 bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700"
                      
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(webexMeetingDetails.join_link);
                        }}
                        className="px-3 py-1.5 text-xs bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg hover:opacity-90 transition-opacity"
                      
                      >
                        نسخ
                      </button>
                    </div>
                  </div>

                  {/* Meeting Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right">
                        رقم الاجتماع
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700">
                        {webexMeetingDetails.meeting_number}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right">
                        كلمة المرور
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700">
                        {webexMeetingDetails.password}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right">
                        عنوان SIP
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700">
                        {webexMeetingDetails.sip_address}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right">
                        مفتاح المضيف
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700">
                        {webexMeetingDetails.host_key}
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* مبدئي + Protocol Type + Data Complete */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-4">
            <FormField label="مبدئي" className="w-full max-w-none h-auto">
              <FormSwitch
                checked={!scheduleForm.requires_protocol}
                onCheckedChange={(checked) => setScheduleForm((prev) => ({ ...prev, requires_protocol: !checked }))}
              />
            </FormField>

            <FormField label="البيانات مكتملة" className="w-full max-w-none h-auto">
              <FormSwitch
                checked={scheduleForm.is_data_complete}
                onCheckedChange={(checked) => setScheduleForm((prev) => ({ ...prev, is_data_complete: checked }))}
              />
            </FormField>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <FormTextArea
              label="ملاحظات"
              value={scheduleForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Meeting scheduled successfully"
              containerClassName="!px-0 !mx-0"
              fullWidth={false}
            />
          </div>
          </form>
      </Drawer>
      )}

      {/* Delete minister attendee confirmation modal */}
      <Dialog
        open={deleteAttendeeIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAttendeeIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-[400px]" dir="rtl">
          <DialogHeader className="items-end">
            <DialogTitle
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '26px',
                color: '#101828',
              }}
            >
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 mb-4">
            <p
              className="text-right text-sm text-[#475467]"
            >
              هل أنت متأكد من حذف هذا الحضور من قائمة الحضور من جهة الوزير؟
            </p>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => setDeleteAttendeeIndex(null)}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteAttendeeIndex !== null) {
                  removeMinisterAttendee(deleteAttendeeIndex);
                }
                setDeleteAttendeeIndex(null);
              }}
              className="px-4 py-2 rounded-lg bg-[#CA4545] text-white hover:bg-[#B63D3D] transition-colors"
            >
              حذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invitee Confirmation Modal */}
      <Dialog
        open={deleteInviteeId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteInviteeId(null);
          }
        }}
      >
        <DialogContent className="max-w-[400px]" dir="rtl">
          <DialogHeader className="items-end">
            <DialogTitle
              style={{
                fontFamily: "'Almarai', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '26px',
                color: '#101828',
              }}
            >
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 mb-4">
            <p
              className="text-right text-sm text-[#475467]"
            >
              هل أنت متأكد من حذف هذا المدعو من قائمة المدعوين؟
            </p>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => setDeleteInviteeId(null)}
              className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDeleteInvitee}
              className="px-4 py-2 rounded-lg bg-[#CA4545] text-white hover:bg-[#B63D3D] transition-colors"
            >
              حذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default MeetingDetail;