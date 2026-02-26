import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Download, Eye, User, Mail, Phone, Building2 } from 'lucide-react';
import { Tabs, StatusBadge } from '@shared/components';
import {
  MeetingStatus,
  getMeetingStatusLabel,
  getMeetingTypeLabel,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
  getDirectiveMethodLabel,
  SectorLabels,
  Sector,
} from '@shared/types';
import { getConsultationRequestById, submitConsultationResponse, saveConsultationAsDraft, getPendingConsultations } from '../data/consultationsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';


/** Safely format related_guidance which may be a string or a directive object/array from the API */
function formatRelatedGuidance(value: unknown): string {
  if (value == null) return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '-';
  }
  if (Array.isArray(value)) {
    const texts = value
      .map((d: { directive_text?: string }) => (d?.directive_text != null ? String(d.directive_text) : ''))
      .filter(Boolean);
    return texts.length > 0 ? texts.join(' ') : '-';
  }
  if (typeof value === 'object' && value !== null && 'directive_text' in value) {
    const text = (value as { directive_text?: string }).directive_text;
    return text != null && String(text).trim() !== '' ? String(text).trim() : '-';
  }
  return '-';
}

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
  // Show consultation_question from pending API response; fallback to detail API
  const consultationQuestion =
    pendingConsultation?.consultation_question ??
    consultationData?.consultation_question ??
    '';

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

  // Submit consultation mutation (sends consultation_answers to API)
  const submitMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string }) => {
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

  // Save as draft mutation (sends consultation_answers to API)
  const saveDraftMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string }) => {
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
      consultation_answers: consultationResponse,
    });
  };

  const handleSaveAsDraft = () => {
    saveDraftMutation.mutate({
      feasibility_answer: isSuitableForScheduling,
      consultation_answers: consultationResponse,
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
        {/* Submit Consultation Tab */}
        {activeTab === 'submit-consultation' && (
          <div className="flex flex-col gap-6">
            {/* Consultation Question Section */}
            <div
              className="flex flex-col justify-center items-end p-[10px_34px_10px_10px] gap-[10px] w-full max-w-[1321px] mx-auto"
            >
              <div className="flex flex-col items-start p-0 gap-[10px] w-full">
                  <div className="flex flex-col items-start p-0 gap-[4px] w-full">
                    {/* Title */}
                    <h2
                      className="w-full h-[38px] font-bold text-lg leading-[38px] text-right text-[#101828]"
                      style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        lineHeight: '38px',
                      }}
                    >
                      سؤال جدوى جدولة الاجتماع
                    </h2>

                    {/* Question Content */}
                    <div className="flex flex-col items-start p-0 gap-4 w-full">
                      <p
                        className="w-full text-base leading-6 text-right text-[#475467]"
                        style={{
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
                        className="w-[138px] whitespace-nowrap h-5 font-bold text-base leading-6 text-white"
                        style={{
                          fontFamily: "'Almarai', sans-serif",
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
            </div>
          )}

          {/* Request Info Tab */}
          {activeTab === 'request-info' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* رقم الطلب */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-lg font-semibold text-gray-900 text-right"
                    
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
                    className="text-lg font-semibold text-gray-900 text-right"
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
                    className="text-lg font-semibold text-gray-900 text-right"
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
                    className="text-lg font-semibold text-gray-900 text-right"
                    
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
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* هل تطلب الاجتماع نيابة عن غيرك؟ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      هل تطلب الاجتماع نيابة عن غيرك؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.is_on_behalf_of === true
                        ? 'نعم'
                        : meetingRequest.is_on_behalf_of === false
                          ? 'لا'
                          : '-'}
                    </div>
                  </div>
                  {/* مالك الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      مالك الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.current_owner_user
                        ? `${meetingRequest.current_owner_user.first_name ?? ''} ${meetingRequest.current_owner_user.last_name ?? ''}`.trim()
                        : meetingRequest.current_owner_role?.name_ar ?? meetingRequest.submitter_name ?? '-'}
                    </div>
                  </div>
                  {/* عنوان الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      عنوان الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.meeting_title || '-'}
                    </div>
                  </div>
                  {/* القطاع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      القطاع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {SectorLabels[meetingRequest.sector as Sector] || '-'}
                    </div>
                  </div>
                  {/* نوع الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      نوع الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getMeetingTypeLabel(meetingRequest.meeting_type) || '-'}
                    </div>
                  </div>
                  {/* وصف الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      وصف الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.meeting_subject || '-'}
                    </div>
                  </div>
                  {/* اجتماع عاجل؟ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      اجتماع عاجل؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.is_urgent === true
                        ? 'نعم'
                        : meetingRequest.is_urgent === false
                          ? 'لا'
                          : meetingRequest.is_direct_schedule === true
                            ? 'نعم'
                            : meetingRequest.is_direct_schedule === false
                              ? 'لا'
                              : '-'}
                    </div>
                  </div>
                  {/* السبب */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      السبب
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.urgent_reason || '-'}
                    </div>
                  </div>
                  {/* موعد الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      موعد الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.scheduled_at
                        ? new Date(meetingRequest.scheduled_at).toLocaleString('ar-SA')
                        : '-'}
                    </div>
                  </div>
                  {/* آلية انعقاد الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      آلية انعقاد الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getMeetingChannelLabel(meetingRequest.meeting_channel) || '-'}
                    </div>
                  </div>
                  {/* الموقع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      الموقع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.location ?? (meetingRequest.selected_time_slot?.location ?? '-')}
                    </div>
                  </div>
                  {/* هل يتطلب بروتوكول؟ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      هل يتطلب بروتوكول؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.requires_protocol === true
                        ? 'نعم'
                        : meetingRequest.requires_protocol === false
                          ? 'لا'
                          : '-'}
                    </div>
                  </div>
                  {/* فئة الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      فئة الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getMeetingClassificationLabel(meetingRequest.meeting_classification) || '-'}
                    </div>
                  </div>
                  {/* مبرّر اللقاء */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      مبرّر اللقاء
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.meeting_justification || '-'}
                    </div>
                  </div>
                  {/* موضوع التكليف المرتبط */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      موضوع التكليف المرتبط
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.related_topic || '-'}
                    </div>
                  </div>
                  {/* تاريخ الاستحقاق */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      تاريخ الاستحقاق
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.deadline
                        ? new Date(meetingRequest.deadline).toLocaleDateString('ar-SA')
                        : '-'}
                    </div>
                  </div>
                  {/* تصنيف الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      تصنيف الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getMeetingClassificationTypeLabel(meetingRequest.meeting_classification_type) || '-'}
                    </div>
                  </div>
                  {/* سريّة الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      سريّة الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getMeetingConfidentialityLabel(meetingRequest.meeting_confidentiality) || '-'}
                    </div>
                  </div>
                  {/* اجتماع متسلسل؟ */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      اجتماع متسلسل؟
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.is_sequential === true
                        ? 'نعم'
                        : meetingRequest.is_sequential === false
                          ? 'لا'
                          : '-'}
                    </div>
                  </div>
                  {/* الاجتماع السابق */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      الاجتماع السابق
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.previous_meeting_id || '-'}
                    </div>
                  </div>
                  {/* الرقم التسلسلي */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      الرقم التسلسلي
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.sequential_number != null
                        ? String(meetingRequest.sequential_number)
                        : '-'}
                    </div>
                  </div>
                  {/* أجندة الاجتماع */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      أجندة الاجتماع
                    </label>
                    {meetingRequest.agenda_items && meetingRequest.agenda_items.length > 0 ? (
                      <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-[#F9FAFB]">
                        <table className="w-full text-sm text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          <thead>
                            <tr className="border-b border-gray-300 bg-[#F2F4F7]">
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[100px] text-center">رقم البند</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold">بند جدول الأعمال</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[160px] text-center">مدة العرض (دقيقة)</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[180px] text-center">نوع دعم الوزير</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetingRequest.agenda_items.map((item: any, idx: number) => (
                              <tr key={item.id} className={idx < (meetingRequest.agenda_items?.length ?? 0) - 1 ? 'border-b border-gray-200' : ''}>
                                <td className="px-4 py-3 text-[#475467] text-center">{idx + 1}</td>
                                <td className="px-4 py-3 text-[#101828]">{item.agenda_item || '-'}</td>
                                <td className="px-4 py-3 text-[#475467] text-center">{item.presentation_duration_minutes ?? '-'}</td>
                                <td className="px-4 py-3 text-[#475467] text-center">{item.minister_support_type || item.minister_support_other || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                        -
                      </div>
                    )}
                  </div>
                  {/* هل طلب الاجتماع بناءً على توجيه من معالي الوزير */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      هل طلب الاجتماع بناءً على توجيه من معالي الوزير
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0
                        ? 'نعم'
                        : meetingRequest.is_direct_schedule === true
                          ? 'نعم'
                          : meetingRequest.is_direct_schedule === false
                            ? 'لا'
                            : '-'}
                    </div>
                  </div>
                  {/* طريقة التوجيه */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      طريقة التوجيه
                    </label>
                    <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {getDirectiveMethodLabel(meetingRequest.directive_method) || '-'}
                    </div>
                  </div>
                  {/* محضر الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      محضر الاجتماع
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {meetingRequest.protocol_type || '-'}
                    </div>
                  </div>
                  {/* التوجيه */}
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      التوجيه
                    </label>
                    <div className="w-full min-h-[44px] flex items-start px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                      {formatRelatedGuidance(meetingRequest.related_guidance)}
                    </div>
                  </div>
                  {/* ملاحظات */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-lg font-semibold text-gray-900 text-right">
                      ملاحظات
                    </label>
                    {Array.isArray(meetingRequest.general_notes) && meetingRequest.general_notes.length > 0 ? (
                      <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-[#F9FAFB]">
                        <table className="w-full text-sm text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          <thead>
                            <tr className="border-b border-gray-300 bg-[#F2F4F7]">
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[80px] text-center">رقم</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold">الملاحظة</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[150px] text-center">المصدر</th>
                              <th className="px-4 py-3 text-[#475467] font-semibold whitespace-nowrap w-[180px] text-center">التاريخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetingRequest.general_notes.map((note: any, idx: number) => (
                              <tr key={note.id || idx} className={idx < (meetingRequest.general_notes?.length ?? 0) - 1 ? 'border-b border-gray-200' : ''}>
                                <td className="px-4 py-3 text-[#475467] text-center">{idx + 1}</td>
                                <td className="px-4 py-3 text-[#101828] whitespace-pre-wrap">{note.text || '-'}</td>
                                <td className="px-4 py-3 text-[#475467] text-center">{note.author_name || ({ SCHEDULING: 'الجدولة', CONTENT: 'المحتوى', CONTENT_CONSULTATION: 'استشارة المحتوى', EXECUTIVE_OFFICE: 'المكتب التنفيذي', GUIDANCE: 'التوجيه', SYSTEM: 'النظام', SUBMITTER: 'مقدّم الطلب', MINISTER: 'الوزير' } as Record<string, string>)[note.author_type] || note.author_type || '-'}</td>
                                <td className="px-4 py-3 text-[#475467] text-center">{note.created_at ? new Date(note.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="w-full min-h-[44px] flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-[#F9FAFB] text-base text-gray-900 text-right">
                        -
                      </div>
                    )}
                  </div>
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
                      style={{ fontFamily: "'Almarai', sans-serif" }}
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
                              <span className="text-sm font-medium text-[#344054] text-right whitespace-nowrap overflow-hidden text-ellipsis">
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
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                        لا يوجد عرض تقديمي مرفق
                      </p>
                    )}
                  </div>

                  {/* Optional Attachments */}
                  <div className="flex flex-col gap-3">
                    <h3
                      className="text-lg font-semibold text-right text-[#101828]"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
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
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                        لا توجد مرفقات اختيارية
                      </p>
                    )}
                  </div>
                </div>

                {/* Presentation Attachment Timing */}
                <div className="flex flex-col gap-2 max-w-sm">
                  <label
                    className="text-lg font-semibold text-gray-900 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    متى سيتم إرفاق العرض؟
                  </label>
                  <p
                    className="text-base text-gray-900 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
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
                {/* Invitees cards - قائمة المدعوين (مقدم الطلب) */}
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
                    قائمة المدعوين (مقدم الطلب)
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

                {/* Minister attendees cards - قائمة المدعوين (الوزير) */}
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
                    قائمة المدعوين (الوزير)
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
                      لا توجد قائمة مدعوين من الوزير
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

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
                  className="text-lg font-semibold text-gray-900 text-right"
                  
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
                  fontFamily: "'Almarai', sans-serif",
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
                  fontFamily: "'Almarai', sans-serif",
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