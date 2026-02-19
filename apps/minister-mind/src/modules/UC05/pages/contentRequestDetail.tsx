import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronUp, ChevronDown, Send, Eye, Download, RotateCcw, Upload, ClipboardCheck, MessageSquare, Clock, User, Mail, Phone, Trash2, Hash, Building2, FileCheck, Scale, Sparkles, Loader2, AlertCircle, Check, FileText } from 'lucide-react';
import { Tabs, StatusBadge, MeetingActionsBar } from '@shared/components';
import {
  MeetingStatus,
  MeetingStatusLabels,
  SectorLabels,
  getMeetingTypeLabel,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
} from '@shared/types';
import {
  getContentRequestById,
  submitContentReturn,
  submitContentConsultation,
  completeContentConsultation,
  getContentConsultants,
  approveContent,
  analyzeContradictions,
  getAttachmentInsightsWithPolling,
  runCompareByAttachment,
  type Attachment,
  type ConsultantUser,
  type AnalyzeResponse,
  type AttachmentInsightsResponse,
  type ComparePresentationsResponse,
} from '../data/contentApi';
import { getConsultationRecords, type ConsultationRecord } from '../../UC02/data/meetingsApi';

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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
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

/** Translate known compare-presentations API error detail to Arabic */
function translateCompareErrorDetail(detail: string | null): string | null {
  if (!detail || typeof detail !== 'string') return detail;
  const trimmed = detail.trim();
  if (trimmed.includes('Need at least two presentation attachments with completed extraction')) {
    return 'يجب وجود عرضين تقديميين على الأقل مع اكتمال استخراج المحتوى للمقارنة. تأكد من وجود العرضين في النظام واكتمال الاستخراج، أو قدّم النسخة الأصلية والنسخة الجديدة.';
  }
  return detail;
}

/** Translate comparison API enum-like values to Arabic for display */
const COMPARE_STATUS: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'قيد المعالجة',
};
const COMPARE_LEVEL: Record<string, string> = {
  minor: 'طفيف',
  moderate: 'متوسط',
  major: 'كبير',
};
const COMPARE_RECOMMENDATION: Record<string, string> = {
  review: 'مراجعة',
};
const COMPARE_CONFIDENCE_IMPACT: Record<string, string> = {
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};
const COMPARE_COHERENCE: Record<string, string> = {
  good: 'جيد',
  needs_improvement: 'يحتاج تحسين',
};
function translateCompareValue(
  value: string | undefined | null,
  map: Record<string, string>
): string {
  if (value == null || value === '') return '—';
  const v = String(value).toLowerCase();
  return map[v] ?? value;
}

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
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [analyzingRecordId, setAnalyzingRecordId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  const [consultantSearch, setConsultantSearch] = useState<string>('');

  // LLM notes/insights modal for presentation attachment
  const [insightsModalAttachment, setInsightsModalAttachment] = useState<{ id: string; file_name: string } | null>(null);

  // Compare presentations modal (تقييم الاختلاف بين العروض)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareErrorDetail, setCompareErrorDetail] = useState<string | null>(null);

  const insightsAbortControllerRef = useRef<AbortController | null>(null);

  // Actions bar (FAB) open state – same pattern as meeting detail
  const [actionsBarOpen, setActionsBarOpen] = useState(false);

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

  const draftsRecords =
    consultationRecordsWithDrafts?.items?.filter(
      (item) =>
        item.is_draft ||
        (!item.consultation_answers?.length && !item.assignees?.some(a => a.answers?.length)) ||
        item.consultation_answers?.some((a) => a.is_draft)
    ) || [];

  const queryClient = useQueryClient();

  const insightsMutation = useMutation({
    mutationFn: ({ attachmentId, signal }: { attachmentId: string; signal?: AbortSignal }) =>
      getAttachmentInsightsWithPolling(attachmentId, { signal }),
    onError: () => {},
  });

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

  const analyzeContradictionsMutation = useMutation({
    mutationFn: (sentences: string[]) => analyzeContradictions(sentences),
    onSuccess: (data) => {
      setAnalyzeResult(data);
      setIsAnalyzeModalOpen(true);
      setAnalyzingRecordId(null);
    },
    onError: (error) => {
      console.error('Error analyzing contradictions:', error);
      setAnalyzeResult(null);
      setIsAnalyzeModalOpen(true);
      setAnalyzingRecordId(null);
    },
  });

  const compareByAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => runCompareByAttachment(attachmentId),
    onSuccess: (data) => {
      setCompareResult(data);
      setCompareErrorDetail(null);
      setIsCompareModalOpen(true);
    },
    onError: (error: unknown) => {
      console.error('Error comparing presentations:', error);
      setCompareResult(null);
      const err = error as { response?: { data?: { detail?: string } }; detail?: string };
      const detail =
        typeof err?.response?.data?.detail === 'string'
          ? err.response.data.detail
          : typeof err?.detail === 'string'
            ? err.detail
            : null;
      setCompareErrorDetail(detail);
      setIsCompareModalOpen(true);
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
    navigate(PATH.CONTENT_REQUESTS);
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
      label: 'الاستشارات',
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
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  {contentRequest.meeting_title} ({contentRequest.request_number})
                </h1>
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>
            <button
            type="button"
            className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-[#038F86] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRequestConsultation}
            >
              <ClipboardCheck className="w-5 h-5" strokeWidth={1.26} />
              طلب استشارة
            </button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center w-full ">
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
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '20px',
                    lineHeight: '28px',
                  }}
                >
                  معلومات الطلب
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      رقم الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.request_number ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      حالة الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {statusLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      مقدم الطلب
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.submitter_name ?? '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      مالك الاجتماع
                    </label>
                    <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '20px',
                    lineHeight: '28px',
                  }}
                >
                  معلومات الاجتماع
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      هل تطلب الاجتماع نيابة عن غيرك؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {(contentRequest as { is_on_behalf_of?: boolean | null }).is_on_behalf_of === true
                        ? 'نعم'
                        : (contentRequest as { is_on_behalf_of?: boolean | null }).is_on_behalf_of === false
                          ? 'لا'
                          : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      مالك الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.current_owner_user
                        ? `${contentRequest.current_owner_user.first_name} ${contentRequest.current_owner_user.last_name}`
                        : contentRequest.current_owner_role?.name_ar ?? '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      عنوان الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.meeting_title || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      وصف الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.meeting_subject || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      القطاع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {(contentRequest.sector && SectorLabels[contentRequest.sector as keyof typeof SectorLabels]) || contentRequest.sector || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      نوع الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getMeetingTypeLabel(contentRequest.meeting_type) || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      اجتماع عاجل؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.is_direct_schedule === true ? 'نعم' : contentRequest.is_direct_schedule === false ? 'لا' : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      السبب
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.meeting_justification || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      موعد الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.scheduled_at ? new Date(contentRequest.scheduled_at).toLocaleString('ar-SA') : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      آلية انعقاد الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getMeetingChannelLabel(contentRequest.meeting_channel) || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      الموقع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {(contentRequest as { meeting_location?: string | null }).meeting_location || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      هل يتطلب بروتوكول؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.requires_protocol === true ? 'نعم' : contentRequest.requires_protocol === false ? 'لا' : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      فئة الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getMeetingClassificationLabel(contentRequest.meeting_classification) || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      مبرّر اللقاء
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.meeting_justification || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      موضوع التكليف المرتبط
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.related_topic || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      تاريخ الاستحقاق
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.deadline ? new Date(contentRequest.deadline).toLocaleDateString('ar-SA') : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      تصنيف الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getMeetingClassificationTypeLabel(contentRequest.meeting_classification_type) || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      سرية الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getMeetingConfidentialityLabel(contentRequest.meeting_confidentiality) || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      اجتماع متسلسل؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.is_sequential === true ? 'نعم' : contentRequest.is_sequential === false ? 'لا' : '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      الاجتماع السابق
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.previous_meeting_id || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      الرقم التسلسلي
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.sequential_number ?? '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      أجندة الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      هل طلب الاجتماع بناءً على توجيه من معالي الوزير
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {contentRequest.related_directive_ids && contentRequest.related_directive_ids.length > 0 ? 'نعم' : 'لا'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      طريقة التوجيه
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {(contentRequest as { directive_method?: string | null }).directive_method || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      محضر الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {(contentRequest as { meeting_minutes?: string | null }).meeting_minutes || '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      التوجيه
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {formatRelatedGuidance(contentRequest.related_guidance)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      ملاحظات
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes)}
                    </div>
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
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '20px',
                    lineHeight: '28px',
                  }}
                >
                  المحتوى
                </h2>

                {/* العرض التقديمي – same card as meeting detail */}
                <div className="rounded-2xl border border-[#EAECF0] bg-white shadow-[0px_1px_3px_rgba(16,24,40,0.08),0px_4px_12px_rgba(16,24,40,0.04)]">
                  <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-l from-[#048F86]/08 to-transparent border-b border-[#EAECF0]">
                    <div className="w-8 h-8 rounded-lg bg-[#048F86]/12 flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-[#048F86]" strokeWidth={1.8} />
                    </div>
                    <label className="text-sm font-bold text-[#344054]" style={{ fontFamily: "'Almarai', sans-serif" }}>العرض التقديمي</label>
                  </div>
                  <div className="p-5 min-h-[140px]" style={{ minHeight: '140px' }}>
                    <TooltipProvider>
                      <div className="flex flex-col max-w-[800px] gap-4">
                        {presentationAttachments.map((att: Attachment) => (
                          <div key={att.id} className="flex flex-row gap-4 justify-start items-center flex-wrap">
                            <div className="flex flex-row items-center flex-1 min-w-0 px-4 py-3 gap-3 h-[56px] bg-white border border-[#009883]/40 rounded-xl shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:border-[#009883] hover:shadow-[0px_2px_8px_rgba(4,143,134,0.12)] transition-all duration-200">
                              {att.file_type?.toLowerCase() === 'pdf' ? <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain flex-shrink-0" /> : <div className="w-10 h-10 bg-[#E2E5E7] rounded-lg flex items-center justify-center text-xs font-semibold text-[#B04135] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                              <div className="flex flex-col items-end min-w-0 flex-1">
                                <span className="text-sm font-medium text-[#344054] truncate w-full text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>{att.file_name}</span>
                                <span className="text-xs text-[#475467]" style={{ fontFamily: "'Almarai', sans-serif" }}>{Math.round((att.file_size || 0) / 1024)} KB</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div className="flex items-center rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-0.5">
                                  {att.replaces_attachment_id != null && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCompareResult(null);
                                            setCompareErrorDetail(null);
                                            setIsCompareModalOpen(true);
                                            compareByAttachmentMutation.mutate(att.id);
                                          }}
                                          disabled={compareByAttachmentMutation.isPending}
                                          className="p-2 rounded-md hover:bg-[#009883]/10 text-[#009883] disabled:opacity-50 transition-colors"
                                        >
                                          <Scale className="w-4 h-4" strokeWidth={1.26} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-right">
                                        <p>تقييم الاختلاف بين العروض</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                {att.blob_url && (
                                  <>
                                    <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#009883]/10 text-[#009883] transition-colors"><Download className="w-4 h-4" /></a>
                                    <button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-[#F2F4F7] text-[#475467] transition-colors"><Eye className="w-4 h-4" /></button>
                                  </>
                                )}
                              </div>
                            </div>
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
                              className="relative flex flex-row justify-end items-center gap-2 w-fit min-w-[119px] h-[41px] rounded-[22.8393px] flex-shrink-0 text-white font-bold overflow-hidden box-border px-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                              style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '11px',
                                lineHeight: '14px',
                                background: '#34C3BA',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.08), 0 2px 4px rgba(4, 143, 134, 0.2), 0 4px 12px rgba(4, 143, 134, 0.25), 0 8px 24px rgba(4, 143, 134, 0.15)',
                              }}
                            >
                              <span className="absolute left-0 top-1/2 pointer-events-none w-[86px] h-[74px] rounded-full opacity-80 -translate-y-1/2 -translate-x-1/3" style={{ background: '#87F8F8', filter: 'blur(9.41px)' }} aria-hidden />
                              <span className="relative z-10 flex items-center gap-2">
                                ملاحظات بالذكاء الاصطناعي
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
                        ))}
                        {presentationAttachments.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed border-[#D0D5DD] min-h-[200px]" style={{ backgroundColor: '#F9FAFB', borderColor: '#D0D5DD', minHeight: '200px' }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: '#F2F4F7' }}>
                              <FileCheck className="w-7 h-7" strokeWidth={1.2} style={{ color: '#98A2B3' }} />
                            </div>
                            <p className="font-medium text-base mb-1" style={{ fontFamily: "'Almarai', sans-serif", color: '#344054' }}>لا يوجد عرض تقديمي</p>
                          </div>
                        )}
                      </div>
                    </TooltipProvider>
                  </div>
                </div>

                {/* متى سيتم إرفاق العرض؟ */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    متى سيتم إرفاق العرض؟
                  </label>
                  <p className="text-base text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    -
                  </p>
                </div>

                {/* مرفقات اختيارية */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                              <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                                {att.file_name}
                              </span>
                              <span className="text-xs text-[#475467] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                    <p className="text-base text-gray-500 text-right py-2" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      لا توجد مرفقات اختيارية
                    </p>
                  )}
                </div>

                {/* ملاحظات */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    ملاحظات
                  </label>
                  <p className="text-base text-gray-900 text-right whitespace-pre-wrap" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                    fontFamily: "'Almarai', sans-serif",
                    fontWeight: 700,
                    fontSize: '22px',
                    lineHeight: '38px',
                    color: '#101828',
                  }}
                >
                  قائمة المدعوين (مقدّم الطلب)
                </h2>
                {contentRequest.invitees && contentRequest.invitees.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4">
                    {contentRequest.invitees.map((invitee: any, idx: number) => {
                      const name = invitee.external_name || invitee.user_id || '-';
                      const position = invitee.position || '-';
                      const sector = (invitee.sector && SectorLabels[invitee.sector as keyof typeof SectorLabels]) || invitee.sector || '-';
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

              {/* قائمة المدعوين (الوزير) */}
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
                  قائمة المدعوين (الوزير)
                </h2>
                {contentRequest.minister_attendees && contentRequest.minister_attendees.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4">
                    {contentRequest.minister_attendees.map((invitee: any, idx: number) => {
                      const name = invitee.external_name || invitee.user_id || '-';
                      const position = invitee.position || '-';
                      const sector = (invitee.sector && SectorLabels[invitee.sector as keyof typeof SectorLabels]) || invitee.sector || '-';
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
                    لا توجد قائمة مدعوين من جهة الوزير
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'directives-log' && (
            <div className="flex flex-col gap-4 w-full" dir="rtl">
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                <>
                 
                  <div className="flex flex-col gap-4" dir="rtl">
                    {consultationRecords.items.map((row: ConsultationRecord, index: number) => {
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
                                {/* {displayRequestNumber && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                    <Hash className="w-4 h-4 flex-shrink-0" />
                                    <span>رمز الطلب : {displayRequestNumber}</span>
                                  </span>
                                )} */}
                               
                                {flatItems?.length>1&&
                                <div className="flex justify-end" dir="rtl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const typeLabel = (t: string) =>
                                      t === 'SCHEDULING' ? 'السؤال' : t === 'CONTENT' ? 'محتوى' : t;
                                    const sentences: string[] = [];
                                    flatItems.forEach((row:  {
                                      id: string;
                                      text: string;
                                      status: string;
                                      name: string;
                                      respondedAt: string | null;
                                      requestNumber: string | null;
                                  }) => {

                                            sentences.push(`${row.text}`);
                                      
                                    });
                                    if (sentences.length > 0) {
                                      setAnalyzingRecordId(recordId);
                                      analyzeContradictionsMutation.mutate(sentences);
                                    }
                                  }}
                                  disabled={analyzeContradictionsMutation.isPending && analyzingRecordId === recordId}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-[#009883] text-white hover:bg-[#008274] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                  style={{ fontFamily: "'Almarai', sans-serif" }}
                                >
                                  {analyzeContradictionsMutation.isPending && analyzingRecordId === recordId ? 'جاري التحليل...' : 'تقييم التعارض بين افادات المستشارين'}
                                </button>
                               </div>}
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
                    })}
                  </div>
                </>
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

          {/* Compare presentations result modal (تقييم الاختلاف بين العروض) – same as meeting detail */}
          <Dialog open={isCompareModalOpen} onOpenChange={setIsCompareModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  تقييم الاختلاف بين العروض
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                {compareByAttachmentMutation.isPending ? (
                  <p className="text-center text-gray-500 py-6">جاري تقييم الاختلاف بين العروض...</p>
                ) : compareByAttachmentMutation.isError ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                    {compareErrorDetail ? <p className="text-gray-700 text-sm mt-2 text-right">{translateCompareErrorDetail(compareErrorDetail) ?? compareErrorDetail}</p> : <p className="text-gray-600 text-sm mt-2">يرجى المحاولة لاحقاً.</p>}
                  </div>
                ) : compareResult ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">معرف التقييم</span>
                        <span className="font-medium text-gray-900">{compareResult.comparison_id || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">الدرجة الإجمالية</span>
                        <span className="font-medium text-gray-900">{compareResult.overall_score ?? '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">مستوى الاختلاف</span>
                        <span className="font-medium text-gray-900">{translateCompareValue(compareResult.difference_level, COMPARE_LEVEL)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">الحالة</span>
                        <span className="font-medium text-gray-900">{translateCompareValue(compareResult.status, COMPARE_STATUS)}</span>
                      </div>
                    </div>
                    {compareResult.regeneration_recommendation ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm">توصية إعادة التوليد</span>
                        <p className="text-gray-900 whitespace-pre-wrap">{translateCompareValue(compareResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}</p>
                      </div>
                    ) : null}
                    {compareResult.summary ? (
                      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <span className="text-gray-700 font-medium">ملخص الشرائح</span>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>الشرائح الأصلية: {compareResult.summary.total_slides_original ?? '—'}</span>
                          <span>الشرائح الجديدة: {compareResult.summary.total_slides_new ?? '—'}</span>
                          <span>فرق العدد: {compareResult.summary.slide_count_difference ?? '—'}</span>
                          <span>بدون تغيير: {compareResult.summary.unchanged_slides ?? '—'}</span>
                          <span>تغييرات طفيفة: {compareResult.summary.minor_changes ?? '—'}</span>
                          <span>تغييرات متوسطة: {compareResult.summary.moderate_changes ?? '—'}</span>
                          <span>تغييرات كبيرة: {compareResult.summary.major_changes ?? '—'}</span>
                          <span>شرائح جديدة: {compareResult.summary.new_slides ?? '—'}</span>
                        </div>
                      </div>
                    ) : null}
                    {compareResult.ai_insights && Object.keys(compareResult.ai_insights).length > 0 ? (
                      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <span className="text-gray-700 font-medium">رؤى الذكاء الاصطناعي</span>
                        {(() => {
                          const ai = compareResult.ai_insights as {
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
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  إغلاق
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Analyze contradictions result modal */}
          <Dialog open={isAnalyzeModalOpen} onOpenChange={setIsAnalyzeModalOpen}>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  تقييم التعارض بين افادات المستشارين
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1 space-y-6">
                {(() => {
                  const categoriesWithContradictions = (analyzeResult?.categories ?? []).filter(
                    (c) => c.contradictions && c.contradictions.length > 0
                  );
                  return categoriesWithContradictions.length > 0 ? (
                    categoriesWithContradictions.map((category, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-amber-100/80 border-b border-amber-200">
                          <h4 className="text-base font-semibold text-amber-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                            يوجد تعارض في: {category.category_name || `الفئة ${idx + 1}`}
                          </h4>
                        </div>
                        <div className="p-4">
                          <ul className="space-y-3 list-none">
                            {category.contradictions.map((item, i) => {
                              if (typeof item === 'string') {
                                return (
                                  <li
                                    key={i}
                                    className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-gray-800 text-right"
                                    style={{ fontFamily: "'Almarai', sans-serif" }}
                                  >
                                    {item}
                                  </li>
                                );
                              }
                              const obj = item as { statements?: string[]; severity?: string; comment?: string };
                              const statementsText = obj.statements?.length
                                ? obj.statements.join(' ← → ')
                                : '';
                              const hasContent = statementsText || obj.severity || obj.comment;
                              if (!hasContent) return null;
                              return (
                                <li
                                  key={i}
                                  className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-right space-y-2"
                                  style={{ fontFamily: "'Almarai', sans-serif" }}
                                >
                                  {statementsText && (
                                    <p className="text-sm text-gray-800">{statementsText}</p>
                                  )}
                                  {obj.severity && (
                                    <p className="text-xs font-medium text-amber-800">
                                      درجة التعارض: {obj.severity}
                                    </p>
                                  )}
                                  {obj.comment && (
                                    <p className="text-sm text-gray-600">{obj.comment}</p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : analyzeContradictionsMutation.isError ? (
                    <p className="text-center text-red-600 py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      حدث خطأ أثناء تحليل التعارضات. يرجى المحاولة لاحقاً.
                    </p>
                  ) : (
                    <p className="text-center text-gray-500 py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      لا توجد تعارضات في النتيجة.
                    </p>
                  );
                })()}
              </div>
              <DialogFooter className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  إغلاق
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action Content (outside tabs) */}
         {activeTab === 'request-info' && <div className="flex flex-col gap-6">
            {/* Guidance Section */}
            <div className="flex flex-col gap-4 w-full max-w-[1321px] mx-auto bg-white border border-[#E6E6E6] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
              <h3 className="text-lg font-semibold text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                        <span className="text-sm font-medium text-[#344054] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          {executiveSummaryFile.name}
                        </span>
                        <span className="text-xs text-[#475467] text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
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
                    <p className="text-base text-[#1A1A1A] mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      اضغط للرفع أو اسحب الملف هنا
                    </p>
                    <p className="text-sm text-[#666666]" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      PDF, WORD, EXCEL (max. 20MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>}
        </div>
      </div>

      {/* Actions bar – same FAB + arc as meeting detail */}
      <MeetingActionsBar
        meetingStatus={MeetingStatus.UNDER_REVIEW}
        open={actionsBarOpen}
        onOpenChange={setActionsBarOpen}
        onOpenSchedule={() => {}}
        onOpenReject={() => {}}
        onOpenEditConfirm={() => {}}
        onOpenReturnForInfo={() => {}}
        onOpenSendToContent={() => {}}
        onAddToWaitingList={() => {}}
        isAddToWaitingListPending={false}
        hasChanges={false}
        hasContent={false}
        customActions={[
          {
            icon: <Send className="w-5 h-5" strokeWidth={1.26} />,
            label: 'إرسال إلى مسؤول الجدولة',
            onClick: handleSendToScheduling,
            disabled: sendToSchedulingMutation.isPending || !executiveSummaryFile,
            disabledReason: !executiveSummaryFile ? 'يرجى إرفاق الملخص التنفيذي أولاً' : undefined,
          },
          {
            icon: <RotateCcw className="w-5 h-5" strokeWidth={1.26} />,
            label: 'إعادة للطلب',
            onClick: handleReturnRequest,
            disabled: submitReturnMutation.isPending,
          },
          ...(draftsRecords && draftsRecords.length > 0
            ? [{
                icon: <MessageSquare className="w-5 h-5" strokeWidth={1.26} />,
                label: `مسودات (${draftsRecords.length})`,
                onClick: () => setIsDraftsModalOpen(true),
              }]
            : []),
        ]}
      />

      {/* Attachment LLM notes/insights modal (ملاحظات على العرض) – same as meeting detail */}
      <Dialog open={!!insightsModalAttachment} onOpenChange={(open) => { if (!open) { insightsAbortControllerRef.current?.abort(); insightsAbortControllerRef.current = null; setInsightsModalAttachment(null); insightsMutation.reset(); } }}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden p-0" dir="rtl">
          <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-[#048F86] via-[#06B6A4] to-[#A6D8C1]" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#048F86] to-[#06B6A4]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <DialogHeader className="p-0">
                  <DialogTitle className="text-right text-[16px] font-bold text-[#101828]" style={{ fontFamily: "'Almarai', sans-serif" }}>
                    تحليل العرض التقديمي
                  </DialogTitle>
                </DialogHeader>
                {insightsModalAttachment?.file_name && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-[#667085] flex-shrink-0" />
                    <span className="text-[13px] text-[#667085] truncate" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      {insightsModalAttachment.file_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                const d = insightsMutation.data as AttachmentInsightsResponse;
                const notes = Array.isArray(d.llm_notes) ? d.llm_notes : [];
                const suggestions = Array.isArray(d.llm_suggestions) ? d.llm_suggestions : [];
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
                            <FileText className="h-4 w-4 text-[#048F86]" />
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

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => { insightsAbortControllerRef.current?.abort(); insightsAbortControllerRef.current = null; setInsightsModalAttachment(null); insightsMutation.reset(); }}
              className="px-5 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] transition-colors text-[14px] font-semibold shadow-sm"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              إغلاق
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Request Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              إعادة الطلب لمقدم الطلب
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Almarai', sans-serif" }}
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              {submitReturnMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
            <button
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submitReturnMutation.isPending}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Almarai', sans-serif" }}
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              طلب استشارة محتوى
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* Consultant Select */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                المستشار *
              </label>
              <Select
                value={selectedConsultantId}
                onValueChange={setSelectedConsultantId}
              >
                <SelectTrigger
                  className="w-full h-11 bg-white border border-gray-300 rounded-lg shadow-sm text-right flex-row-reverse"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
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
                      style={{ fontFamily: "'Almarai', sans-serif" }}
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
                style={{ fontFamily: "'Almarai', sans-serif" }}
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
              style={{ fontFamily: "'Almarai', sans-serif" }}
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
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {submitConsultationMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitConsultation('submit')}
                disabled={submitConsultationMutation.isPending || !consultationNotes.trim() || !selectedConsultantId}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Almarai', sans-serif" }}
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
            ) : consultationRecordsWithDrafts && draftsRecords.length > 0 ? (
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
                        {new Date(draft.requested_at).toLocaleDateString('ar-SA')}
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
              ); })
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
    </div>
  );
};

export default ContentRequestDetail;
