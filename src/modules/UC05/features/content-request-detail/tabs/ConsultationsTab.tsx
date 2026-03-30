/**
 * UC05 Consultations tab – chat UI + inline consultant input + analyze modal.
 */
import React from 'react';
import {
  ClipboardCheck, Loader2, Users, Search, X,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea, Input,
} from '@/lib/ui';
import { StatusBadge, MeetingStatus } from '@/modules/shared';
import { formatTimeAgoArabic } from '@/modules/shared/utils';
import type { ConsultationRecord } from '../../../../UC02/data/meetingsApi';
import { CONSULTATION_STATUS_LABELS } from '../constants';
import { getAssigneeDisplayName } from '../utils';
import type { useContentRequestDetailPage } from '../hooks/useContentRequestDetailPage';

type HookReturn = ReturnType<typeof useContentRequestDetailPage>;

export interface ConsultationsTabProps {
  h: HookReturn;
}

export function ConsultationsTab({ h }: ConsultationsTabProps) {
  const contentRequest = h.contentRequest!;
  const meetingStatus = h.meetingStatus;
  const schedulingContentNote = h.schedulingContentNote;

  const flattenItems = (row: ConsultationRecord) => {
    const flat: Array<{ id: string; text: string; status: string; name: string; respondedAt: string | null; requestNumber: string | null }> = [];
    if (row.assignees?.length) {
      row.assignees.forEach((a) => {
        if (a.answers?.length) {
          a.answers.forEach((ans, ai) => {
            flat.push({
              id: (ans as any).answer_id ?? (ans as any).id ?? `ans-${flat.length}`,
              text: (ans as any).text ?? (ans as any).answer ?? '',
              status: a.status, name: getAssigneeDisplayName(a),
              respondedAt: (ans as any).responded_at ?? null, requestNumber: a.request_number,
            });
          });
        } else {
          flat.push({ id: a.user_id, text: '', status: a.status, name: getAssigneeDisplayName(a), respondedAt: a.responded_at, requestNumber: a.request_number });
        }
      });
    } else if (row.consultation_answers?.length) {
      row.consultation_answers.forEach((a, ai) =>
        flat.push({
          id: (a as any).consultation_id || (a as any).external_id || `ans-${ai}`,
          text: (a as any).consultation_answer ?? '', status: a.status,
          name: row.consultant_name || '', respondedAt: (a as any).responded_at ?? null,
          requestNumber: row.consultation_request_number || null,
        }),
      );
    } else if (row.assignee_sections?.length) {
      row.assignee_sections.forEach((a) =>
        flat.push({
          id: a.user_id, text: a.answers?.join(' | ') || '', status: a.status,
          name: getAssigneeDisplayName({ assignee_name: a.assignee_name }),
          respondedAt: a.responded_at, requestNumber: a.consultation_record_number || null,
        }),
      );
    }
    return flat;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background min-h-0" dir="rtl">
      {/* Chat messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {h.isLoadingConsultationRecords ? (
          <div className="flex items-center justify-center py-16"><div className="text-muted-foreground">جاري التحميل...</div></div>
        ) : h.consultationRecords && h.consultationRecords.items.length > 0 ? (
          (() => {
            const filteredItems = h.consultationRecords.items.filter((row: ConsultationRecord) => {
              const recordType = row.type || row.consultation_type || '';
              if (recordType === 'CONTENT') return true;
              const question = (row.question || row.consultation_question || '').toString().trim().replace(/\s+/g, ' ');
              const schedulingNote = schedulingContentNote.trim().replace(/\s+/g, ' ');
              if (recordType === 'SCHEDULING' && schedulingNote && question === schedulingNote) return false;
              return true;
            });
            if (filteredItems.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><ClipboardCheck className="w-6 h-6 text-muted-foreground" /></div>
                  <p className="text-[15px] font-semibold text-foreground">سجل الاستشارات</p>
                  <p className="text-[13px] text-muted-foreground">لا توجد استشارات بعد</p>
                </div>
              );
            }
            return (
              <div className="flex flex-col pb-4">
                {filteredItems.map((row: ConsultationRecord, index: number) => {
                  const recordId = row.id || row.consultation_id || `${index}`;
                  const recordType = row.type || row.consultation_type || '';
                  const recordQuestion = row.question || row.consultation_question || '';
                  const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                  const rawRequester = row.consultant_name || contentRequest?.submitter_name || h.user?.username || '-';
                  const requesterName = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawRequester))
                    ? (contentRequest?.submitter_name || 'مقدم الطلب') : rawRequester;
                  const flatItems = flattenItems(row);

                  return (
                    <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                      {/* Question bubble */}
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start gap-3" dir="rtl">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{requesterName?.charAt(0)?.toUpperCase() || '?'}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">{requesterName}</span>
                              <span className="text-[11px] text-muted-foreground">{requestDate}</span>
                              {row.round_number != null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 font-medium">الجولة {row.round_number}</span>
                              )}
                              {row.status && <StatusBadge status={row.status} label={CONSULTATION_STATUS_LABELS[row.status] || row.status} />}
                            </div>
                            <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                              <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{recordQuestion || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Response bubbles */}
                      <div className="px-5 pb-5 pt-1">
                        {flatItems.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {flatItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-3" dir="ltr">
                                <div className="flex-shrink-0">
                                  <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-amber-800">{item.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-foreground">{item.name || '-'}</span>
                                    {item.respondedAt && <span className="text-[11px] text-muted-foreground">{formatTimeAgoArabic(item.respondedAt)}</span>}
                                    <StatusBadge status={item.status} label={CONSULTATION_STATUS_LABELS[item.status] || item.status} />
                                  </div>
                                  <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                    <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{item.text?.trim() || '—'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {flatItems.length > 1 && (
                              <div className="flex justify-end mt-2" dir="rtl">
                                <button type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const sentences = flatItems.map((r) => r.text).filter(Boolean);
                                    if (sentences.length > 0) { h.setAnalyzingRecordId(recordId); h.analyzeContradictionsMutation.mutate(sentences); }
                                  }}
                                  disabled={h.analyzeContradictionsMutation.isPending && h.analyzingRecordId === recordId}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {h.analyzeContradictionsMutation.isPending && h.analyzingRecordId === recordId ? 'جاري التحليل...' : 'تقييم التعارض بين افادات المستشارين'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border border-dashed border-border rounded-xl w-fit" dir="ltr">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">لا يوجد رد بعد</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center"><ClipboardCheck className="w-6 h-6 text-muted-foreground" /></div>
            <p className="text-[15px] font-semibold text-foreground">سجل الاستشارات</p>
            <p className="text-[13px] text-muted-foreground">لا توجد استشارات بعد</p>
          </div>
        )}
      </div>

      {/* Inline chat input */}
      {meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT && meetingStatus !== MeetingStatus.SCHEDULED_ADDITIONAL_INFO && (
        <div className="flex-shrink-0 border-t border-border bg-muted/30 rounded-b-2xl px-6 pb-6 pt-4">
          {h.showConsultantPicker && (
            <div className="px-5 pt-4 pb-2 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">اختر المستشار</span>
                {h.selectedConsultantId && (
                  <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">1 مستشار</span>
                )}
              </div>
              <div className="relative mb-2">
                <Input type="text" value={h.consultantSearch}
                  onChange={(e) => h.setConsultantSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد..."
                  className="h-9 text-right text-sm rounded-lg border-border bg-background pr-3 pl-8" />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border bg-background">
                {h.isLoadingConsultants ? (
                  <div className="py-4 text-center"><Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" /></div>
                ) : h.consultants.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
                ) : (
                  <div className="py-1">
                    {h.consultants.map((c) => {
                      const isSelected = h.selectedConsultantId === c.id;
                      return (
                        <button key={c.id} type="button"
                          onClick={() => h.setSelectedConsultantId(isSelected ? '' : c.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-right transition-colors hover:bg-muted ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {c.first_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <span className="text-sm text-foreground">{c.first_name} {c.last_name}</span>
                            <span className="text-[11px] text-muted-foreground mr-1.5">{c.email}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {h.selectedConsultantId && (() => {
                const selected = h.consultants.find((c) => c.id === h.selectedConsultantId);
                return selected ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                      {selected.first_name} {selected.last_name}
                      <button type="button" onClick={() => h.setSelectedConsultantId('')} className="hover:text-primary/80"><X className="w-3 h-3" /></button>
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); if (!h.selectedConsultantId || !h.consultationNotes.trim()) return; h.handleSubmitConsultation('submit'); }}
            className="flex items-end gap-3 px-5 py-4"
          >
            <button type="button" onClick={() => h.setShowConsultantPicker((v) => !v)}
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors border relative ${h.showConsultantPicker ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary'}`}
              title="اختيار المستشار">
              <Users className="w-5 h-5" />
              {h.selectedConsultantId && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">1</span>
              )}
            </button>
            <div className="flex-1 relative">
              <Textarea value={h.consultationNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => h.setConsultationNotes(e.target.value)}
                placeholder={!h.selectedConsultantId ? 'اختر المستشار أولاً ثم اكتب سؤالك...' : 'اكتب سؤال الاستشارة...'}
                className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-border bg-background resize-none focus:border-primary focus:ring-primary/20"
                rows={1}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (h.selectedConsultantId && h.consultationNotes.trim()) h.handleSubmitConsultation('submit'); }
                }}
              />
            </div>
            <button type="submit"
              disabled={!h.selectedConsultantId || !h.consultationNotes.trim() || h.submitConsultationMutation.isPending}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {h.submitConsultationMutation.isPending ? (<Loader2 className="w-5 h-5 animate-spin" />) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-180">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ─── Analyze contradictions modal ─── */}
      <Dialog open={h.isAnalyzeModalOpen} onOpenChange={h.setIsAnalyzeModalOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تقييم التعارض بين افادات المستشارين</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 space-y-6">
            {(() => {
              const categoriesWithContradictions = (h.analyzeResult?.categories ?? []).filter((c) => c.contradictions && c.contradictions.length > 0);
              return categoriesWithContradictions.length > 0 ? (
                categoriesWithContradictions.map((category, idx) => (
                  <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
                    <div className="px-4 py-3 bg-amber-100/80 border-b border-amber-200">
                      <h4 className="text-base font-semibold text-amber-900 text-right">يوجد تعارض في: {category.category_name || `الفئة ${idx + 1}`}</h4>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-3 list-none">
                        {category.contradictions.map((item, i) => {
                          if (typeof item === 'string') {
                            return <li key={i} className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-foreground text-right">{item}</li>;
                          }
                          const obj = item as { statements?: string[]; severity?: string; comment?: string };
                          const statementsText = obj.statements?.length ? obj.statements.join(' ← → ') : '';
                          if (!statementsText && !obj.severity && !obj.comment) return null;
                          return (
                            <li key={i} className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-right space-y-2">
                              {statementsText && <p className="text-sm text-foreground">{statementsText}</p>}
                              {obj.severity && <p className="text-xs font-medium text-amber-800">درجة التعارض: {obj.severity}</p>}
                              {obj.comment && <p className="text-sm text-muted-foreground">{obj.comment}</p>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))
              ) : h.analyzeContradictionsMutation.isError ? (
                <p className="text-center text-destructive py-4">حدث خطأ أثناء تحليل التعارضات. يرجى المحاولة لاحقاً.</p>
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد تعارضات في النتيجة.</p>
              );
            })()}
          </div>
          <DialogFooter className="border-t pt-4">
            <button type="button" onClick={() => h.setIsAnalyzeModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted text-sm font-medium">إغلاق</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
