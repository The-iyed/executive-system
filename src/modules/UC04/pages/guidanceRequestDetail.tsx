import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ClipboardCheck, Clock, Phone, Mail, User, Trash2, Hash, Building2 } from 'lucide-react';
import { DetailPageHeader, StatusBadge, MeetingInfo, Mou7tawaContentTab, AttachmentPreviewDrawer, type MeetingInfoData } from '@/modules/shared/components';
import { formatDateArabic, formatDateTimeArabic, formatTimeAgoArabic } from '@/modules/shared/utils';
import { MeetingStatus } from '@/modules/shared/types';
import { getMeetingStatusLabel } from '@/modules/shared';
import { getGuidanceRequestById, getContentExceptionById, provideGuidance, saveGuidanceAsDraft, completeGuidance, handleContentException, ProvideGuidanceRequest, HandleContentExceptionRequest } from '../data/guidanceApi';
import { useAuth } from '../../auth/context/AuthProvider';
import { getGuidanceRecords, getConsultationRecordsWithParams, type GuidanceRecord, type ConsultationRecord } from '../../UC02/data/meetingsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/lib/ui';
import { PATH } from '../routes/paths';
import { trackEvent } from '@/lib/analytics';
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

/** Safely format related_guidance which may be a string or a directive object/array from the API */
function formatRelatedGuidance(value: unknown): string {
  if (typeof value === 'string') return value.trim() || '-';
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      const texts = value
        .map((d: { directive_text?: string }) => (d?.directive_text != null ? String(d.directive_text) : ''))
        .filter(Boolean);
      return texts.length > 0 ? texts.join(' ') : '-';
    }
    if ('directive_text' in value && typeof (value as { directive_text?: string }).directive_text === 'string') {
      return (value as { directive_text: string }).directive_text;
    }
  }
  return '-';
}

/** Safely render notes (string / object / array from API) */
function getNotesText(...candidates: unknown[]): string {
  const extract = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') {
      const t = value.trim();
      return t.length ? t : null;
    }
    if (Array.isArray(value)) {
      const parts = value.map((v) => extract(v)).filter(Boolean) as string[];
      return parts.length ? parts.join('\n') : null;
    }
    if (typeof value === 'object') {
      const v = value as Record<string, unknown>;
      if (typeof v.text === 'string' && v.text.trim()) return v.text.trim();
      if (typeof v.note === 'string' && v.note.trim()) return v.note.trim();
      if (typeof v.content === 'string' && v.content.trim()) return v.content.trim();
      if (typeof v.value === 'string' && v.value.trim()) return v.value.trim();
      if (typeof v.notes === 'string' && v.notes.trim()) return v.notes.trim();
      return null;
    }
    return null;
  };
  for (const c of candidates) {
    const t = extract(c);
    if (t) return t;
  }
  return '-';
}

const GuidanceRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isExceptionMode = location.pathname.startsWith('/exception-request/');
  const { user } = useAuth();
  const isExecutiveManager = user?.roles?.some((r) => r.code === 'EXECUTIVE_OFFICE_MANAGER') ?? false;
  const [activeTab, setActiveTab] = useState<string>('guidance-request');
  const [guidanceResponse, setGuidanceResponse] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(false);
  const [queriesDisabled, setQueriesDisabled] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);

  // Exception mode state
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState<boolean>(false);
  const [contentException, setContentException] = useState<boolean>(false);
  const [grantedDurationHours, setGrantedDurationHours] = useState<number>(0);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);

  // Fetch guidance request data from API
  const { data: guidanceData, isLoading, error } = useQuery({
    queryKey: [isExceptionMode ? 'content-exception' : 'guidance-request', id],
    queryFn: () => isExceptionMode ? getContentExceptionById(id!) : getGuidanceRequestById(id!),
    enabled: !!id && !queriesDisabled,
  });

  // Fetch guidance records
  const { data: guidanceRecords, isLoading: isLoadingGuidanceRecords } = useQuery({
    queryKey: ['guidance-records', id],
    queryFn: () => getGuidanceRecords(id!),
    enabled: !!id && activeTab === 'directives-log',
  });

  // Fetch guidance records with drafts for request-info tab
  const { data: guidanceRecordsWithDrafts, isLoading: isLoadingGuidanceRecordsWithDrafts } = useQuery({
    queryKey: ['guidance-records-with-drafts', id],
    queryFn: () => getGuidanceRecords(id!),
    enabled: !!id && activeTab === 'guidance-request',
  });

  // Fetch consultation records (سجلات الاستشارات)
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecordsWithParams(id!, {
      include_drafts: false,
      skip: 0,
      limit: 100,
    }),
    enabled: !!id && activeTab === 'consultations-log',
  });

  // Fetch content consultation records (سجلات الاستشارات المحتوى) from /api/meeting-requests/{meeting_id}/consultation-record
  const { data: contentConsultationRecords, isLoading: isLoadingContentConsultationRecords } = useQuery({
    queryKey: ['consultation-records-content', id],
    queryFn: () => getConsultationRecordsWithParams(id!, {
      consultation_type: 'CONTENT',
      include_drafts: false,
      skip: 0,
      limit: 100,
    }),
    enabled: !!id && activeTab === 'consultations-log-content',
  });

  const meetingRequest = guidanceData?.meeting_request;
  const guidanceQuestion = guidanceData?.guidance_question || '';

  useEffect(() => {
    if (guidanceData?.id || id) {
      trackEvent('UC-04', 'uc04_guidance_request_detail_viewed', {
        guidance_request_id: guidanceData?.id ?? id,
      });
    }
  }, [guidanceData?.id, id]);

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!meetingRequest) return {};
    const execSummary = meetingRequest.attachments?.find((a: { is_executive_summary?: boolean }) => a.is_executive_summary);
    return {
      ...meetingRequest as MeetingInfoData,
      is_on_behalf_of: meetingRequest.is_on_behalf_of,
      meeting_manager_label: meetingRequest.submitter_name ?? undefined,
      meetingSubject: meetingRequest.meeting_title ?? undefined,
      meetingDescription: meetingRequest.meeting_subject ?? undefined,
      sector: meetingRequest.sector ?? undefined,
      meetingType: meetingRequest.meeting_type ?? undefined,
      is_urgent: !!meetingRequest.urgent_reason,
      urgent_reason: meetingRequest.urgent_reason ?? undefined,
      meeting_start_date: meetingRequest.scheduled_at ?? undefined,
      meeting_end_date: undefined,
      meetingChannel: meetingRequest.meeting_channel ?? undefined,
      meeting_location: undefined,
      meetingCategory: meetingRequest.meeting_classification ?? undefined,
      meetingReason: meetingRequest.meeting_justification ?? undefined,
      relatedTopic: meetingRequest.related_topic ?? undefined,
      dueDate: meetingRequest.deadline ?? undefined,
      meetingClassification1: meetingRequest.meeting_classification_type ?? undefined,
      meetingConfidentiality: meetingRequest.meeting_confidentiality ?? undefined,
      meetingAgenda: meetingRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0),
      directive_method:
        (meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0)
          ? 'DIRECT_DIRECTIVE'
          : ((meetingRequest as { previous_meeting_attachment?: unknown }).previous_meeting_attachment != null || meetingRequest.previous_meeting_id != null)
            ? 'PREVIOUS_MEETING'
            : (meetingRequest as { directive_method?: string }).directive_method ?? undefined,
      previous_meeting_minutes_file: execSummary ? { name: execSummary.file_name } : undefined,
      directive_text: formatRelatedGuidance(meetingRequest.related_guidance),
      notes: getNotesText(meetingRequest.general_notes, meetingRequest.content_officer_notes),
    };
  }, [meetingRequest]);

  const tabs = [
    {
      id: 'guidance-request',
      label: 'معلومات الطلب',
    },
    {
      id: 'meeting-info',
      label: 'معلومات الاجتماع',
    },
    {
      id: 'content',
      label: 'المحتوى',
    },
    {
      id: 'invitees',
      label: 'قائمة المدعوين',
    },
    {
      id: 'directives-log',
      label: 'استشارات',
    },
    ...(!isExecutiveManager ? [
      {
        id: 'consultations-log',
        label: 'سجلات الاستشارات',
      },
    ] : []),
    ...(!isExecutiveManager ? [
      {
        id: 'consultations-log-content',
        label: 'سجلات الاستشارات المحتوى',
      },
    ] : []),
  ];

  const queryClient = useQueryClient();

  // Submit guidance mutation
  const submitMutation = useMutation({
    mutationFn: (data: ProvideGuidanceRequest): Promise<ProvideGuidanceRequest> => {
      if (!meetingRequest?.id) throw new Error('Meeting request ID is required');
      return provideGuidance(meetingRequest.id, data).then(() => data);
    },
    onSuccess: ( data: ProvideGuidanceRequest ) => {
      // Disable queries first to prevent any new requests

        navigate(PATH.GUIDANCE_REQUESTS);
   
      setQueriesDisabled(true);
      
      // Cancel any in-flight queries
      queryClient.cancelQueries({ queryKey: ['guidance-request', id] });
      
      // Remove queries from cache since we're navigating away
      queryClient.removeQueries({ queryKey: ['guidance-request', id] });
      
      // Invalidate guidance requests list to remove the responded request
      queryClient.invalidateQueries({ queryKey: ['guidance-requests'] });
      
      setIsSubmitModalOpen(false);
      setGuidanceResponse('');
      setIsSuitableForScheduling(false);
      
      // Navigate back to guidance requests list
    },
    onError: (error) => {
      console.error('Error submitting guidance:', error);
      // TODO: Show error toast/notification
    },
  });

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: ProvideGuidanceRequest): Promise<ProvideGuidanceRequest> => {
      if (!meetingRequest?.id) throw new Error('Meeting request ID is required');
      return saveGuidanceAsDraft(meetingRequest.id, data).then(() => data);
    },
    onSuccess: ( _data: ProvideGuidanceRequest ) => {
      queryClient.invalidateQueries({ queryKey: ['guidance-request', id] });
      queryClient.invalidateQueries({ queryKey: ['guidance-records-with-drafts', id] });
      queryClient.invalidateQueries({ queryKey: ['guidance-records', id] });
      queryClient.invalidateQueries({ queryKey: ['guidance-requests'] });
      setIsSubmitModalOpen(false);
    },
    onError: (error) => {
      console.error('Error saving guidance draft:', error);
      // TODO: Show error toast/notification
    },
  });

  const handleOpenSubmitModal = () => {
    setIsSubmitModalOpen(true);
  };

  const handleSubmitGuidance = () => {
    if (!guidanceResponse.trim()) {
      // TODO: Show validation error
      return;
    }

    if (!meetingRequest?.id) {
      console.error('Meeting request ID is required');
      return;
    }

    submitMutation.mutate({
      guidance_notes: guidanceResponse,
      feasibility_answer: isSuitableForScheduling,
      is_draft: false,
    });
    navigate(PATH.GUIDANCE_REQUESTS);
  };

  // Publish draft mutation
  const publishDraftMutation = useMutation({
    mutationFn: (guidanceId: string) => {
      return completeGuidance(guidanceId);
    },
    onSuccess: () => {
      navigate(PATH.GUIDANCE_REQUESTS);
    },
    onError: (error) => {
      console.error('Error publishing draft:', error);
      // TODO: Show error toast/notification
    },
  });

  const handlePublishDraft = (guidanceId: string) => {
    publishDraftMutation.mutate(guidanceId);
  };

  const handleSaveAsDraft = () => {
    if (!meetingRequest?.id) {
      console.error('Meeting request ID is required');
      return;
    }

    saveDraftMutation.mutate({
      guidance_notes: guidanceResponse,
      feasibility_answer: isSuitableForScheduling,
      is_draft: true,
    });
  };

  // Exception handling mutation
  const exceptionMutation = useMutation({
    mutationFn: (data: HandleContentExceptionRequest) => {
      if (!meetingRequest?.id) throw new Error('Meeting request ID is required');
      return handleContentException(meetingRequest.id, data);
    },
    onSuccess: () => {
      setQueriesDisabled(true);
      queryClient.cancelQueries({ queryKey: ['content-exception', id] });
      queryClient.removeQueries({ queryKey: ['content-exception', id] });
      queryClient.invalidateQueries({ queryKey: ['exception-requests'] });
      setIsExceptionModalOpen(false);
      setContentException(false);
      setGrantedDurationHours(0);
      navigate(PATH.EXCEPTION_REQUEST);
    },
    onError: (error) => {
      console.error('Error submitting exception:', error);
    },
  });

  /** Scheduled meeting start (backend uses this for "الوقت المتبقي حتى الاجتماع") – prefer scheduled_start, then scheduled_at, then meeting_start_date */
  const scheduledAtRaw =
    meetingRequest?.scheduled_start ?? meetingRequest?.scheduled_at ?? (meetingRequest as { meeting_start_date?: string | null })?.meeting_start_date;
  const scheduledAtParsed = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  const scheduledAt = scheduledAtParsed && !Number.isNaN(scheduledAtParsed.getTime()) ? scheduledAtParsed : null;
  const hoursUntilScheduled =
    scheduledAt && scheduledAt.getTime() > Date.now()
      ? (scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60)
      : 0;
  /** Max granted hours = min(72, time remaining) – backend expects granted_duration_hours <= this (decimal). */
  const maxGrantedHoursBySchedule = Math.max(0, Math.min(72, hoursUntilScheduled));
  /** Effective cap: when we have a scheduled date, use time remaining (0 if meeting is in the past); else 72. */
  const effectiveCap =
    scheduledAt != null
      ? (scheduledAt.getTime() > Date.now() ? maxGrantedHoursBySchedule : 0)
      : 72;
  const grantedDurationExceedsScheduled =
    contentException &&
    !!scheduledAt &&
    scheduledAt.getTime() > Date.now() &&
    grantedDurationHours > maxGrantedHoursBySchedule;

  /** Clamp to [0, effectiveCap] and 2 decimal places – single source of truth. */
  const clampGrantedHours = useCallback(
    (value: number): number => {
      const rounded = Math.round(value * 100) / 100;
      return Math.min(72, Math.max(0, Math.min(rounded, effectiveCap)));
    },
    [effectiveCap]
  );

  /** When modal is open and content exception is on, keep value within cap and 2 decimals. */
  useEffect(() => {
    if (!isExceptionModalOpen || !contentException) return;
    const clamped = clampGrantedHours(grantedDurationHours);
    if (clamped !== grantedDurationHours) setGrantedDurationHours(clamped);
  }, [isExceptionModalOpen, contentException, grantedDurationHours, clampGrantedHours]);

  const handleSubmitException = () => {
    if (!meetingRequest?.id) return;
    const finalHours = contentException ? clampGrantedHours(grantedDurationHours) : 0;
    if (contentException && (finalHours < 0 || finalHours > effectiveCap)) return;

    exceptionMutation.mutate({
      content_exception: contentException,
      granted_duration_hours: finalHours,
    });
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
  if (error || !meetingRequest) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  // Map status to MeetingStatus enum
  const meetingStatus = (meetingRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getMeetingStatusLabel(meetingStatus);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="p-6">
        <DetailPageHeader
          title={meetingRequest.request_number ? `${meetingRequest.meeting_title} (${meetingRequest.request_number})` : meetingRequest.meeting_title}
          onBack={() => navigate(-1)}
          statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} />}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content Container — flex-1 so directives-log can pin input to bottom */}
      <div className={`flex-1 flex flex-col min-h-0 m-6 mt-0 ${activeTab === 'directives-log' ? '' : 'overflow-y-auto p-6 pb-32 bg-white border border-[#E6E6E6] rounded-2xl'}`}>
          {/* Guidance Request Tab */}
          {activeTab === 'guidance-request' && (
            <div className="flex flex-col gap-6">
              {/* Consultation Question Section - hidden for EXECUTIVE_OFFICE_MANAGER (shown in directives-log tab instead) */}
             {!isExecutiveManager && <div
                className="flex flex-col justify-start items-end p-[10px] gap-[10px] w-full max-w-[1321px] h-[265px] mx-auto"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                <div className="flex flex-col items-start p-0 gap-[10px] w-full">
                  <div className="flex flex-col items-start p-0 gap-[4px] w-full">
                    {/* Title */}
                    <h2
                      className="w-full h-[38px] font-bold text-lg leading-[38px] text-right text-[#101828]"
                      style={{
                        fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                        fontWeight: 700,
                        fontSize: '18px',
                        lineHeight: '38px',
                      }}
                    >
                      سؤال جدوى جدولة الاجتماع
                    </h2>

                    {/* Question Content */}
                    <div className="flex flex-col items-start p-0 gap-4 w-full min-h-[80px]">
                      <p
                        className="w-full text-base leading-6 text-right text-[#475467]"
                        style={{
                          fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                        {guidanceQuestion || 'لا يوجد سؤال متاح'}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleOpenSubmitModal}
                    className="flex flex-row items-center px-3 py-2 gap-2 w-[158px] h-10 bg-[#29615C] rounded-[85px] flex-none"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                  >
                    <div className="flex flex-row justify-end items-center p-0 gap-3 w-[134px] h-6">
                    <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2} />

                     <span
                        className="w-[98px] h-5 font-bold text-base leading-6 text-white"
                        style={{
                          fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                       تقديم توجيه 
                      </span>
                    </div>
                  </button>
                </div>
              </div>}
                  {/* Request Info Section */}
                  <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto">
                <div className="flex flex-row items-center justify-between gap-4">
                  <h2
                    className="text-lg font-bold text-right text-[#101828]"
                    style={{
                      fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                      fontWeight: 700,
                      fontSize: '16px',
                      lineHeight: '28px',
                    }}
                  >
                    معلومات الطلب
                  </h2>

                  <div className="flex flex-row justify-start items-center gap-2">
                    {guidanceRecordsWithDrafts && guidanceRecordsWithDrafts?.items?.filter((item) => !!item.is_draft)?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsDraftsModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-[#F2F4F7] text-[#344054] rounded-full border-2 border-[#D0D5DD] transition-opacity hover:bg-gray-100 cursor-pointer"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                      >
                        مسودات ({guidanceRecordsWithDrafts.items.filter((item) => item.status === 'DRAFT' || !item.responded_at).length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* رقم الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      رقم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      {meetingRequest.request_number ?? '-'}
                    </p>
                  </div>

                  {/* تاريخ الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      تاريخ الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      {formatDateArabic((meetingRequest as { submitted_at?: string; created_at?: string })?.submitted_at ?? (meetingRequest as { created_at?: string })?.created_at) || '-'}
                    </p>
                  </div>

                  {/* حالة الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      حالة الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      {statusLabel}
                    </p>
                  </div>

                  {/* مقدم الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      مقدم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      {meetingRequest.submitter_name ?? '-'}
                    </p>
                  </div>

                  {/* مالك الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                      مالك الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                    >
                       {meetingRequest?.meeting_owner?.username ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Information Tab */}
          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-6">
              <MeetingInfo data={meetingInfoData} dir="rtl" />
           </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6">
              <Mou7tawaContentTab
                presentationFiles={(meetingRequest?.attachments ?? []).filter((a) => a.is_presentation).map((att) => ({
                  id: att.id,
                  file_name: att.file_name,
                  file_size: att.file_size ?? 0,
                  file_type: att.file_type ?? '',
                  blob_url: att.blob_url ?? null,
                }))}
                optionalFiles={(() => {
                  const prevId = (meetingRequest as { previous_meeting_attachment?: { id?: string } | null })?.previous_meeting_attachment?.id ?? null;
                  return (meetingRequest?.attachments ?? [])
                    .filter((a) => a.is_additional && (prevId == null || a.id !== prevId))
                    .map((att) => ({
                      id: att.id,
                      file_name: att.file_name,
                      file_size: att.file_size ?? 0,
                      file_type: att.file_type ?? '',
                      blob_url: att.blob_url ?? null,
                    }));
                })()}
                attachmentTimingValue=""
                notesValue=""
                readOnly
                formatDate={formatDateArabic}
                onView={(file) => setPreviewAttachment({ blob_url: file.blob_url!, file_name: file.file_name, file_type: file.file_type })}
                onDownload={(file) => file.blob_url && window.open(file.blob_url!, '_blank')}
              />
            </div>
          )}

          {/* استشارات Tab — Chat-style UI (like استشارة المكتب التنفيذي in UC02) */}
          {activeTab === 'directives-log' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full bg-white border border-[#E6E6E6] rounded-2xl" dir="rtl">

              <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoadingGuidanceRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
                  <div className="flex flex-col pb-4">
                    {[...guidanceRecords.items].reverse().map((row: GuidanceRecord, index: number) => {
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                      const requesterName = row.requested_by_name || '-';
                      const responseDate = row.responded_at ? formatTimeAgoArabic(row.responded_at) : null;
                      const guidanceStatusLabels: Record<string, string> = {
                        PENDING: 'قيد الانتظار',
                        RESPONDED: 'تم الرد',
                        CANCELLED: 'ملغاة',
                        DRAFT: 'مسودة',
                        COMPLETED: 'مكتمل',
                        SUPERSEDED: 'معلق',
                      };
                      return (
                        <div key={`guidance-${row.guidance_id}-${index}`} className="flex flex-col gap-0">
                          {/* Question bubble (right-aligned teal — like UC02 chat) */}
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
                                  {row.status && (
                                    <StatusBadge status={row.status} label={guidanceStatusLabels[row.status] || row.status} />
                                  )}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">{row.guidance_question || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Response bubble (left-aligned gray — like UC02 chat) */}
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
                                    <span className="text-sm font-semibold text-[#1F2937]">{row.responded_by_name || '-'}</span>
                                    {responseDate && <span className="text-[11px] text-[#9CA3AF]">{responseDate}</span>}
                                    <StatusBadge status={row.status} label={guidanceStatusLabels[row.status] || row.status} />
                                  </div>
                                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                    <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">{row.guidance_answer.trim()}</p>
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
                      <Clock className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">استشارة المكتب التنفيذي</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات مسجلة</p>
                  </div>
                )}
              </div>

              {/* Input fixed at bottom (flex-shrink-0) — only for Executive Manager in guidance flow */}
              {!isExceptionMode && isExecutiveManager && meetingRequest?.id && (
                <div className="flex-shrink-0 border-t border-[#F3F4F6] bg-[#FAFAFA] rounded-b-2xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!guidanceResponse.trim()) return;
                      submitMutation.mutate({
                        guidance_notes: guidanceResponse,
                        feasibility_answer: isSuitableForScheduling,
                        is_draft: false,
                      });
                    }}
                    className="flex items-end gap-3 px-5 py-4"
                    dir="rtl"
                  >
                    <Textarea
                      value={guidanceResponse}
                      onChange={(e) => setGuidanceResponse(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!guidanceResponse.trim()) return;
                          submitMutation.mutate({
                            guidance_notes: guidanceResponse,
                            feasibility_answer: isSuitableForScheduling,
                            is_draft: false,
                          });
                        }
                      }}
                      placeholder="اكتب استشارتك هنا..."
                      className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-right focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86] placeholder:text-[#9CA3AF]"
                      dir="rtl"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={!guidanceResponse.trim() || submitMutation.isPending}
                      className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white flex items-center justify-center transition-opacity disabled:opacity-40"
                    >
                      {submitMutation.isPending ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Consultations Log Tab - Chat-style UI */}
          {activeTab === 'consultations-log' && (
            <div className="flex flex-col w-full bg-white" dir="rtl">
              <div className="flex-1 min-h-0">
                {isLoadingConsultationRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : consultationRecords && consultationRecords.items.length > 0 ? (
                  <div className="flex flex-col pb-4">
                    {[...consultationRecords.items].reverse().map((row: ConsultationRecord, index: number) => {
                      const recordId = row.id || row.consultation_id || `${index}`;
                      const recordQuestion = row.question || row.consultation_question || '';
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                      const requesterName = row.consultant_name || '-';
                      const consultationStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

                      const flatItems: Array<{ id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null }> = [];
                      if (row.assignees?.length) {
                        row.assignees.forEach((a) => {
                          if (a.answers?.length) {
                            a.answers.forEach((ans) => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at, requestNumber: a.request_number }));
                          } else {
                            flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at, requestNumber: a.request_number });
                          }
                        });
                      } else if (row.consultation_answers?.length) {
                        row.consultation_answers.forEach((a) => flatItems.push({ id: a.consultation_id || a.external_id || `ans-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at, requestNumber: row.consultation_request_number || null }));
                      } else if (row.assignee_sections?.length) {
                        row.assignee_sections.forEach((a) => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null }));
                      }

                      return (
                        <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                          {/* Question bubble (sent – right-aligned teal) */}
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
                                  {row.round_number != null && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 font-medium">الجولة {row.round_number}</span>
                                  )}
                                  {row.status && <StatusBadge status={row.status} label={consultationStatusLabels[row.status] || row.status} />}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">{recordQuestion || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Response bubbles (received – left-aligned gray) */}
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
                      <Clock className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">سجل الإستشارات</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات مسجلة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Consultation Records Tab - Chat-style UI */}
          {activeTab === 'consultations-log-content' && (
            <div className="flex flex-col w-full bg-white" dir="rtl">
              <div className="flex-1 min-h-0">
                {isLoadingContentConsultationRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : contentConsultationRecords && contentConsultationRecords.items.length > 0 ? (
                  <div className="flex flex-col pb-4">
                    {[...contentConsultationRecords.items].reverse().map((row: ConsultationRecord, index: number) => {
                      const recordId = row.id || row.consultation_id || `c-${index}`;
                      const recordQuestion = row.question || row.consultation_question || '';
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                      const requesterName = row.consultant_name || '-';
                      const consultationStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

                      const flatItems: Array<{ id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null }> = [];
                      if (row.assignees?.length) {
                        row.assignees.forEach((a) => {
                          if (a.answers?.length) {
                            a.answers.forEach((ans) => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at, requestNumber: a.request_number }));
                          } else {
                            flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at, requestNumber: a.request_number });
                          }
                        });
                      } else if (row.consultation_answers?.length) {
                        row.consultation_answers.forEach((a) => flatItems.push({ id: a.consultation_id || a.external_id || `ans-c-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at, requestNumber: row.consultation_request_number || null }));
                      } else if (row.assignee_sections?.length) {
                        row.assignee_sections.forEach((a) => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null }));
                      }

                      return (
                        <div key={`consultation-content-${recordId}-${index}`} className="flex flex-col gap-0">
                          {/* Question bubble (sent – right-aligned teal) */}
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
                                  {row.round_number != null && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 font-medium">الجولة {row.round_number}</span>
                                  )}
                                  {row.status && <StatusBadge status={row.status} label={consultationStatusLabels[row.status] || row.status} />}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">{recordQuestion || '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Response bubbles (received – left-aligned gray) */}
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
                      <Clock className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">سجلات الاستشارات المحتوى</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات محتوى مسجلة</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invitees Tab - قائمة المدعوين */}
          {activeTab === 'invitees' && (
            <InviteesTableForm initialInvitees={meetingRequest.invitees} mode='view' viewLayout="cards" />
          )}
      </div>

      {/* Submit Guidance Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
            >
             تقديم توجيه
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-md font-medium text-gray-700 text-right"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
               محتوى التوجيه
              </label>
              <Textarea
                value={guidanceResponse}
                onChange={(e) => setGuidanceResponse(e.target.value)}
                placeholder="أدخل محتوى التوجيه..."
                className="min-h-[300px] text-right"
                dir="rtl"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              />
            </div>
            
            {/* Toggle for scheduling suitability */}
            <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-row items-center justify-between w-full">
                <span
                  className="text-sm font-semibold text-gray-900"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  هل الطلب مناسب للجدولة؟
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span
                    className="text-base text-[#667085]"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                  >
                    {isSuitableForScheduling ? 'نعم' : 'لا'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSuitableForScheduling((prev) => !prev)}
                    className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                      isSuitableForScheduling
                        ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                        : 'bg-[#F2F4F7] justify-start'
                    } px-0.5`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              style={{
                fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={submitMutation.isPending || !guidanceResponse.trim() || !meetingRequest?.id}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              <span className="text-white">
                {saveDraftMutation.isPending ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSubmitGuidance}
              disabled={submitMutation.isPending || !guidanceResponse.trim() || !meetingRequest?.id}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              <span className="text-white">
                {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drafts Modal */}
      <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
        <DialogContent className="sm:max-w-[700px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
            >
              مسودات التوجيهات
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            {isLoadingGuidanceRecordsWithDrafts ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : guidanceRecordsWithDrafts && guidanceRecordsWithDrafts.items.filter((item) => !!item.is_draft).length > 0 ? (
              guidanceRecordsWithDrafts.items
                .filter((item) => item.status === 'DRAFT' || !item.responded_at)
                .map((draft) => (
                  <div
                    key={draft.guidance_id}
                    className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center justify-between">
                        <span
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                        >
                          سؤال التوجيه:
                        </span>
                        <span
                          className="text-xs text-gray-500"
                          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                        >
                          {formatDateArabic(draft.requested_at)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-900 text-right"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                      >
                        {draft.guidance_question}
                      </p>
                    </div>

                    {draft.guidance_answer && (
                      <div className="flex flex-col gap-2">
                        <span
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                        >
                          الإجابة:
                        </span>
                        <p
                          className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200"
                          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                        >
                          {draft.guidance_answer}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-row justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishDraft(draft.guidance_id)}
                        disabled={publishDraftMutation.isPending}
                        className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                      >
                        {publishDraftMutation.isPending ? 'جاري النشر...' : 'نشر'}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <p
                  className="text-gray-500 text-right"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  لا توجد مسودات
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-start gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
            >
              إغلاق
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exception Mode: Sticky Footer */}
      {isExceptionMode && (
        <div
          className="sticky bottom-4 left-0 right-0 z-10 flex items-center justify-center "
          dir="rtl"
        >
          <button
            onClick={() => setIsExceptionModalOpen(true)}
            className="flex flex-row items-center px-6 py-3 gap-2 bg-[#29615C] rounded-[85px] transition-colors hover:bg-[#1e4a46]"
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            <ClipboardCheck className="w-5 h-5 text-white" strokeWidth={2} />
            <span
              className="font-bold text-base leading-6 text-white"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", fontWeight: 700, fontSize: '16px' }}
            >
              تقديم استثناء
            </span>
          </button>
        </div>
      )}

      {/* Exception Modal */}
      <Dialog open={isExceptionModalOpen} onOpenChange={setIsExceptionModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
            >
              تقديم استثناء
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* content_exception toggle */}
            <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-row items-center justify-between w-full">
                <span
                  className="text-sm font-semibold text-gray-900"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  استثناء المحتوى؟
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span
                    className="text-base text-[#667085]"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                  >
                    {contentException ? 'نعم' : 'لا'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setContentException((prev) => !prev)}
                    className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                      contentException
                        ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                        : 'bg-[#F2F4F7] justify-start'
                    } px-0.5`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* granted_duration_hours (shown only when content_exception is true) */}
            {contentException && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  المدة الممنوحة (بالساعات)
                </label>
                <input
                  type="number"
                  min={0}
                  max={effectiveCap}
                  step={0.01}
                  value={clampGrantedHours(grantedDurationHours)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (Number.isNaN(val)) return;
                    setGrantedDurationHours(clampGrantedHours(val));
                  }}
                  onBlur={() => {
                    const clamped = clampGrantedHours(grantedDurationHours);
                    if (clamped !== grantedDurationHours) setGrantedDurationHours(clamped);
                  }}
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm text-right ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    grantedDurationExceedsScheduled
                      ? 'border-red-500 focus-visible:ring-red-500 bg-red-50'
                      : 'border-gray-300 bg-white focus-visible:ring-[#048F86]'
                  }`}
                  dir="rtl"
                  placeholder={`0 - ${effectiveCap} ساعة`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                />
                {(() => {
                  const detail = (exceptionMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
                  return detail ? (
                    <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                      {detail}
                    </span>
                  ) : null;
                })()}
                {grantedDurationExceedsScheduled && !(exceptionMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ? (
                  <span className="text-xs text-red-600 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    المدة الممنوحة يجب ألا تتجاوز الوقت المتبقي حتى الاجتماع ({maxGrantedHoursBySchedule.toFixed(2)} ساعة)
                  </span>
                ) : scheduledAt ? (
                  <span className="text-xs text-gray-500 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    الحد الأقصى {maxGrantedHoursBySchedule.toFixed(2)} ساعة (الوقت المتبقي حتى موعد الاجتماع)
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    الحد الأقصى 72 ساعة
                  </span>
                )}
              </div>
            )}

          </div>
          <DialogFooter className="flex-row-reverse gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsExceptionModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '24px' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmitException}
              disabled={
                exceptionMutation.isPending ||
                !meetingRequest?.id ||
                (contentException && (grantedDurationHours < 0 || grantedDurationHours > 72)) ||
                grantedDurationExceedsScheduled ||
                (contentException && grantedDurationHours > effectiveCap) ||
                (contentException && effectiveCap <= 0 && grantedDurationHours > 0)
              }
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '24px' }}
            >
              <span className="text-white">
                {exceptionMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDrawer
        open={!!previewAttachment}
        onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}
        attachment={previewAttachment}
      />
    </div>
  );
};

export default GuidanceRequestDetail;
