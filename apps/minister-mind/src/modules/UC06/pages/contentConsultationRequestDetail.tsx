import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Eye, Download } from 'lucide-react';
import { Tabs, StatusBadge, DataTable } from '@shared/components';
import type { TableColumn } from '@shared';
import {
  MeetingStatus,
  MeetingStatusLabels,
  getMeetingTypeLabel,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
  getDirectiveMethodLabel,
  getInviteeResponseStatusLabel,
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

const ContentConsultationRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [activeSubTab, setActiveSubTab] = useState<string>('presentation');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(true);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);

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

  const draftsRecords = consultationRecordsWithDrafts?.items?.filter((item) => !!item.is_draft);

  const queryClient = useQueryClient();

  const meetingRequest = consultationData?.meeting_request;
  const consultationQuestion = consultationData?.consultation_question || '';
  // Use consultation_id from response, or fallback to meeting request id from URL
  const consultationId = consultationData?.consultation_id || id;

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
    mutationFn: (data: { feasibility_answer: boolean; consultation_notes: string; is_draft: boolean }) => {
      if (!consultationId) throw new Error('Consultation ID is required');
      return submitConsultation(consultationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-consultation-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-consultation-requests'] });
      setConsultationNotes('');
      setIsSuitableForScheduling(true);
      setIsConsultationModalOpen(false);

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
      consultation_notes: consultationNotes.trim(),
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
      <div className="flex-1 overflow-y-auto p-6 pb-32">
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
                  {meetingRequest.meeting_title} ({meetingRequest.request_number})
                </h1>
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-start w-fit">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <div className="flex flex-row items-center justify-between gap-4">
                
                  <h2
                    className="text-xl font-bold text-right text-[#101828]"
                    style={{
                      fontFamily: "'Ping AR + LT', sans-serif",
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
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    إضافة الاستشارة
                  </button>
                  
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      رقم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      {meetingRequest.request_number ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      حالة الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      {statusLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      مقدم الطلب
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      {meetingRequest.submitter_name ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      مالك الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <h2
                  className="text-xl font-bold text-right text-[#101828]"
                  style={{
                    fontFamily: "'Ping AR + LT', sans-serif",
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
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
                                {att.file_name}
                              </span>
                              <span
                                className="text-xs text-[#475467] text-right"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                  onClick={() => window.open(att.blob_url, '_blank')}
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
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      لا يوجد عرض تقديمي
                    </p>
                  )}
                </div>

                {/* متى سيتم إرفاق العرض؟ */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    متى سيتم إرفاق العرض؟
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    {(meetingRequest as { presentation_attachment_timing?: string | null })?.presentation_attachment_timing ?? '-'}
                  </p>
                </div>

                {/* مرفقات اختيارية - same UI as in المرفقات tab */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
                                {att.file_name}
                              </span>
                              <span
                                className="text-xs text-[#475467] text-right"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                  onClick={() => window.open(att.blob_url, '_blank')}
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
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      لا توجد مرفقات اختيارية
                    </p>
                  )}
                </div>

                {/* ملاحظات */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    ملاحظات
                  </label>
                  <p
                    className="text-base text-gray-900 text-right whitespace-pre-wrap"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    {meetingRequest.general_notes || meetingRequest.content_officer_notes || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="flex flex-col gap-6">
              {/* Sub-tabs for attachments */}
              <div className="flex flex-row gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveSubTab('presentation')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSubTab === 'presentation'
                      ? 'text-[#009883] border-b-2 border-[#009883]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    {additionalAttachments.length} مرفقات إضافية
                  </button>
                )}
              </div>

              {/* Attachment Display */}
              <div className="flex flex-col gap-4">
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
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              {att.file_name}
                            </span>
                            <span
                              className="text-xs text-[#475467] text-right"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                onClick={() => window.open(att.blob_url, '_blank')}
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
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              {att.file_name}
                            </span>
                            <span
                              className="text-xs text-[#475467] text-right"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                                onClick={() => window.open(att.blob_url, '_blank')}
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  ملاحظات مسؤول المحتوى
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px]">
                  <p
                    className="text-sm text-gray-700 text-right whitespace-pre-wrap"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    {meetingRequest.content_officer_notes || 'لا توجد ملاحظات'}
                  </p>
                </div>
              </div>

              {/* Consultation Question */}
              {consultationQuestion && (
                <div className="flex flex-col gap-4">
                  <h3
                    className="text-lg font-semibold text-gray-900 text-right"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    سؤال الاستشارة
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p
                      className="text-sm text-gray-700 text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
              {/* Basic Information Section - all fields */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  المعلومات الأساسية
                </h3>
                <div className="flex flex-col gap-4">
                  {/* هل تطلب الاجتماع نيابة عن غيرك؟ / مالك الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        هل تطلب الاجتماع نيابة عن غيرك؟
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.is_on_behalf_of === true ? 'نعم' : meetingRequest.is_on_behalf_of === false ? 'لا' : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        مالك الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.current_owner_user
                          ? `${meetingRequest.current_owner_user.first_name} ${meetingRequest.current_owner_user.last_name}`
                          : meetingRequest.current_owner_role?.name_ar ?? '-'}
                      </p>
                    </div>
                  </div>
                  {/* عنوان الاجتماع / وصف الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        عنوان الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.meeting_title || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        وصف الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.meeting_subject || '-'}
                      </p>
                  </div>
                  </div>
                  {/* القطاع / نوع الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        القطاع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.sector || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        نوع الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {getMeetingTypeLabel(meetingRequest.meeting_type) || '-'}
                      </p>
                    </div>
                  </div>
                  {/* اجتماع عاجل؟ / السبب */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        اجتماع عاجل؟
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.is_direct_schedule === true ? 'نعم' : meetingRequest.is_direct_schedule === false ? 'لا' : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        السبب
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.meeting_justification || '-'}
                      </p>
                    </div>
                  </div>
                  {/* موعد الاجتماع / آلية انعقاد الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        موعد الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.scheduled_at ? new Date(meetingRequest.scheduled_at).toLocaleString('ar-SA') : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        آلية انعقاد الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {getMeetingChannelLabel(meetingRequest.meeting_channel) || '-'}
                      </p>
                    </div>
                  </div>
                  {/* الموقع / هل يتطلب بروتوكول؟ */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        الموقع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        -
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        هل يتطلب بروتوكول؟
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.requires_protocol === true ? 'نعم' : meetingRequest.requires_protocol === false ? 'لا' : '-'}
                      </p>
                    </div>
                  </div>
                  {/* فئة الاجتماع / مبرّر اللقاء */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        فئة الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {getMeetingClassificationTypeLabel(meetingRequest.meeting_classification_type) || getMeetingClassificationLabel(meetingRequest.meeting_classification) || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        مبرّر اللقاء
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.meeting_justification || '-'}
                      </p>
                    </div>
                  </div>
                  {/* موضوع التكليف المرتبط / تاريخ الاستحقاق */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        موضوع التكليف المرتبط
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.related_topic || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        تاريخ الاستحقاق
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.deadline ? new Date(meetingRequest.deadline).toLocaleDateString('ar-SA') : '-'}
                      </p>
                    </div>
                  </div>
                  {/* تصنيف الاجتماع / سريّة الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        تصنيف الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {getMeetingClassificationLabel(meetingRequest.meeting_classification) || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        سريّة الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {getMeetingConfidentialityLabel(meetingRequest.meeting_confidentiality) || '-'}
                      </p>
                    </div>
                  </div>
                  {/* اجتماع متسلسل؟ / الاجتماع السابق */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        اجتماع متسلسل؟
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.is_sequential === true ? 'نعم' : meetingRequest.is_sequential === false ? 'لا' : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        الاجتماع السابق
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.previous_meeting_id || '-'}
                      </p>
                    </div>
                  </div>
                  {/* الرقم التسلسلي / أجندة الاجتماع */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        الرقم التسلسلي
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.sequential_number != null ? String(meetingRequest.sequential_number) : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        أجندة الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.agenda_items && meetingRequest.agenda_items.length > 0
                          ? `${meetingRequest.agenda_items.length} بند`
                          : '-'}
                      </p>
                    </div>
                  </div>
                  {/* هل طلب الاجتماع بناءً على توجيه من معالي الوزير / طريقة التوجيه */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        هل طلب الاجتماع بناءً على توجيه من معالي الوزير
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0 ? 'نعم' : 'لا'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        طريقة التوجيه
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0 ? getDirectiveMethodLabel('DIRECT_DIRECTIVE') : '-'}
                      </p>
                    </div>
                  </div>
                  {/* محضر الاجتماع / التوجيه */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        محضر الاجتماع
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        -
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        التوجيه
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.related_guidance || '-'}
                      </p>
                    </div>
                  </div>
                  {/* ملاحظات */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        ملاحظات
                      </label>
                      <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {meetingRequest.general_notes || meetingRequest.content_officer_notes || '-'}
                      </p>
                    </div>
                    <div className="flex-1" />
                  </div>
                </div>
              </div>

              {/* Content Section - Objectives and Agenda Items */}
              <div className="flex flex-row items-start gap-[26px] w-full" dir="rtl">
                {/* Objectives Card */}
                <div className="flex flex-col items-start p-[4.4px] gap-[8.79px] w-[530px] min-h-[115px] bg-white rounded-[11.36px] shadow-[0px_2.52px_14px_rgba(58,168,124,0.14)]">
                  <div className="flex flex-col items-start p-0 gap-[6.15px] w-full min-h-[106px]">
                    <div className="relative w-full min-h-[106px] bg-white rounded-[8.2px] overflow-hidden">
                      {/* Background Blur Effect */}
                      <div
                        className="absolute rounded-full bg-[#A6D8C1]"
                        style={{
                          width: '227.75px',
                          height: '213.87px',
                          left: '-41.02px',
                          top: '4.66px',
                          filter: 'blur(63.26px)',
                          transform: 'rotate(-90deg)',
                        }}
                      />
                      {/* Content */}
                      <div className="relative flex flex-col items-end p-4 gap-[21px] w-full min-h-[85px]">
                        <div className="flex flex-col items-start p-0 gap-[4px] w-full">
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
                          <div className="w-full text-right max-h-[200px] overflow-y-auto">
                            {meetingRequest.objectives && meetingRequest.objectives.length > 0 ? (
                              <ul className="list-none p-0 m-0 space-y-1">
                                {meetingRequest.objectives.map((obj) => (
                                  <li key={obj.id} className="flex items-center gap-2">
                                    <span className="text-[#2C2C2C] text-base leading-[26px]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                      •
                                    </span>
                                    <span className="flex-1 text-[#2C2C2C] text-base leading-[26px]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                      {obj.objective}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p
                                className="text-[#2C2C2C] text-base leading-[26px]"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
                                لا توجد أهداف
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agenda Items Card */}
                <div className="flex flex-col items-start p-[4.4px] gap-[8.79px] w-[529px] min-h-[115px] bg-white rounded-[11.36px] shadow-[0px_2.52px_14px_rgba(58,168,124,0.14)]">
                  <div className="flex flex-col items-start p-0 gap-[6.15px] w-full min-h-[106px]">
                    <div className="relative w-full min-h-[106px] bg-white rounded-[8.2px] overflow-hidden">
                      {/* Background Blur Effect */}
                      <div
                        className="absolute rounded-full bg-[#A6D8C1]"
                        style={{
                          width: '227.75px',
                          height: '213.87px',
                          left: '-41.02px',
                          top: '4.66px',
                          filter: 'blur(63.26px)',
                          transform: 'rotate(-90deg)',
                        }}
                      />
                      {/* Content */}
                      <div className="relative flex flex-col items-end p-4 gap-[21px] w-full min-h-[85px]">
                        <div className="flex flex-col items-start p-0 gap-[4px] w-full">
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
                          <div className="w-full text-right max-h-[300px] overflow-y-auto">
                            {meetingRequest.agenda_items && meetingRequest.agenda_items.length > 0 ? (
                              <div className="flex flex-col gap-3">
                                {meetingRequest.agenda_items.map((item, index) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#048F86] text-white text-xs font-semibold flex-shrink-0 mt-1">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1 flex flex-col gap-2">
                                        <p
                                          className="text-[#2C2C2C] text-base leading-[26px]"
                                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                        >
                                          {item.agenda_item}
                                        </p>
                                        {item.presentation_duration_minutes && (
                                          <span className="text-[#475467] text-sm font-medium" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                            المدة: {item.presentation_duration_minutes} دقيقة
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling Section - Invitees and Minister Attendees */}

              {/* Additional Information Section */}
              <div className="flex flex-col gap-6 w-full">
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
                  معلومات إضافية
                        </h2>
                <div className="flex flex-col gap-4">
                  {meetingRequest.meeting_justification && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        مبرر الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_justification}
                      </p>
                      </div>
                  )}
                  {meetingRequest.related_topic && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        الموضوع المرتبط
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_topic}
                      </p>
                    </div>
                  )}
                  {meetingRequest.general_notes && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        ملاحظات عامة
                      </label>
                      <p
                        className="text-base text-gray-700 text-right whitespace-pre-wrap leading-relaxed"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.general_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invitees Tab - قائمة المدعوين */}
          {activeTab === 'invitees' && (
            <div className="flex flex-col gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
              {/* قائمة المدعوين (مقدّم الطلب) */}
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
                  قائمة المدعوين (مقدّم الطلب)
                </h2>
                {meetingRequest.invitees && meetingRequest.invitees.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                    <div className="w-full min-w-0">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: 'رقم البند',
                            width: 'min-w-[8rem] flex-shrink-0',
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
                            width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                              <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                    {row.external_name || row.user_id || '--------------'}
                                  </span>
                                ),
                              },
                              {
                                id: 'email',
                                header: 'البريد الإلكتروني',
                            width: 'min-w-0 flex-1',
                                align: 'end',
                                render: (row: any) => (
                              <span className="text-sm text-[#475467] text-right block truncate" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                    {row.external_email || '--------------'}
                                  </span>
                                ),
                              },
                              {
                                id: 'is_required',
                                header: 'الحضور أساسي',
                            width: 'min-w-[11rem] flex-shrink-0',
                                align: 'center',
                                render: (row: any) => (
                                  <div className="flex items-center justify-center gap-2 w-full">
                                    <span className="text-sm text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                      {row.is_required ? 'نعم' : 'لا'}
                                    </span>
                                  </div>
                                ),
                              },
                              {
                                id: 'response_status',
                                header: 'الحالة',
                            width: 'min-w-[6rem] flex-shrink-0',
                                align: 'center',
                                render: (row: any) => (
                              <span className="text-sm text-[#475467] whitespace-nowrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {getInviteeResponseStatusLabel(row.response_status)}
                                  </span>
                                ),
                              },
                            ] as TableColumn<any>[]}
                            data={meetingRequest.invitees}
                          />
                        </div>
                      </div>
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    لا توجد قائمة مدعوين من مقدّم الطلب
                  </p>
                  )}
              </div>

              {/* الحضور من جهة الوزير */}
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
                {(meetingRequest as { minister_attendees?: any[] }).minister_attendees &&
                (meetingRequest as { minister_attendees?: any[] }).minister_attendees!.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                        <div className="min-w-[1085px]">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: 'رقم البند',
                                width: 'w-[114px]',
                                align: 'center',
                                render: (_row: any, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                              },
                              {
                            id: 'name',
                            header: 'اسم المستخدم',
                            width: 'w-[227px]',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {row.external_name || row.user_id || '--------------'}
                              </span>
                            ),
                          },
                          {
                            id: 'email',
                            header: 'البريد الإلكتروني الخارجي',
                            width: 'w-[227px]',
                            align: 'end',
                            render: (row: any) => (
                              <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {row.external_email || '--------------'}
                              </span>
                            ),
                          },
                          {
                            id: 'is_required',
                            header: 'الحضور أساسي',
                            width: 'w-[136px]',
                            align: 'center',
                            render: (row: any) => (
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className="text-sm text-[#667085]"
                                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                                >
                                  {row.is_required ? 'نعم' : 'لا'}
                                </span>
                              </div>
                            ),
                          },
                          {
                            id: 'access_permission',
                            header: 'صلاحية الوصول',
                            width: 'w-[165px]',
                            align: 'center',
                            render: (row: any) => (
                              <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {row.access_permission || '-'}
                              </span>
                            ),
                          },
                          {
                            id: 'justification',
                            header: 'المبرر',
                            width: 'w-[300px]',
                            align: 'end',
                            render: (row: any) => (
                              <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {row.justification || '-'}
                                  </span>
                                ),
                              },
                            ] as TableColumn<any>[]}
                        data={(meetingRequest as { minister_attendees?: any[] }).minister_attendees!}
                          />
                        </div>
                      </div>
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    لا يوجد حضور من جهة الوزير
                  </p>
                )}
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
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultation_type === 'SCHEDULING' ? 'جدولة' : row.consultation_type === 'CONTENT' ? 'محتوى' : row.consultation_type}
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
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span className="text-sm text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.consultant_name}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_at',
                      header: 'تاريخ الطلب',
                      width: 'flex-1',
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
                      width: 'flex-1',
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
                      width: 'flex-1',
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

          {/* Add Consultation Modal */}
          <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
            <DialogContent className="sm:max-w-[650px]" dir="rtl">
              <DialogHeader>
                <DialogTitle
                  className="text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    هل الطلب مناسب للجدولة؟
                  </span>
                  <div className="flex flex-row items-center gap-3">
                    <span
                      className="text-base text-[#667085]"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  {submitMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={()=>handleSubmitConsultation('submit')}
                  disabled={submitMutation.isPending || !consultationNotes.trim() || !consultationId}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  مسودات الاستشارات
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                {isLoadingConsultationRecordsWithDrafts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : consultationRecordsWithDrafts && consultationRecordsWithDrafts.items.length > 0 ? (
                  consultationRecordsWithDrafts.items
                    .filter((item) => item.status === 'DRAFT' || !item.responded_at)
                    .map((draft) => (
                      <div
                        key={draft.consultation_id}
                        className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-row items-center justify-between">
                            <span
                              className="text-sm font-medium text-gray-700 text-right"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              سؤال الاستشارة:
                            </span>
                            <span
                              className="text-xs text-gray-500"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              {new Date(draft.requested_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <p
                            className="text-sm text-gray-900 text-right"
                            style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                          >
                            {draft.consultation_question}
                          </p>
                        </div>

                        {draft.consultation_answer && (
                          <div className="flex flex-col gap-2">
                            <span
                              className="text-sm font-medium text-gray-700 text-right"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              الإجابة:
                            </span>
                            <p
                              className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200"
                              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                            >
                              {draft.consultation_answer}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-row justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(draft.consultation_id)}
                            disabled={publishDraftMutation.isPending}
                            className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  إغلاق
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ContentConsultationRequestDetail;
