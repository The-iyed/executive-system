/**
 * UC02 Content tab – uses shared ContentInfoView + UC02-specific AI features.
 * AI comparison/insights modals and directives table remain here.
 */
import { useState, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, GitCompare, Sparkles, Lightbulb, AlertCircle, Loader2, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/lib/ui';
import { formatDateArabic } from '@/modules/shared';
import { ContentInfoView, mapMeetingToContentInfo } from '@/modules/shared/features/content-info';
import type { ContentFileItem } from '@/modules/shared/features/content-info';
import {
  runCompareByAttachment, getAttachmentInsightsWithPolling,
  type ComparePresentationsResponse, type AttachmentInsightsResponse,
} from '../../../data/meetingsApi';
import { DIRECTIVE_STATUS_LABELS } from '@/modules/shared/types/minister-directive-enums';
import type { MeetingApiResponse } from '../../../data/meetingsApi';
import { translateCompareValue, getGeneralNotesList } from '../utils/meetingDetailHelpers';
import { COMPARE_STATUS, COMPARE_LEVEL, COMPARE_RECOMMENDATION } from '../constants';

export interface ContentTabProps {
  meeting: MeetingApiResponse;
  onPreviewAttachment: (att: { blob_url: string; file_name: string; file_type?: string }) => void;
}

export function ContentTab({ meeting, onPreviewAttachment }: ContentTabProps) {
  // AI comparison state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareNoReplace, setCompareNoReplace] = useState(false);
  const compareAbortRef = useRef<AbortController | null>(null);

  // AI insights state
  const [insightsAtt, setInsightsAtt] = useState<{ id: string; file_name: string } | null>(null);
  const insightsAbortRef = useRef<AbortController | null>(null);

  const compareByAttachmentMutation = useMutation({
    mutationFn: (p: { attachmentId: string; signal?: AbortSignal }) => runCompareByAttachment(p.attachmentId, { signal: p.signal }),
    onSuccess: (data) => { setCompareResult(data); setCompareError(null); setIsCompareOpen(true); },
    onError: (err: unknown) => {
      if ((err as DOMException)?.name !== 'AbortError') {
        setCompareResult(null);
        const e = err as { response?: { data?: { detail?: string } }; detail?: string };
        setCompareError(typeof e?.response?.data?.detail === 'string' ? e.response.data.detail : typeof e?.detail === 'string' ? e.detail : null);
        setIsCompareOpen(true);
      }
    },
  });

  const insightsMutation = useMutation({
    mutationFn: (p: { attachmentId: string; signal?: AbortSignal }) => getAttachmentInsightsWithPolling(p.attachmentId, { signal: p.signal }),
    onError: (err) => { if ((err as DOMException)?.name !== 'AbortError') console.error('Insights error:', err); },
  });

  // Directives
  const contentApprovalDirectivesRows = useMemo(() => {
    const raw = meeting.content_approval_directives;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((item: any) => {
      if (typeof item === 'string') return { directive_text: item };
      if (item && typeof item === 'object') {
        const text = item.title ?? item.text ?? String(item);
        const dueDate = item.due_date ?? item.deadline;
        const assignees = item.assignees;
        const responsiblePersons = Array.isArray(assignees)
          ? assignees.map((a: any) => (typeof a === 'string' ? a : a?.name ?? String(a))).filter(Boolean).join('، ') || undefined
          : undefined;
        return { directive_number: item.directive_number, directive_date: dueDate, directive_text: text, deadline: dueDate, responsible_persons: responsiblePersons, directive_status: item.status };
      }
      return { directive_text: String(item) };
    });
  }, [meeting.content_approval_directives]);

  // Map meeting → shared content data
  const contentData = useMemo(() => mapMeetingToContentInfo(meeting, { hideEmpty: false }), [meeting]);

  // Presentation sequence map for compare feature
  const presentationSeqMap = useMemo(() => {
    const map = new Map<string, number>();
    (meeting.attachments ?? []).filter(a => a.is_presentation).forEach(a => {
      map.set(a.id, a.presentation_sequence ?? 0);
    });
    return map;
  }, [meeting.attachments]);

  const closeCompare = () => {
    compareAbortRef.current?.abort(); compareAbortRef.current = null;
    setIsCompareOpen(false); setCompareResult(null); setCompareError(null); setCompareNoReplace(false);
  };
  const closeInsights = () => {
    insightsAbortRef.current?.abort(); insightsAbortRef.current = null;
    setInsightsAtt(null); insightsMutation.reset();
  };

  // Render AI action buttons for presentation files
  const renderFileActions = (file: ContentFileItem, sectionKey: string) => {
    if (sectionKey !== 'presentation') return null;
    const seq = presentationSeqMap.get(file.id) ?? 0;
    const showCompare = seq > 1;

    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* AI Compare */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    if (!showCompare || compareByAttachmentMutation.isPending) return;
                    compareAbortRef.current?.abort();
                    compareAbortRef.current = new AbortController();
                    setCompareResult(null); setCompareError(null); setIsCompareOpen(true);
                    compareByAttachmentMutation.mutate({ attachmentId: file.id, signal: compareAbortRef.current.signal });
                  }}
                  disabled={compareByAttachmentMutation.isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  style={!showCompare ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >
                  <GitCompare className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                  <span>مقارنة</span>
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-right">
              <p>{showCompare ? 'مقارنة هذا العرض مع النسخة السابقة' : 'المقارنة متاحة عندما يكون رقم التسلسل أكبر من 1'}</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Notes */}
          <button
            type="button"
            onClick={() => {
              insightsAbortRef.current?.abort();
              insightsAbortRef.current = new AbortController();
              setInsightsAtt({ id: file.id, file_name: file.file_name });
              insightsMutation.reset();
              insightsMutation.mutate({ attachmentId: file.id, signal: insightsAbortRef.current.signal });
            }}
            disabled={insightsMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex-shrink-0 disabled:opacity-40 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ملاحظات AI</span>
          </button>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto" dir="rtl">

      {/* ─── Directives table (UC02-specific) ─── */}
      {contentApprovalDirectivesRows.length > 0 && (
        <section className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/30">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-bold text-foreground">التوجيهات المرتبطة بالاجتماع</h3>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">التوجيه</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-32">الموعد النهائي</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground w-28">الحالة</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground min-w-[120px]">المعينون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {contentApprovalDirectivesRows.map((row: any, index: number) => {
                  const d = row.deadline ? new Date(row.deadline) : null;
                  const assigneesList = (row.responsible_persons ?? '').split(/[،,]/).map((s: string) => s.trim()).filter(Boolean);
                  return (
                    <tr key={index} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 text-muted-foreground font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5 text-foreground" dir="rtl">{row.directive_text || '—'}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{d ? formatDateArabic(d) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium">
                          {translateCompareValue(row.directive_status, { PENDING: 'قيد الانتظار', IN_PROGRESS: 'قيد التنفيذ', COMPLETED: 'مكتمل', CANCELLED: 'ملغى', CLOSED: 'مغلق', OPEN: 'مفتوح' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" dir="rtl">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {assigneesList.length === 0 ? <span className="text-muted-foreground">—</span> : assigneesList.map((email: string, i: number) => (
                            <span key={`${email}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/8 text-primary text-xs font-medium">{email}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Shared Content Sections ─── */}
      <ContentInfoView
        data={contentData}
        onViewFile={(file) => {
          if (!file.blob_url) return;
          onPreviewAttachment({ blob_url: file.blob_url, file_name: file.file_name, file_type: file.file_type });
        }}
        onDownloadFile={(file) => file.blob_url && window.open(file.blob_url, '_blank')}
        renderFileActions={renderFileActions}
      />

      {/* ─── Compare presentations modal ─── */}
      <Dialog open={isCompareOpen} onOpenChange={(open) => { if (!open) closeCompare(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تقييم الاختلاف بين العروض</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            {compareByAttachmentMutation.isPending ? (
              <p className="text-center text-muted-foreground py-6">جاري تقييم الاختلاف بين العروض...</p>
            ) : compareNoReplace ? (
              <p className="text-center text-muted-foreground py-6">المقارنة متاحة فقط للعروض التي تحل محل نسخة سابقة.</p>
            ) : compareByAttachmentMutation.isError ? (
              <div className="text-center py-4">
                <p className="text-destructive font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                {compareError ? <p className="text-foreground text-sm mt-2">{compareError}</p> : <p className="text-muted-foreground text-sm mt-2">يرجى المحاولة لاحقاً.</p>}
              </div>
            ) : compareResult ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1"><span className="text-muted-foreground">معرف التقييم</span><span className="font-medium text-foreground">{compareResult.comparison_id || '—'}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-muted-foreground">الدرجة الإجمالية</span><span className="font-medium text-foreground">{compareResult.overall_score ?? '—'}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-muted-foreground">مستوى الاختلاف</span><span className="font-medium text-foreground">{translateCompareValue(compareResult.difference_level, COMPARE_LEVEL)}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-muted-foreground">الحالة</span><span className="font-medium text-foreground">{translateCompareValue(compareResult.status, COMPARE_STATUS)}</span></div>
                </div>
                {compareResult.regeneration_recommendation && (
                  <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">توصية إعادة التوليد</span><p className="text-foreground whitespace-pre-wrap">{translateCompareValue(compareResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}</p></div>
                )}
                {compareResult.summary && (
                  <div className="flex flex-col gap-2 border border-border rounded-lg p-3 bg-muted/30">
                    <span className="text-foreground font-medium">ملخص الشرائح</span>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>الشرائح الأصلية: {compareResult.summary.total_slides_original ?? '—'}</span>
                      <span>الشرائح الجديدة: {compareResult.summary.total_slides_new ?? '—'}</span>
                      <span>فرق العدد: {compareResult.summary.slide_count_difference ?? '—'}</span>
                      <span>بدون تغيير: {compareResult.summary.unchanged_slides ?? '—'}</span>
                      <span>تغييرات طفيفة: {compareResult.summary.minor_changes ?? '—'}</span>
                      <span>تغييرات متوسطة: {compareResult.summary.moderate_changes ?? '—'}</span>
                      <span>تغييرات كبيرة: {compareResult.summary.major_changes ?? '—'}</span>
                      <span>شرائح جديدة: {compareResult.summary.new_slides ?? '—'}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">لا توجد نتيجة لعرضها.</p>
            )}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={closeCompare} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors">إغلاق</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AI Insights modal ─── */}
      <Dialog open={!!insightsAtt} onOpenChange={(open) => { if (!open) closeInsights(); }}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden p-0" dir="rtl">
          <div className="relative px-6 pt-6 pb-4 border-b border-border">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-primary via-primary/70 to-primary/40" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <DialogHeader className="p-0"><DialogTitle className="text-right text-[16px] font-bold text-foreground">تحليل العرض التقديمي</DialogTitle></DialogHeader>
                {insightsAtt?.file_name && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[13px] text-muted-foreground truncate">{insightsAtt.file_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
            {insightsMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Loader2 className="h-7 w-7 text-primary animate-spin" /></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-foreground">جاري التحليل...</span>
                  <span className="text-[13px] text-muted-foreground">يتم تحليل العرض التقديمي بواسطة الذكاء الاصطناعي</span>
                </div>
              </div>
            ) : insightsMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-destructive" /></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-foreground">تعذّر إتمام التحليل</span>
                  <span className="text-[13px] text-muted-foreground">حدث خطأ أثناء جلب الملاحظات. يرجى المحاولة لاحقاً.</span>
                </div>
              </div>
            ) : insightsMutation.data && insightsAtt?.id === insightsMutation.variables?.attachmentId ? (
              (() => {
                const d = insightsMutation.data as AttachmentInsightsResponse & Record<string, unknown>;
                const notes: string[] = Array.isArray(d.llm_notes) ? d.llm_notes : d.llm_notes != null ? [].concat(d.llm_notes as any) : [];
                const rawSuggestions = d.llm_suggestions ?? (d as any).suggestions;
                const suggestions: string[] = Array.isArray(rawSuggestions) ? rawSuggestions.map((x: unknown) => String(x ?? '')) : rawSuggestions != null ? [].concat(rawSuggestions as any).map((x: unknown) => String(x ?? '')) : [];
                if (notes.length === 0 && suggestions.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><Check className="h-6 w-6 text-muted-foreground" /></div>
                      <span className="text-[14px] text-muted-foreground">لا توجد ملاحظات أو اقتراحات على هذا العرض.</span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-5">
                    {notes.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent"><FileText className="h-4 w-4 text-accent-foreground" /></div>
                          <span className="text-[14px] font-bold text-foreground">الملاحظات</span>
                          <span className="text-[12px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{notes.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {notes.map((note, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-accent/30 border border-accent/50">
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-[11px] font-bold mt-0.5">{idx + 1}</span>
                              <p className="text-[13px] text-foreground leading-[22px] whitespace-pre-wrap flex-1">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"><Lightbulb className="h-4 w-4 text-primary" /></div>
                          <span className="text-[14px] font-bold text-foreground">الاقتراحات</span>
                          <span className="text-[12px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{suggestions.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {suggestions.map((s, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/20">
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-0.5">{idx + 1}</span>
                              <p className="text-[13px] text-foreground leading-[22px] whitespace-pre-wrap flex-1">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground" /></div>
                <span className="text-[14px] text-muted-foreground">لا توجد ملاحظات.</span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <button type="button" onClick={closeInsights} className="px-5 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-[14px] font-semibold shadow-sm">إغلاق</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
