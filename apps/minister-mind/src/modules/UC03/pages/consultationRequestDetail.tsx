import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Download, Eye } from 'lucide-react';
import { Tabs, StatusBadge, DataTable } from '@shared/components';
import type { TableColumn } from '@shared';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { getConsultationRequestById, submitConsultationResponse, saveConsultationAsDraft, getPendingConsultations } from '../data/consultationsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';

// Translate response status to Arabic
const translateResponseStatus = (status: string | null | undefined): string => {
  if (!status) return '-';
  
  const statusMap: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    ACCEPTED: 'مقبول',
    DECLINED: 'مرفوض',
  };
  
  return statusMap[status.toUpperCase()] || status;
};

// Get status label with support for custom statuses
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  // Handle custom statuses
  if (status === 'UNDER_CONSULTATION_SCHEDULING') {
    return 'قيد استشارة الجدولة';
  }
  return status as string;
};

const ConsultationRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [consultationResponse, setConsultationResponse] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(false);
  const [queriesDisabled, setQueriesDisabled] = useState<boolean>(false);

  // Fetch consultation request data from API
  const { data: consultationData, isLoading, error } = useQuery({
    queryKey: ['consultation-request', id],
    queryFn: () => getConsultationRequestById(id!),
    enabled: !!id && !queriesDisabled,
  });

  // Fetch pending consultation data
  const { data: pendingConsultation, isLoading: isLoadingConsultation } = useQuery({
    queryKey: ['pending-consultation', id],
    queryFn: () => getPendingConsultations(id!),
    enabled: !!id && !queriesDisabled,
  });

  const meetingRequest = consultationData?.meeting_request;
  const consultationQuestion = consultationData?.consultation_question || '';

  // Attachments grouping
  const presentationAttachments =
    meetingRequest?.attachments?.filter((att) => att.is_presentation) || [];
  const optionalAttachments =
    meetingRequest?.attachments?.filter((att) => !att.is_presentation) || [];

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
      id: 'invitees',
      label: 'قائمة المدعوين',
    },
    {
      id: 'submit-consultation',
      label: 'تقديم استشارة',
    },
  ];

  const queryClient = useQueryClient();

  // Submit consultation mutation
  const submitMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_notes: string }) => {
      if (!pendingConsultation?.id) throw new Error('Consultation ID is required');
      return submitConsultationResponse(pendingConsultation.id, data);
    },
    onSuccess: () => {
      // Disable queries first to prevent any new requests
      setQueriesDisabled(true);
      
      // Cancel any in-flight queries
      queryClient.cancelQueries({ queryKey: ['consultation-request', id] });
      queryClient.cancelQueries({ queryKey: ['pending-consultation', id] });
      
      // Remove queries from cache since we're navigating away
      queryClient.removeQueries({ queryKey: ['consultation-request', id] });
      queryClient.removeQueries({ queryKey: ['pending-consultation', id] });
      
      // Invalidate consultation requests list to remove the responded request
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      
      setIsSubmitModalOpen(false);
      setConsultationResponse('');
      setIsSuitableForScheduling(false);
      
      // Navigate back to consultation requests list
      navigate(PATH.CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting consultation:', error);
      // TODO: Show error toast/notification
    },
  });

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_notes: string }) => {
      if (!pendingConsultation?.id) throw new Error('Consultation ID is required');
      return saveConsultationAsDraft(pendingConsultation.id, data);
    },
    onSuccess: () => {
      // Invalidate and refetch consultation request data and pending consultation
      queryClient.invalidateQueries({ queryKey: ['consultation-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-consultation', id] });
      setIsSubmitModalOpen(false);
      // Don't clear the form when saving as draft
    },
    onError: (error) => {
      console.error('Error saving draft:', error);
      // TODO: Show error toast/notification
    },
  });

  const handleOpenSubmitModal = () => {
    setIsSubmitModalOpen(true);
  };

  const handleSubmitConsultation = () => {
    if (!consultationResponse.trim()) {
      // TODO: Show validation error
      return;
    }

    if (!pendingConsultation?.id) {
      // TODO: Show error that consultation ID is missing
      console.error('Consultation ID is required');
      return;
    }

    submitMutation.mutate({
      feasibility_answer: isSuitableForScheduling,
      consultation_notes: consultationResponse,
    });
  };

  const handleSaveAsDraft = () => {
    saveDraftMutation.mutate({
      feasibility_answer: isSuitableForScheduling,
      consultation_notes: consultationResponse,
    });
  };

  // Open submit consultation modal automatically when its tab is selected
  useEffect(() => {
    if (activeTab === 'submit-consultation') {
      setIsSubmitModalOpen(true);
    }
  }, [activeTab]);

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
                  
                >
                  تعديل طلب معاد من مسؤول الجدولة ({meetingRequest.request_number})
                </h1>
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-start">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Submit Consultation Tab */}
          {activeTab === 'submit-consultation' && (
            <div className="flex flex-col gap-6">
              {/* Consultation Question Section */}
              <div
                className="flex flex-col justify-center items-end p-[10px_34px_10px_10px] gap-[10px] w-full max-w-[1321px] h-[265px] bg-white border border-[#E6E6E6] rounded-2xl mx-auto"
                
              >
                <div className="flex flex-col items-start p-0 gap-[10px] w-full">
                  <div className="flex flex-col items-start p-0 gap-[4px] w-full">
                    {/* Title */}
                    <h2
                      className="w-full h-[38px] font-bold text-lg leading-[38px] text-right text-[#101828]"
                      style={{
                        fontFamily: "'Ping AR + LT', sans-serif",
                        fontWeight: 700,
                        fontSize: '18px',
                        lineHeight: '38px',
                      }}
                    >
                      سؤال جدوى جدولة الاجتماع
                    </h2>

                    {/* Question Content */}
                    <div className="flex flex-col items-start p-0 gap-4 w-full h-[136px]">
                      <p
                        className="w-full text-base leading-6 text-right text-[#475467]"
                        style={{
                          fontFamily: "'Ping AR + LT', sans-serif",
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                        {consultationQuestion || 'لا يوجد سؤال متاح'}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleOpenSubmitModal}
                    disabled={!pendingConsultation?.id || isLoadingConsultation}
                    className="flex flex-row items-center px-3 py-2 gap-2 w-[158px] h-10 bg-[#29615C] rounded-[85px] flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                    
                  >
                    <div className="flex flex-row justify-end items-center p-0 gap-3 w-[134px] h-6">
                    <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={2} />

                     <span
                        className="w-[98px] h-5 font-bold text-base leading-6 text-white"
                        style={{
                          fontFamily: "'Ping AR + LT', sans-serif",
                          fontWeight: 700,
                          fontSize: '16px',
                          lineHeight: '24px',
                        }}
                      >
                       تقديم استشارة 
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pending Consultation Section */}
              {isLoadingConsultation ? (
                <div className="flex items-center justify-center p-6">
                  <div className="text-gray-600" >
                    جاري تحميل بيانات الاستشارة...
                  </div>
                </div>
              ) : pendingConsultation ? (
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
                    بيانات الاستشارة المعلقة
                  </h2>
                  
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          معرف الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.id}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          نوع الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.consultation_type === 'SCHEDULING' ? 'جدولة' : pendingConsultation.consultation_type}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          الحالة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {translateResponseStatus(pendingConsultation.status)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          معرف المستشار
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.consultant_user_id}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          تاريخ الطلب
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.requested_at ? new Date(pendingConsultation.requested_at).toLocaleString('ar-SA') : '-'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          تاريخ الرد
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.responded_at ? new Date(pendingConsultation.responded_at).toLocaleString('ar-SA') : '-'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          إجابة الجدوى
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.feasibility_answer === null ? '-' : pendingConsultation.feasibility_answer ? 'نعم' : 'لا'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          المدة الممنوحة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          
                        >
                          {pendingConsultation.duration_granted ? `${pendingConsultation.duration_granted} دقيقة` : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {pendingConsultation.recommendation && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          التوصية
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200"
                          
                        >
                          {pendingConsultation.recommendation}
                        </p>
                      </div>
                    )}
                    
                    {pendingConsultation.consultation_notes && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          ملاحظات الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap"
                          
                        >
                          {pendingConsultation.consultation_notes}
                        </p>
                      </div>
                    )}
                    
                    {pendingConsultation.content_exception && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          
                        >
                          استثناء المحتوى
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200"
                          
                        >
                          {pendingConsultation.content_exception}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Request Info Tab */}
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-4">
              <h3
                className="text-lg font-semibold text-gray-900 text-right"
                
              >
                معلومات الطلب
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* رقم الطلب */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    
                  >
                    رقم الطلب
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                    
                  >
                    {meetingRequest.request_number}
                  </p>
                </div>
                {/* حالة الطلب */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                  >
                    حالة الطلب
                  </label>
                  {/* <div className="flex justify-end"> */}
                  <p
                    className="text-base text-gray-900 text-right"
                  >
                    {statusLabel}
                  </p>
                  {/* </div> */}
                </div>
                {/* مالك الاجتماع */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                  >
                    مالك الاجتماع
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                  >
                    {meetingRequest.current_owner_user
                      ? `${meetingRequest.current_owner_user.first_name} ${meetingRequest.current_owner_user.last_name}`
                      : meetingRequest.current_owner_role?.name_ar || '-'}
                  </p>
                </div>
                {/* مقدم الطلب */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    
                  >
                    مقدم الطلب
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                    
                  >
                    {meetingRequest.submitter_name || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Information Tab */}
          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-6">
              {/* Basic Information */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  
                >
                  معلومات الاجتماع
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      عنوان الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.meeting_title || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      موضوع الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.meeting_subject || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      فئة الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.meeting_classification || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      نوع الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.meeting_type || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      آلية انعقاد الاجتماع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.meeting_channel || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      القطاع
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.sector || '-'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      هل يتطلب بروتوكول؟
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.requires_protocol ? 'نعم' : 'لا'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700 text-right"
                      
                    >
                      مدة العرض التقديمي (دقيقة)
                    </label>
                    <p
                      className="text-base text-gray-900 text-right"
                      
                    >
                      {meetingRequest.presentation_duration || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  
                >
                  معلومات إضافية
                </h3>
                <div className="flex flex-col gap-4">
                  {meetingRequest.meeting_justification && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        
                      >
                        مبرر الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        
                      >
                        {meetingRequest.meeting_justification}
                      </p>
                    </div>
                  )}
                  {meetingRequest.related_topic && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        
                      >
                        الموضوع المرتبط
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        
                      >
                        {meetingRequest.related_topic}
                      </p>
                    </div>
                  )}
                  {meetingRequest.general_notes && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        
                      >
                        ملاحظات عامة
                      </label>
                      <p
                        className="text-base text-gray-700 text-right whitespace-pre-wrap leading-relaxed"
                        
                      >
                        {meetingRequest.general_notes}
                      </p>
                    </div>
                  )}
                  {meetingRequest.content_officer_notes && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        
                      >
                        ملاحظات مسؤول المحتوى
                      </label>
                      <p
                        className="text-base text-gray-700 text-right whitespace-pre-wrap leading-relaxed"
                        
                      >
                        {meetingRequest.content_officer_notes}
                      </p>
                    </div>
                  )}
                  {meetingRequest.related_guidance && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        
                      >
                        التوجيهات المرتبطة
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        
                      >
                        {meetingRequest.related_guidance}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6">
              {/* Attachments & Presentation Section */}
              <div className="flex flex-col gap-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Presentation Attachments */}
                  <div className="flex flex-col gap-3">
                    <h3
                      className="text-lg font-semibold text-right text-[#101828]"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      العرض التقديمي
                    </h3>
                    {presentationAttachments.length > 0 ? (
                      <div className="flex flex-row gap-4 flex-wrap">
                        {presentationAttachments.map((att) => (
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
                              <span className="text-sm font-medium text-[#344054] text-right">
                                {att.file_name}
                              </span>
                              <span className="text-sm text-[#475467] text-right">
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
                    ) : (
                      <p
                        className="text-sm text-[#667085] text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        لا يوجد عرض تقديمي مرفق
                      </p>
                    )}
                  </div>

                  {/* Optional Attachments */}
                  <div className="flex flex-col gap-3">
                    <h3
                      className="text-lg font-semibold text-right text-[#101828]"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      مرفقات اختيارية
                    </h3>
                    {optionalAttachments.length > 0 ? (
                      <div className="flex flex-row gap-4 flex-wrap">
                        {optionalAttachments.map((att) => (
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
                              <span className="text-sm font-medium text-[#344054] text-right">
                                {att.file_name}
                              </span>
                              <span className="text-sm text-[#475467] text-right">
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
                    ) : (
                      <p
                        className="text-sm text-[#667085] text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        لا توجد مرفقات اختيارية
                      </p>
                    )}
                  </div>
                </div>

                {/* Presentation Attachment Timing */}
                <div className="flex flex-col gap-2 max-w-sm">
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
                    {meetingRequest.presentation_attachment_timing
                      ? new Date(meetingRequest.presentation_attachment_timing).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invitees Tab */}
          {activeTab === 'invitees' && (
            <div
              className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto"
              dir="rtl"
            >
              <div className="flex flex-col gap-6 w-full max-w-[1085px]">
                {/* Invitees table */}
                {meetingRequest.invitees && meetingRequest.invitees.length > 0 && (
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
                        قائمة المدعوين (مقدم الطلب)
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
                              width: 'w-[300px]',
                              align: 'end',
                              render: (row: any) => (
                                <span
                                  className="text-sm text-[#475467] text-right"
                                  
                                >
                                  {row.external_name || row.user_id || '--------------'}
                                </span>
                              ),
                            },
                            {
                              id: 'email',
                              header: 'البريد الإلكتروني',
                              width: 'w-[250px]',
                              align: 'end',
                              render: (row: any) => (
                                <span
                                  className="text-sm text-[#475467] text-right"
                                  
                                >
                                  {row.external_email || '--------------'}
                                </span>
                              ),
                            },
                            {
                              id: 'is_required',
                              header: 'الحضور أساسي',
                              width: 'w-[180px]',
                              align: 'center',
                              render: (row: any) => (
                                <div className="flex items-center justify-center gap-2 w-full">
                                  <span
                                    className="text-sm text-[#667085]"
                                    
                                  >
                                    {row.is_required ? 'نعم' : 'لا'}
                                  </span>
                                </div>
                              ),
                            },
                            {
                              id: 'response_status',
                              header: 'الحالة',
                              width: 'w-[150px]',
                              align: 'center',
                              render: (row: any) => (
                                <span
                                  className="text-sm text-[#475467]"
                                  
                                >
                                  {translateResponseStatus(row.response_status)}
                                </span>
                              ),
                            },
                          ] as TableColumn<any>[]}
                          data={meetingRequest.invitees}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Minister attendees table */}
                {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 && (
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
                                  
                                >
                                  {row.justification || '-'}
                                </span>
                              ),
                            },
                          ] as TableColumn<any>[]}
                          data={meetingRequest.minister_attendees}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        {/* Submit Consultation Modal */}
        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
          <DialogContent className="sm:max-w-[600px]" dir="rtl">
            <DialogHeader>
              <DialogTitle
                className="text-right"
                
              >
               تقديم استشارة
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-gray-700 text-right"
                  
                >
                 محتوى الاستشارة
                </label>
                <Textarea
                  value={consultationResponse}
                  onChange={(e) => setConsultationResponse(e.target.value)}
                  placeholder="أدخل محتوى الاستشارة..."
                  className="min-h-[300px] text-right"
                  dir="rtl"
                  
                />
              </div>
              
              {/* Toggle for scheduling suitability */}
              <div className="flex flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span
                  className="text-sm font-medium text-gray-900 text-right"
                  
                >
                  هل الطلب مناسب للجدولة
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span
                    className="text-base text-[#667085]"
                    
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
            <DialogFooter className="flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleSubmitConsultation}
                disabled={submitMutation.isPending || !consultationResponse.trim() || !pendingConsultation?.id}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Ping AR + LT', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                }}
              >
                <span className="text-white">
                  {submitMutation.isPending ? 'جاري الإرسال...' : 'تقديم استشارة'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={saveDraftMutation.isPending || !pendingConsultation?.id}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Ping AR + LT', sans-serif",
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                }}
              >
                <span>
                  {saveDraftMutation.isPending ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                </span>
              </button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
        
        </div>
      </div>
    </div>
  );
};

export default ConsultationRequestDetail;