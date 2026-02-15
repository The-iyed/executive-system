import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, X, Send, FileCheck, ClipboardCheck, RotateCcw, Calendar, CalendarMinus, Plus, Pencil, Trash2, Download, Eye, GitCompare, HelpCircle, Clock, Zap } from 'lucide-react';
import pdfIcon from '../../shared/assets/pdf.svg';
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
  MeetingConfidentialityLabels,
  MeetingChannelLabels,
  StatusBadge,
  DataTable,
  Tabs,
  type TableColumn,
  AIGenerateButton,
  FormAsyncSelectV2,
  FormDatePicker,
  type OptionType,
  Drawer,
} from '@shared'; 
import {
  getMeetingById,
  getMeetings,
  searchMeetings,
  rejectMeeting,
  sendToContent,
  requestGuidance,
  getConsultants,
  type ConsultantUser,
  requestSchedulingConsultation,
  returnMeetingForInfo,
  scheduleMeeting,
  rescheduleMeeting,
  createWebexMeeting,
  type MinisterAttendee,
  getConsultationRecords,
  type ConsultationRecord,
  getGuidanceRecords,
  type GuidanceRecord,
  getContentOfficerNotesRecords,
  type ContentOfficerNoteRecord,
  type GeneralNoteItem,
  moveToWaitingList,
} from '../data/meetingsApi';
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
  DialogFooter,
  Textarea,
  DateTimePicker,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@sanad-ai/ui';
import { updateMeetingRequest, updateMeetingRequestWithAttachments, runCompareByAttachment, type ComparePresentationsResponse } from '../data/meetingsApi';
import QualityModal from '../components/qualityModal';
import { MinisterCalendarView, SuggestAttendeesModal } from '../components';
import { type CalendarEventData } from '@shared';
import { type SuggestedAttendee } from '../hooks/useSuggestMeetingAttendees';

// Field labels mapping for edit confirmation modal
const fieldLabels: Record<string, string> = {
  meeting_type: 'نوع الاجتماع',
  meeting_title: 'عنوان الاجتماع',
  meeting_subject: 'موضوع الاجتماع',
  meeting_classification: 'تصنيف الاجتماع',
  meeting_owner: 'مالك الاجتماع',
  is_on_behalf_of: 'هل تطلب الاجتماع نيابة عن غيرك؟',
  is_sequential: 'اجتماع متسلسل؟',
  previous_meeting_id: 'الاجتماع السابق',
  is_based_on_directive: 'هل طلب الاجتماع بناءً على توجيه من معالي الوزير',
  directive_method: 'طريقة التوجيه',
  previous_meeting_minutes_id: 'محضر الاجتماع',
  related_guidance: 'التوجيه',
  objectives: 'الأهداف',
  agenda_items: 'بنود جدول أعمال الاجتماع',
  meeting_channel: 'آلية انعقاد الاجتماع',
  requires_protocol: 'يتطلب بروتوكول',
  protocol_type: 'نوع البروتوكول',
  is_data_complete: 'اكتمال البيانات',
  selected_time_slot_id: 'الموعد المحدد',
  minister_attendees: 'حضور الوزير',
  invitees: 'المدعوون',
  deleted_attachment_ids: 'حذف المرفقات',
  sector: 'القطاع',
  meeting_justification: 'السبب',
  meeting_classification_type: 'فئة الاجتماع',
  related_topic: 'موضوع التكليف المرتبط',
  deadline: 'تاريخ الاستحقاق',
  meeting_confidentiality: 'سريّة الاجتماع',
  general_notes: 'ملاحظات',
};

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
}> {
  return (list || []).map((a) => ({
    username: a.username ?? '',
    external_name: a.external_name ?? '',
    external_email: a.external_email ?? '',
    is_required: a.is_required ?? false,
    justification: a.justification ?? '',
    access_permission: a.access_permission ?? 'FULL',
    position: a.position ?? '',
    phone: a.phone ?? '',
    attendance_channel: (a.attendance_channel ?? 'PHYSICAL') as 'PHYSICAL' | 'REMOTE',
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

/** Field keys sent as editable_fields to return-for-info API (same order as in form) */
const EDITABLE_FIELD_IDS = Object.keys(fieldLabels) as string[];

const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
] as const;

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

function ActionBubble({
  icon,
  label,
  onClick,
  disabled,
  variant,
  disabledReason,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
  /** Shown as tooltip when disabled (explains why the action is disabled) */
  disabledReason?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-end gap-2 rtl:flex-row-reverse rtl:justify-start w-full touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-1 pr-1 pl-0"
    >
      <span
        className="min-w-[11rem] text-end text-sm font-medium text-gray-800 whitespace-nowrap rounded-lg px-2 py-1 bg-white/90 shadow-sm border border-gray-200/80"
        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
      >
        {label}
      </span>
      <span
        className={`flex items-center justify-center w-11 h-11 rounded-full shadow-md border flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 ${
          variant === 'danger'
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-white border-gray-200/80 text-gray-800'
        }`}
      >
        {icon}
      </span>
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex w-full min-w-0">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
            {disabledReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

  // Fetch meeting data from API
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  const generalNotesList = React.useMemo(
    () => getGeneralNotesList(meeting?.general_notes),
    [meeting?.general_notes]
  );

  // Fetch consultation records (استشارة الجدولة tab)
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === 'scheduling-consultation',
  });

  // Fetch guidance records (التوجيه tab)
  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', id],
    queryFn: () => getGuidanceRecords(id!),
    enabled: !!id && activeTab === 'directive',
  });

  // Fetch content officer notes records (استشارة المحتوى tab)
  // Only fetch when tab is active to prevent unnecessary data loading
  const { data: contentOfficerNotesRecordsRaw, isLoading: isLoadingContentOfficerNotes } = useQuery({
    queryKey: ['content-officer-notes-records', id],
    queryFn: () => getContentOfficerNotesRecords(id!, { skip: 0, limit: 100 }),
    enabled: !!id && activeTab === 'content-consultation',
    // Don't keep previous data when disabled to prevent rendering stale objects
    placeholderData: undefined,
  });

  // Clear query cache when tab is not active to prevent stale data
  // Note: queryClient is declared later in the component, so we'll move this effect there

  // Only expose data when tab is actually active - this prevents stale data from being accessed
  // Use useMemo to ensure we never access the data when tab is not active
  const contentOfficerNotesRecords = React.useMemo(() => {
    if (activeTab !== 'content-consultation') {
      return undefined;
    }
    return contentOfficerNotesRecordsRaw;
  }, [activeTab, contentOfficerNotesRecordsRaw]);

  const contentOfficerNotesTableData = React.useMemo(() => {
    if (!contentOfficerNotesRecords?.items?.length) return [];
    return contentOfficerNotesRecords.items
      .filter((item: any) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item: any) => {
        const safeString = (v: any, f: string = '') => (v == null || typeof v === 'object' ? f : typeof v === 'string' ? v : String(v));
        const safeNoteQuestion = (v: any): string | null => (v == null || typeof v === 'object' ? null : typeof v === 'string' ? v : String(v));
        const getSafeValue = (v: any, f: any = null) => (v == null || typeof v === 'object' ? f : v);
        return {
          id: safeString(getSafeValue(item.id, item.note_id), ''),
          note_question: safeNoteQuestion(getSafeValue(item.note_question, item.text)),
          note_answer: safeString(getSafeValue(item.note_answer, item.text), ''),
          author_name: safeString(getSafeValue(item.author_name), ''),
          created_at: safeString(getSafeValue(item.created_at), ''),
          updated_at: safeString(getSafeValue(item.updated_at), ''),
        } as ContentOfficerNoteRecord;
      });
  }, [contentOfficerNotesRecords]);

  // Form state
  const [formData, setFormData] = useState({
    meeting_type: '',
    meeting_title: '',
    meeting_classification: '',
    meeting_subject: '',
    meeting_owner: '',
    is_on_behalf_of: false,
    is_sequential: false,
    previous_meeting_id: null as string | null,
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
  });
  /** Selected option for "الاجتماع السابق" async select (value + label) */
  const [previousMeetingOption, setPreviousMeetingOption] = useState<OptionType | null>(null);
  /** Selected option for "محضر الاجتماع" async select */
  const [previousMeetingMinutesOption, setPreviousMeetingMinutesOption] = useState<OptionType | null>(null);

  // Fetch previous meeting when الاجتماع السابق is selected (for الرقم التسلسلي = previous + 1)
  const previousMeetingId = (meeting?.previous_meeting_id || formData.previous_meeting_id || null) as string | null;
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

  // Scheduling consultation modal state
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    consultant_user_id: '',
    consultation_question: '',
    search: '',
  });

  // Return for info modal state (editable_fields: which fields submitter can edit)
  const [isReturnForInfoModalOpen, setIsReturnForInfoModalOpen] = useState(false);
  const [returnForInfoForm, setReturnForInfoForm] = useState<{
    notes: string;
    editable_fields: Record<string, boolean>;
  }>({
    notes: '',
    editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>),
  });

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCreatingWebex, setIsCreatingWebex] = useState(false);
  const [webexMeetingDetails, setWebexMeetingDetails] = useState<{
    join_link: string;
    meeting_number: string;
    password: string;
    sip_address: string;
    host_key: string;
  } | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
    meeting_channel: 'PHYSICAL' as 'PHYSICAL' | 'PHYSICAL_LOCATION_1' | 'PHYSICAL_LOCATION_2' | 'PHYSICAL_LOCATION_3' | 'VIRTUAL' | 'HYBRID',
    requires_protocol: false,
    protocol_type: null as string | null,
    protocol_type_text: '',
    is_data_complete: true,
    notes: '',
    location: '',
    selected_time_slot_id: null as string | null,
    minister_attendees: [] as MinisterAttendee[],
  });

  // Content tab form state (objectives and agenda items)
  const [contentForm, setContentForm] = useState<{
    objectives: Array<{ id: string; objective: string }>;
    agendaItems: Array<{ id: string; agenda_item: string; presentation_duration_minutes?: number }>;
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
  
  // Delete invitee confirmation modal state
  const [deleteInviteeId, setDeleteInviteeId] = useState<string | null>(null);

  // Minister Calendar Modal state
  const [isMinisterCalendarOpen, setIsMinisterCalendarOpen] = useState(false);

  // Compare presentations modal (تقييم الاختلاف بين العروض)
  const [isComparePresentationsModalOpen, setIsComparePresentationsModalOpen] = useState(false);
  const [comparePresentationsResult, setComparePresentationsResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareErrorDetail, setCompareErrorDetail] = useState<string | null>(null);

  // Handle invitee deletion
  const handleDeleteInvitee = () => {
    if (deleteInviteeId) {
      setLocalInvitees((prev) => prev.filter((inv) => inv.id !== deleteInviteeId));
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
    phone?: string;
    attendance_channel?: AttendanceChannel;
    access_permission?: boolean;
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
      phone: '',
      attendance_channel: 'PHYSICAL' as AttendanceChannel,
      access_permission: false,
    };
    setLocalInvitees((prev) => [...prev, newInvitee]);
  };

  // Update local invitee (clear validation error for this field when user edits)
  const updateLocalInvitee = (inviteeId: string, field: string, value: string | boolean | AttendanceChannel) => {
    setLocalInvitees((prev) =>
      prev.map((inv) => (inv.id === inviteeId ? { ...inv, [field]: value } : inv))
    );
    setInviteeValidationErrors((prev) => {
      const row = prev[inviteeId];
      if (!row || !(field in row)) return prev;
      const nextRow = { ...row };
      delete (nextRow as any)[field];
      if (Object.keys(nextRow).length === 0) {
        const { [inviteeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [inviteeId]: nextRow };
    });
  };

  // Get combined invitees (API + local) with UI fields
  const allInvitees = React.useMemo(() => {
    const apiInvitees = (meeting?.invitees || []).map((inv) => ({
      ...inv,
      isLocal: false,
      position: (inv as any).position ?? '',
      phone: (inv as any).phone ?? '',
      attendance_channel: ((inv as any).attendance_channel as AttendanceChannel) || 'PHYSICAL',
      access_permission: (inv as any).access_permission ?? false,
    }));
    const localInviteesMapped = localInvitees.map((inv) => ({
      id: inv.id,
      user_id: null,
      external_email: inv.external_email || null,
      external_name: inv.external_name || null,
      is_required: inv.is_required,
      response_status: '',
      attendee_source: '',
      justification: null,
      access_permission: inv.access_permission ?? false,
      isLocal: true,
      position: inv.position ?? '',
      phone: inv.phone ?? '',
      attendance_channel: inv.attendance_channel ?? 'PHYSICAL',
    }));
    return [...apiInvitees, ...localInviteesMapped];
  }, [meeting?.invitees, localInvitees]);

  // Create highlighted event for the calendar from selected time slot
  const highlightedEvents = React.useMemo(() => {
    if (!scheduleForm.selected_time_slot_id || !meeting) return [];
    
    // Find the slot object
    let selectedSlot = null;
    const allSlots = [
      meeting.alternative_time_slot_1,
      meeting.alternative_time_slot_2,
      meeting.selected_time_slot
    ];
    
    for (const s of allSlots) {
      if (s?.id === scheduleForm.selected_time_slot_id) {
        selectedSlot = s;
        break;
      }
    }
    
    if (!selectedSlot || !selectedSlot.slot_start) return [];
    
    const startDate = new Date(selectedSlot.slot_start);
    const endDate = selectedSlot.slot_end ? new Date(selectedSlot.slot_end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatTimeToSlot = (date: Date): string => {
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    };
    
    const formatExactTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return [{
      id: 'highlighted-slot',
      type: 'optional', // Uses the highlighted amber style
      label: `الموعد المختار (${formatExactTime(startDate)})`,
      startTime: formatTimeToSlot(startDate),
      endTime: formatTimeToSlot(endDate),
      date: startDate,
      title: 'موعد هذا الاجتماع',
      is_available: false,
      is_selected: true,
      exactStartTime: formatExactTime(startDate),
      exactEndTime: formatExactTime(endDate),
    }] as CalendarEventData[];
  }, [scheduleForm.selected_time_slot_id, meeting]);

  // Extract the date of the selected slot to open the calendar at the correct week
  const selectedSlotDate = React.useMemo(() => {
    if (highlightedEvents.length > 0) {
      return highlightedEvents[0].date;
    }
    return undefined;
  }, [highlightedEvents]);


  const queryClient = useQueryClient();
  
  // Clear content officer notes query cache when tab is not active to prevent stale data
  React.useEffect(() => {
    if (activeTab !== 'content-consultation') {
      queryClient.removeQueries({ queryKey: ['content-officer-notes-records', id] });
    }
  }, [activeTab, id, queryClient]);
  
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [actionsBarOpen, setActionsBarOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);
  /** Validation errors per local invitee id (قائمة المدعوين مقدّم الطلب) */
  const [inviteeValidationErrors, setInviteeValidationErrors] = useState<Record<string, Partial<Record<'external_name' | 'external_email' | 'position' | 'phone', string>>>>({});
  /** Validation errors per minister attendee index (قائمة المدعوين الوزير) */
  const [ministerAttendeeValidationErrors, setMinisterAttendeeValidationErrors] = useState<Record<number, Partial<Record<'external_name' | 'external_email' | 'position' | 'phone' | 'justification', string>>>>({});

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
    if ((formData.previous_meeting_id || null) !== (originalSnapshot.formData.previous_meeting_id || null)) payload.previous_meeting_id = formData.previous_meeting_id || null;
    if (formData.is_based_on_directive !== originalSnapshot.formData.is_based_on_directive) payload.is_based_on_directive = formData.is_based_on_directive;
    if ((formData.directive_method || '') !== (originalSnapshot.formData.directive_method || '')) payload.directive_method = formData.directive_method || null;
    if ((formData.previous_meeting_minutes_id || '') !== (originalSnapshot.formData.previous_meeting_minutes_id || '')) payload.previous_meeting_minutes_id = formData.previous_meeting_minutes_id || null;
    if ((formData.related_guidance || '') !== (originalSnapshot.formData.related_guidance || '')) payload.related_guidance = formData.related_guidance || null;
    if (formData.is_on_behalf_of !== originalSnapshot.formData.is_on_behalf_of) payload.is_on_behalf_of = formData.is_on_behalf_of;
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
      payload.agenda_items = contentForm.agendaItems
        .filter((item) => item.agenda_item.trim().length > 0)
        .map((item) => ({
          agenda_item: item.agenda_item.trim(),
          presentation_duration_minutes: item.presentation_duration_minutes,
        }));
    }

    // scheduleForm comparisons against snapshot (meeting_channel = آلية انعقاد الاجتماع enum)
    if ((scheduleForm.meeting_channel || '') !== (originalSnapshot.scheduleForm.meeting_channel || '')) payload.meeting_channel = scheduleForm.meeting_channel;
    if ((scheduleForm.requires_protocol ?? false) !== (originalSnapshot.scheduleForm.requires_protocol ?? false)) payload.requires_protocol = scheduleForm.requires_protocol;
    if ((scheduleForm.protocol_type_text || '') !== (originalSnapshot.scheduleForm.protocol_type_text || '')) payload.protocol_type = scheduleForm.protocol_type_text;
    if ((scheduleForm.is_data_complete ?? true) !== (originalSnapshot.scheduleForm.is_data_complete ?? true)) payload.is_data_complete = scheduleForm.is_data_complete;
    if ((scheduleForm.selected_time_slot_id || null) !== (originalSnapshot.scheduleForm.selected_time_slot_id || null)) payload.selected_time_slot_id = scheduleForm.selected_time_slot_id;

    // minister attendees (قائمة المدعوين الوزير) – all fields required in payload
    if (JSON.stringify(scheduleForm.minister_attendees || []) !== JSON.stringify(originalSnapshot.scheduleForm.minister_attendees || [])) {
      payload.minister_attendees = normalizeMinisterAttendees(scheduleForm.minister_attendees);
    }
    // invitees (قائمة المدعوين مقدّم الطلب) – full list in API shape when changed
    if (JSON.stringify(localInvitees || []) !== JSON.stringify(originalSnapshot.localInvitees || [])) {
      const existingInvitees = (meeting?.invitees || []).map((inv: any) => ({
        id: inv.id,
        user_id: inv.user_id ?? null,
        external_email: inv.external_email ?? null,
        external_name: inv.external_name ?? null,
        position: inv.position ?? null,
        mobile: inv.mobile ?? inv.phone ?? null,
        item_number: inv.item_number,
        attendance_mechanism: inv.attendance_mechanism ?? inv.attendance_channel ?? null,
        is_required: inv.is_required ?? false,
        response_status: inv.response_status ?? null,
        attendee_source: inv.attendee_source ?? null,
        justification: inv.justification ?? null,
        access_permission: inv.access_permission ?? null,
      }));
      const newInvitees = localInvitees.map((i, idx) => ({
        id: i.id,
        user_id: null,
        external_email: i.external_email || null,
        external_name: i.external_name || null,
        position: i.position || null,
        mobile: i.phone || null,
        item_number: idx + 1,
        attendance_mechanism: i.attendance_channel ?? null,
        is_required: i.is_required,
        response_status: null,
        attendee_source: null,
        justification: null,
        access_permission: i.access_permission != null ? String(i.access_permission) : null,
      }));
      payload.invitees = [...existingInvitees, ...newInvitees];
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

  /** Validate local invitees (قائمة المدعوين مقدّم الطلب): all required, email format. Returns true if valid. */
  const validateInvitees = useCallback((): boolean => {
    const errors: Record<string, Partial<Record<'external_name' | 'external_email' | 'position' | 'phone', string>>> = {};
    localInvitees.forEach((inv) => {
      const row: Partial<Record<'external_name' | 'external_email' | 'position' | 'phone', string>> = {};
      const name = (inv.external_name ?? '').trim();
      const email = (inv.external_email ?? '').trim();
      const position = (inv.position ?? '').trim();
      const phone = (inv.phone ?? '').trim();
      if (!name) row.external_name = 'مطلوب';
      if (!email) row.external_email = 'مطلوب';
      else if (!isValidEmail(email)) row.external_email = 'صيغة بريد إلكتروني غير صحيحة';
      if (!position) row.position = 'مطلوب';
      if (!phone) row.phone = 'مطلوب';
      if (Object.keys(row).length > 0) errors[inv.id] = row;
    });
    setInviteeValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localInvitees]);

  /** Validate minister attendees (قائمة المدعوين الوزير): all required, email format. Returns true if valid. */
  const validateMinisterAttendees = useCallback((): boolean => {
    const errors: Record<number, Partial<Record<'external_name' | 'external_email' | 'position' | 'phone' | 'justification', string>>> = {};
    (scheduleForm.minister_attendees || []).forEach((att, index) => {
      const row: Partial<Record<'external_name' | 'external_email' | 'position' | 'phone' | 'justification', string>> = {};
      const name = (att.external_name ?? '').trim();
      const email = (att.external_email ?? '').trim();
      const position = (att.position ?? '').trim();
      const phone = (att.phone ?? '').trim();
      const justification = (att.justification ?? '').trim();
      if (!name) row.external_name = 'مطلوب';
      if (!email) row.external_email = 'مطلوب';
      else if (!isValidEmail(email)) row.external_email = 'صيغة بريد إلكتروني غير صحيحة';
      if (!position) row.position = 'مطلوب';
      if (!phone) row.phone = 'مطلوب';
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

  // Move to waiting list mutation
  const moveToWaitingListMutation = useMutation({
    mutationFn: () => moveToWaitingList(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      navigate(-1); // Navigate back after successful move
    },
  });

  // Compare by attachment (تقييم الاختلاف بين العروض) – only for attachments with replaces_attachment_id
  const compareByAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => runCompareByAttachment(attachmentId),
    onSuccess: (data) => {
      setComparePresentationsResult(data);
      setCompareErrorDetail(null);
      setIsComparePresentationsModalOpen(true);
    },
    onError: (err: unknown) => {
      console.error('Compare presentations error:', err);
      setComparePresentationsResult(null);
      const e = err as { response?: { data?: { detail?: string } }; detail?: string };
      const detail = typeof e?.response?.data?.detail === 'string' ? e.response.data.detail : typeof e?.detail === 'string' ? e.detail : null;
      setCompareErrorDetail(detail);
      setIsComparePresentationsModalOpen(true);
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

  // Send to content mutation
  const sendToContentMutation = useMutation({
    mutationFn: (payload: { notes: string; is_draft?: boolean }) => sendToContent(id!, payload),
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsRequestGuidanceModalOpen(false);
      setRequestGuidanceForm({ notes: '' });
      if (!variables.is_draft) navigate(-1);
    },
  });

  const handleRequestGuidanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestGuidanceMutation.mutate({
      notes: requestGuidanceForm.notes || 'يرجى توفير التوجيهات اللازمة حول هذا الطلب',
    });
  };

  const handleRequestGuidanceDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    requestGuidanceMutation.mutate({
      notes: requestGuidanceForm.notes || 'يرجى توفير التوجيهات اللازمة حول هذا الطلب',
      is_draft: true,
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
    enabled: isConsultationModalOpen,
  });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // Scheduling consultation mutation
  const consultationMutation = useMutation({
    mutationFn: (payload: {
      consultant_user_id: string;
      consultation_question: string;
      is_draft?: boolean;
    }) => requestSchedulingConsultation(id!, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsConsultationModalOpen(false);
      setConsultationForm({
        consultant_user_id: '',
        consultation_question: '',
        search: '',
      });
      if (!variables.is_draft) navigate(-1);
    },
  });

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationForm.consultant_user_id) return;
    consultationMutation.mutate({
      consultant_user_id: consultationForm.consultant_user_id,
      consultation_question:
        consultationForm.consultation_question || 'هل يمكن جدولة هذا الاجتماع في الموعد المقترح؟',
    });
  };

  const handleConsultationDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    consultationMutation.mutate({
      consultant_user_id: consultationForm.consultant_user_id || '',
      consultation_question:
        consultationForm.consultation_question || 'هل يمكن جدولة هذا الاجتماع في الموعد المقترح؟',
      is_draft: true,
    });
  };

  // Return for info mutation (POST with notes + editable_fields)
  const returnForInfoMutation = useMutation({
    mutationFn: (payload: { notes: string; editable_fields: string[] }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoForm({
        notes: '',
        editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>),
      });
      navigate(-1);
    },
  });

  const handleReturnForInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const editable_fields = EDITABLE_FIELD_IDS.filter((id) => returnForInfoForm.editable_fields[id]);
    returnForInfoMutation.mutate({
      notes: returnForInfoForm.notes || 'يرجى توفير معلومات إضافية حول الموضوع',
      editable_fields,
    });
  };

  // Schedule meeting mutation (uses reschedule API when meeting is already SCHEDULED)
  const scheduleMutation = useMutation({
    mutationFn: (payload: {
      scheduled_at: string;
      meeting_channel: string;
      requires_protocol: boolean;
      protocol_type: string | null;
      is_data_complete: boolean;
      notes: string;
      location?: string;
      meeting_link?: string;
      minister_attendees: MinisterAttendee[];
    }) =>
      meeting?.status === MeetingStatus.SCHEDULED
        ? rescheduleMeeting(id!, payload)
        : scheduleMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      // Keep modal open if Webex details exist so user can see them
      // The modal will close when user clicks "تم" button
      if (!webexMeetingDetails) {
        setIsScheduleModalOpen(false);
        setScheduleForm({
          scheduled_at: '',
          meeting_channel: 'PHYSICAL',
          requires_protocol: false,
          protocol_type: null,
          protocol_type_text: '',
          is_data_complete: true,
          notes: '',
          location: '',
          selected_time_slot_id: null,
          minister_attendees: [],
        });
        navigate(-1); // Navigate back after successful scheduling
      }
    },
  });

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.scheduled_at) return;

    // Reject past date/time
    const scheduledAt = new Date(scheduleForm.scheduled_at);
    if (scheduledAt.getTime() <= Date.now()) {
      setValidationError('لا يمكن اختيار تاريخ أو وقت في الماضي');
      return;
    }

    // Validate: if requires_protocol is true, protocol_type or protocol_type_text must be filled
    if (scheduleForm.requires_protocol && !scheduleForm.protocol_type && !scheduleForm.protocol_type_text) {
      setValidationError('يجب تحديد نوع البروتوكول عند تفعيل خيار "يتطلب بروتوكول"');
      return;
    }

    // Validate minister attendees (قائمة المدعوين الوزير)
    if ((scheduleForm.minister_attendees?.length ?? 0) > 0 && !validateMinisterAttendees()) {
      setValidationError('يرجى تصحيح الأخطاء في قائمة المدعوين (الوزير) — جميع الحقول مطلوبة والبريد يجب أن يكون صالحاً');
      return;
    }

    setValidationError(null);

    // Convert datetime-local to ISO string (UTC)
    const scheduledAtISO = new Date(scheduleForm.scheduled_at).toISOString();

    // If meeting channel is VIRTUAL (عن بُعد), use the already-created Webex meeting link
    let meetingLink: string | undefined = undefined;
    if (scheduleForm.meeting_channel === 'VIRTUAL') {
      if (!webexMeetingDetails) {
        setValidationError('يرجى الانتظار حتى يتم إنشاء اجتماع Webex');
        return;
      }
      meetingLink = webexMeetingDetails.join_link;
    } else {
      // Clear Webex details if channel is not VIRTUAL
      setWebexMeetingDetails(null);
    }

    const schedulePayload = {
      scheduled_at: scheduledAtISO,
      meeting_channel: scheduleForm.meeting_channel,
      requires_protocol: scheduleForm.requires_protocol,
      protocol_type: scheduleForm.requires_protocol ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
      is_data_complete: scheduleForm.is_data_complete,
      notes: scheduleForm.notes || 'Meeting scheduled successfully',
      location: scheduleForm.location || undefined,
      online_link: meetingLink,
      minister_attendees: normalizeMinisterAttendees(scheduleForm.minister_attendees),
    };

    scheduleMutation.mutate(schedulePayload);
  };

  const addMinisterAttendee = () => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: [
        ...prev.minister_attendees,
        {
          username: '',
          external_name: '',
          external_email: '',
          is_required: false,
          justification: '',
          access_permission: 'FULL',
          position: '',
          phone: '',
          attendance_channel: 'PHYSICAL',
        },
      ],
    }));
  };

  const removeMinisterAttendee = (index: number) => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: prev.minister_attendees.filter((_, i) => i !== index),
    }));
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

  // Initialize form data when meeting loads
  React.useEffect(() => {
    if (meeting) {
      const ownerDisplay = meeting.current_owner_user
        ? `${(meeting.current_owner_user.first_name || '').trim()} ${(meeting.current_owner_user.last_name || '').trim()}`.trim() || meeting.current_owner_user.username || ''
        : meeting.current_owner_role?.name_ar || '';
      const prevId = meeting.previous_meeting_id || null;
      const basedOnDirective = !!(meeting.related_guidance || (meeting as any).is_based_on_directive);
      const directiveMethod = (meeting as any).directive_method || '';
      const minutesId = (meeting as any).previous_meeting_minutes_id || '';
      const guidance = meeting.related_guidance ?? '';
      setFormData({
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.meeting_subject || '',
        meeting_owner: meeting.meeting_owner_name ?? ownerDisplay ?? '',
        is_on_behalf_of: (meeting as any)?.is_on_behalf_of ?? false,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_id: prevId,
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
      });
      setPreviousMeetingOption(prevId ? { value: prevId, label: prevId } : null);
      setPreviousMeetingMinutesOption(minutesId ? { value: minutesId, label: minutesId } : null);

      // Initialize content tab form (objectives and agenda items)
      setContentForm({
        objectives: (meeting.objectives || []).map((obj) => ({
          id: obj.id || `obj-${Date.now()}-${Math.random()}`,
          objective: obj.objective,
        })),
        agendaItems: (meeting.agenda_items || []).map((item) => ({
          id: item.id || `agenda-${Date.now()}-${Math.random()}`,
          agenda_item: item.agenda_item,
          presentation_duration_minutes: item.presentation_duration_minutes,
        })),
      });
      setContentTabForm({
        when_presentation_attached: (meeting as any).when_presentation_attached ?? '',
        general_notes: '', // new note to add; existing notes come from meeting.general_notes (array)
      });
    }
  }, [meeting]);
 
 

  // Auto-create Webex meeting when ONLINE channel is selected and date/time is set
  useEffect(() => {
      // Only create if modal is open, channel is VIRTUAL, date/time is set, and we don't already have details
    if (
      !isScheduleModalOpen ||
      scheduleForm.meeting_channel !== 'VIRTUAL' ||
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

        // Get meeting title and duration from meeting data
        const meetingTitle = meeting?.meeting_title || 'اجتماع';
        const durationMinutes = meeting?.presentation_duration || 60;

        const webexResponse = await createWebexMeeting({
          meeting_title: meetingTitle,
          start_datetime: webexDateTime,
          time_zone: 'UTC',
          duration_minutes: durationMinutes,
        });

        // Store Webex meeting details for display in the modal
        setWebexMeetingDetails({
          join_link: webexResponse.data.webex_meeting_join_link,
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
  }, [isScheduleModalOpen, scheduleForm.meeting_channel, scheduleForm.scheduled_at, webexMeetingDetails, isCreatingWebex, meeting]);

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
        scheduled_at: meeting.scheduled_at || '',
        meeting_channel: meetingChannel,
        requires_protocol: meeting.requires_protocol ?? prev.requires_protocol,
        protocol_type: meeting.protocol_type || prev.protocol_type,
        protocol_type_text: meeting.protocol_type || prev.protocol_type_text,
        is_data_complete: meeting.is_data_complete ?? prev.is_data_complete,
        location: meeting.meeting_channel || prev.location,
        selected_time_slot_id: meeting.selected_time_slot_id || null,
        minister_attendees: ((meeting as any).minister_attendees as any) || prev.minister_attendees,
      };
    });

    setLocalInvitees([]);
    
    // Reset attachment state when meeting loads
    setDeletedAttachmentIds([]);
    setNewAttachments([]);
    setNewPresentationAttachments([]);

    const ownerDisplay = meeting.current_owner_user
      ? `${(meeting.current_owner_user.first_name || '').trim()} ${(meeting.current_owner_user.last_name || '').trim()}`.trim() || meeting.current_owner_user.username || ''
      : meeting.current_owner_role?.name_ar || '';
    const prevId = meeting.previous_meeting_id || null;
    const basedOnDirective = !!(meeting.related_guidance || (meeting as any).is_based_on_directive);
    const directiveMethod = (meeting as any).directive_method || '';
    const minutesId = (meeting as any).previous_meeting_minutes_id || '';
    const guidance = meeting.related_guidance ?? '';
    setOriginalSnapshot({
      formData: {
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.meeting_subject || '',
        meeting_owner: meeting.meeting_owner_name ?? ownerDisplay ?? '',
        is_on_behalf_of: (meeting as any)?.is_on_behalf_of ?? false,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_id: prevId,
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
        location: meeting.meeting_channel || '',
        meeting_channel: ['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3', 'VIRTUAL', 'HYBRID'].includes(meeting.meeting_channel) ? meeting.meeting_channel : 'PHYSICAL',
        minister_attendees: ((meeting as any).minister_attendees as any) || [],
      },
      contentForm: {
        objectives: (meeting.objectives || []).map((obj) => ({
          id: obj.id || `obj-${Date.now()}-${Math.random()}`,
          objective: obj.objective,
        })),
        agendaItems: (meeting.agenda_items || []).map((item) => ({
          id: item.id || `agenda-${Date.now()}-${Math.random()}`,
          agenda_item: item.agenda_item,
          presentation_duration_minutes: item.presentation_duration_minutes,
        })),
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

  // المحتوى: objectives/agenda and at least one presentation file (العرض التقديمي)
  const presentationAttachments = (meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id));
  const hasPresentation = presentationAttachments.length > 0 || newPresentationAttachments.length > 0;
  const hasObjectivesOrAgenda = (contentForm.objectives?.length ?? 0) > 0 || (contentForm.agendaItems?.length ?? 0) > 0;
  const hasContent = hasObjectivesOrAgenda && hasPresentation;

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /** Async load options for "الاجتماع السابق" – searchMeetings by original_title */
  const loadClosedMeetingsOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      if (!search || search.trim().length === 0) {
        return {
          items: [],
          total: 0,
          skip: 0,
          limit,
          has_next: false,
          has_previous: false,
        };
      }
      const results = await searchMeetings({
        q: search.trim(),
        limit: Math.min(limit, 100), // API max is 100
      });
      const currentId = meeting?.id;
      const items = results
        .filter((m) => String(m.id) !== currentId)
        .map((m) => ({
          value: String(m.id),
          label: m.meeting_title || m.original_title || String(m.id),
        }));
      return {
        items,
        total: items.length,
        skip: 0, // API doesn't support pagination
        limit: results.length,
        has_next: false, // API doesn't support pagination
        has_previous: false,
      };
    },
    [meeting?.id]
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
  const TABS_HIDDEN_WHEN_SCHEDULED = ['scheduling-consultation', 'directive', 'content-consultation'];
  const tabs = useMemo(() => {
    const all = [
      { id: 'request-info', label: 'معلومات الطلب' },
      { id: 'meeting-info', label: 'معلومات الاجتماع' },
      { id: 'content', label: 'المحتوى' },
      { id: 'attendees', label: 'قائمة المدعوين' },
      { id: 'scheduling-consultation', label: 'استشارة الجدولة' },
      { id: 'directive', label: 'التوجيه' },
      { id: 'content-consultation', label: 'استشارة المحتوى' },
    ];
    if (meetingStatus === MeetingStatus.SCHEDULED) {
      const filtered = all.filter((t) => !TABS_HIDDEN_WHEN_SCHEDULED.includes(t.id));
      return [...filtered, { id: 'meeting-documentation', label: 'توثيق الاجتماع' }];
    }
    return all;
  }, [meetingStatus]);

  // When status is SCHEDULED and current tab is hidden, switch to request-info; when not SCHEDULED and on meeting-documentation, switch away
  useEffect(() => {
    if (meetingStatus === MeetingStatus.SCHEDULED && TABS_HIDDEN_WHEN_SCHEDULED.includes(activeTab)) {
      setActiveTab('request-info');
    } else if (meetingStatus !== MeetingStatus.SCHEDULED && activeTab === 'meeting-documentation') {
      setActiveTab('request-info');
    } else if (activeTab === 'request-notes') {
      setActiveTab('request-info');
    }
  }, [meetingStatus, activeTab]);

  /** Renders a field label with an optional "editable when return for info" checkbox beside it (only when status is UNDER_REVIEW) */
  const renderFieldLabel = (fieldId: string, labelContent: React.ReactNode, labelClassName?: string) => {
    const baseLabelClass = labelClassName ?? 'text-sm font-medium text-gray-700 text-[#344054]';
    const showEditable = meetingStatus === MeetingStatus.UNDER_REVIEW && EDITABLE_FIELD_IDS.includes(fieldId);
    const isChecked = returnForInfoForm.editable_fields[fieldId] ?? false;
    if (!showEditable) {
      return <label className={baseLabelClass} style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{labelContent}</label>;
    }
    return (
      <div className="flex flex-row items-center justify-end gap-3 w-full min-w-0 flex-nowrap">
        <span className={`${baseLabelClass} flex-1 min-w-0 truncate`} style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{labelContent}</span>
        <label
          className={`
            inline-flex items-center gap-2 cursor-pointer flex-shrink-0
            px-2.5 py-1 rounded-full border transition-all duration-200
            ${isChecked
              ? 'bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]'
              : 'bg-gray-100/80 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
            }
          `}
          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) =>
              setReturnForInfoForm((p) => ({
                ...p,
                editable_fields: { ...p.editable_fields, [fieldId]: e.target.checked },
              }))
            }
            className="sr-only"
            aria-label={`قابل للتعديل: ${typeof labelContent === 'string' ? labelContent : fieldId}`}
          />
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
        </label>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  // Error state
  if (error || !meeting) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      {/* Single parent: no bg, no extra container — only head and content are white cards with gap */}
      <div className="flex-1 min-h-0 flex flex-col gap-8 pr-5">
        {/* Head: white card */}
        <div
            className="flex flex-col flex-shrink-0 gap-8 h-full pb-3 "
          >
            <div className="flex flex-row justify-end items-center gap-2.5 relative">
            {/* Figma Frame 2147241026: column, justify-center, items-end, gap 18px */}
            <div className="w-full flex-1 min-h-0 flex flex-col overflow-y-auto pr-6 pl-6 py-6 gap-6 rounded-2xl bg-white">
              {/* Top row: title + status on right (RTL), quality button at end (left in RTL) */}
              <div className="flex flex-row justify-between items-center gap-2.5 w-full">
                {/* Right side (RTL): back, title block, status */}
                <div className="flex flex-row items-center gap-2.5 flex-1 min-w-0 justify-start">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex flex-row justify-center items-center w-6 h-6 rounded-[4.97px] bg-white border border-[#D0D5DD] shadow-[0px_0.62px_1.24px_rgba(16,24,40,0.05)] flex-shrink-0"
                    aria-label="رجوع"
                  >
                    <ChevronRight className="w-3 h-3 text-[#667085]" />
                  </button>
                  <div className="flex flex-col items-start min-w-0 text-right">
                    <h1
                      className="text-xl font-bold text-[#101828] leading-tight whitespace-nowrap truncate max-w-full"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      مراجعة طلب الاجتماع ({meeting.request_number})
                    </h1>
                    <p
                      className="text-sm font-normal text-[#475467] leading-snug text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.
                    </p>
                  </div>
                  {hasChanges && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white text-xs flex-shrink-0" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تغييرات غير محفوظة
                    </span>
                  )}
                  <StatusBadge status={meetingStatus} label={statusLabel} />
                </div>
                {/* End (left in RTL): quality button - animated with shadow */}
                <button
                  type="button"
                  onClick={() => setIsQualityModalOpen(true)}
                  className="relative flex flex-row justify-end items-center gap-2 w-fit min-w-[119px] h-[41px] rounded-[22.8393px] flex-shrink-0 text-white font-bold overflow-hidden box-border px-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: '11px',
                    lineHeight: '14px',
                    background: '#34C3BA',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.08), 0 2px 4px rgba(4, 143, 134, 0.2), 0 4px 12px rgba(4, 143, 134, 0.25), 0 8px 24px rgba(4, 143, 134, 0.15)',
                  }}
                >
                  {/* Ellipse glow - Figma Ellipse 1: #87F8F8, blur(9.41px), soft highlight top-left */}
                  <span
                    className="absolute left-0 top-1/2 pointer-events-none w-[86px] h-[74px] rounded-full opacity-80 -translate-y-1/2 -translate-x-1/3"
                    style={{
                      background: '#87F8F8',
                      filter: 'blur(9.41px)',
                    }}
                    aria-hidden
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    تقييم جودة الاجتماع
                    <svg className="w-5 h-5 flex-shrink-0 animate-sparkle-stars inline-block" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.25398 4.43574C2.31098 4.48358 2.38555 4.51001 2.46286 4.50976C2.53984 4.50958 2.61395 4.48297 2.67057 4.43517C2.72718 4.38737 2.76217 4.32187 2.76864 4.25158C2.84188 3.81496 3.06712 3.41171 3.41081 3.10189C3.7545 2.79208 4.19824 2.59229 4.67592 2.5323C4.7458 2.51964 4.80871 2.48515 4.85393 2.43473C4.89915 2.38431 4.92387 2.32107 4.92387 2.25581C4.92387 2.19055 4.89915 2.12731 4.85393 2.07688C4.80871 2.02646 4.7458 1.99197 4.67592 1.97931C4.19728 1.92156 3.7522 1.7225 3.40806 1.41229C3.06392 1.10207 2.83945 0.697576 2.76864 0.260034C2.76264 0.189272 2.72773 0.123188 2.67087 0.0749826C2.61401 0.026777 2.5394 0 2.46193 0C2.38447 0 2.30985 0.026777 2.253 0.0749826C2.19614 0.123188 2.16123 0.189272 2.15523 0.260034C2.08199 0.696656 1.85675 1.09991 1.51306 1.40972C1.16937 1.71954 0.725625 1.91932 0.247945 1.97931C0.178069 1.99197 0.115154 2.02646 0.0699358 2.07688C0.024718 2.12731 0 2.19055 0 2.25581C0 2.32107 0.024718 2.38431 0.0699358 2.43473C0.115154 2.48515 0.178069 2.51964 0.247945 2.5323C0.72659 2.59006 1.17167 2.78911 1.51581 3.09933C1.85995 3.40955 2.08442 3.81404 2.15523 4.25158C2.16172 4.32216 2.19698 4.3879 2.25398 4.43574Z" fill="white"/>
                      <path d="M8.89539 12.4012C8.82392 12.4014 8.75502 12.377 8.70255 12.3328C8.65008 12.2887 8.61793 12.2282 8.61257 12.1634C8.59673 11.974 8.16938 7.50891 3.17558 6.48248C3.11281 6.46975 3.0567 6.43796 3.01648 6.39235C2.97626 6.34675 2.95435 6.29004 2.95435 6.23159C2.95435 6.17315 2.97626 6.11644 3.01648 6.07083C3.0567 6.02522 3.11281 5.99343 3.17558 5.98071C8.17985 4.95248 8.60861 0.346806 8.61228 0.299765C8.61778 0.235032 8.65003 0.174589 8.70255 0.130576C8.75506 0.0865641 8.82396 0.0622444 8.89539 0.062502C8.96691 0.0623238 9.03585 0.0867798 9.08833 0.130947C9.1408 0.175113 9.17292 0.235709 9.17821 0.300536C9.19405 0.489987 9.6214 4.95505 14.6152 5.98148C14.678 5.99421 14.7341 6.026 14.7743 6.0716C14.8145 6.11721 14.8364 6.17392 14.8364 6.23236C14.8364 6.29081 14.8145 6.34752 14.7743 6.39313C14.7341 6.43873 14.678 6.47052 14.6152 6.48325C9.61093 7.51148 9.18217 12.1171 9.1785 12.1642C9.17293 12.2289 9.14065 12.2893 9.08814 12.3332C9.03563 12.3772 8.96678 12.4015 8.89539 12.4012ZM7.94424 9.21753C8.70255 5.50911 8.61228 6.39236 8.70255 4.68951C9.16327 3.26696 10.5236 5.25548 13.5337 6.23185C10.5428 5.26172 12.5721 5.98071 8.89539 5.50911C8.31931 7.42187 8.70255 6.07083 7.94424 9.21753Z" fill="white"/>
                      <path d="M2.53536 10.8913C2.61385 10.9631 2.72031 11.0035 2.83131 11.0035C2.94231 11.0035 3.04876 10.9631 3.12725 10.8913C3.20574 10.8194 3.24983 10.7219 3.24983 10.6202V9.85354C3.24983 9.75188 3.20574 9.65438 3.12725 9.58249C3.04876 9.5106 2.94231 9.47021 2.83131 9.47021C2.72031 9.47021 2.61385 9.5106 2.53536 9.58249C2.45687 9.65438 2.41278 9.75188 2.41278 9.85354V10.6202C2.41278 10.7219 2.45687 10.8194 2.53536 10.8913Z" fill="white"/>
                      <path d="M1.15719 11.7702H1.99425C2.10525 11.7702 2.2117 11.7298 2.29019 11.6579C2.36868 11.586 2.41278 11.4885 2.41278 11.3869C2.41278 11.2852 2.36868 11.1877 2.29019 11.1158C2.2117 11.0439 2.10525 11.0035 1.99425 11.0035H1.15719C1.04619 11.0035 0.939736 11.0439 0.861247 11.1158C0.782758 11.1877 0.738663 11.2852 0.738663 11.3869C0.738663 11.4885 0.782758 11.586 0.861247 11.6579C0.939736 11.7298 1.04619 11.7702 1.15719 11.7702Z" fill="white"/>
                      <path d="M2.53536 13.1912C2.61385 13.2631 2.72031 13.3035 2.83131 13.3035C2.94231 13.3035 3.04876 13.2631 3.12725 13.1912C3.20574 13.1193 3.24983 13.0218 3.24983 12.9202V12.1535C3.24983 12.0519 3.20574 11.9544 3.12725 11.8825C3.04876 11.8106 2.94231 11.7702 2.83131 11.7702C2.72031 11.7702 2.61385 11.8106 2.53536 11.8825C2.45687 11.9544 2.41278 12.0519 2.41278 12.1535V12.9202C2.41278 13.0218 2.45687 13.1193 2.53536 13.1912Z" fill="white"/>
                      <path d="M3.66836 11.7702H4.50542C4.61642 11.7702 4.72288 11.7298 4.80137 11.6579C4.87986 11.586 4.92395 11.4885 4.92395 11.3869C4.92395 11.2852 4.87986 11.1877 4.80137 11.1158C4.72288 11.0439 4.61642 11.0035 4.50542 11.0035H3.66836C3.55736 11.0035 3.45091 11.0439 3.37242 11.1158C3.29393 11.1877 3.24983 11.2852 3.24983 11.3869C3.24983 11.4885 3.29393 11.586 3.37242 11.6579C3.45091 11.7298 3.55736 11.7702 3.66836 11.7702Z" fill="white"/>
                    </svg>
                  </span>
                </button>
              </div>
              {/* Tabs row: help icon and tabs on same row, same alignment */}
              <div className="flex flex-row items-center w-full gap-2.5">
            
                <div className="flex-1 flex justify-center min-w-0">
                  <Tabs
                    items={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    variant="underline"
                    className="gap-2.5"
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-center w-6 h-6 text-[#020617] hover:opacity-80 flex-shrink-0 rounded-full"
                        aria-label="مساعدة"
                      >
                        <HelpCircle className="w-4 h-4" strokeWidth={1.33} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px] text-right">
                      <p className="font-semibold text-gray-900 mb-1">يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب.</p>
                      <p className="text-sm text-gray-600">يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
        </div>

        {/* Content: white card, takes full remaining height, gap above from head */}
        <div
          className="w-full flex-1 min-h-0 flex flex-row overflow-y-auto pr-6 pl-6 py-6 gap-6 rounded-2xl bg-white justify-center"
          style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.06)' }}
        >
          {/* Tab: معلومات الطلب (Excel التبويب) – اسم الحقل: رقم الطلب، حالة الطلب، مقدم الطلب، مالك الاجتماع */}
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>رقم الطلب</label>
                  <div className="w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {meeting?.request_number ?? '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>حالة الطلب</label>
                  <div className="w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {statusLabel}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مقدم الطلب</label>
                  <div className="w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {meeting?.submitter_name ?? '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مالك الاجتماع</label>
                  <div className="w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {(meeting )?.meeting_owner_name ?? '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: معلومات الاجتماع – Figma: flex column gap 14px, rows justify-between gap 15px, label #344054 8.24px, input border #D0D5DD rounded 4.71px */}
          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-[14px] items-end w-full" dir="rtl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[15px] gap-y-[14px] w-full">
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('is_on_behalf_of', 'هل نطلب الاجتماع نيابة عن غيرك؟', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <div className="flex items-center gap-2 w-full justify-start">
                    <span className="text-[10.23px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{formData.is_on_behalf_of ? 'نعم' : 'لا'}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, is_on_behalf_of: !p.is_on_behalf_of }))}
                      className={`w-7 h-[15.34px] rounded-full flex transition-all cursor-pointer flex-shrink-0 ${formData.is_on_behalf_of ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'} p-[1.28px]`}
                    >
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('meeting_owner', 'مالك الاجتماع', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <Input type="text" value={formData.meeting_owner} onChange={(e) => handleFieldChange('meeting_owner', e.target.value)} className="w-full min-h-[25.9px] py-[5.89px] px-[8.24px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-[0px_0.59px_1.18px_rgba(16,24,40,0.05)] text-right text-[9.42px] text-[#667085] placeholder:text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="مالك الاجتماع" />
                </div>
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('meeting_title', 'عنوان الاجتماع', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <Input type="text" value={formData.meeting_title} onChange={(e) => handleFieldChange('meeting_title', e.target.value)} className="w-full min-h-[25.9px] py-[5.89px] px-[8.24px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-[0px_0.59px_1.18px_rgba(16,24,40,0.05)] text-right text-[9.42px] text-[#667085] placeholder:text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="أدخل عنوان الاجتماع" />
                </div>
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('meeting_subject', 'وصف الاجتماع', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <Input type="text" value={formData.meeting_subject} onChange={(e) => handleFieldChange('meeting_subject', e.target.value)} className="w-full min-h-[25.9px] py-[5.89px] px-[8.24px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-[0px_0.59px_1.18px_rgba(16,24,40,0.05)] text-right text-[9.42px] text-[#667085] placeholder:text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="أدخل وصف الاجتماع" />
                </div>
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('sector', 'القطاع', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <Input type="text" value={formData.sector} onChange={(e) => handleFieldChange('sector', e.target.value)} className="w-full min-h-[25.9px] py-[5.89px] px-[8.24px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-[0px_0.59px_1.18px_rgba(16,24,40,0.05)] text-right text-[9.42px] text-[#667085] placeholder:text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="القطاع" />
                </div>
                <div className="flex flex-col gap-[3.53px]">
                  {renderFieldLabel('meeting_type', 'نوع الاجتماع', 'text-sm font-medium text-gray-700 text-[#344054]')}
                  <Select value={formData.meeting_type} onValueChange={(v) => handleFieldChange('meeting_type', v)}>
                    <SelectTrigger className="w-full min-h-[25.9px] py-[5.89px] px-[8.24px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-[0px_0.59px_1.18px_rgba(16,24,40,0.05)] text-right flex-row-reverse text-[9.42px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر نوع الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingType).map((t) => <SelectItem key={t} value={t}>{MeetingTypeLabels[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('meeting_justification', 'السبب', 'text-sm font-medium text-gray-700')}
                  <Textarea value={formData.meeting_justification} onChange={(e) => handleFieldChange('meeting_justification', e.target.value)} className="w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-right resize-y" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="السبب" />
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('meeting_channel', 'آلية انعقاد الاجتماع', 'text-sm font-medium text-gray-700')}
                  <Select
                    value={scheduleForm.meeting_channel}
                    onValueChange={(value) => setScheduleForm((p) => ({ ...p, meeting_channel: value as typeof p.meeting_channel }))}
                  >
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      <SelectValue placeholder="اختر آلية انعقاد الاجتماع" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {Object.entries(MeetingChannelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {['PHYSICAL', 'PHYSICAL_LOCATION_1', 'PHYSICAL_LOCATION_2', 'PHYSICAL_LOCATION_3'].includes(scheduleForm.meeting_channel) && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>الموقع</label>
                    <Input type="text" value={scheduleForm.location} onChange={(e) => setScheduleForm((p) => ({ ...p, location: e.target.value }))} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="القاعة/الموقع" />
                  </div>
                )}
                <div className="flex flex-col items-end gap-[6.89px]">
                  {renderFieldLabel('requires_protocol', 'هل يتطلب بروتوكول؟', 'text-sm font-medium text-gray-700 leading-[11px] text-[#344054]')}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10.23px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{scheduleForm.requires_protocol ? 'نعم' : 'لا'}</span>
                    <button type="button" onClick={() => setScheduleForm((p) => ({ ...p, requires_protocol: !p.requires_protocol }))} className={`w-7 h-[15.34px] rounded-full flex transition-all cursor-pointer flex-shrink-0 ${scheduleForm.requires_protocol ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'} p-[1.28px]`}><div className="w-3 h-3 rounded-full bg-white shadow-sm" /></button>
                  </div>
                  {scheduleForm.requires_protocol && (
                    <Input type="text" value={scheduleForm.protocol_type_text} onChange={(e) => setScheduleForm((p) => ({ ...p, protocol_type_text: e.target.value }))} className="w-full h-11 mt-1 bg-white border border-gray-300 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="نوع البروتوكول" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('meeting_classification_type', 'فئة الاجتماع', 'text-sm font-medium text-gray-700')}
                  <Select value={formData.meeting_classification_type || ''} onValueChange={(v) => handleFieldChange('meeting_classification_type', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر فئة الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingClassificationType).map((c) => <SelectItem key={c} value={c}>{MeetingClassificationTypeLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مبرّر اللقاء</label>
                  <Textarea value={formData.meeting_justification} onChange={(e) => handleFieldChange('meeting_justification', e.target.value)} className="w-full min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-right resize-y" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="مبرّر اللقاء" />
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('related_topic', 'موضوع التكليف المرتبط', 'text-sm font-medium text-gray-700')}
                  <Input type="text" value={formData.related_topic} onChange={(e) => handleFieldChange('related_topic', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="موضوع التكليف المرتبط" />
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('deadline', 'تاريخ الاستحقاق', 'text-sm font-medium text-gray-700')}
                  <FormDatePicker
                    value={formData.deadline}
                    onChange={(value) => handleFieldChange('deadline', value)}
                    placeholder="dd/mm/yyyy"
                    fullWidth
                    className="h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('meeting_classification', 'تصنيف الاجتماع', 'text-sm font-medium text-gray-700')}
                  <Select value={formData.meeting_classification} onValueChange={(v) => handleFieldChange('meeting_classification', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر تصنيف الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingClassification).map((c) => <SelectItem key={c} value={c}>{MeetingClassificationLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('meeting_confidentiality', 'سريّة الاجتماع', 'text-sm font-medium text-gray-700')}
                  <Select value={formData.meeting_confidentiality || ''} onValueChange={(v) => handleFieldChange('meeting_confidentiality', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر سريّة الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingConfidentiality).map((c) => <SelectItem key={c} value={c}>{MeetingConfidentialityLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col items-end gap-[6.89px]">
                  {renderFieldLabel('is_sequential', 'اجتماع متسلسل؟', 'text-sm font-medium text-gray-700 leading-[11px] text-[#344054]')}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10.23px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{formData.is_sequential ? 'نعم' : 'لا'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !formData.is_sequential;
                        setFormData((p) => ({ ...p, is_sequential: next, ...(next ? {} : { previous_meeting_id: null }) }));
                        if (!next) setPreviousMeetingOption(null);
                      }}
                      className={`w-7 h-[15.34px] rounded-full flex transition-all cursor-pointer flex-shrink-0 ${formData.is_sequential ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'} p-[1.28px]`}
                    >
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
                {formData.is_sequential && (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    {renderFieldLabel('previous_meeting_id', <>الاجتماع السابق <span className="text-red-500">*</span></>, 'text-sm font-medium text-gray-700')}
                    <FormAsyncSelectV2
                      value={previousMeetingOption}
                      onValueChange={(opt) => {
                        setPreviousMeetingOption(opt);
                        setFormData((p) => ({ ...p, previous_meeting_id: opt?.value ?? null }));
                      }}
                      loadOptions={loadClosedMeetingsOptions}
                      placeholder="اختر الاجتماع السابق..."
                      searchPlaceholder="ابحث..."
                      emptyMessage="لا توجد اجتماعات مغلقة"
                      fullWidth
                      className="text-right"
                      error={formData.is_sequential && !formData.previous_meeting_id}
                      errorMessage={formData.is_sequential && !formData.previous_meeting_id ? 'مطلوب عند تفعيل اجتماع متسلسل' : undefined}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>الرقم التسلسلي</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} title="غير قابل للتعديل. إذا كان الاجتماع السابق متسلسلاً يُضاف 1 للرقم الحالي؛ وإلا يُعطى السابق 1 والحالي 2.">
                    {meeting?.sequential_number != null
                      ? String(meeting.sequential_number)
                      : formData.is_sequential && formData.previous_meeting_id
                        ? previousMeeting?.sequential_number != null
                          ? String((previousMeeting.sequential_number ?? 0) + 1)
                          : 'غير موجود (إجباري)'
                        : 'غير موجود'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-[6.89px] md:col-span-2">
                  {renderFieldLabel('is_based_on_directive', 'هل طلب الاجتماع بناء على توجيه من معالي الوزير', 'text-sm font-medium text-gray-700 leading-[11px] text-[#344054]')}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10.23px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{formData.is_based_on_directive ? 'نعم' : 'لا'}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, is_based_on_directive: !p.is_based_on_directive, ...(!p.is_based_on_directive ? {} : { directive_method: '' }) }))}
                      className={`w-7 h-[15.34px] rounded-full flex transition-all cursor-pointer flex-shrink-0 ${formData.is_based_on_directive ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'} p-[1.28px]`}
                    >
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('directive_method', 'طريقة التوجيه', 'text-sm font-medium text-gray-700')}
                  <Select value={formData.directive_method || ''} onValueChange={(v) => handleFieldChange('directive_method', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      <SelectValue placeholder="اختر طريقة التوجيه" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {DIRECTIVE_METHOD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  {renderFieldLabel('previous_meeting_minutes_id', 'محضر الاجتماع', 'text-sm font-medium text-gray-700')}
                  <FormAsyncSelectV2
                    value={previousMeetingMinutesOption}
                    onValueChange={(opt) => {
                      setPreviousMeetingMinutesOption(opt);
                      setFormData((p) => ({ ...p, previous_meeting_minutes_id: opt?.value ?? '' }));
                    }}
                    loadOptions={loadPreviousMeetingMinutesOptions}
                    placeholder="اختر محضر الاجتماع..."
                    searchPlaceholder="ابحث..."
                    emptyMessage="لا توجد نتائج"
                    fullWidth
                    className="text-right"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  {renderFieldLabel('related_guidance', 'التوجيه', 'text-sm font-medium text-gray-700')}
                  <Textarea
                    value={formData.related_guidance}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((p) => ({ ...p, related_guidance: e.target.value }))}
                    className="w-full min-h-24 bg-white border border-gray-300 rounded-lg shadow-sm text-right resize-y"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    placeholder="أدخل التوجيه..."
                  />
                </div>
              </div>
              {/* موعد الاجتماع – Figma: slot cards + gradient button */}
              <div className="flex flex-col gap-[8px] w-full">
                <div style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {renderFieldLabel('selected_time_slot_id', 'موعد الاجتماع', 'text-right text-[12.69px] leading-[19px] text-[#101828]')}
                </div>
                <div className="flex flex-row gap-4 flex-wrap items-center">
                  {suggestedTimes.length === 0 ? (
                    <div className="w-full text-center py-4 text-[#667085] text-sm">لا توجد أوقات متاحة</div>
                  ) : (
                    suggestedTimes.map((timeSlot) => (
                      <div key={timeSlot.id} className="flex flex-row items-center gap-2 px-2.5 py-2.5 bg-white border border-[#EEEEEE] rounded-[5px] shadow-[0px_4px_28px_rgba(0,0,0,0.06)] min-w-[160px]">
                        <button type="button" onClick={() => { setSuggestedTimes((prev) => prev.map((s) => (s.id === timeSlot.id ? { ...s, selected: !s.selected } : { ...s, selected: false }))); setScheduleForm((prev) => ({ ...prev, selected_time_slot_id: scheduleForm.selected_time_slot_id === timeSlot.id ? null : timeSlot.id })); }} className={`w-7 h-[15.34px] rounded-full flex transition-all cursor-pointer flex-shrink-0 ${timeSlot.selected ? 'bg-[#3FB2AE] justify-end' : 'bg-[#F2F4F7] justify-start'} p-[1.28px]`}><div className="w-3 h-3 rounded-full bg-white shadow-sm" /></button>
                        <span className="flex-1 text-right text-[10.23px] text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{timeSlot.time}</span>
                        <Calendar className="w-4 h-4 text-[#667085] flex-shrink-0" />
                      </div>
                    ))
                  )}
                  <button type="button" onClick={() => setIsMinisterCalendarOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-[7.59px] text-white font-bold text-xs shadow-[0px_0.95px_1.9px_rgba(16,24,40,0.05)] transition-opacity hover:opacity-90" style={{ fontFamily: "'Almarai', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)' }}><Calendar className="w-4 h-4" />اطلع على جدول الوزير</button>
                </div>
              </div>
              {/* الأهداف – Figma: table border #EAECF0, header #F9FAFB, trash #FFF4F4, add button gradient. Columns RTL: رقم البند | الهدف | إجراء */}
              <div className="flex flex-col gap-[10px] w-full">
                <div className="text-[12.69px] leading-[38px] text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {renderFieldLabel('objectives', 'الأهداف', 'text-right text-[12.69px] leading-[38px] text-[#101828]')}
                </div>
                {contentForm.objectives.length > 0 ? (
                  <div className="border border-[#EAECF0] rounded-[11.38px] overflow-hidden shadow-[0px_0.95px_2.85px_rgba(16,24,40,0.1),0px_0.95px_1.9px_rgba(16,24,40,0.06)] bg-white">
                    <DataTable
                      columns={[
                        { id: 'idx', header: 'رقم البند', width: 'w-[134px]', align: 'end', render: (_: any, i: number) => <span className="text-[15.17px] text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{i + 1}</span> },
                        { id: 'objective', header: 'الهدف', width: 'flex-1 min-w-[200px]', align: 'end', render: (obj: any, index: number) => (
                          <Input type="text" value={obj.objective} onChange={(e) => { const n = [...contentForm.objectives]; n[index] = { ...obj, objective: e.target.value }; setContentForm((p) => ({ ...p, objectives: n })); }} className="w-full min-h-9 text-right text-sm font-bold text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="الهدف" />
                        ) },
                        { id: 'act', header: 'إجراء', width: 'w-[108px]', align: 'center', render: (_: any, index: number) => (
                          <button type="button" onClick={() => setContentForm((p) => ({ ...p, objectives: p.objectives.filter((_, i) => i !== index) }))} className="flex items-center justify-center w-7 h-7 rounded-[5.57px] bg-[#FFF4F4] text-[#CA4545] hover:bg-[#FFE5E5]" title="حذف"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.16} /></button>
                        ) },
                      ] as TableColumn<any>[]}
                      data={contentForm.objectives}
                      className="border-none"
                      rowPadding="py-3"
                    />
                  </div>
                ) : null}
                <button type="button" onClick={() => setContentForm((p) => ({ ...p, objectives: [...p.objectives, { id: `obj-${Date.now()}`, objective: '' }] }))} className="flex items-center justify-center gap-2 px-4 py-2 rounded-[7.59px] text-white font-bold text-xs shadow-[0px_0.95px_1.9px_rgba(16,24,40,0.05)] transition-opacity hover:opacity-90 w-[242px]" style={{ fontFamily: "'Almarai', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)' }}><Plus className="w-5 h-5" />إضافة هدف</button>
              </div>
              {/* أجندة الاجتماع – Figma: same table style, "+ إضافة أجندة" */}
              <div className="flex flex-col gap-[10px] w-full">
                <div className="text-[12.69px] leading-[38px] text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {renderFieldLabel('agenda_items', 'أجندة الاجتماع', 'text-right text-[12.69px] leading-[38px] text-[#101828]')}
                </div>
                {contentForm.agendaItems.length > 0 ? (
                  <div className="border border-[#EAECF0] rounded-[11.38px] overflow-hidden shadow-[0px_0.95px_2.85px_rgba(16,24,40,0.1),0px_0.95px_1.9px_rgba(16,24,40,0.06)] bg-white">
                    <DataTable
                      columns={[
                        { id: 'idx', header: 'رقم البند', width: 'w-[134px]', align: 'end', render: (_: any, i: number) => <span className="text-[15.17px] text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{i + 1}</span> },
                        { id: 'agenda_item', header: 'بند جدول الأعمال', width: 'flex-1 min-w-[200px]', align: 'end', render: (item: any, index: number) => (
                          <Input type="text" value={item.agenda_item} onChange={(e) => { const n = [...contentForm.agendaItems]; n[index] = { ...item, agenda_item: e.target.value }; setContentForm((p) => ({ ...p, agendaItems: n })); }} className="w-full min-h-9 text-right text-sm font-bold text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="عنوان البند" />
                        ) },
                        { id: 'act', header: 'إجراء', width: 'w-[108px]', align: 'center', render: (_: any, index: number) => (
                          <button type="button" onClick={() => setContentForm((p) => ({ ...p, agendaItems: p.agendaItems.filter((_, i) => i !== index) }))} className="flex items-center justify-center w-7 h-7 rounded-[5.57px] bg-[#FFF4F4] text-[#CA4545] hover:bg-[#FFE5E5]" title="حذف"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.16} /></button>
                        ) },
                      ] as TableColumn<any>[]}
                      data={contentForm.agendaItems}
                      className="border-none"
                      rowPadding="py-3"
                    />
                  </div>
                ) : null}
                <button type="button" onClick={() => setContentForm((p) => ({ ...p, agendaItems: [...p.agendaItems, { id: `agenda-${Date.now()}`, agenda_item: '', presentation_duration_minutes: undefined }] }))} className="flex items-center justify-center gap-2 px-4 py-2 rounded-[7.59px] text-white font-bold text-xs shadow-[0px_0.95px_1.9px_rgba(16,24,40,0.05)] transition-opacity hover:opacity-90 w-[242px]" style={{ fontFamily: "'Almarai', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)' }}><Plus className="w-5 h-5" />إضافة أجندة</button>
              </div>
              <Dialog open={isMinisterCalendarOpen} onOpenChange={setIsMinisterCalendarOpen}>
                <DialogContent className="max-w-[850px] w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-right text-2xl font-bold mb-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>جدول الوزير</DialogTitle></DialogHeader>
                  <div className="py-4"><MinisterCalendarView extraEvents={highlightedEvents} initialDate={selectedSlotDate} /></div>
                  <DialogFooter className="sm:justify-start"><button type="button" onClick={() => setIsMinisterCalendarOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إغلاق</button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Tab: المحتوى (Excel التبويب) – اسم الحقل: العرض التقديمي، متى سيتم إرفاق العرض؟، مرفقات اختيارية، ملاحظات */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6 w-full" dir="rtl">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>العرض التقديمي</label>
                <TooltipProvider>
                <div className="flex flex-row gap-4 flex-wrap">
                  {(meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).map((att) => (
                    <div key={att.id} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-[#009883] rounded-xl">
                      {att.file_type?.toLowerCase() === 'pdf' ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{att.file_type?.toUpperCase() || ''}</div>}
                      <div className="flex flex-col items-end"><span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{att.file_name}</span><span className="text-xs text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{Math.round((att.file_size || 0) / 1024)} KB</span></div>
                      <div className="flex items-center gap-2 mr-auto">
                        {att.replaces_attachment_id != null && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => { setComparePresentationsResult(null); setCompareErrorDetail(null); setIsComparePresentationsModalOpen(true); compareByAttachmentMutation.mutate(att.id); }}
                                disabled={compareByAttachmentMutation.isPending}
                                className="p-2 rounded-lg hover:bg-[#009883]/10 text-[#009883] disabled:opacity-50"
                              >
                                <GitCompare className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-right">
                              <p>مقارنة</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)]"><Download className="w-4 h-4 text-[#009883]" /></a><button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-[#475467]" /></button><button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {newPresentationAttachments.map((file, idx) => (
                    <div key={`new-pres-${idx}`} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-dashed border-[#009883] rounded-xl">
                      {file.name.toLowerCase().endsWith('pdf') ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>}
                      <div className="flex flex-col items-end"><span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{file.name}</span><span className="text-xs text-[#048F86]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>جديد</span></div>
                      <button type="button" onClick={() => handleRemoveNewPresentationAttachment(idx)} className="mr-auto p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {(meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).length === 0 && newPresentationAttachments.length === 0 && (
                    <p className="text-[#667085] text-sm py-2">لا يوجد عرض تقديمي</p>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[#009883] rounded-xl text-[#009883] hover:bg-[#009883]/5 cursor-pointer" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}><Plus className="w-4 h-4" />إضافة عرض تقديمي<input type="file" multiple onChange={(e) => { handleAddPresentationAttachments(e.target.files); e.target.value = ''; }} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>
                </div>
                </TooltipProvider>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>متى سيتم إرفاق العرض؟</label>
                <Input type="text" value={contentTabForm.when_presentation_attached} onChange={(e) => setContentTabForm((p) => ({ ...p, when_presentation_attached: e.target.value }))} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="متى سيتم إرفاق العرض؟" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مرفقات اختيارية</label>
                <div className="flex flex-row gap-4 flex-wrap">
                  {(meeting?.attachments || []).filter((a) => !a.is_presentation && !deletedAttachmentIds.includes(a.id)).map((att) => (
                    <div key={att.id} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-gray-300 rounded-xl">
                      {att.file_type?.toLowerCase() === 'pdf' ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{att.file_type?.toUpperCase() || ''}</div>}
                      <div className="flex flex-col items-end"><span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{att.file_name}</span><span className="text-xs text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{Math.round((att.file_size || 0) / 1024)} KB</span></div>
                      <div className="flex items-center gap-2 mr-auto"><a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)]"><Download className="w-4 h-4 text-[#009883]" /></a><button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-[#475467]" /></button><button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  ))}
                  {newAttachments.map((file, idx) => (
                    <div key={`new-${idx}`} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-dashed border-[#048F86] rounded-xl">
                      <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                      <div className="flex flex-col items-end"><span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{file.name}</span><span className="text-xs text-[#048F86]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>جديد</span></div>
                      <button type="button" onClick={() => handleRemoveNewAttachment(idx)} className="mr-auto p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-[#048F86] rounded-xl text-[#048F86] hover:bg-[#048F86]/5 cursor-pointer" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}><Plus className="w-4 h-4" />إضافة مرفق<input type="file" multiple onChange={(e) => handleAddAttachments(e.target.files)} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {renderFieldLabel('general_notes', 'ملاحظات', 'text-sm font-medium text-gray-700')}
                <div className="w-full min-h-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {generalNotesList.length > 0
                    ? generalNotesList.map((n) => n.text).join('\n\n')
                    : contentTabForm.general_notes || '—'}
                </div>
              </div>

              {/* Compare presentations result modal (تقييم الاختلاف بين العروض) */}
              <Dialog open={isComparePresentationsModalOpen} onOpenChange={setIsComparePresentationsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تقييم الاختلاف بين العروض
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {compareByAttachmentMutation.isPending ? (
                      <p className="text-center text-gray-500 py-6">جاري تقييم الاختلاف بين العروض...</p>
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
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 text-sm">رؤى الذكاء الاصطناعي</span>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                              {JSON.stringify(comparePresentationsResult.ai_insights, null, 2)}
                            </pre>
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
                      onClick={() => { setIsComparePresentationsModalOpen(false); setComparePresentationsResult(null); setCompareErrorDetail(null); }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      إغلاق
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Tab: قائمة المدعوين (Excel) – قائمة المدعوين (مقدم الطلب)، قائمة المدعوين (الوزير) */}
          {activeTab === 'attendees' && (
            <div className="flex flex-col items-stretch gap-6 w-full" dir="rtl">
              <div className="flex flex-col gap-6 w-full">
                <div className="flex flex-col gap-2 w-full min-w-0">
                  <div className="w-full min-w-0 min-h-[38px] flex items-center justify-end" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '22px', lineHeight: '38px' }}>
                    {renderFieldLabel('invitees', 'قائمة المدعوين (مقدّم الطلب)', 'text-right font-bold text-[#101828]')}
                  </div>
                  <div className="w-full overflow-x-auto table-scroll min-w-0">
                    <div className="min-w-full">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم البند',
                            width: 'w-[100px]',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <span className="text-sm text-[#475467]">{index + 1}</span>
                            ),
                          },
                          {
                            id: 'name',
                            header: 'الإسم',
                            width: 'w-[180px]',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                const err = inviteeValidationErrors[row.id]?.external_name;
                                return (
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <Input
                                      type="text"
                                      value={row.external_name || ''}
                                      onChange={(e) => { e.stopPropagation(); updateLocalInvitee(row.id, 'external_name', e.target.value); }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="الإسم *"
                                      className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                    />
                                    {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                  </div>
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.external_name || row.user_id || '—'}</span>;
                            },
                          },
                          {
                            id: 'position',
                            header: 'المنصب',
                            width: 'w-[160px]',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                const err = inviteeValidationErrors[row.id]?.position;
                                return (
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <Input
                                      type="text"
                                      value={row.position || ''}
                                      onChange={(e) => { e.stopPropagation(); updateLocalInvitee(row.id, 'position', e.target.value); }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="المنصب *"
                                      className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                    />
                                    {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                  </div>
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.position || '—'}</span>;
                            },
                          },
                          {
                            id: 'phone',
                            header: 'الجوال',
                            width: 'w-[140px]',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                const err = inviteeValidationErrors[row.id]?.phone;
                                return (
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <Input
                                      type="text"
                                      value={row.phone || ''}
                                      onChange={(e) => { e.stopPropagation(); updateLocalInvitee(row.id, 'phone', e.target.value); }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="الجوال *"
                                      className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                    />
                                    {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                  </div>
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.phone || '—'}</span>;
                            },
                          },
                          {
                            id: 'email',
                            header: 'البريد الإلكتروني',
                            width: 'w-[200px]',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                const err = inviteeValidationErrors[row.id]?.external_email;
                                return (
                                  <div className="flex flex-col gap-0.5 w-full">
                                    <Input
                                      type="email"
                                      value={row.external_email || ''}
                                      onChange={(e) => { e.stopPropagation(); updateLocalInvitee(row.id, 'external_email', e.target.value); }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="البريد الإلكتروني *"
                                      className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                    />
                                    {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                  </div>
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.external_email || '—'}</span>;
                            },
                          },
                          {
                            id: 'attendance_channel',
                            header: 'آلية الحضور',
                            width: 'w-[140px]',
                            align: 'center',
                            render: (row: any) => {
                              const val = row.attendance_channel || 'PHYSICAL';
                              if (row.isLocal) {
                                return (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Select value={val} onValueChange={(v) => updateLocalInvitee(row.id, 'attendance_channel', v as AttendanceChannel)}>
                                      <SelectTrigger className="h-9 bg-white border border-gray-300 rounded-lg text-right flex-row-reverse w-full" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent dir="rtl">
                                        <SelectItem value="PHYSICAL">حضوري</SelectItem>
                                        <SelectItem value="REMOTE">عن بعد</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              return <span className="text-sm text-[#475467]">{val === 'REMOTE' ? 'عن بعد' : 'حضوري'}</span>;
                            },
                          },
                          {
                            id: 'access_permission',
                            header: 'صلاحية الاطلاع',
                            width: 'w-[120px]',
                            align: 'center',
                            render: (row: any) => {
                              const checked = !!row.access_permission;
                              if (row.isLocal) {
                                return (
                                  <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => updateLocalInvitee(row.id, 'access_permission', e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300 text-[#048F86] focus:ring-[#048F86]"
                                    />
                                  </div>
                                );
                              }
                              return (
                                <span className="text-sm text-[#475467]">{checked ? 'نعم' : 'لا'}</span>
                              );
                            },
                          },
                          {
                            id: 'action',
                            header: 'إجراء',
                            width: 'w-[100px]',
                            align: 'center',
                            render: (row: any) => (
                              <div className="flex items-center justify-center w-full">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setDeleteInviteeId(row.id); }}
                                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#FFF4F4] hover:bg-[#FFE5E5] transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-[#CA4545]" />
                                </button>
                              </div>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={allInvitees}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-start mt-3">
                    <button
                      type="button"
                      onClick={addInvitee}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-[8px] shadow-sm text-[#344054]"
                      style={{
                        fontFamily: "'Ping AR + LT', sans-serif",
                        fontWeight: 700,
                        fontSize: '16px',
                        lineHeight: '24px',
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مدعو جديد
                    </button>
                  </div>
                </div>

                {/* قائمة المدعوين (الوزير) */}
                <div className="flex flex-col gap-2 w-full min-w-0">
                  <div className="w-full min-w-0 min-h-[38px] flex items-center justify-end" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '22px', lineHeight: '38px' }}>
                    {renderFieldLabel('minister_attendees', 'قائمة المدعوين (الوزير)', 'text-right font-bold text-[#101828]')}
                  </div>
                  <div className="w-full overflow-x-auto table-scroll min-w-0">
                    <div className="min-w-[1400px]">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم البند',
                            width: 'w-[80px]',
                            align: 'center',
                            render: (_row: any, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                          },
                          {
                            id: 'username',
                            header: 'اسم المستخدم',
                            width: 'w-[140px]',
                            align: 'end',
                            render: (row: any, index: number) => (
                              <Input
                                type="text"
                                value={row.username || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateMinisterAttendee(index, 'username', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="اسم المستخدم"
                                className="h-9 text-right w-full"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              />
                            ),
                          },
                          {
                            id: 'name',
                            header: 'الإسم (خارجي)',
                            width: 'w-[160px]',
                            align: 'end',
                            render: (row: any, index: number) => {
                              const err = ministerAttendeeValidationErrors[index]?.external_name;
                              return (
                                <div className="flex flex-col gap-0.5 w-full">
                                  <Input
                                    type="text"
                                    value={row.external_name || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateMinisterAttendee(index, 'external_name', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="الإسم *"
                                    className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                  {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                </div>
                              );
                            },
                          },
                          {
                            id: 'position',
                            header: 'المنصب',
                            width: 'w-[160px]',
                            align: 'end',
                            render: (row: any, index: number) => {
                              const err = ministerAttendeeValidationErrors[index]?.position;
                              return (
                                <div className="flex flex-col gap-0.5 w-full">
                                  <Input
                                    type="text"
                                    value={row.position || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateMinisterAttendee(index, 'position', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="المنصب *"
                                    className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                  {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                </div>
                              );
                            },
                          },
                          {
                            id: 'phone',
                            header: 'الجوال',
                            width: 'w-[140px]',
                            align: 'end',
                            render: (row: any, index: number) => {
                              const err = ministerAttendeeValidationErrors[index]?.phone;
                              return (
                                <div className="flex flex-col gap-0.5 w-full">
                                  <Input
                                    type="text"
                                    value={row.phone || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateMinisterAttendee(index, 'phone', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="الجوال *"
                                    className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                  {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                </div>
                              );
                            },
                          },
                          {
                            id: 'email',
                            header: 'البريد الإلكتروني',
                            width: 'w-[200px]',
                            align: 'end',
                            render: (row: any, index: number) => {
                              const err = ministerAttendeeValidationErrors[index]?.external_email;
                              return (
                                <div className="flex flex-col gap-0.5 w-full">
                                  <Input
                                    type="email"
                                    value={row.external_email || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateMinisterAttendee(index, 'external_email', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="البريد الإلكتروني *"
                                    className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                  {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                </div>
                              );
                            },
                          },
                          {
                            id: 'attendance_channel',
                            header: 'آلية الحضور',
                            width: 'w-[140px]',
                            align: 'center',
                            render: (row: any, index: number) => {
                              const val = row.attendance_channel || 'PHYSICAL';
                              return (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Select value={val} onValueChange={(v) => updateMinisterAttendee(index, 'attendance_channel', v)}>
                                    <SelectTrigger className="h-9 bg-white border border-gray-300 rounded-lg text-right flex-row-reverse w-full" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                      <SelectItem value="PHYSICAL">حضوري</SelectItem>
                                      <SelectItem value="REMOTE">عن بعد</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            },
                          },
                          {
                            id: 'access_permission',
                            header: 'صلاحية الاطلاع',
                            width: 'w-[120px]',
                            align: 'center',
                            render: (row: any, index: number) => {
                              const checked = row.access_permission === 'FULL';
                              return (
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => updateMinisterAttendee(index, 'access_permission', e.target.checked ? 'FULL' : 'READ_ONLY')}
                                    className="w-4 h-4 rounded border-gray-300 text-[#048F86] focus:ring-[#048F86]"
                                  />
                                </div>
                              );
                            },
                          },
                          {
                            id: 'is_required',
                            header: 'مطلوب',
                            width: 'w-[90px]',
                            align: 'center',
                            render: (row: any, index: number) => (
                              <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={!!row.is_required}
                                  onChange={(e) => updateMinisterAttendee(index, 'is_required', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-[#048F86] focus:ring-[#048F86]"
                                />
                              </div>
                            ),
                          },
                          {
                            id: 'justification',
                            header: 'المبرر',
                            width: 'w-[160px]',
                            align: 'end',
                            render: (row: any, index: number) => {
                              const err = ministerAttendeeValidationErrors[index]?.justification;
                              return (
                                <div className="flex flex-col gap-0.5 w-full">
                                  <Input
                                    type="text"
                                    value={row.justification || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateMinisterAttendee(index, 'justification', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="المبرر *"
                                    className={`h-9 text-right w-full ${err ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                  {err && <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{err}</span>}
                                </div>
                              );
                            },
                          },
                          {
                            id: 'action',
                            header: 'إجراء',
                            width: 'w-[100px]',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteAttendeeIndex(index);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#FFF4F4] hover:bg-[#FFE5E5] transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-[#CA4545]" />
                              </button>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={scheduleForm.minister_attendees}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-start mt-3">
                    <button
                      type="button"
                      onClick={addMinisterAttendee}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-[8px] shadow-sm text-[#344054]"
                      style={{
                        fontWeight: 700,
                        fontSize: '16px',
                        lineHeight: '24px',
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مدعو جديد
                    </button>
                    <AIGenerateButton 
                    className='mr-4'
                    label='	إضافة مدعوين آليًا'
                    onClick={() => {
                      setIsSuggestAttendeesModalOpen(true);
                    }} 
                    />
                  </div>
               
                </div>
              </div>
            </div>
          )}

          {/* Consultations Log → استشارة الجدولة - Collapsible cards */}
          {activeTab === 'scheduling-consultation' && (
            <div className="flex flex-col gap-4 w-full" dir="rtl">
              {meetingStatus !== MeetingStatus.WAITING && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConsultationModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
                  >
                    <ClipboardCheck className="w-5 h-5" strokeWidth={1.26} />
                    طلب استشارة
                  </button>
                </div>
              )}
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                consultationRecords.items.map((row: ConsultationRecord, index: number) => {
                  const isExpanded = expandedConsultationId === row.consultation_id;
                  const typeLabel = row.consultation_type === 'SCHEDULING' ? 'جدولة' : row.consultation_type === 'CONTENT' ? 'محتوى' : row.consultation_type;
                  const requestDate = new Date(row.requested_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const answers = row.consultation_answers ?? [];

                  return (
                    <div key={`consultation-${row.consultation_id}-${index}`} className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => setExpandedConsultationId((id) => (id === row.consultation_id ? null : row.consultation_id))}
                        className={`
                          w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2
                          ${isExpanded
                            ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}
                        `}
                        style={{ fontFamily: "'Almarai', 'Ping AR + LT', sans-serif" }}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <p className="text-base font-bold text-[#048F86] mb-1">{typeLabel}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{row.consultation_question}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>تاريخ الطلب : {requestDate}</span>
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && answers.length > 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          {answers.map((_, index) =>
                             <div className={"flex flex-shrink-0 w-12 flex-col items-center pt-1 "} 
                              
                              style={index > 0 ? {
                                position: 'absolute',
                                top: `${47 * index}px`,
                                height: `${136 * index}px`,
                              } : {}}
                              >
                              <div className={`w-[50px] -ml-[30px]  min-h-[8px] flex-1  border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[38px] max-h-[60%]`} />
                              <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                            </div>
                        )}
                          <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                            {answers.map((answer) => {
                              const responseDate = answer.responded_at
                                ? new Date(answer.responded_at).toLocaleDateString('ar-SA', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—';
                              const statusLabels: Record<string, string> = {
                                PENDING: 'قيد الانتظار',
                                RESPONDED: 'تم الرد',
                                CANCELLED: 'ملغاة',
                                COMPLETED: 'مكتمل',
                              };
                              const statusLabel = statusLabels[answer.status] || answer.status;
                              return (
                                <div
                                  key={answer.consultation_id}
                                  className="flex h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4"
                                  style={{ fontFamily: "'Almarai', 'Ping AR + LT', sans-serif" }}
                                >
                                  <div className="flex w-full flex-row items-center justify-between gap-4">
                                    <p className="min-w-0 flex-1 truncate text-right text-sm text-gray-700">
                                      {answer.consultation_answer?.trim() || '—'}
                                    </p>
                                    <StatusBadge status={answer.status} label={statusLabel} />
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">
                                      {row.consultant_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="flex-shrink-0 text-sm text-gray-700">{row.consultant_name || '—'}</span>
                                  
                                    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                      <Clock className="h-4 w-4 flex-shrink-0" />
                                      <span>تاريخ الرد : {responseDate}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {isExpanded && answers.length === 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                            <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                            <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                          </div>
                          <div
                            className="z-[2] mt-4 flex h-[44px] min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 mb-4"
                            style={{ fontFamily: "'Almarai', 'Ping AR + LT', sans-serif" }}
                          >
                            <p className="w-full text-right text-sm text-gray-500">لا يوجد رد بعد</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600 text-lg mb-2">سجل الإستشارات</p>
                    <p className="text-gray-500 text-sm">لا توجد استشارات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* التوجيه tab */}
          {activeTab === 'directive' && (
            <div className="flex flex-col gap-4">
              {meetingStatus !== MeetingStatus.WAITING && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRequestGuidanceModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
                  >
                    <FileCheck className="w-5 h-5" strokeWidth={1.26} />
                    طلب توجيه
                  </button>
                </div>
              )}
              {isLoadingGuidanceRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      id: 'guidance_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.guidance_question}
                        </span>
                      ),
                    },
                    {
                      id: 'guidance_answer',
                      header: 'الإجابة',
                      width: 'flex-1',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.guidance_answer || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_by_name',
                      header: 'طلب بواسطة',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.requested_by_name}
                        </span>
                      ),
                    },
                    {
                      id: 'responded_by_name',
                      header: 'رد بواسطة',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.responded_by_name || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_at',
                      header: 'تاريخ الطلب',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => {
                        const date = new Date(row.requested_at);
                        const formattedDate = date.toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {formattedDate}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'responded_at',
                      header: 'تاريخ الرد',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => {
                        if (!row.responded_at) {
                          return (
                            <span className="text-sm text-gray-400" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              -
                            </span>
                          );
                        }
                        const date = new Date(row.responded_at);
                        const formattedDate = date.toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {formattedDate}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'status',
                      header: 'الحالة',
                      width: 'w-32',
                      align: 'center',
                      render: (row: GuidanceRecord) => {
                        const statusLabels: Record<string, string> = {
                          PENDING: 'قيد الانتظار',
                          RESPONDED: 'تم الرد',
                          CANCELLED: 'ملغاة',
                        };
                        const statusLabel = statusLabels[row.status] || row.status;
                        return (
                          <div className="flex justify-center">
                            <StatusBadge status={row.status} label={statusLabel} />
                          </div>
                        );
                      },
                    },
                  ]}
                  data={guidanceRecords.items}
                  rowPadding="py-3"
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600 text-lg mb-2">التوجيه</p>
                    <p className="text-gray-500 text-sm">لا توجد توجيهات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Officer Notes Tab – الملخص التنفيذي + الملاحظات (preview) + notes table */}
          {activeTab === 'content-consultation' && (
            <div className="flex flex-col gap-6 w-full" dir="rtl">
              {isLoadingContentOfficerNotes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : (
                <>
                  {/* الملخص التنفيذي – preview only (text + file preview cards for is_executive_summary attachments) */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الملخص التنفيذي
                    </h3>
                    {(() => {
                      const textSummary =
                        meeting?.executive_summary != null && String(meeting.executive_summary).trim() !== ''
                          ? String(meeting.executive_summary)
                          : contentOfficerNotesRecords?.items?.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY')
                            ? (contentOfficerNotesRecords.items.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY') as any)?.text ?? (contentOfficerNotesRecords.items.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY') as any)?.note_answer ?? ''
                            : '';
                      const executiveSummaryAttachments = (meeting?.attachments ?? []).filter((a) => a.is_executive_summary === true);
                      const hasContent = textSummary || executiveSummaryAttachments.length > 0;
                      if (!hasContent) {
                        return (
                          <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            —
                          </div>
                        );
                      }
                      return (
                        <>
                          {textSummary ? (
                            <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              {textSummary}
                            </div>
                          ) : null}
                          {executiveSummaryAttachments.length > 0 && (
                            <div className="flex flex-row gap-4 flex-wrap">
                              {executiveSummaryAttachments.map((att) => (
                                <div key={att.id} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-gray-300 rounded-xl">
                                  {att.file_type?.toLowerCase() === 'pdf' ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{att.file_type?.toUpperCase() || ''}</div>}
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{att.file_name}</span>
                                    <span className="text-xs text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{Math.round((att.file_size || 0) / 1024)} KB</span>
                                  </div>
                                  <div className="flex items-center gap-2 mr-auto">
                                    <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)]" title="تحميل"><Download className="w-4 h-4 text-[#009883]" /></a>
                                    <button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-gray-100" title="معاينة"><Eye className="w-4 h-4 text-[#475467]" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* الملاحظات – preview only */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الملاحظات
                    </h3>
                    <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {(() => {
                        const raw: unknown = meeting?.content_officer_notes;
                        if (raw == null) return '—';
                        if (typeof raw === 'string') return raw;
                        if (Array.isArray(raw)) return raw.map((n: any) => (n && typeof n === 'object' && typeof n.text === 'string' ? n.text : String(n?.text ?? '')).trim()).filter(Boolean).join('\n\n') || '—';
                        if (typeof raw === 'object' && raw !== null && 'text' in raw) return (raw as { text?: string }).text ?? '—';
                        return '—';
                      })()}
                    </div>
                  </div>

                  {/* Content officer notes – card design (same as الملاحظات على الطلب) */}
                  {contentOfficerNotesTableData.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>ملاحظات مسؤول المحتوى</p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: "'Almarai', sans-serif" }}>لا توجد ملاحظات مسجلة</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[10px] w-full">
                      <h3 className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        ملاحظات مسؤول المحتوى
                      </h3>
                      {contentOfficerNotesTableData.map((row) => {
                        const question = (row.note_question && typeof row.note_question === 'string') ? row.note_question : '';
                        const answer = (row.note_answer && typeof row.note_answer === 'string') ? row.note_answer : '';
                        const authorName = typeof row.author_name === 'string' ? row.author_name : String(row.author_name || '—');
                        const createdAt = typeof row.created_at === 'string' ? row.created_at : String(row.created_at || '');
                        const dateValid = createdAt ? !isNaN(new Date(createdAt).getTime()) : false;
                        const formattedDate = dateValid ? new Date(createdAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '—';
                        return (
                          <div
                            key={row.id}
                            className="flex flex-col justify-center items-center p-[3px] gap-[10px] w-full rounded-[9.26px]"
                            style={{ background: '#E6ECF5' }}
                          >
                            <div
                              className="flex flex-col items-end w-full py-[10px] px-[8.5px] gap-[7.13px] rounded-[8.05px] bg-white"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              <div className="flex flex-row justify-between items-start w-full gap-[15px]">
                                <div className="flex flex-col justify-center items-end gap-[4.28px] min-w-0 flex-1">
                                  <span className="text-[15.67px] font-bold leading-5 text-right" style={{ color: '#383838', fontFamily: "'Almarai', sans-serif" }}>
                                    {authorName}
                                  </span>
                                  {question ? (
                                    <p className="text-[10px] leading-[11px] text-right" style={{ color: '#18192B', fontFamily: "'Almarai', sans-serif" }}>
                                      {question}
                                    </p>
                                  ) : null}
                                  {answer ? (
                                    <p className="text-[10px] leading-[11px] text-right whitespace-pre-wrap" style={{ color: '#18192B', fontFamily: "'Almarai', sans-serif" }}>
                                      {answer}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-row justify-between items-center gap-3 flex-shrink-0">
                                  <div className="flex flex-row justify-center items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(0, 167, 157, 0.06)' }}>
                                    <span className="text-[10px] leading-[11px]" style={{ color: '#00A79D', fontFamily: "'Almarai', sans-serif" }}>
                                      مكتمل
                                    </span>
                                  </div>
                                  <div className="flex flex-row justify-center items-center gap-2">
                                    <span className="text-[9px] leading-[10px] text-right" style={{ color: '#2C2C2C', fontFamily: "'Almarai', sans-serif" }}>
                                      تاريخ الطلب : {formattedDate}
                                    </span>
                                    <Clock className="w-3 h-3 text-[#475467]" strokeWidth={1.08} aria-hidden />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: توثيق الاجتماع (only when status is SCHEDULED) – محضر الاجتماع، الحضور الفعلي، التوجيهات المرتبطة بالاجتماع */}
          {activeTab === 'meeting-documentation' && (
            <div className="flex flex-col gap-8 w-full" dir="rtl">
              <div className="flex flex-col gap-2">
                <h2 className="text-right font-bold text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '18px' }}>محضر الاجتماع</h2>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {(meeting as any)?.previous_meeting_minutes_id ? (previousMeetingMinutesOption?.label ?? (meeting as any).previous_meeting_minutes_id) : '-'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-right font-bold text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '18px' }}>الحضور الفعلي</h2>
                {meeting?.minister_attendees && meeting.minister_attendees.length > 0 ? (
                  <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
                    <DataTable
                      columns={[
                        {
                          id: 'index',
                          header: 'رقم البند',
                          width: 'w-20',
                          align: 'center',
                          render: (_row: MinisterAttendee, index: number) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{index + 1}</span>
                          ),
                        },
                        {
                          id: 'username',
                          header: 'اسم المستخدم',
                          width: 'w-32',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.username || '-'}</span>
                          ),
                        },
                        {
                          id: 'external_name',
                          header: 'الإسم (خارجي)',
                          width: 'w-36',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.external_name || '-'}</span>
                          ),
                        },
                        {
                          id: 'external_email',
                          header: 'البريد الإلكتروني',
                          width: 'w-44',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.external_email || '-'}</span>
                          ),
                        },
                        {
                          id: 'position',
                          header: 'المنصب',
                          width: 'w-32',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.position || '-'}</span>
                          ),
                        },
                        {
                          id: 'phone',
                          header: 'الجوال',
                          width: 'w-28',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.phone || '-'}</span>
                          ),
                        },
                        {
                          id: 'attendance_channel',
                          header: 'آلية الحضور',
                          width: 'w-24',
                          align: 'center',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              {row.attendance_channel === 'REMOTE' ? 'عن بعد' : row.attendance_channel === 'PHYSICAL' ? 'حضوري' : '-'}
                            </span>
                          ),
                        },
                        {
                          id: 'access_permission',
                          header: 'صلاحية الاطلاع',
                          width: 'w-28',
                          align: 'center',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              {row.access_permission === 'FULL' ? 'كامل' : row.access_permission === 'READ_ONLY' ? 'قراءة فقط' : row.access_permission || '-'}
                            </span>
                          ),
                        },
                        {
                          id: 'is_required',
                          header: 'مطلوب',
                          width: 'w-24',
                          align: 'center',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              {row.is_required != null ? (row.is_required ? 'نعم' : 'لا') : '-'}
                            </span>
                          ),
                        },
                        {
                          id: 'justification',
                          header: 'المبرر',
                          width: 'w-40',
                          align: 'end',
                          render: (row: MinisterAttendee) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.justification || '-'}</span>
                          ),
                        },
                      ]}
                      data={meeting.minister_attendees}
                      rowPadding="py-3"
                    />
                  </div>
                ) : (
                  <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>لا يوجد حضور مسجل</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-right font-bold text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '18px' }}>التوجيهات المرتبطة بالاجتماع</h2>
                {meeting?.related_directive_ids && meeting.related_directive_ids.length > 0 ? (
                  <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
                    <DataTable
                      columns={[
                        {
                          id: 'index',
                          header: 'رقم البند',
                          width: 'w-28',
                          align: 'center',
                          render: (_row: { id: string }, index: number) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{index + 1}</span>
                          ),
                        },
                        {
                          id: 'directive_id',
                          header: 'معرف التوجيه',
                          width: 'flex-1',
                          align: 'end',
                          render: (row: { id: string }) => (
                            <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{row.id}</span>
                          ),
                        },
                      ]}
                      data={meeting.related_directive_ids.map((id) => ({ id }))}
                      rowPadding="py-3"
                    />
                  </div>
                ) : (
                  <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>لا توجد توجيهات مرتبطة</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Corner FAB: fixed in corner (RTL-aware), tap to show action bubbles */}
        {meeting && (meeting.status === MeetingStatus.UNDER_REVIEW || meeting.status === MeetingStatus.WAITING || meeting.status === MeetingStatus.SCHEDULED) && (
          <>
            {actionsBarOpen && (
              <button
                type="button"
                aria-label="إغلاق"
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                onClick={() => setActionsBarOpen(false)}
              />
            )}
            {/* Anchor: fixed size so main FAB stays in exact same spot open or closed */}
            <div
              className="fixed bottom-6 z-50 w-14 h-14 right-6 rtl:right-auto rtl:left-6"
              dir="ltr"
            >
              {/* Action bubbles: absolutely above main FAB, same corner alignment */}
              {actionsBarOpen && (
                <div
                  className="absolute bottom-full flex flex-col-reverse gap-3 mb-2 right-0 rtl:right-auto rtl:left-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                >
                  {/* SCHEDULED */}
                  {meetingStatus === MeetingStatus.SCHEDULED && (
                    <>
                      <ActionBubble icon={<CalendarMinus className="w-5 h-5" strokeWidth={1.26} />} label="جدولة مجدداً" onClick={() => { setActionsBarOpen(false); setIsScheduleModalOpen(true); }} />
                      <ActionBubble icon={<Plus className="w-5 h-5" strokeWidth={1.26} />} label={moveToWaitingListMutation.isPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار'} onClick={() => { setActionsBarOpen(false); moveToWaitingListMutation.mutate(); }} disabled={moveToWaitingListMutation.isPending} disabledReason="جاري المعالجة، انتظر قليلاً" />
                      <ActionBubble icon={<X className="w-5 h-5" strokeWidth={1.26} />} label="إلغاء" variant="danger" onClick={() => { setActionsBarOpen(false); setIsRejectModalOpen(true); }} />
                    </>
                  )}
                  {/* WAITING */}
                  {meetingStatus === MeetingStatus.WAITING && (
                    <>
                      <ActionBubble icon={<X className="w-5 h-5" strokeWidth={1.26} />} label="إلغاء" variant="danger" onClick={() => { setActionsBarOpen(false); setIsRejectModalOpen(true); }} />
                      <ActionBubble icon={<CalendarMinus className="w-5 h-5" strokeWidth={1.26} />} label="جدولة" onClick={() => { setActionsBarOpen(false); setIsScheduleModalOpen(true); }} />
                    </>
                  )}
                  {/* UNDER_REVIEW */}
                  {meetingStatus === MeetingStatus.UNDER_REVIEW && (
                    <>
                      <ActionBubble icon={<CalendarMinus className="w-5 h-5" strokeWidth={1.26} />} label="جدولة" onClick={() => { setActionsBarOpen(false); setIsScheduleModalOpen(true); }} />
                      <ActionBubble icon={<Pencil className="w-5 h-5" strokeWidth={1.26} />} label="تعديل" onClick={() => { setActionsBarOpen(false); setIsEditConfirmOpen(true); }} disabled={!hasChanges} disabledReason="لا يوجد تغييرات لحفظها" />
                      <ActionBubble icon={<RotateCcw className="w-5 h-5" strokeWidth={1.26} />} label="إعادة للطلب" onClick={() => { setActionsBarOpen(false); setIsReturnForInfoModalOpen(true); }} />
                      <ActionBubble icon={<Send className="w-5 h-5" strokeWidth={1.26} />} label="إرسال للمحتوى" onClick={() => { setActionsBarOpen(false); hasContent && setIsSendToContentModalOpen(true); }} disabled={!hasContent} disabledReason="أضف أهدافاً أو بنود أجندة وعرضاً تقديمياً في تبويب المحتوى لتفعيل الإرسال" />
                      <ActionBubble icon={<Plus className="w-5 h-5" strokeWidth={1.26} />} label={moveToWaitingListMutation.isPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار'} onClick={() => { setActionsBarOpen(false); moveToWaitingListMutation.mutate(); }} disabled={moveToWaitingListMutation.isPending} disabledReason="جاري المعالجة، انتظر قليلاً" />
                      <ActionBubble icon={<X className="w-5 h-5" strokeWidth={1.26} />} label="رفض" variant="danger" onClick={() => { setActionsBarOpen(false); setIsRejectModalOpen(true); }} />
                    </>
                  )}
                </div>
              )}
              {/* Main FAB: always same position (absolute to corner of anchor) */}
              <button
                type="button"
                aria-label={actionsBarOpen ? 'إغلاق القائمة' : 'إجراءات سريعة'}
                aria-expanded={actionsBarOpen}
                onClick={() => setActionsBarOpen((o) => !o)}
                className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                style={{
                  background: actionsBarOpen ? 'rgb(229 231 235)' : 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Zap className="w-6 h-6 text-[#048F86]" strokeWidth={2} />
              </button>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Meeting Quality Modal */}
     <QualityModal 
       isOpen={isQualityModalOpen} 
       onOpenChange={setIsQualityModalOpen} 
       meetingId={id || ''}
     />

      {/* Suggest Attendees Modal */}
      {meeting && (
        <SuggestAttendeesModal
          isOpen={isSuggestAttendeesModalOpen}
          onOpenChange={setIsSuggestAttendeesModalOpen}
          meetingParams={{
            meeting: {
              meeting_subject: formData.meeting_subject || meeting.meeting_subject || '',
              meeting_type: formData.meeting_type || meeting.meeting_type || '',
              meeting_classification: formData.meeting_classification || meeting.meeting_classification || '',
              meeting_justification: meeting.meeting_justification || '',
              related_topic: meeting.related_topic || null,
              objectives: contentForm.objectives.map((obj) => ({ objective: obj.objective })),
              agenda_items: contentForm.agendaItems.map((item) => ({ agenda_item: item.agenda_item })),
              minister_support: meeting.minister_support || [],
            },
          }}
          onSuccess={(data) => {
            // Map suggested attendees to MinisterAttendee format and add to the table
            if (data?.suggestions && Array.isArray(data.suggestions)) {
              const mappedAttendees: MinisterAttendee[] = data.suggestions.map((suggestion: SuggestedAttendee) => ({
                username: `${suggestion.first_name} ${suggestion.last_name}`,
                external_email: suggestion.email,
                external_name: `${suggestion.first_name} ${suggestion.last_name}`,
                is_required: suggestion.importance_level === 'مناسب جدا',
                justification: suggestion.suggestion_reason,
                access_permission: 'FULL',
                position: '',
                phone: '',
                attendance_channel: 'PHYSICAL',
              }));

              // Add the mapped attendees to the existing list
              setScheduleForm((prev) => ({
                ...prev,
                minister_attendees: [...prev.minister_attendees, ...mappedAttendees],
              }));
            }
          }}
        />
      )}

      {/* Reject Meeting Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              رفض طلب الاجتماع
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  سبب الرفض <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="الطلب غير مناسب للجدولة"
                  className="w-full text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  ملاحظات إضافية
                </label>
                <Textarea
                  value={rejectForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="تفاصيل إضافية حول سبب الرفض"
                  className="w-full min-h-[100px] text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!rejectForm.reason.trim() || rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {rejectMutation.isPending ? 'جاري الرفض...' : 'رفض الطلب'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit confirmation modal */}
      <Dialog open={isEditConfirmOpen} onOpenChange={(open) => {
        setIsEditConfirmOpen(open);
        if (!open) {
          setValidationError(null);
          setUpdateErrorMessage(null);
        }
      }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              تأكيد التعديلات
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(validationError || updateErrorMessage) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-right text-sm text-red-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {updateErrorMessage || validationError}
                </p>
              </div>
            )}
            <p className="text-right text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              سيتم إرسال الحقول التالية للتعديل:
            </p>
            <ul className="mt-3 list-disc list-inside text-right text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              {Object.keys(changedPayload).map((k) => (
                <li key={k}>{fieldLabels[k] || k}</li>
              ))}
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
                // Validate: if requires_protocol is true, protocol_type must be filled
                const requiresProtocol = changedPayload.requires_protocol ?? scheduleForm.requires_protocol;
                const protocolType = changedPayload.protocol_type ?? scheduleForm.protocol_type_text;
                if (requiresProtocol === true && !protocolType) {
                  setValidationError('يجب تحديد نوع البروتوكول عند تفعيل خيار "يتطلب بروتوكول"');
                  return;
                }
                // Validate: if اجتماع متسلسل؟ is checked, الاجتماع السابق is required
                const isSequential = changedPayload.is_sequential ?? formData.is_sequential;
                const previousMeetingId = changedPayload.previous_meeting_id ?? formData.previous_meeting_id;
                if (isSequential === true && !previousMeetingId) {
                  setValidationError('يجب اختيار الاجتماع السابق عند تفعيل خيار "اجتماع متسلسل؟"');
                  return;
                }
                // Validate invitees (قائمة المدعوين مقدّم الطلب) when payload includes them
                if (changedPayload.invitees && localInvitees.length > 0 && !validateInvitees()) {
                  setValidationError('يرجى تصحيح الأخطاء في قائمة المدعوين (مقدّم الطلب) — جميع الحقول مطلوبة والبريد يجب أن يكون صالحاً');
                  setIsEditConfirmOpen(false);
                  setActiveTab('attendees');
                  return;
                }
                // Validate minister attendees (قائمة المدعوين الوزير) when payload includes them
                if (changedPayload.minister_attendees && (scheduleForm.minister_attendees?.length ?? 0) > 0 && !validateMinisterAttendees()) {
                  setValidationError('يرجى تصحيح الأخطاء في قائمة المدعوين (الوزير) — جميع الحقول مطلوبة والبريد يجب أن يكون صالحاً');
                  setIsEditConfirmOpen(false);
                  setActiveTab('attendees');
                  return;
                }
                setValidationError(null);
                setInviteeValidationErrors({});
                setMinisterAttendeeValidationErrors({});
                const hasPresentationFiles = newPresentationAttachments.length > 0;
                updateMutation.mutate({
                  payload: changedPayload,
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

      {/* Send to Content – Drawer */}
      <Drawer
        open={isSendToContentModalOpen}
        onOpenChange={setIsSendToContentModalOpen}
        title={<span className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إرسال للمحتوى</span>}
        side="left"
        width={500}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsSendToContentModalOpen(false); setSendToContentForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إلغاء</button>
            <button type="button" onClick={handleSendToContentDraft} disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            <button type="submit" form="send-to-content-form" disabled={sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{sendToContentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}</button>
          </div>
        }
      >
        <form id="send-to-content-form" onSubmit={handleSendToContentSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              ملاحظات
            </label>
            <Textarea
              value={sendToContentForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendToContentForm({ notes: e.target.value })}
              placeholder="يرجى مراجعة المحتوى قبل الجدولة"
              className="w-full min-h-[100px] text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            />
          </div>
        </form>
      </Drawer>

      {/* Request Guidance – Drawer */}
      <Drawer
        open={isRequestGuidanceModalOpen}
        onOpenChange={setIsRequestGuidanceModalOpen}
        title={<span className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>طلب توجيه</span>}
        side="left"
        width={500}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsRequestGuidanceModalOpen(false); setRequestGuidanceForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إلغاء</button>
            <button type="button" onClick={handleRequestGuidanceDraft} disabled={requestGuidanceMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{requestGuidanceMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            <button type="submit" form="request-guidance-form" disabled={requestGuidanceMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-[#29615C] rounded-lg hover:bg-[#1f4a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{requestGuidanceMutation.isPending ? 'جاري الإرسال...' : 'طلب توجيه'}</button>
          </div>
        }
      >
        <form id="request-guidance-form" onSubmit={handleRequestGuidanceSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>ملاحظات</label>
            <Textarea value={requestGuidanceForm.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestGuidanceForm({ notes: e.target.value })} placeholder="يرجى توفير التوجيهات اللازمة حول هذا الطلب" className="w-full min-h-[100px] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} />
          </div>
        </form>
      </Drawer>

      {/* Scheduling Consultation – Drawer */}
      <Drawer
        open={isConsultationModalOpen}
        onOpenChange={setIsConsultationModalOpen}
        title={<span className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>طلب استشارة جدولة</span>}
        side="left"
        width={520}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsConsultationModalOpen(false); setConsultationForm({ consultant_user_id: '', consultation_question: '', search: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إلغاء</button>
            <button type="button" onClick={handleConsultationDraft} disabled={consultationMutation.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{consultationMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            <button type="submit" form="consultation-form" disabled={!consultationForm.consultant_user_id || consultationMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-[#29615C] rounded-lg hover:bg-[#1f4a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{consultationMutation.isPending ? 'جاري الإرسال...' : 'طلب استشارة'}</button>
          </div>
        }
      >
        <form id="consultation-form" onSubmit={handleConsultationSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>المستشار</label>
            <Select value={consultationForm.consultant_user_id} onValueChange={(value) => setConsultationForm((prev) => ({ ...prev, consultant_user_id: value }))}>
              <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                <SelectValue placeholder={isLoadingConsultants ? 'جاري التحميل...' : 'اختر المستشار'} />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <div className="px-2 py-1 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <Input type="text" value={consultationForm.search} onChange={(e) => setConsultationForm((prev) => ({ ...prev, search: e.target.value }))} placeholder="ابحث عن المستشار بالاسم أو البريد" className="h-9 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} />
                </div>
                {consultants.length === 0 && !isLoadingConsultants ? <SelectItem disabled value="__no_results__">لا توجد نتائج</SelectItem> : consultants.map((user) => <SelectItem key={user.id} value={user.id}>{`${user.first_name} ${user.last_name} - ${user.email}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>سؤال الاستشارة</label>
            <Textarea value={consultationForm.consultation_question} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm((prev) => ({ ...prev, consultation_question: e.target.value }))} placeholder="هل يمكن جدولة هذا الاجتماع في الموعد المقترح؟" className="w-full min-h-[100px] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} />
          </div>
        </form>
      </Drawer>

      {/* Return for Info – Drawer (notes + editable_fields for POST return-for-info) */}
      <Drawer
        open={isReturnForInfoModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReturnForInfoForm({
              notes: '',
              editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>),
            });
          }
          setIsReturnForInfoModalOpen(open);
        }}
        title={<span className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إعادة للطلب</span>}
        side="left"
        width={500}
        bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { setIsReturnForInfoModalOpen(false); setReturnForInfoForm({ notes: '', editable_fields: EDITABLE_FIELD_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>) }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إلغاء</button>
            <button type="submit" form="return-for-info-form" disabled={returnForInfoMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{returnForInfoMutation.isPending ? 'جاري الإرسال...' : 'إعادة للطلب'}</button>
          </div>
        }
      >
        <form id="return-for-info-form" onSubmit={handleReturnForInfoSubmit} className="flex flex-col gap-4">
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-700 text-right leading-relaxed" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              حدّد الحقول القابلة للتعديل بجانب كل حقل في النموذج عبر علامة <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#048F86]/10 text-[#048F86] text-xs font-medium">قابل للتعديل</span>. أدخل الملاحظات ثم اضغط إعادة للطلب.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-gray-700 text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              ملاحظات
            </label>
            <Textarea
              value={returnForInfoForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReturnForInfoForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="يرجى توفير معلومات إضافية حول الموضوع"
              className="w-full min-h-[100px] text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            />
          </div>
        </form>
      </Drawer>

      {/* Schedule Meeting – Drawer */}
      <Drawer
        open={isScheduleModalOpen}
        onOpenChange={(open: boolean) => {
          setIsScheduleModalOpen(open);
          if (!open) {
            setValidationError(null);
            setWebexMeetingDetails(null);
          }
        }}
        title={<span className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>جدولة الاجتماع</span>}
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
                    meeting_channel: 'PHYSICAL',
                    requires_protocol: false,
                    protocol_type: null,
                    protocol_type_text: '',
                    is_data_complete: true,
                    notes: '',
                    location: '',
                    selected_time_slot_id: null,
                    minister_attendees: [],
                  });
                  setWebexMeetingDetails(null);
                  navigate(-1);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                      meeting_channel: 'PHYSICAL',
                      requires_protocol: false,
                      protocol_type: null,
                      protocol_type_text: '',
                      is_data_complete: true,
                      notes: '',
                      location: '',
                      selected_time_slot_id: null,
                      minister_attendees: [],
                    });
                    setWebexMeetingDetails(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="schedule-meeting-form"
                  disabled={
                    !scheduleForm.scheduled_at ||
                    scheduleMutation.isPending ||
                    isCreatingWebex ||
                    (scheduleForm.meeting_channel === 'VIRTUAL' && !webexMeetingDetails)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  {isCreatingWebex ? 'جاري إنشاء اجتماع Webex...' : scheduleMutation.isPending ? 'جاري الجدولة...' : 'جدولة'}
                </button>
              </>
            )}
          </div>
        }
      >
        <form id="schedule-meeting-form" onSubmit={handleScheduleSubmit} className="flex flex-col gap-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-right text-sm text-red-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                {validationError}
              </p>
            </div>
          )}
          {scheduleMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-right text-sm text-green-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                تم جدولة الاجتماع بنجاح
              </p>
            </div>
          )}
          {/* Scheduled Date/Time */}
          <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  تاريخ ووقت الاجتماع <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={scheduleForm.scheduled_at ? (scheduleForm.scheduled_at.includes('T') && !scheduleForm.scheduled_at.includes('Z') ? new Date(scheduleForm.scheduled_at).toISOString() : scheduleForm.scheduled_at) : undefined}
                  onChange={(isoString) => {
                    // Convert ISO string to datetime-local format for the form state
                    const date = new Date(isoString)
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const hours = String(date.getHours()).padStart(2, '0')
                    const minutes = String(date.getMinutes()).padStart(2, '0')
                    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
                    setScheduleForm((prev) => ({ ...prev, scheduled_at: datetimeLocal }))
                  }}
                  placeholder="اختر التاريخ والوقت"
                  className="w-full"
                  required
                  minDate={(() => {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    return d;
                  })()}
                />
              </div>

              {/* Meeting Channel */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  قناة الاجتماع <span className="text-red-500">*</span>
                </label>
                <Select
                  value={scheduleForm.meeting_channel}
                  onValueChange={(value) => {
                    setScheduleForm((prev) => ({ ...prev, meeting_channel: value as typeof prev.meeting_channel }));
                    // Clear Webex details when channel changes
                    if (value !== 'VIRTUAL') {
                      setWebexMeetingDetails(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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

              {/* Webex Meeting Loading - Show when creating */}
              {scheduleForm.meeting_channel === 'VIRTUAL' && isCreatingWebex && (
                <div className="flex flex-col gap-2 p-4 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#048F86] border-t-transparent rounded-full animate-spin"></div>
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      جاري إنشاء اجتماع Webex...
                    </label>
                  </div>
                </div>
              )}

              {/* Webex Meeting Details - Show when VIRTUAL channel and details are available */}
              {scheduleForm.meeting_channel === 'VIRTUAL' && webexMeetingDetails && !isCreatingWebex && (
                <div className="flex flex-col gap-4 p-4 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD]"></div>
                    <label className="text-sm font-semibold text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تفاصيل اجتماع Webex
                    </label>
                  </div>
                  
                  {/* Join Link */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      رابط الانضمام
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={webexMeetingDetails.join_link}
                        readOnly
                        className="flex-1 h-9 bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(webexMeetingDetails.join_link);
                        }}
                        className="px-3 py-1.5 text-xs bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        نسخ
                      </button>
                    </div>
                  </div>

                  {/* Meeting Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        رقم الاجتماع
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {webexMeetingDetails.meeting_number}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        كلمة المرور
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {webexMeetingDetails.password}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        عنوان SIP
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {webexMeetingDetails.sip_address}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        مفتاح المضيف
                      </label>
                      <div className="h-9 px-3 flex items-center bg-white border border-gray-300 rounded-lg text-right text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {webexMeetingDetails.host_key}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requires Protocol */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_protocol"
                  checked={scheduleForm.requires_protocol}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, requires_protocol: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="requires_protocol" className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  يتطلب محضر
                </label>
              </div>

              {/* Protocol Type - Conditional */}
              {scheduleForm.requires_protocol && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    نوع المحضر <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={scheduleForm.protocol_type || ''}
                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, protocol_type: value }))}
                  >
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      <SelectValue placeholder="اختر نوع المحضر" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="DETAILED">مفصل</SelectItem>
                      <SelectItem value="SUMMARY">ملخص</SelectItem>
                      <SelectItem value="MINUTES">محضر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Is Data Complete */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_data_complete"
                  checked={scheduleForm.is_data_complete}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, is_data_complete: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="is_data_complete" className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  البيانات مكتملة
                </label>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  ملاحظات
                </label>
                <Textarea
                  value={scheduleForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Meeting scheduled successfully"
                  className="w-full min-h-[100px] text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                />
              </div>

              {/* Minister Attendees */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    الحضور الوزاري
                  </label>
                  <button
                    type="button"
                    onClick={addMinisterAttendee}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>إضافة</span>
                  </button>
                </div>

                {scheduleForm.minister_attendees.map((attendee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        حضور {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMinisterAttendee(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          اسم المستخدم
                        </label>
                        <Input
                          type="text"
                          value={attendee.username || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'username', e.target.value)}
                          placeholder="john.doe"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          الاسم (خارجي)
                        </label>
                        <Input
                          type="text"
                          value={attendee.external_name || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'external_name', e.target.value)}
                          placeholder="الاسم الخارجي"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          البريد الإلكتروني
                        </label>
                        <Input
                          type="email"
                          value={attendee.external_email || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'external_email', e.target.value)}
                          placeholder="external@example.com"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          المنصب
                        </label>
                        <Input
                          type="text"
                          value={attendee.position || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'position', e.target.value)}
                          placeholder="المنصب"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          الجوال
                        </label>
                        <Input
                          type="text"
                          value={attendee.phone || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'phone', e.target.value)}
                          placeholder="الجوال"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          آلية الحضور
                        </label>
                        <Select
                          value={attendee.attendance_channel || 'PHYSICAL'}
                          onValueChange={(v) => updateMinisterAttendee(index, 'attendance_channel', v)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white border border-gray-300 rounded-lg text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                            <SelectItem value="PHYSICAL">حضوري</SelectItem>
                            <SelectItem value="REMOTE">عن بعد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          مطلوب
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={attendee.is_required}
                            onChange={(e) => updateMinisterAttendee(index, 'is_required', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-xs text-gray-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {attendee.is_required ? 'نعم' : 'لا'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          صلاحية الوصول
                        </label>
                        <Select
                          value={attendee.access_permission || 'FULL'}
                          onValueChange={(value) => updateMinisterAttendee(index, 'access_permission', value)}
                        >
                          <SelectTrigger className="w-full h-9 bg-white border border-gray-300 rounded-lg text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                            <SelectItem value="FULL">كامل</SelectItem>
                            <SelectItem value="READ_ONLY">قراءة فقط</SelectItem>
                            <SelectItem value="LIMITED">محدود</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        المبرر
                      </label>
                      <Input
                        type="text"
                        value={attendee.justification || ''}
                        onChange={(e) => updateMinisterAttendee(index, 'justification', e.target.value)}
                        placeholder="المبرر"
                        className="w-full h-9 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
        </form>
      </Drawer>

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
                fontFamily: "'Ping AR + LT', sans-serif",
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
              style={{ fontFamily: "'Ping AR + LT', sans-serif", lineHeight: '22px' }}
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
                fontFamily: "'Ping AR + LT', sans-serif",
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
              style={{ fontFamily: "'Ping AR + LT', sans-serif", lineHeight: '22px' }}
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
  );
};

export default MeetingDetail;