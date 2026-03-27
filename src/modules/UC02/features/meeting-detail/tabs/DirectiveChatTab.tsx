/**
 * Directive chat tab – استشارة المكتب التنفيذي / سؤال (chat-style guidance Q&A).
 * Self-contained: fetches guidance records, manages form, sends new requests.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, Loader2 } from 'lucide-react';
import { StatusBadge, formatTimeAgoArabic } from '@/modules/shared';
import { MeetingStatus } from '@/modules/shared/types';
import {
  getGuidanceRecords,
  requestGuidance,
  type GuidanceRecord,
} from '../../../data/meetingsApi';
import { Textarea } from '@/lib/ui';

export interface DirectiveChatTabProps {
  meetingId: string;
  meetingStatus: MeetingStatus;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  RESPONDED: 'تم الرد',
  CANCELLED: 'ملغاة',
  COMPLETED: 'مكتمل',
  DRAFT: 'مسودة',
  SUPERSEDED: 'معلق',
};

export function DirectiveChatTab({
  meetingId,
  meetingStatus,
}: DirectiveChatTabProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  // Fetch guidance records
  const { data: guidanceRecords, isLoading } = useQuery({
    queryKey: ['guidance-records', meetingId],
    queryFn: () => getGuidanceRecords(meetingId),
    enabled: !!meetingId,
  });

  // Request guidance mutation
  const requestGuidanceMutation = useMutation({
    mutationFn: (payload: { notes: string }) =>
      requestGuidance(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({
        queryKey: ['guidance-records', meetingId],
      });
      setNotes('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    requestGuidanceMutation.mutate({
      notes: notes.trim() || 'يرجى توفير التوجيهات اللازمة حول هذا الطلب',
    });
  };

  return (
    <div
      className="flex flex-col w-full max-h-[600px] rounded-2xl border border-[#E5E7EB] bg-white"
      dir="rtl"
    >
      {/* Scrollable messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#048F86]" />
          </div>
        ) : guidanceRecords && guidanceRecords.items.length > 0 ? (
          <div className="flex flex-col pb-4">
            {[...guidanceRecords.items]
              .reverse()
              .map((row: GuidanceRecord, index: number) => {
                const requestDate = row.requested_at
                  ? formatTimeAgoArabic(row.requested_at)
                  : '-';

                return (
                  <div
                    key={`guidance-${row.guidance_id}-${index}`}
                    className="flex flex-col gap-0"
                  >
                    {/* Question bubble */}
                    <div className="px-5 pt-5 pb-3">
                      <div className="flex items-start gap-3" dir="rtl">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#048F86]">
                              {row.requested_by_name
                                ?.charAt(0)
                                ?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#1F2937]">
                              {row.requested_by_name || '-'}
                            </span>
                            <span className="text-[11px] text-[#9CA3AF]">
                              {requestDate}
                            </span>
                            {row.status && (
                              <StatusBadge
                                status={row.status}
                                label={
                                  STATUS_LABELS[row.status] || row.status
                                }
                              />
                            )}
                          </div>
                          <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                            <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                              {row.guidance_question || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response */}
                    <div className="px-5 pb-5 pt-1">
                      {row.guidance_answer ? (
                        <div className="flex items-start gap-3" dir="ltr">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                              <span className="text-xs font-bold text-[#92400E]">
                                {row.responded_by_name
                                  ?.charAt(0)
                                  ?.toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {row.responded_by_name && (
                                <span className="text-sm font-semibold text-[#1F2937]">
                                  {row.responded_by_name}
                                </span>
                              )}
                              {row.responded_at && (
                                <span className="text-[11px] text-[#9CA3AF]">
                                  {formatTimeAgoArabic(row.responded_at)}
                                </span>
                              )}
                            </div>
                            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                              <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                                {row.guidance_answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit"
                          dir="ltr"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                          <p className="text-sm text-[#9CA3AF]">
                            لا يوجد رد بعد
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-[#98A2B3]" />
            </div>
            <p className="text-[15px] font-semibold text-[#344054]">
              استشارة المكتب التنفيذي
            </p>
            <p className="text-[13px] text-[#667085]">
              لا توجد استشارات بعد
            </p>
          </div>
        )}
      </div>

      {/* Input – hidden when meeting is rejected */}
      {meetingStatus !== MeetingStatus.REJECTED &&
        meetingStatus !== MeetingStatus.CLOSED &&
        meetingStatus !== MeetingStatus.CANCELLED && (
          <div className="flex-shrink-0 border-t border-[#F3F4F6] px-5 py-4 bg-[#FAFAFA] rounded-b-2xl">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3"
            >
              <div className="flex-1">
                <Textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value)
                  }
                  placeholder="اكتب سؤالك هنا..."
                  className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-[#E5E7EB] bg-white resize-none focus:border-[#048F86] focus:ring-[#048F86]/20"
                  rows={1}
                  onKeyDown={(
                    e: React.KeyboardEvent<HTMLTextAreaElement>
                  ) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (notes.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={
                  !notes.trim() || requestGuidanceMutation.isPending
                }
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#048F86] hover:bg-[#037A72] text-white"
              >
                {requestGuidanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 rotate-180"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        )}
    </div>
  );
}
