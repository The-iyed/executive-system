import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Send, Eye, Download, RotateCcw, Upload, ClipboardCheck } from 'lucide-react';
import { StatusBadge } from '@shared/components';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import {
  getContentRequestById,
  submitContentReturn,
  submitContentConsultation,
  getContentConsultants,
  approveContent,
  type Attachment,
  type ConsultantUser,
} from '../data/contentApi';
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

const ContentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guidanceNotes, setGuidanceNotes] = useState<string>('');
  const [executiveSummaryFile, setExecutiveSummaryFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
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
    mutationFn: (data: { consultant_user_id: string; consultation_question: string }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return submitContentConsultation(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      setConsultationNotes('');
      setSelectedConsultantId('');
      setConsultantSearch('');
      setIsConsultationModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting consultation:', error);
    },
  });


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

  const handleSubmitConsultation = () => {
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {/* Main Container */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl p-6 md:p-8 gap-6 flex flex-col">
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

          {/* Attachments List - Show above tabs */}
          {contentRequest.attachments && contentRequest.attachments.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3
                className="text-lg font-semibold text-gray-900 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                المرفقات
              </h3>
              <div className="flex flex-row gap-4 flex-wrap">
                {contentRequest.attachments.map((att: Attachment) => (
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
                            onClick={() => window.open(att.blob_url, '_blank')}
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
            </div>
          )}

          {/* Guidance Section */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-lg font-semibold text-gray-900 text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
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
          <div className="flex flex-col gap-4">
            <h3
              className="text-lg font-semibold text-gray-900 text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
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
                      <span
                        className="text-sm font-medium text-[#344054] text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {executiveSummaryFile.name}
                      </span>
                      <span
                        className="text-xs text-[#475467] text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {formatFileSize(executiveSummaryFile.size)}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      disabled={sendToSchedulingMutation.isPending}
                      className="ml-4 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload Icon */}
                  <div className="flex justify-center mb-4">
                    <Upload className="w-10 h-10 text-gray-400" />
                  </div>

                  {/* Instructions */}
                  <p
                    className="text-base text-[#1A1A1A] mb-2"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    اضغط للرفع أو اسحب الملف هنا
                  </p>

                  <p
                    className="text-sm text-[#666666]"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    PDF, WORD, EXCEL (max. 20MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl px-4">
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
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              onClick={handleSubmitConsultation}
              disabled={submitConsultationMutation.isPending || !consultationNotes.trim() || !selectedConsultantId}
              className="px-4 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              {submitConsultationMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
            <button
              onClick={() => setIsConsultationModalOpen(false)}
              disabled={submitConsultationMutation.isPending}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentRequestDetail;
