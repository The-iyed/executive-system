import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, ChevronUp, ClipboardCheck, Download, Eye, Clock, Phone, Mail, User, Trash2, Hash, Building2 } from 'lucide-react';
import { Tabs, StatusBadge, DataTable, MeetingInfo, Drawer, type MeetingInfoData } from '@shared/components';
import {
  MeetingStatus,
  getMeetingStatusLabel,
} from '@shared/types';
import { getGuidanceRequestById, getContentExceptionById, provideGuidance, saveGuidanceAsDraft, completeGuidance, handleContentException, ProvideGuidanceRequest, HandleContentExceptionRequest } from '../data/guidanceApi';
import { useAuth } from '../../auth/context';
import { getGuidanceRecords, getConsultationRecordsWithParams, type GuidanceRecord, type ConsultationRecord } from '../../UC02/data/meetingsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';

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
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [expandedGuidanceId, setExpandedGuidanceId] = useState<string | null>(null);

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

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!meetingRequest) return {};
    const execSummary = meetingRequest.attachments?.find((a: { is_executive_summary?: boolean }) => a.is_executive_summary);
    const alt1 = (meetingRequest as { alternative_time_slot_1?: { start?: string; end?: string } }).alternative_time_slot_1;
    const alt2 = (meetingRequest as { alternative_time_slot_2?: { start?: string; end?: string } }).alternative_time_slot_2;
    return {
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
      alternative_1_start_date: alt1?.start ?? undefined,
      alternative_1_end_date: alt1?.end ?? undefined,
      alternative_2_start_date: alt2?.start ?? undefined,
      alternative_2_end_date: alt2?.end ?? undefined,
      meetingChannel: meetingRequest.meeting_channel ?? undefined,
      meeting_location: undefined,
      meetingCategory: (meetingRequest.meeting_classification_type ?? meetingRequest.meeting_classification) ?? undefined,
      meetingReason: meetingRequest.meeting_justification ?? undefined,
      relatedTopic: meetingRequest.related_topic ?? undefined,
      dueDate: meetingRequest.deadline ?? undefined,
      meetingClassification1: meetingRequest.meeting_classification ?? undefined,
      meetingConfidentiality: meetingRequest.meeting_confidentiality ?? undefined,
      meetingAgenda: meetingRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0),
      directive_method: (meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0) ? 'DIRECT_DIRECTIVE' : undefined,
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
      if (data.is_draft) {
        navigate(PATH.GUIDANCE_REQUESTS);
      }   
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
    onSuccess: ( data: ProvideGuidanceRequest ) => {
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

  const handleSubmitException = () => {
    if (!meetingRequest?.id) return;
    if (contentException && (grantedDurationHours < 0 || grantedDurationHours > 72)) return;

    exceptionMutation.mutate({
      content_exception: contentException,
      granted_duration_hours: contentException ? grantedDurationHours : 0,
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
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  تعديل طلب معاد من مسؤول الجدولة ({meetingRequest.request_number})
                </h1>
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center w-full ">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
          </div>

      {/* Tab Content Container */}
      <div className="overflow-y-auto p-6 pb-32 bg-white border border-[#E6E6E6] rounded-2xl m-6 mt-0">
          {/* Guidance Request Tab */}
          {activeTab === 'guidance-request' && (
            <div className="flex flex-col gap-6">
              {/* Consultation Question Section - hidden for EXECUTIVE_OFFICE_MANAGER (shown in directives-log tab instead) */}
             {!isExecutiveManager && <div
                className="flex flex-col justify-start items-end p-[10px] gap-[10px] w-full max-w-[1321px] h-[265px] mx-auto"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                <div className="flex flex-col items-start p-0 gap-[10px] w-full">
                  <div className="flex flex-col items-start p-0 gap-[4px] w-full">
                    {/* Title */}
                    <h2
                      className="w-full h-[38px] font-bold text-lg leading-[38px] text-right text-[#101828]"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
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
                          fontFamily: "'Almarai', sans-serif",
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
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    <div className="flex flex-row justify-end items-center p-0 gap-3 w-[134px] h-6">
                    <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2} />

                     <span
                        className="w-[98px] h-5 font-bold text-base leading-6 text-white"
                        style={{
                          fontFamily: "'Almarai', sans-serif",
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
                    className="text-xl font-bold text-right text-[#101828]"
                    style={{
                      fontFamily: "'Almarai', sans-serif",
                      fontWeight: 700,
                      fontSize: '20px',
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
                        style={{ fontFamily: "'Almarai', sans-serif" }}
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
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      رقم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {meetingRequest.request_number ?? '-'}
                    </p>
                  </div>

                  {/* حالة الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      حالة الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {statusLabel}
                    </p>
                  </div>

                  {/* مقدم الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      مقدم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {meetingRequest.submitter_name ?? '-'}
                    </p>
                  </div>

                  {/* مالك الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      مالك الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                       {meetingRequest.submitter_name ?? '-'}
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
              {/* Scheduling Section - Invitees and Minister Attendees */}
              {/* <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
                <div className="flex flex-col gap-6 w-full max-w-[1085px]">
                  <div className="flex flex-col gap-2">
                    <h2
                      className="text-right"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '38px',
                        color: '#101828',
                      }}
                    >
                      قائمة المدعوين (مقدّم الطلب)
                    </h2>
                    {meetingRequest.invitees && meetingRequest.invitees.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                        <div className="w-full min-w-0">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: '#',
                                width: 'min-w-[6rem] flex-shrink-0',
                                align: 'center',
                                render: (_row: any, index: number) => (
                                  <div className="flex items-center justify-center w-full">
                                    <span className="text-sm text-[#475467]">{index + 1}</span>
                                  </div>
                                ),
                              },
                              {
                                id: 'name',
                                header: 'الإسم',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.external_name || row.user_id || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'position',
                                header: 'المنصب',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.position || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'mobile',
                                header: 'الجوال',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.mobile || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'email',
                                header: 'البريد الإلكتروني',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.external_email || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'attendance_mechanism',
                                header: 'آلية الحضور',
                                width: 'min-w-[8rem] flex-shrink-0',
                                align: 'end',
                                render: (row: any) => {
                                  const v = row.attendance_mechanism;
                                  const label = v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                                  return (
                                    <span className="text-sm text-[#475467] text-right whitespace-nowrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                      {label}
                                    </span>
                                  );
                                },
                              },
                            ] as TableColumn<any>[]}
                            data={meetingRequest.invitees}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        لا توجد قائمة مدعوين من مقدّم الطلب
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2
                      className="text-right"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '38px',
                        color: '#101828',
                      }}
                    >
                      الحضور من جهة الوزير
                    </h2>
                    {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                        <div className="w-full min-w-0">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: '#',
                                width: 'min-w-[6rem] flex-shrink-0',
                                align: 'center',
                                render: (_row: any, index: number) => (
                                  <div className="flex items-center justify-center w-full">
                                    <span className="text-sm text-[#475467]">{index + 1}</span>
                                  </div>
                                ),
                              },
                              {
                                id: 'name',
                                header: 'الإسم',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.external_name || row.user_id || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'position',
                                header: 'المنصب',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.position || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'mobile',
                                header: 'الجوال',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.mobile || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'email',
                                header: 'البريد الإلكتروني',
                                width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.external_email || '-'}
                                  </span>
                                ),
                              },
                              {
                                id: 'attendance_mechanism',
                                header: 'آلية الحضور',
                                width: 'min-w-[8rem] flex-shrink-0',
                                align: 'end',
                                render: (row: any) => {
                                  const v = row.attendance_mechanism;
                                  const label = v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                                  return (
                                    <span className="text-sm text-[#475467] text-right whitespace-nowrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                      {label}
                                    </span>
                                  );
                                },
                              },
                            ] as TableColumn<any>[]}
                            data={meetingRequest.minister_attendees}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        لا يوجد حضور من جهة الوزير
                      </p>
                    )}
                  </div>


                  <div className="flex flex-col gap-2">
                    <h2
                      className="text-right"
                      style={{
                        fontFamily: "'Almarai', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '38px',
                        color: '#101828',
                      }}
                    >
                      دعم الوزير
                    </h2>
                    {meetingRequest.minister_support && meetingRequest.minister_support.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                        <div className="min-w-[1085px]">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: '#',
                                width: 'w-[114px]',
                                align: 'center',
                                render: (_row: any, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                              },
                              {
                                id: 'support_description',
                                header: 'وصف الدعم',
                                width: 'w-[971px]',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                    {row.support_description || '-'}
                                  </span>
                                ),
                              },
                            ] as TableColumn<any>[]}
                            data={meetingRequest.minister_support}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        لا يوجد دعم من الوزير
                      </p>
                    )}
                  </div> 
                </div>
              </div> */}

            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  المحتوى
                </h3>
                <div className="flex flex-col gap-6">
                  {/* العرض التقديمي */}
                  <div className="flex flex-col gap-4">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      العرض التقديمي
                    </label>
                    {meetingRequest.attachments && meetingRequest.attachments.filter((a) => a.is_presentation).length > 0 ? (
                      <div className="flex flex-row gap-4 flex-wrap">
                        {meetingRequest.attachments
                          .filter((a) => a.is_presentation)
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
                                <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                  {att.file_name}
                                </span>
                                <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                  {Math.round((att.file_size || 0) / 1024)} KB
                                </span>
                              </div>

                              <div className="flex flex-row items-center self-end gap-2 ml-auto">
                                {att.blob_url && (
                                  <>
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
                                      onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                      className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                                    >
                                      <Eye className="w-5 h-5 text-[#475467]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        لا توجد مرفقات
                      </p>
                    )}
                  </div>

                  {/* متى سيتم إرفاق العرض؟ */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      متى سيتم إرفاق العرض؟
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      -
                    </p>
                  </div>

                  {/* مرفقات اختيارية */}
                  <div className="flex flex-col gap-4">
                    <label
                      className="text-md font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      مرفقات اختيارية
                    </label>
                    {meetingRequest.attachments && meetingRequest.attachments.filter((a) => a.is_additional).length > 0 ? (
                      <div className="flex flex-row gap-4 flex-wrap">
                        {meetingRequest.attachments
                          .filter((a) => a.is_additional)
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
                                <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                  {att.file_name}
                                </span>
                                <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                  {Math.round((att.file_size || 0) / 1024)} KB
                                </span>
                              </div>

                              <div className="flex flex-row items-center self-end gap-2 ml-auto">
                                {att.blob_url && (
                                  <>
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
                                      onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                      className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                                    >
                                      <Eye className="w-5 h-5 text-[#475467]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        لا توجد مرفقات
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directives Log Tab */}
          {activeTab === 'directives-log' && (
            <div className="flex flex-col gap-4 w-full" dir="rtl">
              {/* Consultation Question Section - shown here for EXECUTIVE_OFFICE_MANAGER */}
              {!isExceptionMode && isExecutiveManager && (
                <div
                  className="flex flex-col justify-start items-end p-[10px] gap-[10px] w-full max-w-[1321px] h-[265px] mx-auto"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  <div className="flex flex-col items-start p-0 gap-[10px] w-full">
                    <div className="flex flex-col items-start p-0 gap-[4px] w-full">
                      <h2
                        className="w-full h-[38px] font-bold text-lg leading-[38px] text-right text-[#101828]"
                        style={{
                          fontFamily: "'Almarai', sans-serif",
                          fontWeight: 700,
                          fontSize: '18px',
                          lineHeight: '38px',
                        }}
                      >
                        سؤال جدوى جدولة الاجتماع
                      </h2>
                      <div className="flex flex-col items-start p-0 gap-4 w-full min-h-[80px]">
                        <p
                          className="w-full text-base leading-6 text-right text-[#475467]"
                          style={{
                            fontFamily: "'Almarai', sans-serif",
                            fontWeight: 400,
                            fontSize: '16px',
                            lineHeight: '24px',
                          }}
                        >
                          {guidanceQuestion || 'لا يوجد سؤال متاح'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenSubmitModal}
                      className="flex flex-row items-center px-3 py-2 gap-2 w-[158px] h-10 bg-[#29615C] rounded-[85px] flex-none"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      <div className="flex flex-row justify-end items-center p-0 gap-3 w-[134px] h-6">
                        <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2} />
                        <span
                          className="w-[98px] h-5 font-bold text-base leading-6 text-white"
                          style={{
                            fontFamily: "'Almarai', sans-serif",
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
                </div>
              )}

              { !isExecutiveManager && isLoadingGuidanceRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
                guidanceRecords.items.map((row: GuidanceRecord, index: number) => {
                  const isExpanded = expandedGuidanceId === row.guidance_id;
                  const requestDate = row.requested_at
                    ? new Date(row.requested_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';
                  const hasAnswer = !!row.guidance_answer;

                  return (
                    <div key={`guidance-${row.guidance_id}-${index}`} className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => setExpandedGuidanceId((id) => (id === row.guidance_id ? null : row.guidance_id))}
                        className={`
                          w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2
                          ${isExpanded
                            ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}
                        `}
                        style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="flex flex-col items-start flex-1 min-w-0">
                          <p className="text-base font-bold text-[#048F86] mb-1">السؤال</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{row.guidance_question || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>تاريخ الطلب : {requestDate}</span>
                            </span>
                            <span className="flex-shrink-0 text-gray-500" aria-hidden>
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && hasAnswer && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                            <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                            <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                          </div>
                          <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                            {(() => {
                              const responseDate = row.responded_at
                                ? new Date(row.responded_at).toLocaleDateString('ar-SA', {
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
                                DRAFT: 'مسودة',
                                COMPLETED: 'مكتمل',
                                SUPERSEDED: 'معلق',
                              };
                              const statusLabel = statusLabels[row.status] || row.status;
                              return (
                                <div
                                  className="flex h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4"
                                  style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}
                                >
                                  <div className="flex w-full flex-row items-center justify-between gap-4">
                                    <p className="min-w-0 flex-1 truncate text-right text-sm text-gray-700">
                                      {row.guidance_answer?.trim() || '—'}
                                    </p>
                                    <StatusBadge status={row.status} label={statusLabel} />
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">
                                      {row.responded_by_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="flex-shrink-0 text-sm text-gray-700">{row.responded_by_name || '—'}</span>
                                    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                      <Clock className="h-4 w-4 flex-shrink-0" />
                                      <span>تاريخ الرد : {responseDate}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {isExpanded && !hasAnswer && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                            <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                            <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                          </div>
                          <div
                            className="z-[2] mt-4 flex h-[44px] min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 mb-4"
                            style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}
                          >
                            <p className="w-full text-right text-sm text-gray-500">لا يوجد رد بعد</p>
                            { isExecutiveManager&&
                           <>
                          <StatusBadge status={row.status} label={statusLabel} />
                          <div className="flex mr-2 h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">
                            E
                          </div>
                          <span className="flex-shrink-0 ml-2 text-sm text-gray-700">Executive Manager</span>
                          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>تاريخ الرد : -</span>
                          </span>
                          </>
                          }
                          </div>
                      
                        </div>
                      )}
                    </div>
                  );
                })
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

          {/* Consultations Log Tab - سجلات الاستشارات - Same as meetingDetail */}
          {activeTab === 'consultations-log' && (
            <div className="flex flex-col gap-4 w-full" dir="rtl">
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                consultationRecords.items.map((row: ConsultationRecord, index: number) => {
                  const recordId = row.id || row.consultation_id || `${index}`;
                  const recordType = row.type || row.consultation_type || '';
                  const recordQuestion = row.question || row.consultation_question || '';
                  const isExpanded = expandedConsultationId === recordId;
                  const typeLabel = recordType === 'SCHEDULING' ? 'السؤال' : recordType === 'CONTENT' ? 'محتوى' : recordType;
                  const requestDate = row.requested_at ? new Date(row.requested_at).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
                  const displayRequestNumber = row.assignees?.[0]?.request_number || row.consultation_request_number || '';
                  const overallStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

                  const flatItems: Array<{id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null}> = [];
                  if (row.assignees?.length) {
                    row.assignees.forEach(a => {
                      if (a.answers?.length) {
                        a.answers.forEach(ans => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at, requestNumber: a.request_number }));
                      } else {
                        flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at, requestNumber: a.request_number });
                      }
                    });
                  } else if (row.consultation_answers?.length) {
                    row.consultation_answers.forEach(a => flatItems.push({ id: a.consultation_id || a.external_id || `ans-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at, requestNumber: row.consultation_request_number || null }));
                  } else if (row.assignee_sections?.length) {
                    row.assignee_sections.forEach(a => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null }));
                  }

                  return (
                    <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => setExpandedConsultationId((prev) => (prev === recordId ? null : recordId))}
                        className={`
                          w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2
                          ${isExpanded
                            ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}
                        `}
                        style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <p className="text-base font-bold text-[#048F86] mb-1">{typeLabel}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{recordQuestion || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {row.round_number != null && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700 font-medium">
                                <span>الجولة {row.round_number}</span>
                              </span>
                            )}
                            {row.status && (
                              <StatusBadge status={row.status} label={overallStatusLabels[row.status] || row.status} />
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>تاريخ الطلب : {requestDate}</span>
                            </span>
                            {displayRequestNumber && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                <Hash className="w-4 h-4 flex-shrink-0" />
                                <span>رمز الطلب : {displayRequestNumber}</span>
                              </span>
                            )}
                            <span className="flex-shrink-0 text-gray-500" aria-hidden>
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && flatItems.length > 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          {flatItems.map((_, idx) =>
                            <div key={`line-${idx}`} className="flex flex-shrink-0 w-12 flex-col items-center pt-1"
                              style={idx > 0 ? { position: 'absolute', top: `${47 * idx}px`, height: `${136 * idx}px` } : {}}
                            >
                              <div className={`w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] max-h-[60%] ${flatItems.length > 1 ? '-mt-[38px]' : '-mt-[10px]'} `} />
                              <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                            </div>
                          )}
                          <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                            {flatItems.map((item) => {
                              const responseDate = item.respondedAt ? new Date(item.respondedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
                              return (
                                <div key={item.id} className="flex h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4" style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}>
                                  <div className="flex w-full flex-row items-center justify-between gap-4">
                                    <p className="min-w-0 flex-1 truncate text-right text-sm text-gray-700">{item.text?.trim() || '—'}</p>
                                    <StatusBadge status={item.status} label={overallStatusLabels[item.status] || item.status} />
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">{item.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                    <span className="flex-shrink-0 text-sm text-gray-700">{item.name || '—'}</span>
                                    {item.requestNumber && (
                                      <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                        <Hash className="h-4 w-4 flex-shrink-0" /><span>{item.requestNumber}</span>
                                      </span>
                                    )}
                                    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                      <Clock className="h-4 w-4 flex-shrink-0" /><span>تاريخ الرد : {responseDate}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {isExpanded && flatItems.length === 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                            <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                            <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                          </div>
                          <div className="z-[2] mt-4 flex h-[44px] min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 mb-4" style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}>
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
                    <p className="text-gray-600 text-lg mb-2">سجل الاستشارات</p>
                    <p className="text-gray-500 text-sm">لا توجد استشارات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Consultation Records Tab - سجلات الاستشارات المحتوى - Same as meetingDetail */}
          {activeTab === 'consultations-log-content' && (
            <div className="flex flex-col gap-4 w-full" dir="rtl">
              {isLoadingContentConsultationRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : contentConsultationRecords && contentConsultationRecords.items.length > 0 ? (
                contentConsultationRecords.items.map((row: ConsultationRecord, index: number) => {
                  const recordId = row.id || row.consultation_id || `c-${index}`;
                  const recordType = row.type || row.consultation_type || '';
                  const recordQuestion = row.question || row.consultation_question || '';
                  const isExpanded = expandedConsultationId === recordId;
                  const typeLabel = recordType === 'SCHEDULING' ? 'السؤال' : recordType === 'CONTENT' ? 'محتوى' : recordType;
                  const requestDate = row.requested_at ? new Date(row.requested_at).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
                  const displayRequestNumber = row.assignees?.[0]?.request_number || row.consultation_request_number || '';
                  const overallStatusLabels: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

                  const flatItems: Array<{id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null}> = [];
                  if (row.assignees?.length) {
                    row.assignees.forEach(a => {
                      if (a.answers?.length) {
                        a.answers.forEach(ans => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at, requestNumber: a.request_number }));
                      } else {
                        flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at, requestNumber: a.request_number });
                      }
                    });
                  } else if (row.consultation_answers?.length) {
                    row.consultation_answers.forEach(a => flatItems.push({ id: a.consultation_id || a.external_id || `ans-c-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at, requestNumber: row.consultation_request_number || null }));
                  } else if (row.assignee_sections?.length) {
                    row.assignee_sections.forEach(a => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null }));
                  }

                  return (
                    <div key={`consultation-content-${recordId}-${index}`} className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => setExpandedConsultationId((prev) => (prev === recordId ? null : recordId))}
                        className={`
                          w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2
                          ${isExpanded
                            ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}
                        `}
                        style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <p className="text-base font-bold text-[#048F86] mb-1">{typeLabel}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{recordQuestion || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {row.round_number != null && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700 font-medium">
                                <span>الجولة {row.round_number}</span>
                              </span>
                            )}
                            {row.status && (
                              <StatusBadge status={row.status} label={overallStatusLabels[row.status] || row.status} />
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>تاريخ الطلب : {requestDate}</span>
                            </span>
                            {displayRequestNumber && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                <Hash className="w-4 h-4 flex-shrink-0" />
                                <span>رمز الطلب : {displayRequestNumber}</span>
                              </span>
                            )}
                            <span className="flex-shrink-0 text-gray-500" aria-hidden>
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && flatItems.length > 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          {flatItems.map((_, idx) =>
                            <div key={`line-c-${idx}`} className="flex flex-shrink-0 w-12 flex-col items-center pt-1"
                              style={idx > 0 ? { position: 'absolute', top: `${47 * idx}px`, height: `${136 * idx}px` } : {}}
                            >
                              <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[10px] max-h-[60%]" />
                              <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                            </div>
                          )}
                          <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                            {flatItems.map((item) => {
                              const responseDate = item.respondedAt ? new Date(item.respondedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
                              return (
                                <div key={item.id} className="flex h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4" style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}>
                                  <div className="flex w-full flex-row items-center justify-between gap-4">
                                    <p className="min-w-0 flex-1 truncate text-right text-sm text-gray-700">{item.text?.trim() || '—'}</p>
                                    <StatusBadge status={item.status} label={overallStatusLabels[item.status] || item.status} />
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">{item.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                    <span className="flex-shrink-0 text-sm text-gray-700">{item.name || '—'}</span>
                                    {item.requestNumber && (
                                      <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                        <Hash className="h-4 w-4 flex-shrink-0" /><span>{item.requestNumber}</span>
                                      </span>
                                    )}
                                    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                                      <Clock className="h-4 w-4 flex-shrink-0" /><span>تاريخ الرد : {responseDate}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {isExpanded && flatItems.length === 0 && (
                        <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                          <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                            <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                            <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                          </div>
                          <div className="z-[2] mt-4 flex h-[44px] min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 mb-4" style={{ fontFamily: "'Almarai', 'Almarai', sans-serif" }}>
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
                    <p className="text-gray-600 text-lg mb-2">سجلات الاستشارات المحتوى</p>
                    <p className="text-gray-500 text-sm">لا توجد استشارات محتوى مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invitees Tab - قائمة المدعوين */}
          {activeTab === 'invitees' && (
            <div className="flex flex-col gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
              {/* قائمة المدعوين (مقدّم الطلب) */}
              <div className="flex flex-col gap-4">
                <h2
                  className="text-right"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '22px',
                    lineHeight: '38px',
                    color: '#101828',
                  }}
                >
                  قائمة المدعوين (مقدّم الطلب)
                </h2>
                {meetingRequest.invitees && meetingRequest.invitees.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4">
                    {meetingRequest.invitees.map((invitee: any, idx: number) => {
                      const name = invitee.external_name || invitee.user_id || '-';
                      const position = invitee.position || '-';
                      const sector = invitee.sector || '-';
                      const email = invitee.external_email || '-';
                      const mobile = invitee.mobile || '-';
                      const v = invitee.attendance_mechanism;
                      const attendanceLabel = v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                      const accessLabel = invitee.access_permission === 'VIEW' ? 'صلاحية الاطلاع' : invitee.access_permission === 'EDIT' ? 'صلاحية التعديل' : invitee.access_permission || 'صلاحية الاطلاع';
                      const isConsultant = invitee.is_consultant === true;

                      return (
                        <div key={invitee.id || idx} className={`group relative overflow-hidden border-[1.5px] ${isConsultant ? 'bg-[rgba(4,143,134,0.04)] border-[#048F86]' : 'bg-white border-[rgba(230,236,245,1)]'}`} style={{ borderRadius: '16px', boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)' }}>
                          {/* Delete strip - overlays on hover (left side in RTL) */}
                          <div className="absolute left-0 top-0 bottom-0 z-10 flex w-0 items-center justify-center overflow-hidden transition-all duration-200 ease-in-out group-hover:w-12 hidden" style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(1.62px)' }}>
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors bg-white shadow-md"
                              aria-label="حذف"
                            >
                              <Trash2 className="h-[18px] w-[18px] text-[#D92D20]" strokeWidth={1.8} />
                            </button>
                          </div>
                          <div
                            className="flex flex-col gap-4 p-5"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                          {/* Top Row: Avatar + Name/Position + Tags */}
                          <div className="flex flex-row items-center justify-between gap-3">
                            <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217, 217, 217, 1)]">
                                <User className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-bold text-[#101828] truncate leading-5">{name}</span>
                                <span className="text-[12px] text-[#667085] leading-4">{position}</span>
                              </div>
                            </div>
                            <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                              <span className="inline-flex items-center rounded-full bg-[#E6F9F8] px-2.5 py-1 text-[13px] text-[#048F86] whitespace-nowrap">
                                {accessLabel}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-[#EDF6FF] px-2.5 py-1 text-[13px] text-[#4281BF] whitespace-nowrap">
                                {attendanceLabel}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Email + Phone pills */}
                          <div className="flex flex-row items-center gap-2.5 w-full">
                            <div
                              className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                              style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                            >
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <Mail className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[10px] text-gray-700 leading-3">البريد الإلكتروني</span>
                                <span className="text-[12px] text-gray-700 truncate leading-4">{email}</span>
                              </div>
                            </div>
                            <div
                              className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                              style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                            >
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <Phone className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[10px] text-gray-700 leading-3">الجوال</span>
                                <span className="text-[12px] text-gray-700 truncate leading-4" dir="ltr">{mobile}</span>
                              </div>
                            </div>
                          </div>
                          {sector !== '-' && (
                            <div className="flex flex-row items-center gap-2.5 w-full">
                              <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
                                  <Building2 className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                  <span className="text-[10px] text-gray-700 leading-3">الجهة</span>
                                  <span className="text-[12px] text-gray-700 truncate leading-4">{sector}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    لا توجد قائمة مدعوين من مقدّم الطلب
                  </p>
                )}
              </div>

              {/* الحضور من جهة الوزير */}
              <div className="flex flex-col gap-4">
                <h2
                  className="text-right"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '22px',
                    lineHeight: '38px',
                    color: '#101828',
                  }}
                >
                  الحضور من جهة الوزير
                </h2>
                {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4">
                    {meetingRequest.minister_attendees.map((invitee: any, idx: number) => {
                      const name = invitee.external_name || invitee.user_id || '-';
                      const position = invitee.position || '-';
                      const sector = invitee.sector || '-';
                      const email = invitee.external_email || '-';
                      const mobile = invitee.mobile || '-';
                      const v = invitee.attendance_mechanism;
                      const attendanceLabel = v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                      const accessLabel = invitee.access_permission === 'VIEW' ? 'صلاحية الاطلاع' : invitee.access_permission === 'EDIT' ? 'صلاحية التعديل' : invitee.access_permission || 'صلاحية الاطلاع';
                      const isConsultant = invitee.is_consultant === true;

                      return (
                        <div key={invitee.id || idx} className={`group relative overflow-hidden border-[1.5px] ${isConsultant ? 'bg-[rgba(4,143,134,0.04)] border-[#048F86]' : 'bg-white border-[rgba(230,236,245,1)]'}`} style={{ borderRadius: '16px', boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)' }}>
                          {/* Delete strip - overlays on hover (left side in RTL) */}
                          <div className="absolute left-0 top-0 bottom-0 z-10 flex w-0 items-center justify-center overflow-hidden transition-all duration-200 ease-in-out group-hover:w-12 hidden" style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(1.62px)' }}>
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors bg-white shadow-md"
                              aria-label="حذف"
                            >
                              <Trash2 className="h-[18px] w-[18px] text-[#D92D20]" strokeWidth={1.8} />
                            </button>
                          </div>
                          <div
                            className="flex flex-col gap-4 p-5"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                          {/* Top Row: Avatar + Name/Position + Tags */}
                          <div className="flex flex-row items-center justify-between gap-3">
                            <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7]">
                                <User className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] font-bold text-[#101828] truncate leading-5">{name}</span>
                                <span className="text-[12px] text-[#667085] leading-4">{position}</span>
                              </div>
                            </div>
                            <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                              <span className="inline-flex items-center rounded-full bg-[#F9FAFB] border border-[#EAECF0] px-2.5 py-1 text-[11px] text-[#344054] whitespace-nowrap">
                                {accessLabel}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-[#F9FAFB] border border-[#EAECF0] px-2.5 py-1 text-[11px] text-[#344054] whitespace-nowrap">
                                {attendanceLabel}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Email + Phone pills */}
                          <div className="flex flex-row items-center gap-2.5 w-full">
                            <div
                              className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                              style={{ borderRadius: '8px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                            >
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <Mail className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-[#98A2B3] leading-3">البريد الإلكتروني</span>
                                <span className="text-[12px] text-[#344054] truncate leading-4">{email}</span>
                              </div>
                            </div>
                            <div
                              className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2"
                              style={{ borderRadius: '8px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}
                            >
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <Phone className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-[#98A2B3] leading-3">الجوال</span>
                                <span className="text-[12px] text-[#344054] truncate leading-4" dir="ltr">{mobile}</span>
                              </div>
                            </div>
                          </div>
                          {sector !== '-' && (
                            <div className="flex flex-row items-center gap-2.5 w-full">
                              <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '8px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
                                  <Building2 className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] text-[#98A2B3] leading-3">الجهة</span>
                                  <span className="text-[12px] text-[#344054] truncate leading-4">{sector}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    لا يوجد حضور من جهة الوزير
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Submit Guidance Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
             تقديم توجيه
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-md font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
               محتوى التوجيه
              </label>
              <Textarea
                value={guidanceResponse}
                onChange={(e) => setGuidanceResponse(e.target.value)}
                placeholder="أدخل محتوى التوجيه..."
                className="min-h-[300px] text-right"
                dir="rtl"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              />
            </div>
            
            {/* Toggle for scheduling suitability */}
            <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-row items-center justify-between w-full">
                <span
                  className="text-sm font-semibold text-gray-900"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  هل الطلب مناسب للجدولة؟
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span
                    className="text-base text-[#667085]"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
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
                fontFamily: "'Almarai', sans-serif",
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
                fontFamily: "'Almarai', sans-serif",
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
                fontFamily: "'Almarai', sans-serif",
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
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
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          سؤال التوجيه:
                        </span>
                        <span
                          className="text-xs text-gray-500"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          {new Date(draft.requested_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <p
                        className="text-sm text-gray-900 text-right"
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                        {draft.guidance_question}
                      </p>
                    </div>

                    {draft.guidance_answer && (
                      <div className="flex flex-col gap-2">
                        <span
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          الإجابة:
                        </span>
                        <p
                          className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
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
                        style={{ fontFamily: "'Almarai', sans-serif" }}
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
                  style={{ fontFamily: "'Almarai', sans-serif" }}
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
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
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            <ClipboardCheck className="w-5 h-5 text-white" strokeWidth={2} />
            <span
              className="font-bold text-base leading-6 text-white"
              style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: '16px' }}
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
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
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  استثناء المحتوى؟
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span
                    className="text-base text-[#667085]"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
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
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  المدة الممنوحة (بالساعات)
                </label>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={grantedDurationHours}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 72) setGrantedDurationHours(val);
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-right ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#048F86] focus-visible:ring-offset-2"
                  dir="rtl"
                  placeholder="0 - 72 ساعة"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                />
                <span className="text-xs text-gray-500 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  الحد الأقصى 72 ساعة
                </span>
              </div>
            )}

          </div>
          <DialogFooter className="flex-row-reverse gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsExceptionModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '24px' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmitException}
              disabled={
                exceptionMutation.isPending ||
                !meetingRequest?.id ||
                (contentException && (grantedDurationHours < 0 || grantedDurationHours > 72))
              }
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Almarai', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '24px' }}
            >
              <span className="text-white">
                {exceptionMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF / file preview drawer */}
      <Drawer
        open={!!previewAttachment}
        onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}
        title={previewAttachment?.file_name ?? ''}
        side="right"
        width="90vw"
        showDecoration={true}
        bodyClassName="!p-0 flex flex-col flex-1 min-h-0"
      >
        {previewAttachment && (
          <div className="flex flex-col flex-1 min-h-[60vh] w-full" dir="ltr">
            {previewAttachment.file_type?.toLowerCase() === 'pdf' ? (
              <iframe
                title={previewAttachment.file_name}
                src={previewAttachment.blob_url}
                className="w-full flex-1 min-h-0 border-0 rounded-b-[16px] bg-[#f9fafb]"
              />
            ) : (
              <div className="flex flex-col flex-1 items-center justify-center gap-4 py-12 px-4">
                <p className="text-[#475467] text-center" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  معاينة غير متاحة لهذا النوع من الملفات. يمكنك تحميله من الرابط أدناه.
                </p>
                <a
                  href={previewAttachment.blob_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009883] text-white hover:bg-[#008774] transition-colors"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  <Download className="w-4 h-4" />
                  تحميل الملف
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default GuidanceRequestDetail;
