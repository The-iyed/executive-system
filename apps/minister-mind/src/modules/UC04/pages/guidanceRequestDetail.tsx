import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Download, Eye } from 'lucide-react';
import { Tabs, StatusBadge, DataTable } from '@shared/components';
import type { TableColumn } from '@shared';
import {
  MeetingStatus,
  getMeetingStatusLabel,
  getMeetingTypeLabel,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
  getInviteeResponseStatusLabel,
} from '@shared/types';
import { getGuidanceRequestById, provideGuidance, saveGuidanceAsDraft, completeGuidance } from '../data/guidanceApi';
import { getGuidanceRecords, type GuidanceRecord } from '../../UC02/data/meetingsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@sanad-ai/ui';
import { PATH } from '../routes/paths';
import pdfIcon from '../../shared/assets/pdf.svg';

const GuidanceRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('guidance-request');
  const [guidanceResponse, setGuidanceResponse] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(false);
  const [queriesDisabled, setQueriesDisabled] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);

  // Fetch guidance request data from API
  const { data: guidanceData, isLoading, error } = useQuery({
    queryKey: ['guidance-request', id],
    queryFn: () => getGuidanceRequestById(id!),
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

  const meetingRequest = guidanceData?.meeting_request;
  const guidanceQuestion = guidanceData?.guidance_question || '';

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
      id: 'directives-log',
      label:  'سجلات التوجيهات',
    },
    {
      id: 'invitees',
      label: 'قائمة المدعوين',
    },
  ];

  const queryClient = useQueryClient();

  // Submit guidance mutation
  const submitMutation = useMutation({
    mutationFn: (data: { guidance_notes: string; feasibility_answer: boolean }) => {
      if (!meetingRequest?.id) throw new Error('Meeting request ID is required');
      return provideGuidance(meetingRequest.id, data);
    },
    onSuccess: () => {
      // Disable queries first to prevent any new requests
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
      navigate(PATH.GUIDANCE_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting guidance:', error);
      // TODO: Show error toast/notification
    },
  });

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: { guidance_notes: string; feasibility_answer: boolean }) => {
      if (!meetingRequest?.id) throw new Error('Meeting request ID is required');
      return saveGuidanceAsDraft(meetingRequest.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guidance-request', id] });
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
    });
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

          {/* Guidance Request Tab */}
          {activeTab === 'guidance-request' && (
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
                    <div className="flex flex-col items-start p-0 gap-4 w-full min-h-[80px]">
                      <p
                        className="w-full text-base leading-6 text-right text-[#475467]"
                        style={{
                          fontFamily: "'Ping AR + LT', sans-serif",
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
                       تقديم توجيه 
                      </span>
                    </div>
                  </button>
                </div>
              </div>
                  {/* Request Info Section */}
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

                  <div className="flex flex-row justify-start items-center gap-2">
                    {guidanceRecordsWithDrafts && guidanceRecordsWithDrafts?.items?.filter((item) => !!item.is_draft)?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsDraftsModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-[#F2F4F7] text-[#344054] rounded-full border-2 border-[#D0D5DD] transition-opacity hover:bg-gray-100 cursor-pointer"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                      className="text-md pasis font-medium text-gray-700 text-right"
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

                  {/* حالة الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md pasis font-medium text-gray-700 text-right"
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

                  {/* مقدم الطلب */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md pasis font-medium text-gray-700 text-right"
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

                  {/* مالك الاجتماع */}
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-md pasis font-medium text-gray-700 text-right"
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
                        : meetingRequest.current_owner_role?.name_ar ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
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
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        نوع الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {getMeetingTypeLabel(meetingRequest.meeting_type) || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
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
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        تصنيف الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {getMeetingClassificationLabel(meetingRequest.meeting_classification) || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        فئة الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {getMeetingClassificationTypeLabel(meetingRequest.meeting_classification_type) ||
                          getMeetingClassificationLabel(meetingRequest.meeting_classification) ||
                          '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        هل تطلب الاجتماع نيابة عن غيرك؟
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.is_on_behalf_of === true
                          ? 'نعم'
                          : meetingRequest.is_on_behalf_of === false
                          ? 'لا'
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
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
                          : meetingRequest.current_owner_role?.name_ar ?? '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        القطاع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.sector || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        سريّة الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {getMeetingConfidentialityLabel(meetingRequest.meeting_confidentiality) || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        اجتماع عاجل؟
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.is_direct_schedule === true
                          ? 'نعم'
                          : meetingRequest.is_direct_schedule === false
                          ? 'لا'
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        اجتماع متسلسل؟
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.is_sequential === true
                          ? 'نعم'
                          : meetingRequest.is_sequential === false
                          ? 'لا'
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 6 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        الاجتماع السابق
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.previous_meeting_id || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        الرقم التسلسلي
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.sequential_number ??
                          (meetingRequest.sequential_number === 0
                            ? '0'
                            : '-')}
                      </p>
                    </div>
                  </div>

                  {/* Row 7 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        آلية انعقاد الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {getMeetingChannelLabel(meetingRequest.meeting_channel) || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        الموقع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        -
                      </p>
                    </div>
                  </div>

                  {/* Row 8 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        موعد الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.scheduled_at
                          ? new Date(meetingRequest.scheduled_at).toLocaleString(
                              'ar-SA'
                            )
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        تاريخ الاستحقاق
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.deadline
                          ? new Date(meetingRequest.deadline).toLocaleDateString(
                              'ar-SA'
                            )
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 9 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        هل يتطلب بروتوكول؟
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.requires_protocol === true
                          ? 'نعم'
                          : meetingRequest.requires_protocol === false
                          ? 'لا'
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        مبرّر اللقاء
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.meeting_justification || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 10 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        موضوع التكليف المرتبط
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_topic || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        وصف الاجتماع
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

              {/* Additional Details Section */}
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  تفاصيل إضافية
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Row 11 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        هل طلب الاجتماع بناءً على توجيه من معالي الوزير
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_directive_ids &&
                        meetingRequest.related_directive_ids.length > 0
                          ? 'نعم'
                          : 'لا'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        طريقة التوجيه
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_directive_ids &&
                        meetingRequest.related_directive_ids.length > 0
                          ? 'توجيه رسمي'
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row 12 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        التوجيه
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.related_guidance || '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        محضر الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        -
                      </p>
                    </div>
                  </div>

                  {/* Row 13 */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        أجندة الاجتماع
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.agenda_items &&
                        meetingRequest.agenda_items.length > 0
                          ? `${meetingRequest.agenda_items.length} بند`
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        ملاحظات
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.general_notes ||
                          meetingRequest.content_officer_notes ||
                          '-'}
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
                    {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 ? (
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
                    ) : (
                      <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        لا يوجد حضور من جهة الوزير
                      </p>
                    )}
                  </div>

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
                    {meetingRequest.minister_support && meetingRequest.minister_support.length > 0 ? (
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
                    ) : (
                      <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        لا يوجد دعم من الوزير
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {meetingRequest.attachments && meetingRequest.attachments.length > 0 && (
                <div className="flex flex-col items-start gap-6 w-full max-w-[1321px] mx-auto" dir="rtl">
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

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                >
                  المحتوى
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Row 1 */}
                  <div className="flex flex-row gap-4">
                    {/* العرض التقديمي */}
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        العرض التقديمي
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.attachments &&
                        meetingRequest.attachments.some((a) => a.is_presentation)
                          ? `${meetingRequest.attachments.filter((a) => a.is_presentation).length} ملف`
                          : '-'}
                      </p>
                    </div>

                    {/* متى سيتم إرفاق العرض؟ */}
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        متى سيتم إرفاق العرض؟
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        -
                      </p>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-row gap-4">
                    {/* مرفقات اختيارية */}
                    <div className="flex-1 flex flex-col gap-2">
                      <label
                        className="text-md pasis font-medium text-gray-700 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        مرفقات اختيارية
                      </label>
                      <p
                        className="text-base text-gray-900 text-right"
                        style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      >
                        {meetingRequest.attachments &&
                        meetingRequest.attachments.some((a) => a.is_additional)
                          ? `${meetingRequest.attachments.filter((a) => a.is_additional).length} ملف`
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directives Log Tab */}
          {activeTab === 'directives-log' && (
            <div className="flex flex-col gap-4">
              {isLoadingGuidanceRecords ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      id: 'guidance_question',
                      header: 'السؤال',
                      width: 'flex-1',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.guidance_question}
                        </span>
                      ),
                    },
                    {
                      id: 'guidance_answer',
                      header: 'الإجابة',
                      width: 'flex-1',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.guidance_answer || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_by_name',
                      header: 'طلب بواسطة',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.requested_by_name}
                        </span>
                      ),
                    },
                    {
                      id: 'responded_by_name',
                      header: 'رد بواسطة',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => (
                        <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                          {row.responded_by_name || '-'}
                        </span>
                      ),
                    },
                    {
                      id: 'requested_at',
                      header: 'تاريخ الطلب',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => {
                        const date = new Date(row.requested_at);
                        const formattedDate = date.toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                            {formattedDate}
                          </span>
                        );
                      },
                    },
                    {
                      id: 'responded_at',
                      header: 'تاريخ الرد',
                      width: 'w-40',
                      render: (row: GuidanceRecord) => {
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
                          <span className="text-sm whitespace-nowrap text-gray-700" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
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
                      render: (row: GuidanceRecord) => {
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
                  data={guidanceRecords.items}
                  rowPadding="py-3"
                />
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
                {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 ? (
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
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    لا يوجد حضور من جهة الوزير
                  </p>
                )}
                  </div>

                  {/* minister_support - دعم الوزير */}
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
                {meetingRequest.minister_support && meetingRequest.minister_support.length > 0 ? (
                      <div className="w-full overflow-x-auto table-scroll">
                        <div className="min-w-[1085px]">
                          <DataTable
                            columns={[
                              {
                                id: 'index',
                                header: 'رقم البند',
                                width: 'w-[120px]',
                                align: 'center',
                                render: (_row: any, index: number) => <span className="text-sm text-[#475467]">{index + 1}</span>,
                              },
                              {
                                id: 'support_description',
                                header: 'وصف الدعم',
                                width: 'flex-1',
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
                ) : (
                  <p className="text-base text-gray-500 text-right py-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    لا يوجد دعم من الوزير
                  </p>
                )}
                  </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Guidance Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle
              className="text-right"
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
            >
             تقديم توجيه
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-md pasis font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
               محتوى التوجيه
              </label>
              <Textarea
                value={guidanceResponse}
                onChange={(e) => setGuidanceResponse(e.target.value)}
                placeholder="أدخل محتوى التوجيه..."
                className="min-h-[300px] text-right"
                dir="rtl"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              />
            </div>
            
            {/* Toggle for scheduling suitability */}
            <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-row items-center justify-between w-full">
                <span
                  className="text-sm font-semibold text-gray-900"
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
                fontFamily: "'Ping AR + LT', sans-serif",
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
                fontFamily: "'Ping AR + LT', sans-serif",
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
                fontFamily: "'Ping AR + LT', sans-serif",
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
              style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
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
                          style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                        >
                          سؤال التوجيه:
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
                        {draft.guidance_question}
                      </p>
                    </div>

                    {draft.guidance_answer && (
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

export default GuidanceRequestDetail;
