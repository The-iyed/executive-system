/**
 * Scheduling consultation chat tab – استشارة الجدولة (chat-style Q&A).
 * Self-contained: fetches records, manages consultant picker, sends new consultations.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, Loader2, Search } from 'lucide-react';
import {
  StatusBadge,
  formatTimeAgoArabic,
} from '@/modules/shared';
import { MeetingStatus } from '@/modules/shared/types';
import {
  getConsultationRecordsWithParams,
  getConsultants,
  requestSchedulingConsultation,
  type ConsultationRecord,
  type ConsultantUser,
} from '../../../data/meetingsApi';
import { Textarea, Input } from '@/lib/ui';

export interface SchedulingConsultationChatTabProps {
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

export function SchedulingConsultationChatTab({
  meetingId,
  meetingStatus,
}: SchedulingConsultationChatTabProps) {
  const queryClient = useQueryClient();

  const [showConsultantPicker, setShowConsultantPicker] = useState(false);
  const [form, setForm] = useState({
    consultant_user_ids: [] as string[],
    consultation_question: '',
    search: '',
  });

  // Fetch consultation records
  const { data: consultationRecords, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['consultation-records', meetingId, 'SCHEDULING'],
    queryFn: () =>
      getConsultationRecordsWithParams(meetingId, {
        consultation_type: 'SCHEDULING',
      }),
    enabled: !!meetingId,
  });

  // Fetch consultants for picker
  const { data: consultantsResponse, isLoading: isLoadingConsultants } =
    useQuery({
      queryKey: ['consultants', form.search, 'SCHEDULING_CONSULTANT'],
      queryFn: () =>
        getConsultants({
          search: form.search,
          role_code: 'SCHEDULING_CONSULTANT',
          page: 1,
          limit: 50,
        }),
      enabled: true,
    });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // Submit consultation
  const consultationMutation = useMutation({
    mutationFn: (payload: {
      consultant_user_ids: string[];
      consultation_question: string;
    }) =>
      requestSchedulingConsultation(meetingId, {
        consultant_user_ids: payload.consultant_user_ids,
        consultation_question: payload.consultation_question,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meeting', meetingId],
      });
      queryClient.invalidateQueries({
        queryKey: ['consultation-records', meetingId, 'SCHEDULING'],
      });
      setShowConsultantPicker(false);
      setForm({
        consultant_user_ids: [],
        consultation_question: '',
        search: '',
      });
    },
  });

  const toggleConsultantSelection = (userId: string) => {
    setForm((prev) =>
      prev.consultant_user_ids.includes(userId)
        ? {
            ...prev,
            consultant_user_ids: prev.consultant_user_ids.filter(
              (id) => id !== userId
            ),
          }
        : {
            ...prev,
            consultant_user_ids: [...prev.consultant_user_ids, userId],
          }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.consultant_user_ids.length === 0) return;
    const questionTrimmed = form.consultation_question.trim();
    if (!questionTrimmed) return;
    consultationMutation.mutate({
      consultant_user_ids: form.consultant_user_ids,
      consultation_question: questionTrimmed,
    });
  };

  return (
    <div
      className="flex flex-col w-full max-h-[600px] rounded-2xl border border-[#E5E7EB] bg-white"
      dir="rtl"
    >
      {/* Scrollable messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoadingRecords ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#048F86]" />
          </div>
        ) : consultationRecords && consultationRecords.items.length > 0 ? (
          <div className="flex flex-col pb-4">
            {[...consultationRecords.items]
              .reverse()
              .map((row: ConsultationRecord, index: number) => {
                const requestDate = row.requested_at
                  ? formatTimeAgoArabic(row.requested_at)
                  : '-';
                const recordQuestion =
                  row.question || row.consultation_question || '';
                const requesterName = row.consultant_name || '-';

                // Collect all responses
                const flatItems: Array<{
                  id: string;
                  text: string;
                  status: string;
                  name: string;
                  respondedAt: string | null;
                }> = [];
                if (row.assignees?.length) {
                  row.assignees.forEach((a: any) => {
                    if (a.answers?.length) {
                      a.answers.forEach((ans: any) =>
                        flatItems.push({
                          id: ans.answer_id,
                          text: ans.text,
                          status: a.status,
                          name: a.name,
                          respondedAt: ans.responded_at,
                        })
                      );
                    } else {
                      flatItems.push({
                        id: a.user_id,
                        text: '',
                        status: a.status,
                        name: a.name,
                        respondedAt: a.responded_at,
                      });
                    }
                  });
                } else if (row.consultation_answers?.length) {
                  row.consultation_answers.forEach((a: any) =>
                    flatItems.push({
                      id:
                        a.consultation_id ||
                        a.external_id ||
                        `ans-${index}`,
                      text: a.consultation_answer,
                      status: a.status,
                      name: row.consultant_name || '',
                      respondedAt: a.responded_at,
                    })
                  );
                }

                return (
                  <div
                    key={`consultation-${
                      row.id || row.consultation_id || index
                    }-${index}`}
                    className="flex flex-col gap-0"
                  >
                    {/* Question bubble */}
                    <div className="px-5 pt-5 pb-3">
                      <div className="flex items-start gap-3" dir="rtl">
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#048F86]">
                              {requesterName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#1F2937]">
                              {requesterName}
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
                              {recordQuestion || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Responses */}
                    {flatItems.length > 0 ? (
                      flatItems.map((item) => (
                        <div key={item.id} className="px-5 pb-3 pt-1">
                          <div
                            className="flex items-start gap-3"
                            dir="ltr"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                                <span className="text-xs font-bold text-[#92400E]">
                                  {item.name?.charAt(0)?.toUpperCase() ||
                                    '?'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[#1F2937]">
                                  {item.name || '-'}
                                </span>
                                {item.respondedAt && (
                                  <span className="text-[11px] text-[#9CA3AF]">
                                    {formatTimeAgoArabic(item.respondedAt)}
                                  </span>
                                )}
                                <StatusBadge
                                  status={item.status}
                                  label={
                                    STATUS_LABELS[item.status] ||
                                    item.status
                                  }
                                />
                              </div>
                              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                                  {item.text || 'لا يوجد رد'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 pb-5 pt-1">
                        <div
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit"
                          dir="ltr"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                          <p className="text-sm text-[#9CA3AF]">
                            لا يوجد رد بعد
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#98A2B3]" />
            </div>
            <p className="text-[15px] font-semibold text-[#344054]">
              استشارة الجدولة
            </p>
            <p className="text-[13px] text-[#667085]">
              لا توجد استشارات مسجلة
            </p>
          </div>
        )}
      </div>

      {/* Consultant picker + input area */}
      {meetingStatus !== MeetingStatus.REJECTED &&
        meetingStatus !== MeetingStatus.CLOSED &&
        meetingStatus !== MeetingStatus.CANCELLED && (
          <div className="flex-shrink-0 border-t border-[#F3F4F6] bg-[#FAFAFA] rounded-b-2xl">
            {/* Consultant picker */}
            {showConsultantPicker && (
              <div className="px-5 pt-4 pb-2">
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 max-h-[200px] overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <Input
                      value={form.search}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      placeholder="ابحث عن مستشار..."
                      className="pr-9 text-right text-sm h-9"
                    />
                  </div>
                  {isLoadingConsultants ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[#048F86]" />
                    </div>
                  ) : consultants.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {consultants.map((c) => {
                        const isSelected =
                          form.consultant_user_ids.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleConsultantSelection(c.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-right transition-colors w-full ${
                              isSelected
                                ? 'bg-[#048F86]/10 text-[#048F86] font-medium'
                                : 'hover:bg-[#F3F4F6] text-[#344054]'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                isSelected
                                  ? 'bg-[#048F86] text-white'
                                  : 'bg-[#F3F4F6] text-[#6B7280]'
                              }`}
                            >
                              {c.first_name?.charAt(0)?.toUpperCase() ||
                                '?'}
                            </div>
                            <span className="flex-1 truncate">
                              {c.first_name} {c.last_name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9CA3AF] text-center py-3">
                      لا يوجد مستشارون
                    </p>
                  )}
                </div>
                {/* Selected chips */}
                {form.consultant_user_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.consultant_user_ids.map((uid) => {
                      const user = consultants.find((c) => c.id === uid);
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-1 bg-[#048F86]/10 text-[#048F86] text-xs font-medium px-2 py-1 rounded-full"
                        >
                          {user
                            ? `${user.first_name} ${user.last_name}`
                            : uid}
                          <button
                            type="button"
                            onClick={() => toggleConsultantSelection(uid)}
                            className="hover:text-[#037A72]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Input row */}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3 px-5 py-4"
            >
              <button
                type="button"
                onClick={() => setShowConsultantPicker((v) => !v)}
                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors border ${
                  showConsultantPicker
                    ? 'bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]'
                    : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#048F86]/40 hover:text-[#048F86]'
                }`}
                title="اختيار المستشارين"
              >
                <Users className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Textarea
                  value={form.consultation_question}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((prev) => ({
                      ...prev,
                      consultation_question: e.target.value,
                    }))
                  }
                  placeholder={
                    form.consultant_user_ids.length === 0
                      ? 'اختر المستشارين أولاً ثم اكتب سؤالك...'
                      : 'اكتب سؤال الاستشارة...'
                  }
                  className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-[#E5E7EB] bg-white resize-none focus:border-[#048F86] focus:ring-[#048F86]/20"
                  rows={1}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (
                        form.consultant_user_ids.length > 0 &&
                        form.consultation_question.trim()
                      ) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={
                  form.consultant_user_ids.length === 0 ||
                  !form.consultation_question.trim() ||
                  consultationMutation.isPending
                }
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#048F86] hover:bg-[#037A72] text-white"
              >
                {consultationMutation.isPending ? (
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
