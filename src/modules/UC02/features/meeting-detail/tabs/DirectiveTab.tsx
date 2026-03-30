/**
 * Directive tab – سؤال / استشارة المكتب التنفيذي (guidance records).
 */
import React from 'react';
import { FileCheck, Clock, User } from 'lucide-react';
import { StatusBadge, formatDateTimeArabic } from '@/modules/shared';
import type { GuidanceRecord } from '../../../data/meetingsApi';
import { MeetingStatus } from '@/modules/shared/types';

export interface DirectiveTabProps {
  meetingStatus: MeetingStatus;
  onRequestGuidance: () => void;
  isLoading: boolean;
  records: { items: GuidanceRecord[] } | undefined;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
}

const STATUS_LABELS: Record<string, string> = { PENDING: 'قيد الانتظار', RESPONDED: 'تم الرد', CANCELLED: 'ملغاة', COMPLETED: 'مكتمل', DRAFT: 'مسودة', SUPERSEDED: 'معلق' };

export function DirectiveTab({
  meetingStatus,
  onRequestGuidance,
  isLoading,
  records,
  expandedId,
  onToggleExpand,
}: DirectiveTabProps) {
  const showRequestButton =
    meetingStatus !== MeetingStatus.WAITING &&
    meetingStatus !== MeetingStatus.CLOSED &&
    meetingStatus !== MeetingStatus.RETURNED_FROM_SCHEDULING;

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      {showRequestButton && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRequestGuidance}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)', boxShadow: '0px 1px 2px rgba(16,24,40,0.05)' }}
          >
            <FileCheck className="w-5 h-5" strokeWidth={1.26} />
            طلب استشارة
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">جاري التحميل...</div>
        </div>
      ) : records && records.items.length > 0 ? (
        <div className="flex flex-col gap-4 w-full" dir="rtl">
          {records.items.map((row: GuidanceRecord, index: number) => {
            const isExpanded = expandedId === row.guidance_id;
            const requestDate = row.requested_at ? formatDateTimeArabic(row.requested_at) : '-';

            return (
              <div key={`guidance-${row.guidance_id}-${index}`} className="flex flex-col gap-0">
                <button
                  type="button"
                  onClick={() => onToggleExpand(isExpanded ? null : row.guidance_id)}
                  className={`w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2 ${isExpanded ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'}`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <p className="text-base font-bold text-[#048F86] mb-1">السؤال</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{row.guidance_question || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {row.status && <StatusBadge status={row.status} label={STATUS_LABELS[row.status] || row.status} />}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>تاريخ الطلب : {requestDate}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span>{row.requested_by_name || '-'}</span>
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && row.guidance_answer && (
                  <div className="flex w-full flex-row items-stretch gap-0 mt-0 relative" dir="rtl">
                    <div className="flex flex-shrink-0 w-12 flex-col items-center pt-1">
                      <div className="w-[50px] -ml-[30px] min-h-[8px] flex-1 border-r-2 border-b-2 rounded-br-lg z-[1] -mt-[38px] max-h-[60%]" />
                      <div className="w-2 h-2 flex-shrink-0 -mt-[5.5px] -ml-[40px] z-[2] rounded-full bg-gray-400" />
                    </div>
                    <div className="z-[2] mt-4 mb-4 flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex min-h-[44px] items-center rounded-xl border border-gray-200 bg-white px-4 py-3" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                        <div className="flex w-full flex-row items-center justify-between gap-4">
                          <p className="min-w-0 flex-1 text-right text-sm text-gray-700 whitespace-pre-wrap">{row.guidance_answer}</p>
                          <StatusBadge status={row.status} label={STATUS_LABELS[row.status] || row.status} />
                          {row.responded_by_name && (
                            <>
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600">{row.responded_by_name?.charAt(0)?.toUpperCase() || '?'}</div>
                              <span className="flex-shrink-0 text-sm text-gray-700">{row.responded_by_name}</span>
                            </>
                          )}
                          {row.responded_at && (
                            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                              <Clock className="h-4 w-4 flex-shrink-0" /><span>تاريخ الرد : {formatDateTimeArabic(row.responded_at)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isExpanded && !row.guidance_answer && (
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
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">استشارة المكتب التنفيذي</p>
            <p className="text-gray-500 text-sm">لا توجد استشارات مسجلة</p>
          </div>
        </div>
      )}
    </div>
  );
}
