/**
 * Scheduling consultation tab – استشارة الجدولة (collapsible cards).
 */
import React from 'react';
import { ClipboardCheck, Clock, Hash } from 'lucide-react';
import { StatusBadge, formatDateTimeArabic } from '@/modules/shared';
import type { ConsultationRecord } from '../../../data/meetingsApi';
import { MeetingStatus } from '@/modules/shared/types';

export interface SchedulingConsultationTabProps {
  meetingStatus: MeetingStatus;
  onRequestConsultation: () => void;
  isLoading: boolean;
  records: { items: ConsultationRecord[] } | undefined;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
}

const STATUS_LABELS: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

export function SchedulingConsultationTab({
  meetingStatus,
  onRequestConsultation,
  isLoading,
  records,
  expandedId,
  onToggleExpand,
}: SchedulingConsultationTabProps) {
  const showRequestButton =
    meetingStatus !== MeetingStatus.WAITING &&
    meetingStatus !== MeetingStatus.CLOSED &&
    meetingStatus !== MeetingStatus.UNDER_CONTENT_REVIEW &&
    meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT;

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      {showRequestButton && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRequestConsultation}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
          >
            <ClipboardCheck className="w-5 h-5" strokeWidth={1.26} />
            طلب استشارة
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">جاري التحميل...</div>
        </div>
      ) : records && records.items.length > 0 ? (
        records.items.map((row: ConsultationRecord, index: number) => {
          const recordId = row.id || row.consultation_id || `${index}`;
          const recordType = row.type || row.consultation_type || '';
          const recordQuestion = row.question || row.consultation_question || '';
          const isExpanded = expandedId === recordId;
          const typeLabel = recordType === 'SCHEDULING' ? 'السؤال' : recordType === 'CONTENT' ? 'محتوى' : recordType;
          const requestDate = row.requested_at ? formatDateTimeArabic(row.requested_at) : '-';
          const displayRequestNumber = row.assignees?.[0]?.request_number || row.consultation_request_number || '';

          const flatItems: Array<{ id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null }> = [];
          if (row.assignees?.length) {
            row.assignees.forEach((a: any) => {
              if (a.answers?.length) {
                a.answers.forEach((ans: any) => flatItems.push({ id: ans.answer_id, text: ans.text, status: a.status, name: a.name, respondedAt: ans.responded_at, requestNumber: a.request_number }));
              } else {
                flatItems.push({ id: a.user_id, text: '', status: a.status, name: a.name, respondedAt: a.responded_at, requestNumber: a.request_number });
              }
            });
          } else if (row.consultation_answers?.length) {
            row.consultation_answers.forEach((a: any) => flatItems.push({ id: a.consultation_id || a.external_id || `ans-${index}`, text: a.consultation_answer, status: a.status, name: row.consultant_name || '', respondedAt: a.responded_at, requestNumber: row.consultation_request_number || null }));
          } else if (row.assignee_sections?.length) {
            row.assignee_sections.forEach((a: any) => flatItems.push({ id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status, name: a.assignee_name, respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null }));
          }

          return (
            <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
              <button
                type="button"
                onClick={() => onToggleExpand(isExpanded ? null : recordId)}
                className={`w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2 ${isExpanded ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}`}
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                <div className="flex flex-row items-start justify-between gap-4">
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <p className="text-base font-bold text-[#048F86] mb-1">{typeLabel}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{recordQuestion || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
                  </div>
                </div>
              </button>

              {isExpanded && flatItems.length > 0 && (
                <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                  {flatItems.map((_, idx) => (
                    <div key={`line-${idx}`} className="flex flex-shrink-0 w-12 flex-col items-center pt-1" style={idx > 0 ? { position: 'absolute', top: `${47 * idx}px`, height: `${136 * idx}px` } : {}}>
                      <div className={`w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] max-h-[60%] ${flatItems.length > 1 ? '-mt-[38px]' : '-mt-[10px]'}`} />
                      <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                    </div>
                  ))}
                  <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                    {flatItems.map((item) => {
                      const responseDate = item.respondedAt ? formatDateTimeArabic(item.respondedAt) : '—';
                      return (
                        <div key={item.id} className="flex h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                          <div className="flex w-full flex-row items-center justify-between gap-4">
                            <p className="min-w-0 flex-1 truncate text-right text-sm text-gray-700">{item.text?.trim() || '—'}</p>
                            <StatusBadge status={item.status} label={STATUS_LABELS[item.status] || item.status} />
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
                    <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[9px] max-h-[60%]" />
                    <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                  </div>
                  <div className="z-[2] mt-4 flex h-[44px] min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 mb-4" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
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
  );
}
