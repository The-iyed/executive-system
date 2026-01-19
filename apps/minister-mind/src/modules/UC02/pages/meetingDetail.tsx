import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, X, Send, FileCheck, ClipboardCheck, RotateCcw, Calendar, Info, Plus, Trash2, Download, Eye } from 'lucide-react';
import pdfIcon from '../../shared/assets/pdf.svg';
import { StatusBadge, DataTable } from '@shared/components';
import type { TableColumn } from '@shared';
import { 
  MeetingStatus, 
  MeetingStatusLabels, 
  MeetingType,
  MeetingTypeLabels,
  MeetingClassification,
  MeetingClassificationLabels,
} from '@shared/types'; 
import { Tabs } from '@shared/components';
import {
  getMeetingById,
  rejectMeeting,
  sendToContent,
  requestGuidance,
  getConsultants,
  type ConsultantUser,
  requestSchedulingConsultation,
  returnMeetingForInfo,
  scheduleMeeting,
  type MinisterAttendee,
  getConsultationRecords,
  type ConsultationRecord,
  getGuidanceRecords,
  type GuidanceRecord,
  getContentOfficerNotesRecords,
  type ContentOfficerNoteRecord,
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
} from '@sanad-ai/ui';
import { updateMeetingRequest } from '../data/meetingsApi';

// Field labels mapping for edit confirmation modal
const fieldLabels: Record<string, string> = {
  meeting_type: 'نوع الاجتماع',
  meeting_title: 'عنوان الاجتماع',
  meeting_subject: 'موضوع الاجتماع',
  meeting_classification: 'تصنيف الاجتماع',
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

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('basic-info');

  // Fetch meeting data from API
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  // Fetch consultation records
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === 'consultations-log',
  });

  // Fetch guidance records
  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', id],
    queryFn: () => getGuidanceRecords(id!),
    enabled: !!id && activeTab === 'directives-log',
  });

  // Fetch content officer notes records
  const { data: contentOfficerNotesRecords, isLoading: isLoadingContentOfficerNotes } = useQuery({
    queryKey: ['content-officer-notes-records', id],
    queryFn: () => getContentOfficerNotesRecords(id!, { skip: 0, limit: 100 }),
    enabled: !!id && activeTab === 'content-officer-notes',
  });

  // Form state
  const [formData, setFormData] = useState({
    meeting_type: '',
    meeting_title: '',
    meeting_classification: '',
    meeting_subject: '',
  });

  // Alert visibility state - persisted in localStorage
  const [showAttachmentsAlert, setShowAttachmentsAlert] = useState(() => {
    if (!id) return true;
    const dismissedKey = `meeting-alert-dismissed-${id}`;
    const isDismissed = localStorage.getItem(dismissedKey) === 'true';
    return !isDismissed;
  });

  // Scheduling alert visibility state - persisted in localStorage
  const [showSchedulingAlert, setShowSchedulingAlert] = useState(() => {
    if (!id) return true;
    const dismissedKey = `meeting-scheduling-alert-dismissed-${id}`;
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
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
    meeting_channel: 'PHYSICAL',
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

  const queryClient = useQueryClient();
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
    mutationFn: (payload: { notes: string }) => sendToContent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsSendToContentModalOpen(false);
      setSendToContentForm({ notes: '' });
      navigate(-1); // Navigate back after successful send
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
    sendToContentMutation.mutate({
      notes: sendToContentForm.notes,
    });
  };

  // Request guidance mutation
  const requestGuidanceMutation = useMutation({
    mutationFn: (payload: { notes: string }) => requestGuidance(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsRequestGuidanceModalOpen(false);
      setRequestGuidanceForm({ notes: '' });
      navigate(-1); // Navigate back after successful request
    },
  });

  const handleRequestGuidanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestGuidanceMutation.mutate({
      notes: requestGuidanceForm.notes || 'يرجى توفير التوجيهات اللازمة حول هذا الطلب',
    });
  };

  // Consultants query for async select
  const {
    data: consultantsResponse,
    isLoading: isLoadingConsultants,
  } = useQuery({
    queryKey: ['consultants', consultationForm.search],
    queryFn: () =>
      getConsultants({
        search: consultationForm.search,
        page: 1,
        limit: 50,
      }),
    enabled: isConsultationModalOpen,
  });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // Scheduling consultation mutation
  const consultationMutation = useMutation({
    mutationFn: (payload: { consultant_user_id: string; consultation_question: string }) =>
      requestSchedulingConsultation(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsConsultationModalOpen(false);
      setConsultationForm({
        consultant_user_id: '',
        consultation_question: '',
        search: '',
      });
      navigate(-1); // Navigate back after successful request
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

  // Return for info mutation
  const returnForInfoMutation = useMutation({
    mutationFn: (payload: { notes: string }) => returnMeetingForInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      setIsReturnForInfoModalOpen(false);
      setReturnForInfoForm({ notes: '' });
      navigate(-1); // Navigate back after successful return
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
      minister_attendees: MinisterAttendee[];
    }) => scheduleMeeting(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
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
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.scheduled_at) return;

    // Validate: if requires_protocol is true, protocol_type or protocol_type_text must be filled
    if (scheduleForm.requires_protocol && !scheduleForm.protocol_type && !scheduleForm.protocol_type_text) {
      setValidationError('يجب تحديد نوع البروتوكول عند تفعيل خيار "يتطلب بروتوكول"');
      return;
    }

    setValidationError(null);

    // Convert datetime-local to ISO string
    const scheduledAtISO = new Date(scheduleForm.scheduled_at).toISOString();

    scheduleMutation.mutate({
      scheduled_at: scheduledAtISO,
      meeting_channel: scheduleForm.meeting_channel,
      requires_protocol: scheduleForm.requires_protocol,
      protocol_type: scheduleForm.requires_protocol ? (scheduleForm.protocol_type || scheduleForm.protocol_type_text || null) : null,
      is_data_complete: scheduleForm.is_data_complete,
      notes: scheduleForm.notes || 'Meeting scheduled successfully',
      location: scheduleForm.location || undefined,
      minister_attendees: scheduleForm.minister_attendees,
    });
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
      setFormData({
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.meeting_subject || '',
      });

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
 
 

  // Initialize scheduleForm and original snapshot when meeting loads
  useEffect(() => {
    if (!meeting) return;
    setScheduleForm((prev) => ({
      ...prev,
      scheduled_at: meeting.scheduled_at || '',
      meeting_channel: meeting.meeting_channel || prev.meeting_channel,
      requires_protocol: meeting.requires_protocol ?? prev.requires_protocol,
      protocol_type: meeting.protocol_type || prev.protocol_type,
      protocol_type_text: meeting.protocol_type || prev.protocol_type_text,
      is_data_complete: meeting.is_data_complete ?? prev.is_data_complete,
      location: meeting.meeting_channel || prev.location,
      selected_time_slot_id: meeting.selected_time_slot_id || null,
      minister_attendees: ((meeting as any).minister_attendees as any) || prev.minister_attendees,
    }));

    setLocalInvitees([]);
    
    // Reset attachment state when meeting loads
    setDeletedAttachmentIds([]);
    setNewAttachments([]);

    setOriginalSnapshot({
      formData: {
        meeting_type: meeting.meeting_type || '',
        meeting_title: meeting.meeting_title || '',
        meeting_classification: meeting.meeting_classification || '',
        meeting_subject: meeting.meeting_subject || '',
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

  const tabs = [
    { id: 'basic-info', label: 'المعلومات الأساسية' },
    { id: 'content', label: 'المحتوى' },
    { id: 'scheduling', label: 'الجدولة' },
    { id: 'attachments', label: 'المرفقات' },
    { id: 'consultations-log', label: 'سجل الإستشارات' },
    { id: 'directives-log', label: 'سجل التوجيهات' },
    { id: 'content-officer-notes', label: 'ملاحظات مسؤول المحتوى' },
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

          {/* Form Fields - Basic Information */}
          {activeTab === 'basic-info' && (
            <div className="flex flex-col gap-4">
              {/* Row 1 */}
              <div className="flex flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    نوع الاجتماع
                  </label>
                  <Select
                    value={formData.meeting_type}
                    onValueChange={(value) => handleFieldChange('meeting_type', value)}
                  >
                    <SelectTrigger
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      <SelectValue placeholder="اختر نوع الاجتماع" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {Object.values(MeetingType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {MeetingTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    عنوان الاجتماع
                  </label>
                  <Input
                    type="text"
                    value={formData.meeting_title}
                    onChange={(e) => handleFieldChange('meeting_title', e.target.value)}
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    placeholder="أدخل عنوان الاجتماع"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    تصنيف الاجتماع
                  </label>
                  <Select
                    value={formData.meeting_classification}
                    onValueChange={(value) => handleFieldChange('meeting_classification', value)}
                  >
                    <SelectTrigger
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      <SelectValue placeholder="اختر تصنيف الاجتماع" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {Object.values(MeetingClassification).map((classification) => (
                        <SelectItem key={classification} value={classification}>
                          {MeetingClassificationLabels[classification]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    موضوع الاجتماع
                  </label>
                  <Input
                    type="text"
                    value={formData.meeting_subject}
                    onChange={(e) => handleFieldChange('meeting_subject', e.target.value)}
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    placeholder="أدخل موضوع الاجتماع"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-10 w-full" dir="rtl">
              {/* Objectives Section */}
              <div className="flex flex-col items-start gap-4 w-full">
                <h3
                  className="w-full font-semibold text-black text-right"
                  style={{
                    fontFamily: "'Somar Sans', sans-serif",
                    fontSize: '21.1px',
                    lineHeight: '28px',
                  }}
                >
                  الأهداف:
                </h3>
                <div className="w-full text-right overflow-y-auto">
                  {contentForm.objectives.length > 0 ? (
                    <div className="w-full overflow-x-auto table-scroll">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم',
                            width: 'w-[120px] min-w-[120px] flex-shrink-0',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#048F86] text-white text-xs font-semibold mx-auto">
                                {index + 1}
                              </div>
                            ),
                          },
                          {
                            id: 'objective',
                            header: 'الهدف',
                            width: 'flex-[3] min-w-[200px]',
                            align: 'end',
                            render: (obj: any, index: number) => (
                              <input
                                type="text"
                                value={obj.objective}
                                onChange={(e) => {
                                  const newObjectives = [...contentForm.objectives];
                                  newObjectives[index] = { ...obj, objective: e.target.value };
                                  setContentForm((prev) => ({ ...prev, objectives: newObjectives }));
                                }}
                                className="w-full h-10 bg-white border border-gray-300 rounded-lg text-right focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86] px-3"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}
                                placeholder="أدخل الهدف"
                              />
                            ),
                          },
                          {
                            id: 'action',
                            header: '',
                            width: 'w-[120px] min-w-[120px] flex-shrink-0',
                            align: 'center',
                            render: (_item: any, index: number) => (
                              <button
                                type="button"
                                onClick={() => {
                                  setContentForm((prev) => ({
                                    ...prev,
                                    objectives: prev.objectives.filter((_, i) => i !== index),
                                  }));
                                }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors mx-auto"
                                title="حذف الهدف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={contentForm.objectives}
                        className="border-none shadow-none min-w-[700px]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p
                        className="text-[#667085] text-sm"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        لا توجد أهداف
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `obj-${Date.now()}-${Math.random()}`;
                      setContentForm((prev) => ({
                        ...prev,
                        objectives: [...prev.objectives, { id: newId, objective: '' }],
                      }));
                    }}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-[#048F86] rounded-lg text-[#048F86] hover:bg-[#048F86] hover:text-white transition-colors font-medium"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}
                  >
                    <Plus className="w-4 h-4" />
                    إضافة هدف جديد
                  </button>
                </div>
              </div>

              {/* Agenda Items Section */}
              <div className="flex flex-col items-start gap-4 w-full">
                <h3
                  className="w-full font-semibold text-black text-right"
                  style={{
                    fontFamily: "'Somar Sans', sans-serif",
                    fontSize: '21.1px',
                    lineHeight: '28px',
                  }}
                >
                  بنود جدول أعمال الاجتماع:
                </h3>
                <div className="w-full text-right overflow-y-auto">
                  {contentForm.agendaItems.length > 0 ? (
                    <div className="w-full overflow-x-auto table-scroll">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم',
                            width: 'w-[120px] min-w-[120px] flex-shrink-0',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#048F86] text-white text-xs font-semibold mx-auto">
                                {index + 1}
                              </div>
                            ),
                          },
                          {
                            id: 'agenda_item',
                            header: 'عنوان البند',
                            width: 'flex-[3] min-w-[250px]',
                            align: 'end',
                            render: (item: any, index: number) => (
                              <Input
                                type="text"
                                value={item.agenda_item}
                                onChange={(e) => {
                                  const newAgendaItems = [...contentForm.agendaItems];
                                  newAgendaItems[index] = {
                                    ...item,
                                    agenda_item: e.target.value,
                                  };
                                  setContentForm((prev) => ({ ...prev, agendaItems: newAgendaItems }));
                                }}
                                className="w-full h-10 bg-white border border-gray-300 rounded-lg text-right focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86]"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}
                                placeholder="أدخل عنوان البند"
                              />
                            ),
                          },
                          {
                            id: 'duration',
                            header: 'المدة',
                            width: 'w-[140px] min-w-[140px] flex-shrink-0',
                            align: 'end',
                            render: (item: any, index: number) => (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.presentation_duration_minutes || ''}
                                  onChange={(e) => {
                                    const newAgendaItems = [...contentForm.agendaItems];
                                    newAgendaItems[index] = {
                                      ...item,
                                      presentation_duration_minutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                    };
                                    setContentForm((prev) => ({ ...prev, agendaItems: newAgendaItems }));
                                  }}
                                  className="w-20 h-10 bg-white border border-gray-300 rounded-lg text-right focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86]"
                                  style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}
                                  placeholder="المدة"
                                />
                                <span className="text-[#475467] text-xs font-medium" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                  دقيقة
                                </span>
                              </div>
                            ),
                          },
                          {
                            id: 'action',
                            header: '',
                            width: 'w-[120px] min-w-[120px] flex-shrink-0',
                            align: 'center',
                            render: (_item: any, index: number) => (
                              <button
                                type="button"
                                onClick={() => {
                                  setContentForm((prev) => ({
                                    ...prev,
                                    agendaItems: prev.agendaItems.filter((_, i) => i !== index),
                                  }));
                                }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors mx-auto"
                                title="حذف البند"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={contentForm.agendaItems}
                        className="border-none shadow-none min-w-[900px]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p
                        className="text-[#667085] text-sm"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        لا توجد بنود جدول أعمال الاجتماع
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `agenda-${Date.now()}-${Math.random()}`;
                      setContentForm((prev) => ({
                        ...prev,
                        agendaItems: [...prev.agendaItems, { id: newId, agenda_item: '', presentation_duration_minutes: undefined }],
                      }));
                    }}
                    className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-[#048F86] rounded-lg text-[#048F86] hover:bg-[#048F86] hover:text-white transition-colors font-medium"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '14px' }}
                  >
                    <Plus className="w-4 h-4" />
                    إضافة بند جديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
              {/* Alert Card */}
              {showSchedulingAlert && !hasAttachments && (
              <div className="relative flex flex-row items-start gap-3 w-full max-w-[1085px] bg-white border border-[#D0D5DD] rounded-[12px] p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (!id) return;
                    const dismissedKey = `meeting-scheduling-alert-dismissed-${id}`;
                    localStorage.setItem(dismissedKey, 'true');
                    setShowSchedulingAlert(false);
                  }}
                  className="absolute -top-2 -left-2 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-gray-100 transition-colors bg-white border border-gray-200"
                >
                  <X className="w-5 h-5 text-[#667085]" />
                </button>
                <div className="flex flex-col items-end gap-3 w-full pr-2">
                  <div className="flex flex-col items-end gap-1 w-full">
                    <p
                      className="w-full text-right"
                      style={{
                        fontFamily: "'Somar Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#344054',
                      }}
                    >
                      عند جدولة الاجتماع، سيتم الربط مع تقويم الوزير لحجز الموعد وإرسال الدعوات، والربط مع AD لإضافة المدعويين. سيتم إشعار فريق المراسم في حال الحاجة للبروتوكول.
                    </p>
                    <p
                      className="w-full text-right"
                      style={{
                        fontFamily: "'Somar Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#475467',
                      }}
                    >
                      تنبيه: هذا الطلب يحتوي على مرفقات (عروض تقديمية). يجب إرسال الطلب إلى مسؤول المحتوى أولاً لمراجعة جاهزية العرض وإعداد الملخص التنفيذي قبل جدولة الاجتماع. لا يمكن جدولة الاجتماع مباشرة عند وجود مرفقات.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#475467] ml-2 flex-shrink-0">
                  <Info className="w-4 h-4 text-[#475467]" />
                </div>
              </div>
              )}

              <div className="flex flex-col gap-6 w-full max-w-[1085px]">
                {/* Suggested Times Section */}
                <div className="flex flex-col gap-3 w-full">
                  <h2
                    className="text-right"
                    style={{
                      fontFamily: "'Ping AR + LT', sans-serif",
                      fontWeight: 700,
                      fontSize: '22px',
                      lineHeight: '38px',
                      color: '#101828',
                    }}
                  >
                    الوقت المقترح
                  </h2>
                  <div className="flex flex-row gap-4 flex-wrap">
                    {suggestedTimes.length === 0 ? (
                      <div className="w-full text-center py-6 text-gray-500">لا توجد أوقات متاحة</div>
                    ) : (
                      suggestedTimes.map((timeSlot) => (
                        <div
                          key={timeSlot.id}
                          className="flex flex-row items-center gap-3 px-4 py-3 bg-white border border-[#D0D5DD] rounded-[8px] shadow-sm min-w-[300px]"
                        >
                          <button
                            type="button"
                        onClick={() => {
                            setSuggestedTimes((prev) =>
                              prev.map((slot) =>
                                slot.id === timeSlot.id ? { ...slot, selected: !slot.selected } : { ...slot, selected: false }
                              )
                            );
                            // update selected_time_slot_id in scheduleForm
                            setScheduleForm((prev) => ({
                              ...prev,
                              selected_time_slot_id: prev.selected_time_slot_id === timeSlot.id ? null : timeSlot.id,
                            }));
                          }}
                            className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                              timeSlot.selected
                                ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                                : 'bg-[#F2F4F7] justify-start'
                            } px-0.5`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                          </button>
                          <span
                            className="flex-1 text-right"
                            style={{
                              fontFamily: "'Ping AR + LT', sans-serif",
                              fontSize: '16px',
                              lineHeight: '24px',
                              color: '#101828',
                            }}
                          >
                            {timeSlot.time}
                          </span>
                          <Calendar className="w-5 h-5 text-[#048F86] flex-shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Invitees table - shared DataTable, read-only from meeting.invitees */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h2
                      className="text-right"
                      style={{
                        fontFamily: "'Ping AR + LT', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '38px',
                        color: '#101828',
                      }}
                    >
                      قائمة المدعوين
                    </h2>
                  </div>
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

                {/* Minister attendees table - shared DataTable, editable via scheduleForm */}
                <div className="flex flex-col gap-2">
                  <h2
                    className="text-right"
                    style={{
                      fontFamily: "'Ping AR + LT', sans-serif",
                      fontWeight: 700,
                      fontSize: '22px',
                      lineHeight: '38px',
                      color: '#101828',
                    }}
                  >
                    الحضور من جهة الوزير
                  </h2>
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

                {/* Location & completeness summary - bound to scheduleForm.is_data_complete */}
                <div className="flex flex-col gap-6 w-full">
                  {/* Location input */}
                  <div className="flex flex-col gap-2 w-full max-w-[1085px]">
                    <label
                      className="text-sm font-medium text-[#344054] text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      القاعة/الموقع المقترح
                    </label>
                    <Input
                      type="text"
                      value={scheduleForm.location}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="أدخل القاعة أو الموقع المقترح"
                      className="h-[44px] text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '16px', lineHeight: '24px' }}
                    />
                  </div>

                  {/* Protocol requirement toggle and type */}
                  <div className="flex flex-row justify-between items-start gap-6 w-full max-w-[1085px]">
                    <div className="flex flex-col items-end gap-3 ">
                      <span
                        className="text-sm font-medium text-[#344054]"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        يتطلب بروتوكول
                      </span>
                      <div className="flex flex-row items-center gap-3">
                        <span
                          className="text-base text-[#667085]"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {scheduleForm.requires_protocol ? 'نعم' : 'لا'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              requires_protocol: !prev.requires_protocol,
                            }))
                          }
                          className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                            scheduleForm.requires_protocol
                              ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                              : 'bg-[#F2F4F7] justify-start'
                          } px-0.5`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>
                    </div>
                    {scheduleForm.requires_protocol && (
                      <div className="flex flex-col gap-2 flex-1">
                        <label
                          className="text-sm font-medium text-[#344054] text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          نوع البروتوكول <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={scheduleForm.protocol_type_text}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              protocol_type_text: e.target.value,
                            }))
                          }
                          placeholder="أدخل نوع البروتوكول"
                          className="h-[44px] text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif", fontSize: '16px', lineHeight: '24px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
              {/* Attachments list */}
              <div className="flex flex-col gap-4 w-full max-w-[1085px]">
                <div className="flex flex-row gap-4 flex-wrap">
                  {/* Existing attachments (filter out deleted ones) */}
                  {(meeting?.attachments || [])
                    .filter((att) => !deletedAttachmentIds.includes(att.id))
                    .map((att) => (
                      <div
                        key={att.id}
                        className="flex flex-row items-center px-3 py-2 gap-4 h-[60px] bg-white border border-[#009883] rounded-[12px]"
                      >
                        <div className="flex flex-row items-center justify-between">
                          {att.file_type?.toLowerCase() === 'pdf' ? (
                            <img src={pdfIcon} alt="pdf" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <div className="flex items-center justify-center w-[40px] h-[40px] bg-[#E2E5E7] rounded-md text-sm font-semibold text-[#B04135]">
                              {att.file_type?.toUpperCase() || ''}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {att.file_name}
                          </span>
                          <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {Math.round((att.file_size || 0) / 1024)} KB
                          </span>
                        </div>

                        <div className="flex flex-row items-center self-end gap-2 ml-auto">
                          <a
                            href={att.blob_url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                          >
                            <Download className="w-5 h-5 text-[#009883]" />
                          </a>
                          <button
                            type="button"
                            onClick={() => window.open(att.blob_url, '_blank')}
                            className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                          >
                            <Eye className="w-5 h-5 text-[#475467]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(202,69,69,0.1)] rounded-md hover:bg-[rgba(202,69,69,0.2)] transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-[#CA4545]" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* New attachments (pending upload) */}
                  {newAttachments.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex flex-row items-center px-3 py-2 gap-4 h-[60px] bg-white border border-[#048F86] border-dashed rounded-[12px]"
                    >
                      <div className="flex flex-row items-center justify-between">
                        {file.type === 'application/pdf' ? (
                          <img src={pdfIcon} alt="pdf" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-[40px] h-[40px] bg-[#E2E5E7] rounded-md text-sm font-semibold text-[#B04135]">
                            {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {file.name}
                        </span>
                        <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {Math.round(file.size / 1024)} KB
                        </span>
                      </div>

                      <div className="flex flex-row items-center self-end gap-2 ml-auto">
                        <span className="text-xs text-[#048F86] px-2 py-1 bg-[rgba(4,143,134,0.1)] rounded" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          جديد
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewAttachment(index)}
                          className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(202,69,69,0.1)] rounded-md hover:bg-[rgba(202,69,69,0.2)] transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-[#CA4545]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {(meeting?.attachments || []).filter((att) => !deletedAttachmentIds.includes(att.id)).length === 0 && newAttachments.length === 0 && (
                    <div className="w-full text-center text-gray-500 py-6" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      لا توجد مرفقات
                    </div>
                  )}
                </div>

                {/* Add attachment button */}
                <div className="flex items-center justify-start mt-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-[8px] shadow-sm text-[#344054] cursor-pointer hover:bg-gray-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span
                      style={{
                        fontFamily: "'Ping AR + LT', sans-serif",
                        fontWeight: 700,
                        fontSize: '16px',
                        lineHeight: '24px',
                      }}
                    >
                      إضافة مرفق جديد
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleAddAttachments(e.target.files)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Consultations Log Tab */}
          {activeTab === 'consultations-log' && (
            <div className="flex flex-col gap-4">
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
          {activeTab === 'directives-log' && (
            <div className="flex flex-col gap-4">
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
          {activeTab === 'content-officer-notes' && (
            <div className="flex flex-col gap-4">
              {isLoadingContentOfficerNotes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : contentOfficerNotesRecords && contentOfficerNotesRecords.items.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      id: 'note_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: ContentOfficerNoteRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.note_question || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'note_answer',
                      header: 'الملاحظة',
                      width: 'flex-1',
                      render: (row: ContentOfficerNoteRecord) => (
                        <span className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.note_answer}
                        </span>
                      ),
                    },
                    {
                      id: 'author_name',
                      header: 'المؤلف',
                      width: 'w-40',
                      render: (row: ContentOfficerNoteRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.author_name}
                        </span>
                      ),
                    },
                    {
                      id: 'created_at',
                      header: 'تاريخ الإنشاء',
                      width: 'w-40',
                      render: (row: ContentOfficerNoteRecord) => {
                        const date = new Date(row.created_at);
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
                        const date = new Date(row.updated_at);
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
                  data={contentOfficerNotesRecords.items}
                  rowPadding="py-3"
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600 text-lg mb-2">ملاحظات مسؤول المحتوى</p>
                    <p className="text-gray-500 text-sm">لا توجد ملاحظات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Tab Content */}
          {activeTab !== 'basic-info' && activeTab !== 'content' && activeTab !== 'scheduling' && activeTab !== 'attachments' && activeTab !== 'consultations-log' && activeTab !== 'directives-log' && activeTab !== 'content-officer-notes' && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">محتويات {tabs.find(t => t.id === activeTab)?.label} قريباً</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        {/* Sticky action bar - Hidden when status is UNDER_CONSULTATION_SCHEDULING or UNDER_CONTENT_CONSULTATION */}
        {meeting && meeting.status !== MeetingStatus.UNDER_CONSULTATION_SCHEDULING && meeting.status !== MeetingStatus.UNDER_CONTENT_CONSULTATION && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full  px-4">
            <div className="mx-auto bg-white/60 backdrop-blur-md rounded-full p-2.5 shadow-lg border border-gray-200 flex justify-center">
            <div className="flex flex-row items-center gap-1.5 justify-center flex-wrap">
              {/* Schedule Button */}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  جدولة
                </span>
                <Calendar className="w-5 h-5" />
              </button>
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
                      {/* Return to Request Button */}
                      <button
                onClick={() => setIsReturnForInfoModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  إعادة للطلب
                </span>
                <RotateCcw className="w-5 h-5" />
              </button>
                {/* Request Consultation Button */}
                <button
                onClick={() => setIsConsultationModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  طلب استشارة
                </span>
                <ClipboardCheck className="w-5 h-5" />
              </button>
                     {/* Request Guidance Button */}
                     <button
                onClick={() => setIsRequestGuidanceModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  طلب توجيه
                </span>
                <FileCheck className="w-5 h-5" />
              </button>
               {/* Send to Content Button */}
               <button
                onClick={() => setIsSendToContentModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  إرسال للمحتوى
                </span>
                <Send className="w-5 h-5" />
              </button>

              {/* Reject Button */}
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  رفض
                </span>
                <X className="w-5 h-5" />
              </button>

             
       

            

      

         
            </div>
          </div>
        </div>
        )}
      </div>

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
        if (!open) setValidationError(null);
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
                />
              </div>

              {/* Meeting Channel */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  قناة الاجتماع <span className="text-red-500">*</span>
                </label>
                <Select
                  value={scheduleForm.meeting_channel}
                  onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, meeting_channel: value }))}
                >
                  <SelectTrigger className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="PHYSICAL">حضوري</SelectItem>
                    <SelectItem value="ONLINE">عن بُعد</SelectItem>
                    <SelectItem value="HYBRID">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!scheduleForm.scheduled_at || scheduleMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {scheduleMutation.isPending ? 'جاري الجدولة...' : 'جدولة'}
              </button>
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

