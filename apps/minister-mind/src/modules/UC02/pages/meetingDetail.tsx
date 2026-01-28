import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, X, Send, FileCheck, ClipboardCheck, RotateCcw, Calendar, Info, Plus, Trash2, Download, Eye, Sparkles } from 'lucide-react';
import pdfIcon from '../../shared/assets/pdf.svg';
import { 
  MeetingStatus, 
  MeetingStatusLabels, 
  MeetingType,
  MeetingTypeLabels,
  MeetingClassification,
  MeetingClassificationLabels,
  StatusBadge,
  DataTable,
  Tabs,
  type TableColumn,
  AIGenerateButton,
  FormAsyncSelectV2,
  type OptionType,
} from '@shared'; 
import {
  getMeetingById,
  getMeetings,
  rejectMeeting,
  sendToContent,
  requestGuidance,
  getConsultants,
  type ConsultantUser,
  requestSchedulingConsultation,
  returnMeetingForInfo,
  scheduleMeeting,
  createWebexMeeting,
  type MinisterAttendee,
  getConsultationRecords,
  type ConsultationRecord,
  getGuidanceRecords,
  type GuidanceRecord,
  getContentOfficerNotesRecords,
  type ContentOfficerNoteRecord,
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
import { updateMeetingRequest } from '../data/meetingsApi';
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
  is_sequential: 'اجتماع متسلسل؟',
  previous_meeting_id: 'الاجتماع السابق',
  is_based_on_directive: 'هل طلب الاجتماع بناءً على توجيه من معالي الوزير',
  directive_method: 'طريقة التوجيه',
  previous_meeting_minutes_id: 'محضر الاجتماع',
  related_guidance: 'التوجيه',
  objectives: 'الأهداف',
  agenda_items: 'بنود جدول أعمال الاجتماع',
  meeting_channel: 'قناة الاجتماع',
  requires_protocol: 'يتطلب بروتوكول',
  protocol_type: 'نوع البروتوكول',
  is_data_complete: 'اكتمال البيانات',
  selected_time_slot_id: 'الموعد المحدد',
  minister_attendees: 'حضور الوزير',
  invitees: 'المدعوون',
  deleted_attachment_ids: 'حذف المرفقات',
};

const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
] as const;

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);
  /** Include drafts in استشارة الجدولة and التوجيه tabs; default true */
  const [includeDraftsConsultation, setIncludeDraftsConsultation] = useState(true);
  const [includeDraftsGuidance, setIncludeDraftsGuidance] = useState(true);

  // Fetch meeting data from API
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  // Fetch consultation records (استشارة الجدولة tab)
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id, includeDraftsConsultation],
    queryFn: () => getConsultationRecords(id!, includeDraftsConsultation),
    enabled: !!id && activeTab === 'scheduling-consultation',
  });

  // Fetch guidance records (التوجيه tab)
  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', id, includeDraftsGuidance],
    queryFn: () => getGuidanceRecords(id!, includeDraftsGuidance),
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

  // Form state
  const [formData, setFormData] = useState({
    meeting_type: '',
    meeting_title: '',
    meeting_classification: '',
    meeting_subject: '',
    meeting_owner: '',
    is_sequential: false,
    previous_meeting_id: null as string | null,
    is_based_on_directive: false,
    directive_method: '',
    previous_meeting_minutes_id: '',
    related_guidance: '',
  });
  /** Selected option for "الاجتماع السابق" async select (value + label) */
  const [previousMeetingOption, setPreviousMeetingOption] = useState<OptionType | null>(null);
  /** Selected option for "محضر الاجتماع" async select */
  const [previousMeetingMinutesOption, setPreviousMeetingMinutesOption] = useState<OptionType | null>(null);

  // Alert visibility state - persisted in localStorage
  const [showAttachmentsAlert, setShowAttachmentsAlert] = useState(() => {
    if (!id) return true;
    const dismissedKey = `meeting-alert-dismissed-${id}`;
    const isDismissed = localStorage.getItem(dismissedKey) === 'true';
    return !isDismissed;
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

  // Return for info modal state
  const [isReturnForInfoModalOpen, setIsReturnForInfoModalOpen] = useState(false);
  const [returnForInfoForm, setReturnForInfoForm] = useState({
    notes: '',
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

  // Original snapshot for change detection
  const [originalSnapshot, setOriginalSnapshot] = useState<any>(null);

  // Invitees state - for managing is_required toggle
  const [inviteesState, setInviteesState] = useState<Array<{ id: string; is_required: boolean }>>([]);

  // Delete minister attendee confirmation modal state
  const [deleteAttendeeIndex, setDeleteAttendeeIndex] = useState<number | null>(null);
  
  // Delete invitee confirmation modal state
  const [deleteInviteeId, setDeleteInviteeId] = useState<string | null>(null);

  // Minister Calendar Modal state
  const [isMinisterCalendarOpen, setIsMinisterCalendarOpen] = useState(false);

  // Initialize invitees state when meeting data loads
  useEffect(() => {
    if (meeting?.invitees) {
      setInviteesState(
        meeting.invitees.map((invitee) => ({
          id: invitee.id,
          is_required: invitee.is_required,
        }))
      );
    }
  }, [meeting?.invitees]);

  // Update invitee is_required status
  const updateInviteeRequired = (inviteeId: string, is_required: boolean) => {
    setInviteesState((prev) =>
      prev.map((inv) => (inv.id === inviteeId ? { ...inv, is_required } : inv))
    );
    // Also update local invitees if it exists
    setLocalInvitees((prev) =>
      prev.map((inv) => (inv.id === inviteeId ? { ...inv, is_required } : inv))
    );
  };

  // Handle invitee deletion
  const handleDeleteInvitee = () => {
    if (deleteInviteeId) {
      // Remove from inviteesState
      setInviteesState((prev) => prev.filter((inv) => inv.id !== deleteInviteeId));
      // Remove from local invitees
      setLocalInvitees((prev) => prev.filter((inv) => inv.id !== deleteInviteeId));
      // TODO: Call API to delete invitee if needed
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

  // Local invitees state for adding new invitees
  const [localInvitees, setLocalInvitees] = useState<Array<{ id: string; external_name?: string; external_email?: string; is_required: boolean }>>([]);

  // Add new invitee
  const addInvitee = () => {
    const newId = `local-${Date.now()}`;
    const newInvitee = {
      id: newId,
      external_name: '',
      external_email: '',
      is_required: false,
    };
    setLocalInvitees((prev) => [...prev, newInvitee]);
    setInviteesState((prev) => [...prev, { id: newId, is_required: false }]);
  };

  // Update local invitee
  const updateLocalInvitee = (inviteeId: string, field: 'external_name' | 'external_email', value: string) => {
    setLocalInvitees((prev) =>
      prev.map((inv) => (inv.id === inviteeId ? { ...inv, [field]: value } : inv))
    );
  };

  // Get combined invitees (API + local)
  const allInvitees = React.useMemo(() => {
    const apiInvitees = (meeting?.invitees || []).map((inv) => ({
      ...inv,
      isLocal: false,
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
      access_permission: null,
      isLocal: true,
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
  const [validationError, setValidationError] = useState<string | null>(null);

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

    // scheduleForm comparisons against snapshot
    if ((scheduleForm.location || '') !== (originalSnapshot.scheduleForm.location || '')) payload.meeting_channel = scheduleForm.location;
    if ((scheduleForm.requires_protocol ?? false) !== (originalSnapshot.scheduleForm.requires_protocol ?? false)) payload.requires_protocol = scheduleForm.requires_protocol;
    if ((scheduleForm.protocol_type_text || '') !== (originalSnapshot.scheduleForm.protocol_type_text || '')) payload.protocol_type = scheduleForm.protocol_type_text;
    if ((scheduleForm.is_data_complete ?? true) !== (originalSnapshot.scheduleForm.is_data_complete ?? true)) payload.is_data_complete = scheduleForm.is_data_complete;
    if ((scheduleForm.selected_time_slot_id || null) !== (originalSnapshot.scheduleForm.selected_time_slot_id || null)) payload.selected_time_slot_id = scheduleForm.selected_time_slot_id;

    // minister attendees and invitees
    if (JSON.stringify(scheduleForm.minister_attendees || []) !== JSON.stringify(originalSnapshot.scheduleForm.minister_attendees || [])) {
      payload.minister_attendees = scheduleForm.minister_attendees;
    }
    if (JSON.stringify(localInvitees || []) !== JSON.stringify(originalSnapshot.localInvitees || [])) {
      payload.invitees = localInvitees.map((i) => ({
        external_email: i.external_email || null,
        external_name: i.external_name || null,
        is_required: i.is_required,
      }));
    }

    // Track attachment deletions
    if (deletedAttachmentIds.length > 0) {
      payload.deleted_attachment_ids = deletedAttachmentIds;
    }

    // Note: New attachments will need to be uploaded separately via file upload API
    // For now, we track them in state but they won't be in the payload
    // The actual upload should happen in a separate API call

    return payload;
  }, [originalSnapshot, formData, contentForm, scheduleForm, localInvitees, deletedAttachmentIds]);

  const hasChanges = Object.keys(changedPayload).length > 0 || deletedAttachmentIds.length > 0 || newAttachments.length > 0;

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateMeetingRequest(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsEditConfirmOpen(false);
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

  // Return for info mutation
  const returnForInfoMutation = useMutation({
    mutationFn: (payload: { notes: string }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoForm({ notes: '' });
      navigate(-1);
    },
  });

  const handleReturnForInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    returnForInfoMutation.mutate({
      notes: returnForInfoForm.notes || 'يرجى توفير معلومات إضافية حول الموضوع',
    });
  };

  // Schedule meeting mutation
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
    }) => scheduleMeeting(id!, payload),
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

    // Prepare the payload - always include meeting_link field
    const schedulePayload = {
      scheduled_at: scheduledAtISO,
      meeting_channel: scheduleForm.meeting_channel,
      requires_protocol: scheduleForm.requires_protocol,
      protocol_type: scheduleForm.requires_protocol ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
      is_data_complete: scheduleForm.is_data_complete,
      notes: scheduleForm.notes || 'Meeting scheduled successfully',
      location: scheduleForm.location || undefined,
      online_link: meetingLink, // Always include meeting_link field (undefined for non-ONLINE channels)
      minister_attendees: scheduleForm.minister_attendees,
    };

    scheduleMutation.mutate(schedulePayload);
  };

  const addMinisterAttendee = () => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: [
        ...prev.minister_attendees,
        {
          is_required: false,
          justification: '',
          access_permission: 'FULL',
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

  const updateMinisterAttendee = (index: number, field: keyof MinisterAttendee, value: any) => {
    setScheduleForm((prev) => ({
      ...prev,
      minister_attendees: prev.minister_attendees.map((attendee, i) =>
        i === index ? { ...attendee, [field]: value } : attendee
      ),
    }));
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
        meeting_owner: ownerDisplay,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_id: prevId,
        is_based_on_directive: basedOnDirective,
        directive_method: directiveMethod,
        previous_meeting_minutes_id: minutesId,
        related_guidance: guidance,
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
        meeting_owner: ownerDisplay,
        is_sequential: meeting.is_sequential ?? false,
        previous_meeting_id: prevId,
        is_based_on_directive: basedOnDirective,
        directive_method: directiveMethod,
        previous_meeting_minutes_id: minutesId,
        related_guidance: guidance,
      },
      scheduleForm: {
        selected_time_slot_id: meeting.selected_time_slot_id || null,
        requires_protocol: meeting.requires_protocol ?? false,
        protocol_type_text: meeting.protocol_type || '',
        is_data_complete: meeting.is_data_complete ?? true,
        location: meeting.meeting_channel || '',
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
      localInvitees: [],
    });
  }, [meeting]);

  // Map status to MeetingStatus enum
  const meetingStatus = meeting?.status as MeetingStatus || MeetingStatus.UNDER_REVIEW;
  const statusLabel = MeetingStatusLabels[meetingStatus] || meeting?.status || 'قيد المراجعة';
  
  // Check if meeting has attachments (presentations)
  const hasAttachments = meeting?.attachments && meeting.attachments.length > 0;
  const hasPresentations = meeting?.attachments?.some(att => att.is_presentation) || false;

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /** Async load options for "الاجتماع السابق" – getMeetings with status CLOSED */
  const loadClosedMeetingsOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const res = await getMeetings({
        status: MeetingStatus.CLOSED,
        search: search || undefined,
        skip,
        limit,
      });
      const currentId = meeting?.id;
      const items = res.items
        .filter((m) => m.id !== currentId)
        .map((m) => ({
          value: m.id,
          label: `${m.request_number || m.id} – ${m.meeting_title || m.meeting_subject || ''}`.trim() || m.id,
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
  const tabs = [
    { id: 'request-info', label: 'معلومات الطلب' },
    { id: 'meeting-info', label: 'معلومات الاجتماع' },
    { id: 'content', label: 'المحتوى' },
    { id: 'attendees', label: 'قائمة المدعوين' },
    { id: 'scheduling-consultation', label: 'استشارة الجدولة' },
    { id: 'directive', label: 'التوجيه' },
    { id: 'content-consultation', label: 'استشارة المحتوى' },
    { id: 'request-notes', label: 'الملاحظات على الطلب' },
  ];

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
    <div className="flex-1 overflow-y-auto p-6 pb-28">
        {/* Main Container */}
        <div className=" mx-auto bg-white rounded-2xl p-6 md:p-8 gap-6 flex flex-col">
          {/* Header Section */}
          <div className="flex flex-row items-center justify-between gap-6">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            {/* Title and Status */}
            <div className="flex-1 flex flex-col gap-1 items-start relative">
              <div className="flex items-center gap-3">
                <h1
                  className="text-2xl font-bold text-gray-900 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  مراجعة طلب الاجتماع ({meeting.request_number})
                </h1>
                {hasChanges && (
                  <span className="mr-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white text-sm" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    تغييرات غير محفوظة
                  </span>
                )}
                
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>

            <AIGenerateButton
              onClick={() => {
                setIsQualityModalOpen(true);
              }}
              label="تقييم جودة الاجتماع"
            />
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          

          {/* Alert Box */}
          {hasAttachments && showAttachmentsAlert && (
            
            <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 flex flex-row items-start gap-3 relative">
              <button
                onClick={() => {
                  setShowAttachmentsAlert(false);
                  // Persist dismissal in localStorage
                  if (id) {
                    const dismissedKey = `meeting-alert-dismissed-${id}`;
                    localStorage.setItem(dismissedKey, 'true');
                  }
                }}
                className="absolute -top-1 -left-1 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />

            
              <div className="flex-1 flex flex-col gap-2">
                <p
                  className="text-sm font-semibold text-gray-700 text-right"
                  style={{ fontFamily: "'Somar Sans', sans-serif" }}
                >
                  يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب.
                </p>
                {hasPresentations && (
                  <p
                    className="text-sm text-gray-600 text-right"
                    style={{ fontFamily: "'Somar Sans', sans-serif" }}
                  >
                    تنبيه: هذا الطلب يحتوي على مرفقات (عروض تقديمية). يجب إرسال الطلب إلى مسؤول المحتوى أولاً لمراجعة جاهزية العرض وإعداد الملخص التنفيذي قبل جدولة الاجتماع. لا يمكن جدولة الاجتماع مباشرة عند وجود مرفقات.
                  </p>
                )}
              </div>
          
            </div>
          )}

          {/* Tab: معلومات الطلب (Excel التبويب) – اسم الحقل: رقم الطلب، حالة الطلب، مقدم الطلب، مالك الاجتماع */}
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>رقم الطلب</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {meeting?.request_number ?? '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>حالة الطلب</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {statusLabel}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مقدم الطلب</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {meeting?.submitter_name ?? '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مالك الاجتماع</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {meeting?.current_owner_user ? `${meeting.current_owner_user.first_name} ${meeting.current_owner_user.last_name}`.trim() || meeting.current_owner_user.username : meeting?.current_owner_role?.name_ar ?? '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: معلومات الاجتماع (Excel التبويب) – اسم الحقل per Excel */}
          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-6" dir="rtl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>هل تطلب الاجتماع نيابة عن غيرك؟</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{(meeting as any)?.is_on_behalf_of === true ? 'نعم' : (meeting as any)?.is_on_behalf_of === false ? 'لا' : '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مالك الاجتماع</label>
                  <Input type="text" value={formData.meeting_owner} onChange={(e) => handleFieldChange('meeting_owner', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="مالك الاجتماع" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>عنوان الاجتماع</label>
                  <Input type="text" value={formData.meeting_title} onChange={(e) => handleFieldChange('meeting_title', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="أدخل عنوان الاجتماع" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>وصف الاجتماع</label>
                  <Input type="text" value={formData.meeting_subject} onChange={(e) => handleFieldChange('meeting_subject', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="أدخل وصف الاجتماع" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>القطاع</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.sector ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>نوع الاجتماع</label>
                  <Select value={formData.meeting_type} onValueChange={(v) => handleFieldChange('meeting_type', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر نوع الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingType).map((t) => <SelectItem key={t} value={t}>{MeetingTypeLabels[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>السبب</label>
                  <div className="min-h-11 px-3 py-2 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.meeting_justification ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>آلية انعقاد الاجتماع</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.meeting_channel ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>الموقع</label>
                  <Input type="text" value={scheduleForm.location} onChange={(e) => setScheduleForm((p) => ({ ...p, location: e.target.value }))} className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="القاعة/الموقع" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>هل يتطلب بروتوكول؟</label>
                  <div className="flex items-center gap-3 h-11">
                    <span className="text-sm text-gray-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{scheduleForm.requires_protocol ? 'نعم' : 'لا'}</span>
                    <button type="button" onClick={() => setScheduleForm((p) => ({ ...p, requires_protocol: !p.requires_protocol }))} className={`w-11 h-6 rounded-full flex transition-all cursor-pointer ${scheduleForm.requires_protocol ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></button>
                  </div>
                  {scheduleForm.requires_protocol && (
                    <Input type="text" value={scheduleForm.protocol_type_text} onChange={(e) => setScheduleForm((p) => ({ ...p, protocol_type_text: e.target.value }))} className="w-full h-11 mt-1 bg-white border border-gray-300 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="نوع البروتوكول" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>فئة الاجتماع</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.meeting_classification_type ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>مبرّر اللقاء</label>
                  <div className="min-h-11 px-3 py-2 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.meeting_justification ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>موضوع التكليف المرتبط</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.related_topic ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>تاريخ الاستحقاق</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.deadline ? new Date(meeting.deadline).toLocaleDateString('ar-SA') : '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>تصنيف الاجتماع</label>
                  <Select value={formData.meeting_classification} onValueChange={(v) => handleFieldChange('meeting_classification', v)}>
                    <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}><SelectValue placeholder="اختر تصنيف الاجتماع" /></SelectTrigger>
                    <SelectContent dir="rtl">{Object.values(MeetingClassification).map((c) => <SelectItem key={c} value={c}>{MeetingClassificationLabels[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>سريّة الاجتماع</label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.meeting_confidentiality ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>اجتماع متسلسل؟</label>
                  <div className="flex items-center gap-3 h-11">
                    <span className="text-sm text-gray-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{formData.is_sequential ? 'نعم' : 'لا'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !formData.is_sequential;
                        setFormData((p) => ({ ...p, is_sequential: next, ...(next ? {} : { previous_meeting_id: null }) }));
                        if (!next) setPreviousMeetingOption(null);
                      }}
                      className={`w-11 h-6 rounded-full flex transition-all cursor-pointer ${formData.is_sequential ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
                {formData.is_sequential && (
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الاجتماع السابق <span className="text-red-500">*</span>
                    </label>
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
                  <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.sequential_number ?? '-'}</div>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>هل طلب الاجتماع بناءً على توجيه من معالي الوزير</label>
                  <div className="flex items-center gap-3 h-11">
                    <span className="text-sm text-gray-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{formData.is_based_on_directive ? 'نعم' : 'لا'}</span>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, is_based_on_directive: !p.is_based_on_directive, ...(!p.is_based_on_directive ? {} : { directive_method: '' }) }))}
                      className={`w-11 h-6 rounded-full flex transition-all cursor-pointer ${formData.is_based_on_directive ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>طريقة التوجيه</label>
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
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>محضر الاجتماع</label>
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
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>التوجيه</label>
                  <Textarea
                    value={formData.related_guidance}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((p) => ({ ...p, related_guidance: e.target.value }))}
                    className="w-full min-h-24 bg-white border border-gray-300 rounded-lg shadow-sm text-right resize-y"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    placeholder="أدخل التوجيه..."
                  />
                </div>
              </div>
              {/* موعد الاجتماع */}
              <div className="flex flex-col gap-3">
                <h3 className="text-right font-semibold text-gray-800" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>موعد الاجتماع</h3>
                <div className="flex flex-row gap-4 flex-wrap">
                  {suggestedTimes.length === 0 ? (
                    <div className="w-full text-center py-4 text-gray-500">لا توجد أوقات متاحة</div>
                  ) : (
                    suggestedTimes.map((timeSlot) => (
                      <div key={timeSlot.id} className="flex flex-row items-center gap-3 px-4 py-3 bg-white border border-[#D0D5DD] rounded-lg shadow-sm min-w-[280px]">
                        <button type="button" onClick={() => { setSuggestedTimes((prev) => prev.map((s) => (s.id === timeSlot.id ? { ...s, selected: !s.selected } : { ...s, selected: false }))); setScheduleForm((prev) => ({ ...prev, selected_time_slot_id: scheduleForm.selected_time_slot_id === timeSlot.id ? null : timeSlot.id })); }} className={`w-11 h-6 rounded-full flex transition-all cursor-pointer ${timeSlot.selected ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></button>
                        <span className="flex-1 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}>{timeSlot.time}</span>
                        <Calendar className="w-5 h-5 text-[#048F86] flex-shrink-0" />
                      </div>
                    ))
                  )}
                  <button type="button" onClick={() => setIsMinisterCalendarOpen(true)} className="flex items-center gap-2 px-4 py-2 text-[#048F86] bg-[#048F86]/10 border border-[#048F86] rounded-lg hover:bg-[#048F86]/20 transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px', fontWeight: 600 }}><Calendar className="w-4 h-4" />إطلع على جدول الوزير</button>
                </div>
              </div>
              {/* أهداف (للتعديل مع الحفظ) */}
              <div className="flex flex-col gap-3">
                <h3 className="text-right font-semibold text-gray-800" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>الأهداف</h3>
                {contentForm.objectives.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <DataTable
                      columns={[
                        { id: 'idx', header: 'رقم', width: 'w-20', align: 'center', render: (_: any, i: number) => i + 1 },
                        { id: 'objective', header: 'الهدف', width: 'flex-1 min-w-[200px]', align: 'end', render: (obj: any, index: number) => (
                          <Input type="text" value={obj.objective} onChange={(e) => { const n = [...contentForm.objectives]; n[index] = { ...obj, objective: e.target.value }; setContentForm((p) => ({ ...p, objectives: n })); }} className="w-full h-10 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="الهدف" />
                        ) },
                        { id: 'act', header: '', width: 'w-20', align: 'center', render: (_: any, index: number) => (
                          <button type="button" onClick={() => setContentForm((p) => ({ ...p, objectives: p.objectives.filter((_, i) => i !== index) }))} className="p-2 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        ) },
                      ] as TableColumn<any>[]}
                      data={contentForm.objectives}
                      className="border-none"
                      rowPadding="py-2"
                    />
                  </div>
                ) : null}
                <button type="button" onClick={() => setContentForm((p) => ({ ...p, objectives: [...p.objectives, { id: `obj-${Date.now()}`, objective: '' }] }))} className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#048F86] rounded-lg text-[#048F86] hover:bg-[#048F86] hover:text-white transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}><Plus className="w-4 h-4" />إضافة هدف</button>
              </div>
              {/* أجندة الاجتماع */}
              <div className="flex flex-col gap-3">
                <h3 className="text-right font-semibold text-gray-800" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>أجندة الاجتماع</h3>
                {contentForm.agendaItems.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                    <DataTable
                      columns={[
                        { id: 'idx', header: 'رقم البند', width: 'w-24', align: 'center', render: (_: any, i: number) => i + 1 },
                        { id: 'agenda_item', header: 'بند جدول الأعمال', width: 'flex-1 min-w-[200px]', align: 'end', render: (item: any, index: number) => (
                          <Input type="text" value={item.agenda_item} onChange={(e) => { const n = [...contentForm.agendaItems]; n[index] = { ...item, agenda_item: e.target.value }; setContentForm((p) => ({ ...p, agendaItems: n })); }} className="w-full h-10 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }} placeholder="عنوان البند" />
                        ) },
                        { id: 'act', header: '', width: 'w-20', align: 'center', render: (_: any, index: number) => (
                          <button type="button" onClick={() => setContentForm((p) => ({ ...p, agendaItems: p.agendaItems.filter((_, i) => i !== index) }))} className="p-2 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        ) },
                      ] as TableColumn<any>[]}
                      data={contentForm.agendaItems}
                      className="border-none"
                      rowPadding="py-2"
                    />
                  </div>
                ) : null}
                <button type="button" onClick={() => setContentForm((p) => ({ ...p, agendaItems: [...p.agendaItems, { id: `agenda-${Date.now()}`, agenda_item: '', presentation_duration_minutes: undefined }] }))} className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-[#048F86] rounded-lg text-[#048F86] hover:bg-[#048F86] hover:text-white transition-colors" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}><Plus className="w-4 h-4" />إضافة بند</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>ملاحظات</label>
                  <div className="min-h-20 px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.general_notes ?? '-'}</div>
                </div>
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
            <div className="flex flex-col gap-6 w-full max-w-[1085px]" dir="rtl">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>العرض التقديمي</label>
                <div className="flex flex-row gap-4 flex-wrap">
                  {(meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).length === 0 ? (
                    <p className="text-[#667085] text-sm py-2">لا يوجد عرض تقديمي</p>
                  ) : (
                    (meeting?.attachments || []).filter((a) => a.is_presentation && !deletedAttachmentIds.includes(a.id)).map((att) => (
                      <div key={att.id} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-[#009883] rounded-xl">
                        {att.file_type?.toLowerCase() === 'pdf' ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{att.file_type?.toUpperCase() || ''}</div>}
                        <div className="flex flex-col items-end"><span className="text-sm font-medium text-[#344054]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{att.file_name}</span><span className="text-xs text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{Math.round((att.file_size || 0) / 1024)} KB</span></div>
                        <div className="flex items-center gap-2 mr-auto"><a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)]"><Download className="w-4 h-4 text-[#009883]" /></a><button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-[#475467]" /></button><button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>متى سيتم إرفاق العرض؟</label>
                <div className="h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>—</div>
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
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>ملاحظات</label>
                <div className="min-h-20 px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {(() => {
                    const notes: any = meeting?.content_officer_notes;
                    // Safely handle content_officer_notes - could be string, array, or object
                    if (!notes) return '-';
                    if (typeof notes === 'string') return notes;
                    if (Array.isArray(notes)) {
                      // If it's an array, try to extract text from objects or join strings
                      return (notes as any[]).map((item: any) => {
                        if (typeof item === 'string') return item;
                        if (item && typeof item === 'object') {
                          return item.text || item.note_answer || item.note_question || JSON.stringify(item);
                        }
                        return String(item);
                      }).join('\n');
                    }
                    if (typeof notes === 'object') {
                      // If it's a single object, extract text
                      return (notes as any).text || (notes as any).note_answer || (notes as any).note_question || JSON.stringify(notes);
                    }
                    return String(notes);
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tab: قائمة المدعوين (Excel) – قائمة المدعوين (مقدم الطلب)، قائمة المدعوين (الوزير) */}
          {activeTab === 'attendees' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
              <div className="flex flex-col gap-6 w-full max-w-[1085px]">
                <div className="flex flex-col gap-2">
                  <h2 className="text-right font-bold text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '22px', lineHeight: '38px' }}>قائمة المدعوين (مقدّم الطلب)</h2>
                  <div className="w-full overflow-x-auto table-scroll">
                    <div className="min-w-full">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم البند',
                            width: 'w-[120px]',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <div className="flex items-center justify-center w-full">
                                <span className="text-sm text-[#475467]">{index + 1}</span>
                              </div>
                            ),
                          },
                          {
                            id: 'name',
                            header: 'الاسم',
                            width: 'flex-1',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                return (
                                  <Input
                                    type="text"
                                    value={row.external_name || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateLocalInvitee(row.id, 'external_name', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="أدخل الاسم"
                                    className="h-9 text-right w-full"
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.external_name || row.user_id || '--------------'}</span>;
                            },
                          },
                          {
                            id: 'email',
                            header: 'البريد الإلكتروني',
                            width: 'w-[250px]',
                            align: 'end',
                            render: (row: any) => {
                              if (row.isLocal) {
                                return (
                                  <Input
                                    type="email"
                                    value={row.external_email || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      updateLocalInvitee(row.id, 'external_email', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="أدخل البريد الإلكتروني"
                                    className="h-9 text-right w-full"
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  />
                                );
                              }
                              return <span className="text-sm text-[#475467]">{row.external_email || '--------------'}</span>;
                            },
                          },
                          {
                            id: 'is_required',
                            header: 'الحضور أساسي',
                            width: 'w-[180px]',
                            align: 'center',
                            render: (row: any) => {
                              const inviteeState = inviteesState.find((inv) => inv.id === row.id);
                              const isRequired = inviteeState?.is_required ?? row.is_required;
                              return (
                                <div className="flex items-center justify-center gap-2 w-full">
                                  <span className="text-sm text-[#667085]">{isRequired ? 'نعم' : 'لا'}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateInviteeRequired(row.id, !isRequired);
                                    }}
                                    className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                                      isRequired
                                        ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                                        : 'bg-[#F2F4F7] justify-start'
                                    } px-0.5`}
                                  >
                                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                  </button>
                                </div>
                              );
                            },
                          },
                          {
                            id: 'action',
                            header: 'إجراء',
                            width: 'w-[120px]',
                            align: 'center',
                            render: (row: any) => (
                              <div className="flex items-center justify-center w-full">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteInviteeId(row.id);
                                  }}
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
                <div className="flex flex-col gap-2">
                  <h2 className="text-right font-bold text-[#101828]" style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '22px', lineHeight: '38px' }}>قائمة المدعوين (الوزير)</h2>
                  <div className="w-full overflow-x-auto table-scroll">
                    <div className="min-w-[1085px]">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم البند',
                            width: 'w-[114px]',
                            align: 'center',
                            render: (_row: MinisterAttendee, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                          },
                          {
                            id: 'username',
                            header: 'اسم المستخدم',
                            width: 'flex-1',
                            align: 'end',
                            render: (row: MinisterAttendee, index: number) => (
                              <Input
                                type="text"
                                value={row.username || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateMinisterAttendee(index, 'username', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="john.doe"
                                className="h-9 text-right w-full"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              />
                            ),
                          },
                          {
                            id: 'external_email',
                            header: 'البريد الإلكتروني الخارجي',
                            width: 'w-[227px]',
                            align: 'end',
                            render: (row: MinisterAttendee, index: number) => (
                              <Input
                                type="email"
                                value={row.external_email || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateMinisterAttendee(index, 'external_email', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="external@example.com"
                                className="h-9 text-right w-full"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              />
                            ),
                          },
                          {
                            id: 'is_required',
                            header: 'الحضور أساسي',
                            width: 'w-[136px]',
                            align: 'center',
                            render: (row: MinisterAttendee, index: number) => (
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className="text-sm text-[#667085]"
                                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                >
                                  {row.is_required ? 'نعم' : 'لا'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateMinisterAttendee(index, 'is_required', !row.is_required);
                                  }}
                                  className={`w-11 h-6 rounded-full flex items-center transition-all ${
                                    row.is_required
                                      ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                                      : 'bg-[#F2F4F7] justify-start'
                                  } px-0.5 cursor-pointer`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                                </button>
                              </div>
                            ),
                          },
                          {
                            id: 'access_permission',
                            header: 'صلاحية الوصول',
                            width: 'w-[165px]',
                            align: 'center',
                            render: (row: MinisterAttendee, index: number) => (
                              <div onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={row.access_permission}
                                  onValueChange={(value) => updateMinisterAttendee(index, 'access_permission', value)}
                                >
                                  <SelectTrigger
                                    className="h-9 bg-white border border-gray-300 rounded-lg text-right flex-row-reverse w-full"
                                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                  >
                                    <SelectValue placeholder="اختر" />
                                  </SelectTrigger>
                                  <SelectContent dir="rtl">
                                    <SelectItem value="FULL">كامل</SelectItem>
                                    <SelectItem value="READ_ONLY">قراءة فقط</SelectItem>
                                    <SelectItem value="LIMITED">محدود</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ),
                          },
                          {
                            id: 'justification',
                            header: 'التبرير',
                            width: 'w-[100px]',
                            align: 'center',
                            render: (row: MinisterAttendee, _index: number) => {
                              if (!row.justification || row.justification.trim() === '') {
                                return null;
                              }
                              return (
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative group">
                                          <Sparkles 
                                            className="w-5 h-5 text-[#048F86] cursor-pointer transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 animate-pulse"
                                            style={{
                                              animation: 'sparkle 2s ease-in-out infinite',
                                            }}
                                          />
                                          <style>{`
                                            @keyframes sparkle {
                                              0%, 100% {
                                                opacity: 1;
                                                filter: brightness(1);
                                              }
                                              50% {
                                                opacity: 0.8;
                                                filter: brightness(1.3);
                                              }
                                            }
                                          `}</style>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent 
                                        side="left" 
                                        className="max-w-[400px] p-3 text-right"
                                        dir="rtl"
                                      >
                                        <p 
                                          className="text-sm text-[#475467] whitespace-pre-wrap"
                                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                        >
                                          {row.justification}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              );
                            },
                          },
                          {
                            id: 'action',
                            header: 'إجراء',
                            width: 'w-[114px]',
                            align: 'center',
                        render: (_row: MinisterAttendee, index: number) => (
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
                        ] as TableColumn<MinisterAttendee>[]}
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

          {/* Consultations Log → استشارة الجدولة (Excel) */}
          {activeTab === 'scheduling-consultation' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-3 justify-end">
                <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>تضمين المسودات</span>
                <button
                  type="button"
                  onClick={() => setIncludeDraftsConsultation((v) => !v)}
                  className={`w-11 h-6 rounded-full flex transition-all cursor-pointer shrink-0 ${includeDraftsConsultation ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      id: 'consultation_type',
                      header: 'نوع الاستشارة',
                      width: 'w-32',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultation_type === 'SCHEDULING' ? 'جدولة' : row.consultation_type}
                        </span>
                      ),
                    },
                    {
                      id: 'consultation_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultation_question}
                        </span>
                      ),
                    },
                    {
                      id: 'consultation_answer',
                      header: 'الإجابة',
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultation_answer || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'consultant_name',
                      header: 'المستشار',
                      width: 'w-40',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultant_name}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_at',
                      header: 'تاريخ الطلب',
                      width: 'w-40',
                      render: (row: ConsultationRecord) => {
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
                      render: (row: ConsultationRecord) => {
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
                      render: (row: ConsultationRecord) => {
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
                  data={consultationRecords.items}
                  rowPadding="py-3"
                />
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

          {/* Directives Log Tab */}
          {activeTab === 'directive' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-3 justify-end">
                <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>تضمين المسودات</span>
                <button
                  type="button"
                  onClick={() => setIncludeDraftsGuidance((v) => !v)}
                  className={`w-11 h-6 rounded-full flex transition-all cursor-pointer shrink-0 ${includeDraftsGuidance ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end' : 'bg-[#F2F4F7] justify-start'} px-0.5`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
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
                    <p className="text-gray-600 text-lg mb-2">سجل التوجيهات</p>
                    <p className="text-gray-500 text-sm">لا توجد توجيهات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Officer Notes Tab */}
          {activeTab === 'content-consultation' && (
            <div className="flex flex-col gap-4">
              {isLoadingContentOfficerNotes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : (() => {
                  // Double-check tab is active and data exists before processing
                  if (activeTab !== 'content-consultation') {
                    return (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <p className="text-gray-600 text-lg mb-2">ملاحظات مسؤول المحتوى</p>
                          <p className="text-gray-500 text-sm">لا توجد ملاحظات مسجلة</p>
                        </div>
                      </div>
                    );
                  }
                  if (!contentOfficerNotesRecords || !Array.isArray(contentOfficerNotesRecords.items) || contentOfficerNotesRecords.items.length === 0) {
                    return (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <p className="text-gray-600 text-lg mb-2">ملاحظات مسؤول المحتوى</p>
                          <p className="text-gray-500 text-sm">لا توجد ملاحظات مسجلة</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <DataTable
                      columns={[
                    {
                      id: 'note_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: ContentOfficerNoteRecord) => {
                        // Only access fields we know are safe strings from our transformation
                        const question = (row.note_question && typeof row.note_question === 'string') 
                          ? row.note_question 
                          : '-';
                        return (
                          <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {question}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'note_answer',
                      header: 'الملاحظة',
                      width: 'flex-1',
                      render: (row: ContentOfficerNoteRecord) => {
                        // Only access fields we know are safe strings from our transformation
                        const answer = (row.note_answer && typeof row.note_answer === 'string') 
                          ? row.note_answer 
                          : '';
                        return (
                          <span className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {answer}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'author_name',
                      header: 'المؤلف',
                      width: 'w-40',
                      render: (row: ContentOfficerNoteRecord) => {
                        const authorName = typeof row.author_name === 'string' ? row.author_name : String(row.author_name || '-');
                        return (
                          <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {authorName}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'created_at',
                      header: 'تاريخ الإنشاء',
                      width: 'w-40',
                      render: (row: ContentOfficerNoteRecord) => {
                        const createdAt = typeof row.created_at === 'string' ? row.created_at : String(row.created_at || '');
                        const date = new Date(createdAt);
                        if (isNaN(date.getTime())) {
                          return (
                            <span className="text-sm text-gray-400" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              -
                            </span>
                          );
                        }
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
                      id: 'updated_at',
                      header: 'تاريخ التحديث',
                      width: 'w-40',
                      render: (row: ContentOfficerNoteRecord) => {
                        const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : String(row.updated_at || '');
                        const date = new Date(updatedAt);
                        if (isNaN(date.getTime())) {
                          return (
                            <span className="text-sm text-gray-400" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                              -
                            </span>
                          );
                        }
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
                  ]}
                  data={contentOfficerNotesRecords && Array.isArray(contentOfficerNotesRecords.items) 
                    ? contentOfficerNotesRecords.items
                        .filter((item: any) => item && typeof item === 'object' && !Array.isArray(item)) // Only process valid objects, not arrays
                        .map((item: any) => {
                      // Helper function to safely convert any value to string
                      const safeString = (value: any, fallback: string = ''): string => {
                        if (value === null || value === undefined) return fallback;
                        if (typeof value === 'string') return value;
                        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
                        // If it's an object, don't try to render it - return fallback
                        return fallback;
                      };

                      // Helper to safely get note_question (can be null)
                      const safeNoteQuestion = (value: any): string | null => {
                        if (value === null || value === undefined) return null;
                        if (typeof value === 'string') return value;
                        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
                        // If it's an object, return null
                        return null;
                      };

                      // Get source values safely - check each field individually and ensure it's not an object
                      const getSafeValue = (value: any, fallback: any = null): any => {
                        if (value === null || value === undefined) return fallback;
                        // Reject any object (including arrays) - only allow primitives
                        if (typeof value === 'object') {
                          return fallback;
                        }
                        // Only return primitives: string, number, boolean
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                          return value;
                        }
                        return fallback;
                      };

                      const sourceId = getSafeValue(item.id) ?? getSafeValue(item.note_id) ?? '';
                      const sourceQuestion = getSafeValue(item.note_question) ?? getSafeValue(item.text) ?? null;
                      const sourceAnswer = getSafeValue(item.note_answer) ?? getSafeValue(item.text) ?? '';
                      const sourceAuthor = getSafeValue(item.author_name) ?? '';
                      const sourceCreated = getSafeValue(item.created_at) ?? '';
                      const sourceUpdated = getSafeValue(item.updated_at) ?? '';

                      // Safely extract values, ensuring we never have objects
                      // Only include the exact fields we need, all converted to strings
                      // Create a completely new object with only the fields we need
                      const safeItem: ContentOfficerNoteRecord = {
                        id: safeString(sourceId, ''),
                        note_question: safeNoteQuestion(sourceQuestion),
                        note_answer: safeString(sourceAnswer, ''),
                        author_name: safeString(sourceAuthor, ''),
                        created_at: safeString(sourceCreated, ''),
                        updated_at: safeString(sourceUpdated, ''),
                      };
                      
                      // Final safety check: ensure no object properties exist
                      // This prevents any accidental object rendering
                      const finalItem: any = {};
                      Object.keys(safeItem).forEach(key => {
                        const value = (safeItem as any)[key];
                        if (value !== null && value !== undefined && typeof value !== 'object') {
                          finalItem[key] = value;
                        } else if (value === null) {
                          finalItem[key] = null;
                        } else {
                          finalItem[key] = '';
                        }
                      });
                      
                      return finalItem as ContentOfficerNoteRecord;
                        })
                    : []}
                      rowPadding="py-3"
                    />
                  );
                })()}
            </div>
          )}

          {/* Tab: الملاحظات على الطلب (Excel) – اسم الحقل: الملاحظات */}
          {activeTab === 'request-notes' && (
            <div className="flex flex-col gap-4 max-w-[1085px]" dir="rtl">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>الملاحظات</label>
                <div className="min-h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>{meeting?.general_notes ?? '-'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        {/* Sticky action bar - Only shown when status is UNDER_REVIEW */}
        {meeting && meeting.status === MeetingStatus.UNDER_REVIEW && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full  px-4">
            <div className="mx-auto bg-white/60 backdrop-blur-md rounded-full p-2.5 shadow-lg border border-gray-200 flex justify-center w-max ">
            <div className="flex flex-row items-center gap-1.5 justify-center flex-wrap">
              {/* Schedule Button - Hide when status is WAITING */}
              {meetingStatus !== MeetingStatus.WAITING && (
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
                >
                  <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    جدولة
                  </span>
                  <Calendar className="w-5 h-5" />
                </button>
              )}
              {/* Edit/Save Button - shown when there are changes */}
              <button
                onClick={() => setIsEditConfirmOpen(true)}
                disabled={!hasChanges}
                aria-disabled={!hasChanges}
                title={!hasChanges ? 'لا توجد تعديلات ليتم إرسالها' : 'تعديل'}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-opacity ${
                  hasChanges
                    ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  تعديل
                </span>
              </button>
                      {/* Return to Request Button - Hide when status is WAITING */}
                      {meetingStatus !== MeetingStatus.WAITING && (
                        <button
                          onClick={() => setIsReturnForInfoModalOpen(true)}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
                        >
                          <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            إعادة للطلب
                          </span>
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      )}
                {/* Request Consultation Button - Hide when status is WAITING */}
                {meetingStatus !== MeetingStatus.WAITING && (
                  <button
                    onClick={() => setIsConsultationModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors"
                  >
                    <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      طلب استشارة
                    </span>
                    <ClipboardCheck className="w-5 h-5" />
                  </button>
                )}
                     {/* Request Guidance Button - Hide when status is WAITING */}
                     {meetingStatus !== MeetingStatus.WAITING && (
                       <button
                         onClick={() => setIsRequestGuidanceModalOpen(true)}
                         className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors"
                       >
                         <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                           طلب توجيه
                         </span>
                         <FileCheck className="w-5 h-5" />
                       </button>
                     )}
               {/* Send to Content Button - Hide when status is WAITING */}
               {meetingStatus !== MeetingStatus.WAITING && (
                 <button
                   onClick={() => setIsSendToContentModalOpen(true)}
                   className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
                 >
                   <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                     إرسال للمحتوى
                   </span>
                   <Send className="w-5 h-5" />
                 </button>
               )}

              {/* Add to Waiting List Button - Only show when status is UNDER_REVIEW */}
              {meetingStatus === MeetingStatus.UNDER_REVIEW && (
                <button
                  onClick={() => moveToWaitingListMutation.mutate()}
                  disabled={moveToWaitingListMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {moveToWaitingListMutation.isPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار'}
                  </span>
                  <Plus className="w-5 h-5" />
                </button>
              )}

              {/* Reject Button - Hide when status is WAITING */}
              {meetingStatus !== MeetingStatus.WAITING && (
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                >
                  <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    رفض
                  </span>
                  <X className="w-5 h-5" />
                </button>
              )}

             
       

            

      

         
            </div>
          </div>
        </div>
        )}
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
                username:`${suggestion.first_name} ${suggestion.last_name}`, // Extract username from email
                external_email: suggestion.email,
                external_name: `${suggestion.first_name} ${suggestion.last_name}`,
                is_required: suggestion.importance_level === 'مناسب جدا', // Set as required if highly suitable
                justification: suggestion.suggestion_reason,
                access_permission: 'FULL', // Default to full access
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
        if (!open) setValidationError(null);
      }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              تأكيد التعديلات
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-right text-sm text-red-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  {validationError}
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
                setValidationError(null);
                updateMutation.mutate(changedPayload);
              }}
                disabled={!hasChanges || updateMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#048F86] text-white hover:bg-[#047a6f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Content Modal */}
      <Dialog open={isSendToContentModalOpen} onOpenChange={setIsSendToContentModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              إرسال للمحتوى
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendToContentSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
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
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSendToContentModalOpen(false);
                  setSendToContentForm({ notes: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendToContentDraft}
                disabled={sendToContentMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {sendToContentMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}
              </button>
              <button
                type="submit"
                disabled={sendToContentMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {sendToContentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Guidance Modal */}
      <Dialog open={isRequestGuidanceModalOpen} onOpenChange={setIsRequestGuidanceModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              طلب توجيه
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestGuidanceSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  ملاحظات
                </label>
                <Textarea
                  value={requestGuidanceForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setRequestGuidanceForm({ notes: e.target.value })
                  }
                  placeholder="يرجى توفير التوجيهات اللازمة حول هذا الطلب"
                  className="w-full min-h-[100px] text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRequestGuidanceModalOpen(false);
                  setRequestGuidanceForm({ notes: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleRequestGuidanceDraft}
                disabled={requestGuidanceMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {requestGuidanceMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}
              </button>
              <button
                type="submit"
                disabled={requestGuidanceMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#29615C] rounded-lg hover:bg-[#1f4a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {requestGuidanceMutation.isPending ? 'جاري الإرسال...' : 'طلب توجيه'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scheduling Consultation Modal */}
      <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              طلب استشارة جدولة
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConsultationSubmit}>
            <div className="flex flex-col gap-4 py-4">
              {/* Consultant async select with internal search */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  المستشار
                </label>
                <Select
                  value={consultationForm.consultant_user_id}
                  onValueChange={(value) =>
                    setConsultationForm((prev) => ({
                      ...prev,
                      consultant_user_id: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    <SelectValue placeholder={isLoadingConsultants ? 'جاري التحميل...' : 'اختر المستشار'} />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {/* Search inside dropdown */}
                    <div className="px-2 py-1 border-b border-gray-200 sticky top-0 bg-white z-10">
                      <Input
                        type="text"
                        value={consultationForm.search}
                        onChange={(e) =>
                          setConsultationForm((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                        placeholder="ابحث عن المستشار بالاسم أو البريد"
                        className="h-9 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      />
                    </div>
                    {consultants.length === 0 && !isLoadingConsultants ? (
                      <SelectItem disabled value="__no_results__">
                        لا توجد نتائج
                      </SelectItem>
                    ) : (
                      consultants.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {`${user.first_name} ${user.last_name} - ${user.email}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Consultation question */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  سؤال الاستشارة
                </label>
                <Textarea
                  value={consultationForm.consultation_question}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setConsultationForm((prev) => ({
                      ...prev,
                      consultation_question: e.target.value,
                    }))
                  }
                  placeholder="هل يمكن جدولة هذا الاجتماع في الموعد المقترح؟"
                  className="w-full min-h-[100px] text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsConsultationModalOpen(false);
                  setConsultationForm({
                    consultant_user_id: '',
                    consultation_question: '',
                    search: '',
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConsultationDraft}
                disabled={consultationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {consultationMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}
              </button>
              <button
                type="submit"
                disabled={!consultationForm.consultant_user_id || consultationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#29615C] rounded-lg hover:bg-[#1f4a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {consultationMutation.isPending ? 'جاري الإرسال...' : 'طلب استشارة'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return for Info Modal */}
      <Dialog open={isReturnForInfoModalOpen} onOpenChange={setIsReturnForInfoModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              إعادة للطلب
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnForInfoSubmit}>
            <div className="flex flex-col gap-4 py-4">
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
                    setReturnForInfoForm({ notes: e.target.value })
                  }
                  placeholder="يرجى توفير معلومات إضافية حول الموضوع"
                  className="w-full min-h-[100px] text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsReturnForInfoModalOpen(false);
                  setReturnForInfoForm({ notes: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={returnForInfoMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {returnForInfoMutation.isPending ? 'جاري الإرسال...' : 'إعادة للطلب'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={(open) => {
        setIsScheduleModalOpen(open);
        if (!open) {
          setValidationError(null);
          setWebexMeetingDetails(null);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
              جدولة الاجتماع
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit}>
            <div className="flex flex-col gap-4 py-4">
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

                    {/* Username or External Email/Name */}
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
                          البريد الإلكتروني الخارجي
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
                    </div>

                    {attendee.external_email && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          الاسم الخارجي
                        </label>
                        <Input
                          type="text"
                          value={attendee.external_name || ''}
                          onChange={(e) => updateMinisterAttendee(index, 'external_name', e.target.value)}
                          placeholder="External Attendee"
                          className="w-full h-9 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        />
                      </div>
                    )}

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
                          value={attendee.access_permission}
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
                        value={attendee.justification}
                        onChange={(e) => updateMinisterAttendee(index, 'justification', e.target.value)}
                        placeholder="Required for decision making"
                        className="w-full h-9 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              {scheduleMutation.isSuccess && webexMeetingDetails ? (
                // Show close button after successful scheduling with Webex
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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