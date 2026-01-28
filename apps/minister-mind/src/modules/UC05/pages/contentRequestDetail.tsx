import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Send, Eye, Download, RotateCcw, Upload, ClipboardCheck } from 'lucide-react';
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
  getInviteeResponseStatusLabel,
} from '@shared/types';
import {
  getContentRequestById,
  submitContentReturn,
  submitContentConsultation,
  completeContentConsultation,
  getContentConsultants,
  approveContent,
  type Attachment,
  type ConsultantUser,
} from '../data/contentApi';
import { getConsultationRecords, type ConsultationRecord } from '../../UC02/data/meetingsApi';
import {
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';

// Get status label with support for custom statuses
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  // Handle custom statuses
  if (status === 'UNDER_CONTENT_REVIEW') {
    return 'قيد مراجعة المحتوى';
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
      if (typeof v.text === 'string') return v.text;
      if (typeof v.note === 'string') return v.note;
      if (typeof v.content === 'string') return v.content;
      if (typeof v.value === 'string') return v.value;
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

const ContentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [guidanceNotes, setGuidanceNotes] = useState<string>('');
  const [executiveSummaryFile, setExecutiveSummaryFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  const [consultantSearch, setConsultantSearch] = useState<string>('');

  // Fetch content request data from API
  const { data: contentRequest, isLoading, error } = useQuery({
    queryKey: ['content-request', id],
    queryFn: () => getContentRequestById(id!),
    enabled: !!id,
  });

  // Fetch consultation records (سجلات التوجيهات)
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!, false),
    enabled: !!id && activeTab === 'directives-log',
  });

  // Fetch consultation records with drafts for drafts modal
  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ['consultation-records-with-drafts', id],
    queryFn: () => getConsultationRecords(id!, true),
    enabled: !!id,
  });

  const draftsRecords = consultationRecordsWithDrafts?.items?.filter((item) => !!item.is_draft) || [];

  const queryClient = useQueryClient();

  // Consultants query for async select
  const {
    data: consultantsResponse,
    isLoading: isLoadingConsultants,
  } = useQuery({
    queryKey: ['content-consultants', consultantSearch],
    queryFn: () =>
      getContentConsultants({
        search: consultantSearch || '',
        role_code: 'CONTENT_CONSULTANT',
        user_code: '',
        skip: 0,
        limit: 50,
      }),
    enabled: isConsultationModalOpen,
  });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Accept PDF, Word, Excel files (max 20MB)
      const file = droppedFiles[0];
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (file.size > maxSize) {
        // TODO: Show error toast
        console.error('File size exceeds 20MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        // TODO: Show error toast
        console.error('File type not allowed');
        return;
      }

      setExecutiveSummaryFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (selectedFile.size > maxSize) {
        // TODO: Show error toast
        console.error('File size exceeds 20MB');
        return;
      }

      if (!allowedTypes.includes(selectedFile.type)) {
        // TODO: Show error toast
        console.error('File type not allowed');
        return;
      }

      setExecutiveSummaryFile(selectedFile);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setExecutiveSummaryFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Submit return mutation (إعادة للطلب)
  const submitReturnMutation = useMutation({
    mutationFn: (data: { content_notes: string }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return submitContentReturn(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      setReturnNotes('');
      setIsReturnModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting return:', error);
    },
  });

  // Submit consultation mutation (طلب استشارة)
  const submitConsultationMutation = useMutation({
    mutationFn: (data: { consultant_user_id: string; consultation_question: string; is_draft?: boolean }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return submitContentConsultation(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records-with-drafts', id] });
      if (!variables.is_draft) {
        setConsultationNotes('');
        setSelectedConsultantId('');
        setConsultantSearch('');
        setIsConsultationModalOpen(false);
        navigate(PATH.CONTENT_REQUESTS);
      } else {
        setIsConsultationModalOpen(false);
      }
    },
    onError: (error) => {
      console.error('Error submitting consultation:', error);
    },
  });

  // Publish draft mutation
  const publishDraftMutation = useMutation({
    mutationFn: (consultationId: string) => {
      if (!id) throw new Error('Meeting request ID is required');
      return completeContentConsultation(id, consultationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records-with-drafts', id] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records', id] });
      setIsDraftsModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error('Error publishing draft:', error);
    },
  });

  const handlePublishDraft = (consultationId: string) => {
    publishDraftMutation.mutate(consultationId);
  };


  // Send to scheduling officer mutation (إرسال إلى مسؤول الجدولة)
  const sendToSchedulingMutation = useMutation({
    mutationFn: async (data: { file: File; notes?: string }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return approveContent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      setExecutiveSummaryFile(null);
      setGuidanceNotes('');
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error('Error sending to scheduling officer:', error);
    },
  });

  const handleSendToScheduling = () => {
    if (!executiveSummaryFile) {
      // TODO: Show validation error - executive summary file is required
      console.error('Executive summary file is required');
      return;
    }
    sendToSchedulingMutation.mutate({
      file: executiveSummaryFile,
      notes: guidanceNotes.trim() || undefined,
    });
  };

  const handleReturnRequest = () => {
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = () => {
    if (!returnNotes.trim()) {
      // TODO: Show validation error
      return;
    }
    submitReturnMutation.mutate({
      content_notes: returnNotes.trim(),
    });
  };

  const handleRequestConsultation = () => {
    setIsConsultationModalOpen(true);
  };

  const handleSubmitConsultation = (type: 'draft' | 'submit') => {
    if (!consultationNotes.trim()) {
      // TODO: Show validation error
      return;
    }
    if (!selectedConsultantId) {
      // TODO: Show validation error
      return;
    }
    submitConsultationMutation.mutate({
      consultant_user_id: selectedConsultantId,
      consultation_question: consultationNotes.trim(),
      is_draft: type === 'draft',
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
  if (error || !contentRequest) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  // Map status to MeetingStatus enum
  const meetingStatus = (contentRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getStatusLabel(meetingStatus);

  // Filter attachments
  const presentationAttachments = contentRequest?.attachments?.filter(
    (att) => att.is_presentation
  ) || [];
  const additionalAttachments = contentRequest?.attachments?.filter(
    (att) => att.is_additional
  ) || [];

  const tabs = [
    {
      id: 'request-info',
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
      id: 'directives-log',
      label: 'سجلات التوجيهات',
    },
    {
      id: 'invitees',
      label: 'قائمة المدعوين',
    },
  ];

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
                  {contentRequest.meeting_title} ({contentRequest.request_number})
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      رقم الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.request_number ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      حالة الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {statusLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      مقدم الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.submitter_name ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      مالك الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.current_owner_user
                        ? `${contentRequest.current_owner_user.first_name} ${contentRequest.current_owner_user.last_name}`
                        : contentRequest.current_owner_role?.name_ar ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meeting-info' && (
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
                  معلومات الاجتماع
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      هل تطلب الاجتماع نيابة عن غيرك؟
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {(contentRequest as { is_on_behalf_of?: boolean | null }).is_on_behalf_of === true
                        ? 'نعم'
                        : (contentRequest as { is_on_behalf_of?: boolean | null }).is_on_behalf_of === false
                          ? 'لا'
                          : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      مالك الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.current_owner_user
                        ? `${contentRequest.current_owner_user.first_name} ${contentRequest.current_owner_user.last_name}`
                        : contentRequest.current_owner_role?.name_ar ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      عنوان الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.meeting_title || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      وصف الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.meeting_subject || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      القطاع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.sector || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      نوع الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getMeetingTypeLabel(contentRequest.meeting_type) || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      اجتماع عاجل؟
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.is_direct_schedule === true ? 'نعم' : contentRequest.is_direct_schedule === false ? 'لا' : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      السبب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.meeting_justification || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      موعد الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.scheduled_at ? new Date(contentRequest.scheduled_at).toLocaleString('ar-SA') : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      آلية انعقاد الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getMeetingChannelLabel(contentRequest.meeting_channel) || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الموقع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {(contentRequest as { meeting_location?: string | null }).meeting_location || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      هل يتطلب بروتوكول؟
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.requires_protocol === true ? 'نعم' : contentRequest.requires_protocol === false ? 'لا' : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      فئة الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getMeetingClassificationLabel(contentRequest.meeting_classification) || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      مبرّر اللقاء
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.meeting_justification || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      موضوع التكليف المرتبط
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.related_topic || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تاريخ الاستحقاق
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.deadline ? new Date(contentRequest.deadline).toLocaleDateString('ar-SA') : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تصنيف الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getMeetingClassificationTypeLabel(contentRequest.meeting_classification_type) || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      سرية الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getMeetingConfidentialityLabel(contentRequest.meeting_confidentiality) || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      اجتماع متسلسل؟
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.is_sequential === true ? 'نعم' : contentRequest.is_sequential === false ? 'لا' : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الاجتماع السابق
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.previous_meeting_id || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      الرقم التسلسلي
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.sequential_number ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      أجندة الاجتماع
                    </label>
                    <div className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.agenda_items && contentRequest.agenda_items.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {contentRequest.agenda_items.map((item) => (
                            <li key={item.id}>{item.agenda_item}</li>
                          ))}
                        </ul>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      هل طلب الاجتماع بناءً على توجيه من معالي الوزير
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.related_directive_ids && contentRequest.related_directive_ids.length > 0 ? 'نعم' : 'لا'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      طريقة التوجيه
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {(contentRequest as { directive_method?: string | null }).directive_method || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      محضر الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {(contentRequest as { meeting_minutes?: string | null }).meeting_minutes || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      التوجيه
                    </label>
                    <p className="text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {contentRequest.related_guidance || '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      ملاحظات
                    </label>
                    <p className="text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes)}
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

                {/* العرض التقديمي */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                              <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {att.file_name}
                              </span>
                              <span className="text-xs text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                    <p className="text-base text-gray-500 text-right py-2" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      لا يوجد عرض تقديمي
                    </p>
                  )}
                </div>

                {/* متى سيتم إرفاق العرض؟ */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    متى سيتم إرفاق العرض؟
                  </label>
                  <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    -
                  </p>
                </div>

                {/* مرفقات اختيارية */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                              <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                {att.file_name}
                              </span>
                              <span className="text-xs text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                    <p className="text-base text-gray-500 text-right py-2" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      لا توجد مرفقات اختيارية
                    </p>
                  )}
                </div>

                {/* ملاحظات */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    ملاحظات
                  </label>
                  <p className="text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    {getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                {contentRequest.invitees && contentRequest.invitees.length > 0 ? (
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
                              <span
                                className="text-sm text-[#475467] text-right block truncate"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
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
                              <span
                                className="text-sm text-[#475467] text-right block truncate"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
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
                            id: 'response_status',
                            header: 'الحالة',
                            width: 'min-w-[6rem] flex-shrink-0',
                            align: 'center',
                            render: (row: any) => (
                              <span
                                className="text-sm text-[#475467] whitespace-nowrap"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
                                {getInviteeResponseStatusLabel(row.response_status)}
                              </span>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={contentRequest.invitees}
                      />
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-base text-gray-500 text-right py-4"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    لا توجد قائمة مدعوين من مقدّم الطلب
                  </p>
                )}
              </div>

              {/* قائمة المدعوين (الوزير) */}
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
                  قائمة المدعوين (الوزير)
                </h2>
                {contentRequest.minister_attendees && contentRequest.minister_attendees.length > 0 ? (
                  <div className="w-full overflow-x-auto table-scroll">
                    <div className="min-w-[1085px]">
                      <DataTable
                        columns={[
                          {
                            id: 'index',
                            header: 'رقم البند',
                            width: 'w-[114px]',
                            align: 'center',
                            render: (_row: any, index: number) => (
                              <span className="text-sm text-[#475467]">{index + 1}</span>
                            ),
                          },
                          {
                            id: 'name',
                            header: 'اسم المستخدم',
                            width: 'w-[227px]',
                            align: 'end',
                            render: (row: any) => (
                              <span
                                className="text-sm text-[#475467] text-right"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
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
                              <span
                                className="text-sm text-[#475467] text-right"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
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
                              <span
                                className="text-sm text-[#475467]"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
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
                              <span
                                className="text-sm text-[#475467] text-right"
                                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                              >
                                {row.justification || '-'}
                              </span>
                            ),
                          },
                        ] as TableColumn<any>[]}
                        data={contentRequest.minister_attendees}
                      />
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-base text-gray-500 text-right py-4"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    لا توجد قائمة مدعوين من جهة الوزير
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'directives-log' && (
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
                      header: 'نوع التوجيه',
                      width: 'w-44',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.consultation_type === 'SCHEDULING'
                            ? 'جدولة'
                            : row.consultation_type === 'CONTENT'
                              ? 'محتوى'
                              : row.consultation_type}
                        </span>
                      ),
                    },
                    {
                      id: 'consultation_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700 line-clamp-2"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.consultation_question || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'consultation_answer',
                      header: 'الإجابة',
                      width: 'flex-1',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700 line-clamp-2"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.consultation_answer || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'consultant_name',
                      header: 'رد بواسطة',
                      width: 'w-48',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.consultant_name || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_at',
                      header: 'تاريخ الطلب',
                      width: 'w-40',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.requested_at
                            ? new Date(row.requested_at).toLocaleDateString('ar-SA')
                            : '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'responded_at',
                      header: 'تاريخ الرد',
                      width: 'w-40',
                      render: (row: ConsultationRecord) => (
                        <span
                          className="text-sm text-gray-700"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {row.responded_at
                            ? new Date(row.responded_at).toLocaleDateString('ar-SA')
                            : '-'}
                        </span>
                      ),
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
                          DRAFT: 'مسودة',
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
                    <p className="text-gray-600 text-lg mb-2">سجلات التوجيهات</p>
                    <p className="text-gray-500 text-sm">لا توجد سجلات</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Content (outside tabs) */}
         {activeTab === 'request-info' && <div className="flex flex-col gap-6">
            {/* Guidance Section */}
            <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto bg-white border border-[#E6E6E6] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                إضافة التوجيهات
              </h3>
              <Textarea
                value={guidanceNotes}
                onChange={(e) => setGuidanceNotes(e.target.value)}
                placeholder="أدخل محتوى التوجيهات...."
                className="min-h-[200px] resize-none"
                dir="rtl"
              />
            </div>

            {/* Executive Summary Upload Section */}
            <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto bg-white border border-[#E6E6E6] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                الملخص التنفيذي
              </h3>

              {/* File Upload Area */}
              <div
                onDragOver={!sendToSchedulingMutation.isPending ? handleDragOver : undefined}
                onDragLeave={!sendToSchedulingMutation.isPending ? handleDragLeave : undefined}
                onDrop={!sendToSchedulingMutation.isPending ? handleDrop : undefined}
                onClick={!sendToSchedulingMutation.isPending && !executiveSummaryFile ? () => fileInputRef.current?.click() : undefined}
                className={`
                  relative border-2 border-dashed rounded-[12px] p-12 text-center transition-colors
                  ${isDragging && !sendToSchedulingMutation.isPending ? 'border-[#048F86] bg-[#048F86]/5' : 'border-[#D1D5DB] bg-[#F9FAFB]'}
                  ${executiveSummaryFile ? 'border-[#048F86] bg-[#048F86]/5' : ''}
                  ${sendToSchedulingMutation.isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  disabled={sendToSchedulingMutation.isPending}
                  className="hidden"
                />

                {executiveSummaryFile ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[#009883] rounded-[12px]">
                      {executiveSummaryFile.type === 'application/pdf' ? (
                        <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                          {executiveSummaryFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                      )}
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {executiveSummaryFile.name}
                        </span>
                        <span className="text-xs text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {formatFileSize(executiveSummaryFile.size)}
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        disabled={sendToSchedulingMutation.isPending}
                        className="ml-4 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-base text-[#1A1A1A] mb-2" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      اضغط للرفع أو اسحب الملف هنا
                    </p>
                    <p className="text-sm text-[#666666]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      PDF, WORD, EXCEL (max. 20MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>}
        </div>
      </div>

      {/* Sticky Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full  px-4">
        <div className="mx-auto bg-white/60 backdrop-blur-md rounded-full p-2.5 shadow-lg border border-gray-200 flex justify-center">
          <div className="flex flex-row items-center gap-1.5 justify-center flex-wrap">
            {/* Send to Scheduling Officer Button */}
            <button
              onClick={handleSendToScheduling}
              disabled={sendToSchedulingMutation.isPending || !executiveSummaryFile}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                إرسال إلى مسؤول الجدولة
              </span>
              <Send className="w-5 h-5" />
            </button>

            {/* Return Request Button */}
            <button
              onClick={handleReturnRequest}
              disabled={submitReturnMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                إعادة للطلب
              </span>
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Drafts Button */}
            {draftsRecords && draftsRecords.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(true)}
                className="flex items-center justify-center px-4 py-2 bg-[#F2F4F7] text-[#344054] rounded-full border-2 border-[#D0D5DD] transition-opacity hover:bg-gray-100 cursor-pointer"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                مسودات ({draftsRecords.length})
              </button>
            )}

            {/* Request Consultation Button */}
            <button
              onClick={handleRequestConsultation}
              disabled={submitConsultationMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                طلب استشارة
              </span>
              <ClipboardCheck className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              إعادة الطلب لمقدم الطلب
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                الملاحظات *
              </label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="أدخل الملاحظات...."
                className="min-h-[150px] resize-none"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              onClick={handleSubmitReturn}
              disabled={submitReturnMutation.isPending || !returnNotes.trim()}
              className="px-4 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              {submitReturnMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
            <button
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submitReturnMutation.isPending}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Request Modal */}
      <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              طلب استشارة جدولة
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Consultant Select */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                المستشار *
              </label>
              <Select
                value={selectedConsultantId}
                onValueChange={setSelectedConsultantId}
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
                      value={consultantSearch}
                      onChange={(e) => setConsultantSearch(e.target.value)}
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

            {/* Notes Textarea */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                الملاحظات *
              </label>
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="أدخل الملاحظات...."
                className="min-h-[150px] resize-none"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
            <button
              type="button"
              onClick={() => setIsConsultationModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              disabled={submitConsultationMutation.isPending}
            >
              إلغاء
            </button>
            <div className="flex flex-row justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitConsultation('draft')}
                disabled={submitConsultationMutation.isPending || !consultationNotes.trim() || !selectedConsultantId}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {submitConsultationMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitConsultation('submit')}
                disabled={submitConsultationMutation.isPending || !consultationNotes.trim() || !selectedConsultantId}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                {submitConsultationMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
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
            ) : consultationRecordsWithDrafts && consultationRecordsWithDrafts.items.filter((item) => item.status === 'DRAFT' || !item.responded_at).length > 0 ? (
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
  );
};

export default ContentRequestDetail;
