/**
 * Content tab – العرض التقديمي، مرفقات اختيارية، الملخّص التنفيذي، ملاحظات.
 * Self-contained: manages its own AI comparison/insights state and modals.
 */
import { useState, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileCheck, FileText, ClipboardCheck, Plus, Trash2, Download, Eye, GitCompare, Sparkles, Lightbulb, AlertCircle, Loader2, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/lib/ui';
import { formatDateArabic } from '@/modules/shared';
import { PdfIcon } from '@/lib/ui/assets/icons/PdfIcon';
import {
  runCompareByAttachment, getAttachmentInsightsWithPolling,
  type ComparePresentationsResponse, type AttachmentInsightsResponse,
} from '../../../data/meetingsApi';
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

  // Computed data
  const generalNotesList = useMemo(() => getGeneralNotesList(meeting.general_notes), [meeting.general_notes]);
  const presentationAttachments = useMemo(() => (meeting.attachments || []).filter((a) => a.is_presentation), [meeting.attachments]);
  const optionalAttachments = useMemo(() => {
    const prevId = meeting.previous_meeting_attachment?.id ?? null;
    return (meeting.attachments || []).filter((a) => !a.is_presentation && !a.is_executive_summary && (prevId == null || a.id !== prevId));
  }, [meeting.attachments, meeting.previous_meeting_attachment?.id]);

  const contentOfficerNotesDisplay = useMemo(() => {
    const raw: unknown = meeting.content_officer_notes;
    if (raw != null) {
      if (typeof raw === 'string') return raw.trim() || '—';
      if (Array.isArray(raw)) return raw.map((n: { text?: string }) => (n?.text ?? '').trim()).filter(Boolean).join('\n\n') || '—';
      if (typeof raw === 'object' && 'text' in raw) return ((raw as { text?: string }).text ?? '—').trim() || '—';
    }
    return '—';
  }, [meeting.content_officer_notes]);

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

  const closeCompare = () => {
    compareAbortRef.current?.abort(); compareAbortRef.current = null;
    setIsCompareOpen(false); setCompareResult(null); setCompareError(null); setCompareNoReplace(false);
  };
  const closeInsights = () => {
    insightsAbortRef.current?.abort(); insightsAbortRef.current = null;
    setInsightsAtt(null); insightsMutation.reset();
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full self-stretch" dir="rtl" style={{ width: '100%', minWidth: 0, flex: '1 1 0%' }}>

      {/* ─── التوجيهات المرتبطة بالاجتماع ─── */}
      {contentApprovalDirectivesRows.length > 0 && (
        <section className="rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
            <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
              <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-bold text-[#1F2937]">التوجيهات المرتبطة بالاجتماع</h3>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-12">#</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">التوجيه</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-32">الموعد النهائي</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6B7280] w-28">الحالة</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#6B7280] min-w-[120px]">المعينون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9FAFB]">
                {contentApprovalDirectivesRows.map((row: any, index: number) => {
                  const d = row.deadline ? new Date(row.deadline) : null;
                  const assigneesList = (row.responsible_persons ?? '').split(/[،,]/).map((s: string) => s.trim()).filter(Boolean);
                  return (
                    <tr key={index} className="group hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-3.5 text-[#9CA3AF] font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5 text-[#374151]" dir="rtl">{row.directive_text || '—'}</td>
                      <td className="px-4 py-3.5 text-[#6B7280]">{d ? formatDateArabic(d) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F3F4F6] text-[#374151] text-xs font-medium">
                          {translateCompareValue(row.directive_status, { PENDING: 'قيد الانتظار', IN_PROGRESS: 'قيد التنفيذ', COMPLETED: 'مكتمل', CANCELLED: 'ملغى', CLOSED: 'مغلق', OPEN: 'مفتوح' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" dir="rtl">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {assigneesList.length === 0 ? <span className="text-[#9CA3AF]">—</span> : assigneesList.map((email: string, i: number) => (
                            <span key={`${email}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#048F86]/8 text-[#048F86] text-xs font-medium">{email}</span>
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

      {/* ─── العرض التقديمي ─── */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
              <FileCheck className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-bold text-[#1F2937]">العرض التقديمي</h3>
          </div>
        </div>
        <div className="p-6">
          <TooltipProvider>
            <div className="flex flex-col gap-3">
              {presentationAttachments.length > 0 ? presentationAttachments.map((att) => {
                const seq = att.presentation_sequence ?? 0;
                const showCompare = seq > 1;
                return (
                  <div key={att.id} className="group flex items-center gap-4 px-5 py-4 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#048F86]/40 hover:shadow-[0_2px_12px_rgba(4,143,134,0.08)] transition-all duration-200">
                    {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon /> : <div className="w-11 h-11 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                    <div className="flex flex-col items-end min-w-0 flex-1">
                      <div className="flex items-center gap-2 w-full justify-end flex-wrap">
                        {seq > 0 && <span className="text-[10px] font-medium text-[#048F86] bg-[#048F86]/10 px-2 py-0.5 rounded-full flex-shrink-0">نسخة {seq}</span>}
                        <span className="text-sm font-semibold text-[#1F2937] truncate">{att.file_name}</span>
                      </div>
                      <span className="text-xs text-[#9CA3AF] mt-0.5">{Math.round((att.file_size || 0) / 1024)} KB</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <button type="button" onClick={() => { if (!showCompare || compareByAttachmentMutation.isPending) return; compareAbortRef.current?.abort(); compareAbortRef.current = new AbortController(); setCompareResult(null); setCompareError(null); setIsCompareOpen(true); compareByAttachmentMutation.mutate({ attachmentId: att.id, signal: compareAbortRef.current.signal }); }} disabled={compareByAttachmentMutation.isPending} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#048F86]/35 bg-[#048F86]/5 hover:bg-[#048F86]/12 text-[#048F86] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap" style={!showCompare ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}>
                              <GitCompare className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                              <span>مقارنة بالذكاء الاصطناعي</span>
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-right">
                          <p>{showCompare ? 'مقارنة هذا العرض مع النسخة السابقة' : 'المقارنة متاحة عندما يكون رقم التسلسل أكبر من 1'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#048F86]/8 text-[#048F86] transition-colors"><Download className="w-4 h-4" /></a>
                      <button type="button" onClick={() => onPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                    </div>
                    {/* AI insights button */}
                    <button onClick={() => { insightsAbortRef.current?.abort(); insightsAbortRef.current = new AbortController(); setInsightsAtt({ id: att.id, file_name: att.file_name }); insightsMutation.reset(); insightsMutation.mutate({ attachmentId: att.id, signal: insightsAbortRef.current.signal }); }} disabled={insightsMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-l from-[#048F86] to-[#34C3BA] shadow-[0_2px_8px_rgba(4,143,134,0.25)] hover:shadow-[0_4px_16px_rgba(4,143,134,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex-shrink-0 disabled:opacity-50">
                      <span>ملاحظات بالذكاء الاصطناعي</span>
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                );
              }) : (
                <div className="flex flex-col rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] py-6 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.2} />
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] text-[#374151]">لا يوجد عرض تقديمي</p>
                      <p className="text-sm text-[#9CA3AF] mt-0.5">أضف عرضاً تقديمياً للاجتماع</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>
        </div>
      </section>

      {/* ─── مرفقات اختيارية ─── */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
              <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-bold text-[#1F2937]">مرفقات اختيارية</h3>
          </div>
        </div>
        <div className="p-6">
          {optionalAttachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {optionalAttachments.map((att) => (
                <div key={att.id} className="group flex items-center gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#048F86]/30 hover:shadow-sm transition-all duration-200">
                  {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon /> : <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                  <div className="flex flex-col items-end min-w-0 flex-1">
                    <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{att.file_name}</span>
                    <span className="text-xs text-[#9CA3AF]">{Math.round((att.file_size || 0) / 1024)} KB</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#048F86]/8 text-[#048F86] transition-colors"><Download className="w-4 h-4" /></a>
                    <button type="button" onClick={() => onPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAFB] py-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.2} />
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-[#374151]">لا توجد مرفقات اختيارية</p>
                  <p className="text-sm text-[#9CA3AF] mt-0.5">يمكنك إرفاق مستندات إضافية إن رغبت</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── الملخّص التنفيذي ─── */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
            <FileText className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
          </div>
          <h3 className="text-[15px] font-bold text-[#1F2937]">الملخّص التنفيذي</h3>
        </div>
        <div className="p-6">
          {(() => {
            const execText = meeting.executive_summary != null && String(meeting.executive_summary).trim() !== '' ? String(meeting.executive_summary) : null;
            const execAtts = (meeting.attachments ?? []).filter((a) => a.is_executive_summary === true);
            if (!execText && execAtts.length === 0) {
              return (
                <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-[#6B7280]">لا يوجد ملخّص تنفيذي</p>
                </div>
              );
            }
            return (
              <div className="flex flex-col gap-4">
                {execText && <div className="w-full px-5 py-4 bg-[#FFFBEB]/50 border border-[#FDE68A]/40 rounded-xl text-right text-[#78350F] leading-relaxed text-sm whitespace-pre-wrap">{execText}</div>}
                {execAtts.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {execAtts.map((att) => (
                      <div key={att.id} className="group flex items-center gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#92400E]/30 hover:shadow-sm transition-all duration-200">
                        {att.file_type?.toLowerCase() === 'pdf' ? <PdfIcon /> : <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xs font-bold text-[#DC2626] flex-shrink-0">{att.file_type?.toUpperCase() || ''}</div>}
                        <div className="flex flex-col items-end min-w-0 flex-1">
                          <span className="text-sm font-medium text-[#1F2937] truncate w-full text-right">{att.file_name}</span>
                          <span className="text-xs text-[#9CA3AF]">{Math.round((att.file_size || 0) / 1024)} KB</span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[#92400E]/8 text-[#92400E] transition-colors"><Download className="w-4 h-4" /></a>
                          <button type="button" onClick={() => onPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type })} className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"><Eye className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ─── ملاحظات ─── */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
            <ClipboardCheck className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
          </div>
          <h3 className="text-[15px] font-bold text-[#1F2937]">ملاحظات</h3>
        </div>
        <div className="p-6">
          {(() => {
            const notesText = generalNotesList.length > 0 ? generalNotesList.map((n) => n.text).join('\n\n') : '';
            const hasGeneral = generalNotesList.length > 0 || (notesText !== '' && notesText !== '—');
            const hasCO = contentOfficerNotesDisplay && contentOfficerNotesDisplay !== '—';
            if (!hasGeneral && !hasCO) {
              return (
                <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#374151]">لا توجد ملاحظات</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">لم تتم إضافة أي ملاحظات لهذا الطلب</p>
                  </div>
                </div>
              );
            }
            return (
              <>
                {hasGeneral && (
                  <div className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-right text-[#374151] leading-relaxed whitespace-pre-wrap text-sm">
                    {generalNotesList.map((n) => n.text).join('\n\n')}
                  </div>
                )}
                {hasCO && (
                  <div className={hasGeneral ? 'mt-5 pt-5 border-t border-[#F3F4F6]' : ''}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-[#F59E0B]/10 flex items-center justify-center">
                        <ClipboardCheck className="w-3.5 h-3.5 text-[#D97706]" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-semibold text-[#92400E]">ملاحظات مسؤول المحتوى</span>
                    </div>
                    <div className="w-full px-5 py-4 bg-[#FFFBEB]/60 border border-[#FDE68A]/40 rounded-xl text-right text-[#78350F] whitespace-pre-wrap text-sm leading-relaxed">
                      {contentOfficerNotesDisplay}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* ─── Compare presentations modal ─── */}
      <Dialog open={isCompareOpen} onOpenChange={(open) => { if (!open) closeCompare(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تقييم الاختلاف بين العروض</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            {compareByAttachmentMutation.isPending ? (
              <p className="text-center text-gray-500 py-6">جاري تقييم الاختلاف بين العروض...</p>
            ) : compareNoReplace ? (
              <p className="text-center text-gray-600 py-6">المقارنة متاحة فقط للعروض التي تحل محل نسخة سابقة.</p>
            ) : compareByAttachmentMutation.isError ? (
              <div className="text-center py-4">
                <p className="text-red-600 font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                {compareError ? <p className="text-gray-700 text-sm mt-2">{compareError}</p> : <p className="text-gray-600 text-sm mt-2">يرجى المحاولة لاحقاً.</p>}
              </div>
            ) : compareResult ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1"><span className="text-gray-500">معرف التقييم</span><span className="font-medium text-gray-900">{compareResult.comparison_id || '—'}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-gray-500">الدرجة الإجمالية</span><span className="font-medium text-gray-900">{compareResult.overall_score ?? '—'}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-gray-500">مستوى الاختلاف</span><span className="font-medium text-gray-900">{translateCompareValue(compareResult.difference_level, COMPARE_LEVEL)}</span></div>
                  <div className="flex flex-col gap-1"><span className="text-gray-500">الحالة</span><span className="font-medium text-gray-900">{translateCompareValue(compareResult.status, COMPARE_STATUS)}</span></div>
                </div>
                {compareResult.regeneration_recommendation && (
                  <div className="flex flex-col gap-1"><span className="text-gray-500 text-sm">توصية إعادة التوليد</span><p className="text-gray-900 whitespace-pre-wrap">{translateCompareValue(compareResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}</p></div>
                )}
                {compareResult.summary && (
                  <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <span className="text-gray-700 font-medium">ملخص الشرائح</span>
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
              <p className="text-gray-500">لا توجد نتيجة لعرضها.</p>
            )}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={closeCompare} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">إغلاق</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AI Insights modal ─── */}
      <Dialog open={!!insightsAtt} onOpenChange={(open) => { if (!open) closeInsights(); }}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden p-0" dir="rtl">
          <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-[#048F86] via-[#06B6A4] to-[#A6D8C1]" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#048F86] to-[#06B6A4]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <DialogHeader className="p-0"><DialogTitle className="text-right text-[16px] font-bold text-[#101828]">تحليل العرض التقديمي</DialogTitle></DialogHeader>
                {insightsAtt?.file_name && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-[#667085] flex-shrink-0" />
                    <span className="text-[13px] text-[#667085] truncate">{insightsAtt.file_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
            {insightsMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-14 w-14 rounded-full bg-[#E6F9F8] flex items-center justify-center"><Loader2 className="h-7 w-7 text-[#048F86] animate-spin" /></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-[#101828]">جاري التحليل...</span>
                  <span className="text-[13px] text-[#667085]">يتم تحليل العرض التقديمي بواسطة الذكاء الاصطناعي</span>
                </div>
              </div>
            ) : insightsMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-red-500" /></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-[#101828]">تعذّر إتمام التحليل</span>
                  <span className="text-[13px] text-[#667085]">حدث خطأ أثناء جلب الملاحظات. يرجى المحاولة لاحقاً.</span>
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
                      <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center"><Check className="h-6 w-6 text-[#667085]" /></div>
                      <span className="text-[14px] text-[#667085]">لا توجد ملاحظات أو اقتراحات على هذا العرض.</span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-5">
                    {notes.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50"><FileText className="h-4 w-4 text-amber-600" /></div>
                          <span className="text-[14px] font-bold text-[#101828]">الملاحظات</span>
                          <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">{notes.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {notes.map((note, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-[#FFFBF5] border border-amber-100">
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold mt-0.5">{idx + 1}</span>
                              <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F9F8]"><Lightbulb className="h-4 w-4 text-[#048F86]" /></div>
                          <span className="text-[14px] font-bold text-[#101828]">الاقتراحات</span>
                          <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">{suggestions.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {suggestions.map((s, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-[#F6FFFE] border border-[#D0F0ED]">
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#D0F0ED] text-[#048F86] text-[11px] font-bold mt-0.5">{idx + 1}</span>
                              <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">{s}</p>
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
                <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center"><FileText className="h-6 w-6 text-[#98A2B3]" /></div>
                <span className="text-[14px] text-[#667085]">لا توجد ملاحظات.</span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button type="button" onClick={closeInsights} className="px-5 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] transition-colors text-[14px] font-semibold shadow-sm">إغلاق</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
