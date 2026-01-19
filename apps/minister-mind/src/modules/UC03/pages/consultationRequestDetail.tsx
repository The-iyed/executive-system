import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Download, Eye } from 'lucide-react';
import { Tabs, StatusBadge, DataTable } from '@shared/components';
import type { TableColumn } from '@shared';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { getConsultationRequestById, submitConsultationResponse, saveConsultationAsDraft, getPendingConsultations } from '../data/consultationsApi';
import { getConsultationRecords, type ConsultationRecord } from '../../UC02/data/meetingsApi';
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
  const [activeTab, setActiveTab] = useState<string>('consultation-request');
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

  // Fetch consultation records
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === 'consultations-log',
  });

  const meetingRequest = consultationData?.meeting_request;
  const consultationQuestion = consultationData?.consultation_question || '';

  const tabs = [
    {
      id: 'consultation-request',
      label: 'طلب الاستشارة',
    },
    {
      id: 'meeting-info',
      label: 'معلومات الاجتماع',
    },
    {
      id: 'consultations-log',
      label: 'سجل الإستشارات',
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
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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

          {/* Consultation Request Tab */}
          {activeTab === 'consultation-request' && (
            <div className="flex flex-col gap-6">
              {/* Consultation Question Section */}
              <div
                className="flex flex-col justify-center items-end p-[10px_34px_10px_10px] gap-[10px] w-full max-w-[1321px] h-[265px] bg-white border border-[#E6E6E6] rounded-2xl mx-auto"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                  <div className="text-gray-600" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          معرف الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.id}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          نوع الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.consultation_type === 'SCHEDULING' ? 'جدولة' : pendingConsultation.consultation_type}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          الحالة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {translateResponseStatus(pendingConsultation.status)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          معرف المستشار
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.consultant_user_id}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          تاريخ الطلب
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.requested_at ? new Date(pendingConsultation.requested_at).toLocaleString('ar-SA') : '-'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          تاريخ الرد
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.responded_at ? new Date(pendingConsultation.responded_at).toLocaleString('ar-SA') : '-'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          إجابة الجدوى
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.feasibility_answer === null ? '-' : pendingConsultation.feasibility_answer ? 'نعم' : 'لا'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          المدة الممنوحة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.duration_granted ? `${pendingConsultation.duration_granted} دقيقة` : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {pendingConsultation.recommendation && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          التوصية
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.recommendation}
                        </p>
                      </div>
                    )}
                    
                    {pendingConsultation.consultation_notes && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          ملاحظات الاستشارة
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          {pendingConsultation.consultation_notes}
                        </p>
                      </div>
                    )}
                    
                    {pendingConsultation.content_exception && (
                      <div className="flex flex-col gap-2">
                        <label
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          استثناء المحتوى
                        </label>
                        <p
                          className="text-base text-gray-900 text-right p-3 bg-gray-50 rounded-lg border border-gray-200"
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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

          {/* Meeting Information Tab */}
          {activeTab === 'meeting-info' && (
            <div className="flex flex-col gap-6">
              {/* Basic Information Section */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  المعلومات الأساسية
                </h3>
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
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_type || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        عنوان الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_title || '-'}
                      </p>
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
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_classification || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        موضوع الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_subject || '-'}
                      </p>
                    </div>
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
              <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
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
                                width: 'w-[300px]',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                                  <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                                    <span className="text-sm text-[#667085]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                                  <span className="text-sm text-[#475467]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                            data={meetingRequest.minister_attendees}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Minister Support table */}
                  {meetingRequest.minister_support && meetingRequest.minister_support.length > 0 && (
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
                        دعم الوزير
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
                                render: (_row: any, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                              },
                              {
                                id: 'support_description',
                                header: 'وصف الدعم',
                                width: 'w-[971px]',
                                align: 'end',
                                render: (row: any) => (
                                  <span className="text-sm text-[#475467] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                                    {row.support_description || '-'}
                                  </span>
                                ),
                              },
                            ] as TableColumn<any>[]}
                            data={meetingRequest.minister_support}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              {meetingRequest.attachments && meetingRequest.attachments.length > 0 && (
                <div className="flex flex-col items-center gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
                  <div className="flex flex-col gap-4 w-full max-w-[1085px]">
                    <h2
                      className="text-right w-full"
                      style={{
                        fontFamily: "'Ping AR + LT', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '38px',
                        color: '#101828',
                      }}
                    >
                      المرفقات
                    </h2>
                    <div className="flex flex-row gap-4 flex-wrap">
                      {meetingRequest.attachments.map((att) => (
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
                </div>
              )}

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
                  {meetingRequest.content_officer_notes && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        ملاحظات مسؤول المحتوى
                      </label>
                      <p
                        className="text-base text-gray-700 text-right whitespace-pre-wrap leading-relaxed"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.content_officer_notes}
                      </p>
                    </div>
                  )}
                  {meetingRequest.related_guidance && (
                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <label
                        className="text-sm font-semibold text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        التوجيهات المرتبطة
                      </label>
                      <p
                        className="text-base text-gray-700 text-right leading-relaxed"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_guidance}
                      </p>
                    </div>
                  )}
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

        </div>
      </div>

      {/* Submit Consultation Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
             تقديم استشارة
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
               محتوى الاستشارة
              </label>
              <Textarea
                value={consultationResponse}
                onChange={(e) => setConsultationResponse(e.target.value)}
                placeholder="أدخل محتوى الاستشارة..."
                className="min-h-[300px] text-right"
                dir="rtl"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              />
            </div>
            
            {/* Toggle for scheduling suitability */}
            <div className="flex flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span
                className="text-sm font-medium text-gray-900 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                هل الطلب مناسب للجدولة
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
  );
};

export default ConsultationRequestDetail;
