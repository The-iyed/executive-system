import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, ChevronUp, Eye, Download, Clock, User, Mail, Phone, Trash2, Hash, Building2 } from 'lucide-react';
import { Tabs, StatusBadge, AgendaPreviewTable, MeetingInfo, Drawer, type MeetingInfoData } from '@shared/components';
import { formatDateArabic, formatDateTimeArabic } from '@shared/utils';
import {
  MeetingStatus,
  MeetingStatusLabels,
  getMeetingTypeLabel,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
  SectorLabels,
  Sector,
} from '@shared/types';
import {
  getContentConsultationRequestById,
  submitConsultation,
  completeConsultation,
  type Attachment,
} from '../data/contentConsultantApi';
import { getConsultationRecords, type ConsultationRecord } from '../../UC02/data/meetingsApi';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea } from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';

// Get status label with support for custom statuses
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  // Handle custom statuses
  if (status === 'SCHEDULED_CONTENT_CONSULTATION') {
    return 'مجدول لاستشارة المحتوى';
  }
  return status as string;
};

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

// Safely render notes coming as string/object/array from API
const getNotesText = (...candidates: unknown[]): string => {
  const extract = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (Array.isArray(value)) {
      const parts = value.map(extract).filter(Boolean) as string[];
      return parts.length ? parts.join('\n') : null;
    }
    if (typeof value === 'object') {
      const v = value as Record<string, unknown>;
      // Try common text property names
      if (typeof v.text === 'string' && v.text.trim()) return v.text.trim();
      if (typeof v.note === 'string' && v.note.trim()) return v.note.trim();
      if (typeof v.content === 'string' && v.content.trim()) return v.content.trim();
      if (typeof v.value === 'string' && v.value.trim()) return v.value.trim();
      if (typeof v.notes === 'string' && v.notes.trim()) return v.notes.trim();
      if (typeof v.note_text === 'string' && v.note_text.trim()) return v.note_text.trim();
      // Don't return the object itself
      return null;
    }
    return null;
  };

  for (const candidate of candidates) {
    const text = extract(candidate);
    if (text) return text;
  }
  return '-';
};

const ContentConsultationRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [activeSubTab, setActiveSubTab] = useState<string>('presentation');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(true);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);

  // Fetch content consultation request data from API
  const { data: consultationData, isLoading, error } = useQuery({
    queryKey: ['content-consultation-request', id],
    queryFn: () => getContentConsultationRequestById(id!),
    enabled: !!id,
  });

  // Fetch consultation records
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === 'consultations-log',
  });

  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ['consultation-records-with-drafts', id],
    queryFn: () => getConsultationRecords(id!, true),
    enabled: !!id && activeTab === 'request-info',
  });

  const draftsRecords =
    consultationRecordsWithDrafts?.items?.filter(
      (item) =>
        item.is_draft ||
        (!item.consultation_answers?.length && !item.assignees?.some(a => a.answers?.length)) ||
        item.consultation_answers?.some((a) => a.is_draft)
    ) || [];

  const queryClient = useQueryClient();

  const meetingRequest = consultationData?.meeting_request;
  const consultationQuestion = consultationData?.consultation_question || '';
  // Use consultation_id from response, or fallback to meeting request id from URL
  const consultationId = consultationData?.consultation_id || id;

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!meetingRequest) return {};
    const owner = meetingRequest.current_owner_user
      ? `${meetingRequest.current_owner_user.first_name ?? ''} ${meetingRequest.current_owner_user.last_name ?? ''}`.trim()
      : meetingRequest.current_owner_role?.name_ar ?? undefined;
    const alt1 = (meetingRequest as { alternative_time_slot_1?: { start?: string; end?: string } }).alternative_time_slot_1;
    const alt2 = (meetingRequest as { alternative_time_slot_2?: { start?: string; end?: string } }).alternative_time_slot_2;
    return {
      is_on_behalf_of: meetingRequest.is_on_behalf_of,
      meeting_manager_label: owner ?? undefined,
      meetingSubject: meetingRequest.meeting_title ?? undefined,
      meetingDescription: meetingRequest.meeting_subject ?? undefined,
      sector: meetingRequest.sector ?? undefined,
      meetingType: meetingRequest.meeting_type ?? undefined,
      is_urgent: meetingRequest.is_direct_schedule === true,
      urgent_reason: meetingRequest.meeting_justification ?? undefined,
      meeting_start_date: meetingRequest.scheduled_at ?? undefined,
      meeting_end_date: undefined,
      alternative_1_start_date: alt1?.start ?? undefined,
      alternative_1_end_date: alt1?.end ?? undefined,
      alternative_2_start_date: alt2?.start ?? undefined,
      alternative_2_end_date: alt2?.end ?? undefined,
      meetingChannel: meetingRequest.meeting_channel ?? undefined,
      meeting_location: undefined,
      meetingCategory: (meetingRequest as { meeting_classification_type?: string }).meeting_classification_type ?? meetingRequest.meeting_classification ?? undefined,
      meetingReason: meetingRequest.meeting_justification ?? undefined,
      relatedTopic: meetingRequest.related_topic ?? undefined,
      dueDate: meetingRequest.deadline ?? undefined,
      meetingClassification1: meetingRequest.meeting_classification ?? undefined,
      meetingConfidentiality: (meetingRequest as { meeting_confidentiality?: string }).meeting_confidentiality ?? undefined,
      meetingAgenda: meetingRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0),
      directive_method: undefined,
      previous_meeting_minutes_file: undefined,
      directive_text: undefined,
      notes: getNotesText(meetingRequest.general_notes, meetingRequest.content_officer_notes),
    };
  }, [meetingRequest]);

  // Filter attachments
  const presentationAttachments = meetingRequest?.attachments?.filter(
    (att) => att.is_presentation
  ) || [];
  const additionalAttachments = meetingRequest?.attachments?.filter(
    (att) => att.is_additional
  ) || [];

  const tabs = [
    {
      id: 'request-info',
      label: 'معلومات الطلب',
    },
    {
      id: 'content',
      label: 'المحتوى',
    },
    // {
    //   id: 'attachments',
    //   label: 'المرفقات',
    // },
    {
      id: 'meeting-info',
      label: 'معلومات الاجتماع',
    },
    {
      id: 'invitees',
      label: 'قائمة المدعوين',
    },
    {
      id: 'consultations-log',
      label: 'سجل الإستشارات',
    },
  ];

  // Submit consultation mutation
  const submitMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string; is_draft: boolean }) => {
      if (!consultationId) throw new Error('Consultation ID is required');
      return submitConsultation(consultationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-consultation-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-consultation-requests'] });
      setConsultationNotes('');
      setIsSuitableForScheduling(true);
      setIsConsultationModalOpen(false);
      navigate(PATH.CONTENT_CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting consultation:', error);
      // TODO: Show error toast/notification
    },
  });

  const handleSubmitConsultation = (type: 'draft' | 'submit') => {
    if (!consultationNotes.trim()) {
      // TODO: Show validation error
      return;
    }
    if (!consultationId) {
      console.error('Consultation ID is required');
      return;
    }
    submitMutation.mutate({
      feasibility_answer: isSuitableForScheduling,
      consultation_answers: consultationNotes.trim(),
      is_draft: type === 'draft',
    });
  };

  // Publish draft mutation
  const publishDraftMutation = useMutation({
    mutationFn: (draftId: string) => {
      return completeConsultation(draftId);
    },
      onSuccess: () => {
        navigate(PATH.CONTENT_CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error('Error publishing draft:', error);
      // TODO: Show error toast/notification
    },
  });

  const handlePublishDraft = (draftId: string) => {
    publishDraftMutation.mutate(draftId);
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
  const statusLabel = getStatusLabel(meetingStatus);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="p-6">
        {/* Main Container */}
        <div className=" mx-auto bg-white rounded-2xl p-6 md:p-8 gap-6 flex flex-col" >
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
                  {meetingRequest.meeting_title} ({meetingRequest.request_number})
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

          {/* Tab Content */}
        <div className=" overflow-y-auto p-6 pb-32 bg-white border border-[#E6E6E6] rounded-2xl m-6 mt-0">
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-4 w-full">
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

                <div className="flex flex-row justify-start items-center gap-2"  >
                {
                    draftsRecords && draftsRecords?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsDraftsModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-[#F2F4F7] text-[#344054] rounded-full border-2 border-[#D0D5DD] transition-opacity hover:bg-gray-100 cursor-pointer"
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                         مسودات ({draftsRecords.length})
                      </button>
                    )
                  }
                  <button
                    type="button"
                    onClick={() => setIsConsultationModalOpen(true)}
                    disabled={submitMutation.isPending}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full border-2 border-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    إضافة الاستشارة
                  </button>
                  
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
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

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
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

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
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

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      مالك الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {meetingRequest.current_owner_user
                        ? `${meetingRequest.current_owner_user.first_name} ${meetingRequest.current_owner_user.last_name}`
                        : meetingRequest.current_owner_role?.name_ar ?? meetingRequest.current_owner_user_id ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="flex flex-col gap-6 w-full ">
              <div className="flex flex-col gap-4 w-full">
                <h2
                  className="text-xl font-bold text-right text-[#101828]"
                  style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '20px',
                    lineHeight: '28px',
                  }}
                >
                  المحتوى
                </h2>

                {/* العرض التقديمي - same UI as in المرفقات tab */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    العرض التقديمي
                  </label>
                  {presentationAttachments.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {presentationAttachments.map((att: Attachment) => (
                        <div
                          key={att.id}
                          className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                        >
                          <div className="flex flex-row items-center gap-3">
                            {att.file_type?.toLowerCase() === 'pdf' ? (
                              <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                                {att.file_type?.toUpperCase() || ''}
                              </div>
                            )}
                            <div className="flex flex-col items-end">
                              <span
                                className="text-sm font-medium text-[#344054] text-right"
                                style={{ fontFamily: "'Almarai', sans-serif" }}
                              >
                                {att.file_name}
                              </span>
                              <span
                                className="text-xs text-[#475467] text-right"
                                style={{ fontFamily: "'Almarai', sans-serif" }}
                              >
                                {formatFileSize(att.file_size || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row items-center gap-2 ml-auto">
                            {att.blob_url && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                  className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                                >
                                  <Eye className="w-5 h-5 text-[#475467]" />
                                </button>
                                <a
                                  href={att.blob_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                                >
                                  <Download className="w-5 h-5 text-[#009883]" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-base text-gray-500 text-right py-2"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      لا يوجد عرض تقديمي
                    </p>
                  )}
                </div>

                {/* متى سيتم إرفاق العرض؟ */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    متى سيتم إرفاق العرض؟
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    {(meetingRequest as { presentation_attachment_timing?: string | null })?.presentation_attachment_timing ?? '-'}
                  </p>
                </div>

                {/* مرفقات اختيارية - same UI as in المرفقات tab */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    مرفقات اختيارية
                  </label>
                  {additionalAttachments.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {additionalAttachments.map((att: Attachment) => (
                        <div
                          key={att.id}
                          className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                        >
                          <div className="flex flex-row items-center gap-3">
                            {att.file_type?.toLowerCase() === 'pdf' ? (
                              <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                                {att.file_type?.toUpperCase() || ''}
                              </div>
                            )}
                            <div className="flex flex-col items-end">
                              <span
                                className="text-sm font-medium text-[#344054] text-right"
                                style={{ fontFamily: "'Almarai', sans-serif" }}
                              >
                                {att.file_name}
                              </span>
                              <span
                                className="text-xs text-[#475467] text-right"
                                style={{ fontFamily: "'Almarai', sans-serif" }}
                              >
                                {formatFileSize(att.file_size || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row items-center gap-2 ml-auto">
                            {att.blob_url && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                  className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                                >
                                  <Eye className="w-5 h-5 text-[#475467]" />
                                </button>
                                <a
                                  href={att.blob_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                                >
                                  <Download className="w-5 h-5 text-[#009883]" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-base text-gray-500 text-right py-2"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      لا توجد مرفقات اختيارية
                    </p>
                  )}
                </div>

                {/* ملاحظات */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    ملاحظات
                  </label>
                  <p
                    className="text-base text-gray-900 text-right whitespace-pre-wrap"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    {getNotesText(meetingRequest.general_notes, meetingRequest.content_officer_notes)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="flex flex-col gap-6" style={{ width: '100%' }}>
              {/* Sub-tabs for attachments */}
              <div className="flex flex-row gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveSubTab('presentation')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSubTab === 'presentation'
                      ? 'text-[#009883] border-b-2 border-[#009883]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  العرض التقديمي
                </button>
                {additionalAttachments.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('additional')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeSubTab === 'additional'
                        ? 'text-[#009883] border-b-2 border-[#009883]'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    {additionalAttachments.length} مرفقات إضافية
                  </button>
                )}
              </div>

              {/* Attachment Display */}
              <div className="flex flex-col gap-4" style={{ width: '100%' }}>
                {activeSubTab === 'presentation' && presentationAttachments.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {presentationAttachments.map((att: Attachment) => (
                      <div
                        key={att.id}
                        className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                      >
                        <div className="flex flex-row items-center gap-3">
                          {att.file_type?.toLowerCase() === 'pdf' ? (
                            <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                              {att.file_type?.toUpperCase() || ''}
                            </div>
                          )}
                          <div className="flex flex-col items-end">
                            <span
                              className="text-sm font-medium text-[#344054] text-right"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {att.file_name}
                            </span>
                            <span
                              className="text-xs text-[#475467] text-right"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {formatFileSize(att.file_size || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row items-center gap-2 ml-auto">
                          {att.blob_url && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                              >
                                <Eye className="w-5 h-5 text-[#475467]" />
                              </button>
                              <a
                                href={att.blob_url}
                                target="_blank"
                                rel="noreferrer"
                                className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                              >
                                <Download className="w-5 h-5 text-[#009883]" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSubTab === 'additional' && additionalAttachments.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {additionalAttachments.map((att: Attachment) => (
                      <div
                        key={att.id}
                        className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                      >
                        <div className="flex flex-row items-center gap-3">
                          {att.file_type?.toLowerCase() === 'pdf' ? (
                            <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                              {att.file_type?.toUpperCase() || ''}
                            </div>
                          )}
                          <div className="flex flex-col items-end">
                            <span
                              className="text-sm font-medium text-[#344054] text-right"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {att.file_name}
                            </span>
                            <span
                              className="text-xs text-[#475467] text-right"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {formatFileSize(att.file_size || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row items-center gap-2 ml-auto">
                          {att.blob_url && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })}
                                className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                              >
                                <Eye className="w-5 h-5 text-[#475467]" />
                              </button>
                              <a
                                href={att.blob_url}
                                target="_blank"
                                rel="noreferrer"
                                className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                              >
                                <Download className="w-5 h-5 text-[#009883]" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSubTab === 'presentation' && presentationAttachments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد عرض تقديمي
                  </div>
                )}

                {activeSubTab === 'additional' && additionalAttachments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مرفقات إضافية
                  </div>
                )}
              </div>

              {/* Content Manager Notes */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  ملاحظات مسؤول المحتوى
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px]">
                  <p
                    className="text-sm text-gray-700 text-right whitespace-pre-wrap"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    {getNotesText(meetingRequest.content_officer_notes) || 'لا توجد ملاحظات'}
                  </p>
                </div>
              </div>

              {/* Consultation Question */}
              {consultationQuestion && (
                <div className="flex flex-col gap-4">
                  <h3
                    className="text-lg font-semibold text-gray-900 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    سؤال الاستشارة
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p
                      className="text-sm text-gray-700 text-right"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {consultationQuestion}
                    </p>
                  </div>
                </div>
              )}

              {/* Add Consultation Section */}
              
            </div>
          )}

          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-6">
              <MeetingInfo data={meetingInfoData} dir="rtl" />
            </div>
          )}

          {/* Invitees Tab - قائمة المدعوين */}
          {activeTab === 'invitees' && (
            <div className="flex flex-col gap-6 w-full" dir="rtl">
              {/* قائمة المدعوين (مقدّم الطلب) */}
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
                          <div className="absolute left-0 top-0 bottom-0 z-10 flex w-0 items-center justify-center overflow-hidden transition-all duration-200 ease-in-out group-hover:w-12 hidden" style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(16.62px)' }}>
                            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/40" aria-label="حذف">
                              <Trash2 className="h-[18px] w-[18px] text-[#D92D20]" strokeWidth={1.8} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-4 p-5" style={{ fontFamily: "'Almarai', sans-serif" }}>
                            <div className="flex flex-row items-center justify-between gap-3">
                              <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
                                  <User className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[14px] font-bold text-[#101828] truncate leading-5">{name}</span>
                                  <span className="text-[12px] text-[#667085] leading-4">{position}</span>
                                </div>
                              </div>
                              <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                                <span className="inline-flex items-center rounded-full bg-[#E6F9F8] px-2.5 py-1 text-[13px] text-[#048F86] whitespace-nowrap">{accessLabel}</span>
                                <span className="inline-flex items-center rounded-full bg-[#EDF6FF] px-2.5 py-1 text-[13px] text-[#4281BF] whitespace-nowrap">{attendanceLabel}</span>
                              </div>
                            </div>
                            <div className="flex flex-row items-center gap-2.5 w-full">
                              <div className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
                                  <Mail className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                  <span className="text-[10px] text-gray-700 leading-3">البريد الإلكتروني</span>
                                  <span className="text-[12px] text-gray-700 truncate leading-4">{email}</span>
                                </div>
                              </div>
                              <div className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
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
                {(meetingRequest as { minister_attendees?: any[] }).minister_attendees &&
                (meetingRequest as { minister_attendees?: any[] }).minister_attendees!.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(meetingRequest as { minister_attendees?: any[] }).minister_attendees!.map((invitee: any, idx: number) => {
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
                          <div className="absolute left-0 top-0 bottom-0 z-10 flex w-0 items-center justify-center overflow-hidden transition-all duration-200 ease-in-out group-hover:w-12 hidden" style={{ borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(16.62px)' }}>
                            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/40" aria-label="حذف">
                              <Trash2 className="h-[18px] w-[18px] text-[#D92D20]" strokeWidth={1.8} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-4 p-5" style={{ fontFamily: "'Almarai', sans-serif" }}>
                            <div className="flex flex-row items-center justify-between gap-3">
                              <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
                                  <User className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[14px] font-bold text-[#101828] truncate leading-5">{name}</span>
                                  <span className="text-[12px] text-[#667085] leading-4">{position}</span>
                                </div>
                              </div>
                              <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                                <span className="inline-flex items-center rounded-full bg-[#E6F9F8] px-2.5 py-1 text-[13px] text-[#048F86] whitespace-nowrap">{accessLabel}</span>
                                <span className="inline-flex items-center rounded-full bg-[#EDF6FF] px-2.5 py-1 text-[13px] text-[#4281BF] whitespace-nowrap">{attendanceLabel}</span>
                              </div>
                            </div>
                            <div className="flex flex-row items-center gap-2.5 w-full">
                              <div className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
                                  <Mail className="h-4 w-4 text-[#020617]" strokeWidth={2} />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                  <span className="text-[10px] text-gray-700 leading-3">البريد الإلكتروني</span>
                                  <span className="text-[12px] text-gray-700 truncate leading-4">{email}</span>
                                </div>
                              </div>
                              <div className="flex flex-1 max-w-[55%] flex-row items-center gap-2.5 px-3 py-2" style={{ borderRadius: '12px', background: '#FFFF', boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)' }}>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}>
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
                    لا يوجد حضور من جهة الوزير
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Consultations Log Tab - Same as meetingDetail (consultation_answers, 44px sub-items) */}
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
                  const requestDate = row.requested_at ? formatDateTimeArabic(row.requested_at) : '-';
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
                              <div className={`w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] max-h-[60%] ${flatItems.length > 1 ? '-mt-[38px]' : '-mt-[10px]'}`} />
                              <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                            </div>
                          )}
                          <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                            {flatItems.map((item) => {
                              const responseDate = item.respondedAt ? formatDateTimeArabic(item.respondedAt) : '—';
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
                            <div className={`w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%] ${flatItems.length > 1 ? '-mt-[38px]' : '-mt-[10px]'}`} />
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
                    <p className="text-gray-600 text-lg mb-2">سجل الإستشارات</p>
                    <p className="text-gray-500 text-sm">لا توجد استشارات مسجلة</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Consultation Modal */}
          <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
            <DialogContent className="sm:max-w-[650px]" dir="rtl">
              <DialogHeader>
                <DialogTitle
                  className="text-right"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  إضافة الاستشارة
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <Textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="إضافة الاستشارة..."
                  className="min-h-[200px] resize-none"
                  dir="rtl"
                />

                {/* Toggle for scheduling suitability */}
                <div className="flex flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span
                    className="text-sm font-medium text-gray-900 text-right"
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
                      onClick={() => setIsSuitableForScheduling(!isSuitableForScheduling)}
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

              <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
              <button
                  type="button"
                  onClick={() => setIsConsultationModalOpen(false)}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                  disabled={submitMutation.isPending}
                >
                  إلغاء
                </button>
              <div className="flex flex-row justify-between items-center gap-2">
              

                <button
                  type="button"
                  onClick={()=>handleSubmitConsultation('draft')}
                  disabled={submitMutation.isPending || !consultationNotes.trim() || !consultationId}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  {submitMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={()=>handleSubmitConsultation('submit')}
                  disabled={submitMutation.isPending || !consultationNotes.trim() || !consultationId}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
                </button>
               
                </div>
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
                  مسودات الاستشارات
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                {isLoadingConsultationRecordsWithDrafts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : draftsRecords.length > 0 ? (
                  draftsRecords.map((draft) => {
                    const draftAnswer = draft.consultation_answers?.find((a) => a.is_draft) ?? draft.consultation_answers?.[0];
                    const answerText = draftAnswer?.consultation_answer ?? draft.consultation_answer ?? '';
                    const draftId = draft.id || draft.consultation_id;
                    const draftQuestion = draft.question || draft.consultation_question;
                    return (
                      <div
                        key={draftId}
                        className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-row items-center justify-between">
                            <span
                              className="text-sm font-medium text-gray-700 text-right"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              سؤال الاستشارة:
                            </span>
                            <span
                              className="text-xs text-gray-500"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {formatDateArabic(draft.requested_at)}
                            </span>
                          </div>
                          <p
                            className="text-sm text-gray-900 text-right"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                            {draftQuestion}
                          </p>
                        </div>

                        {answerText && (
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
                              {answerText}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-row justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(draftId!)}
                            disabled={publishDraftMutation.isPending}
                            className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                            {publishDraftMutation.isPending ? 'جاري النشر...' : 'نشر'}
                          </button>
                        </div>
                      </div>
                    );
                  })
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
    </div>
  );
};

export default ContentConsultationRequestDetail;
