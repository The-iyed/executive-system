import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, X, Send, FileCheck, ClipboardCheck, RotateCcw, Calendar, Info } from 'lucide-react';
import { StatusBadge } from '@shared/components';
import { MeetingStatus, MeetingStatusLabels, getMeetingTypeLabel, getMeetingClassificationLabel } from '@shared/types';
import { Tabs } from '@shared/components';
import { getMeetingById } from '../data/meetingsApi';
import { MeetingType, MeetingClassification } from '@shared/types';

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('basic-info');

  // Fetch meeting data from API
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  // Map status to MeetingStatus enum
  const meetingStatus = meeting?.status as MeetingStatus || MeetingStatus.UNDER_REVIEW;
  const statusLabel = MeetingStatusLabels[meetingStatus] || meeting?.status || 'قيد المراجعة';
  
  // Check if meeting has attachments (presentations)
  const hasAttachments = meeting?.attachments && meeting.attachments.length > 0;
  const hasPresentations = meeting?.attachments?.some(att => att.is_presentation) || false;

  const tabs = [
    { id: 'basic-info', label: 'المعلومات الأساسية' },
    { id: 'content', label: 'المحتوى' },
    { id: 'scheduling', label: 'الجدولة' },
    { id: 'attachments', label: 'المرفقات' },
    { id: 'history', label: 'السجل' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  // Error state
  if (error || !meeting) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6">
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
                  مراجعة طلب الاجتماع ({meeting.request_number})
                </h1>
                <StatusBadge status={meetingStatus} label={statusLabel} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Alert Box */}
          {hasAttachments && (
            <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 flex flex-row items-start gap-3 relative">
              <button className="absolute -top-1 -right-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 flex flex-col gap-2">
                <p
                  className="text-sm font-semibold text-gray-700 text-right"
                  style={{ fontFamily: "'Somar Sans', sans-serif" }}
                >
                  يمكنك تغيير أي قيمة في طلب الاجتماع قام بإدخالها مقدم الطلب.
                </p>
                {hasPresentations && (
                  <p
                    className="text-sm text-gray-600 text-right"
                    style={{ fontFamily: "'Somar Sans', sans-serif" }}
                  >
                    تنبيه: هذا الطلب يحتوي على مرفقات (عروض تقديمية). يجب إرسال الطلب إلى مسؤول المحتوى أولاً لمراجعة جاهزية العرض وإعداد الملخص التنفيذي قبل جدولة الاجتماع. لا يمكن جدولة الاجتماع مباشرة عند وجود مرفقات.
                  </p>
                )}
              </div>
              <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </div>
          )}

          {/* Form Fields - Basic Information */}
          {activeTab === 'basic-info' && (
            <div className="flex flex-col gap-4">
              {/* Row 1 */}
              <div className="flex flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2 items-end">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    نوع الاجتماع
                  </label>
                  <div className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                    <span className="flex-1 text-right text-gray-600 text-base" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {meeting.meeting_type ? getMeetingTypeLabel(meeting.meeting_type as MeetingType) : '-------------'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 items-end">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    عنوان الاجتماع
                  </label>
                  <div className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                    <span className="flex-1 text-right text-gray-600 text-base" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {meeting.meeting_title || '-------------'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2 items-end">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    تصنيف الاجتماع
                  </label>
                  <div className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                    <span className="flex-1 text-right text-gray-600 text-base" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {meeting.meeting_classification ? getMeetingClassificationLabel(meeting.meeting_classification as MeetingClassification) : '-------------'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 items-end">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                  >
                    موضوع الاجتماع
                  </label>
                  <div className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                    <span className="flex-1 text-right text-gray-600 text-base" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      {meeting.meeting_subject || '-------------'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Tab Content */}
          {activeTab !== 'basic-info' && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">محتويات {tabs.find(t => t.id === activeTab)?.label} قريباً</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="max-w-5xl mx-auto mt-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg border border-gray-200">
            <div className="flex flex-row items-center gap-1.5 justify-center flex-wrap">
              {/* Reject Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors">
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  رفض
                </span>
                <X className="w-5 h-5" />
              </button>

              {/* Send to Content Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity">
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  إرسال للمحتوى
                </span>
                <Send className="w-5 h-5" />
              </button>

              {/* Request Guidance Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors">
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  طلب توجيه
                </span>
                <FileCheck className="w-5 h-5" />
              </button>

              {/* Request Consultation Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-full transition-colors">
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  طلب استشارة
                </span>
                <ClipboardCheck className="w-5 h-5" />
              </button>

              {/* Return to Request Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white rounded-full transition-opacity">
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  إعادة للطلب
                </span>
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Schedule Button - Disabled */}
              <button
                disabled={hasPresentations}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-opacity ${
                  hasPresentations
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] hover:opacity-90 text-white'
                }`}
              >
                <span className="text-base font-bold" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                  جدولة
                </span>
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;

