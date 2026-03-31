/**
 * UC05 Content tab – shared ContentInfoView + UC05-specific directives, notes, executive summary.
 * Compare & insights modals are tab-local.
 */
import React, { useMemo } from 'react';
import {
  Trash2, Sparkles, Loader2, Upload, FileText, AlertCircle, ClipboardCheck,
  ListChecks, StickyNote, FileCheck, GitCompareArrows, Eye,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/lib/ui';
import { formatDateArabic } from '@/modules/shared/utils';
import { FormAsyncSelectV2, FormDatePicker, type OptionType } from '@/modules/shared/components';
import { ContentInfoView, mapMeetingToContentInfo, type ContentFileItem } from '@/modules/shared/features/content-info';
import { MeetingStatus } from '@/modules/shared/types';
import type { Attachment, ContentRequestDetailResponse, ActionItem, AttachmentInsightsResponse, ComparePresentationsResponse } from '../../../data/contentApi';
import { ACTION_STATUS_OPTIONS, COMPARE_STATUS, COMPARE_LEVEL, COMPARE_RECOMMENDATION } from '../constants';
import { getNotesText, formatFileSize, startOfLocalDay, translateCompareErrorDetail, translateCompareValue, normalizeAssignees } from '../utils';
import pdfIcon from '../../../../shared/assets/pdf.svg';
import type { useContentRequestDetailPage } from '../hooks/useContentRequestDetailPage';

type HookReturn = ReturnType<typeof useContentRequestDetailPage>;

export interface ContentTabProps {
  h: HookReturn;
}

/* ─── Reusable section card wrapper matching ContentInfoView style ─── */
function SectionWrapper({
  icon: Icon,
  title,
  children,
  headerActions,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-background overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/20 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
        </div>
        <h3 className="text-[13px] font-bold text-foreground flex-1">{title}</h3>
        {headerActions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ContentTab({ h }: ContentTabProps) {
  const contentRequest = h.contentRequest!;
  const meetingStatus = h.meetingStatus;
  const attachments = contentRequest?.attachments ?? [];
  const prevId = (contentRequest as any)?.previous_meeting_attachment?.id ?? null;
  const presAttachments = attachments.filter((a: Attachment) => a.is_presentation);

  const showContentOfficerNotes = meetingStatus === MeetingStatus.RETURNED_FROM_CONTENT && contentRequest.content_officer_notes;

  // Build shared ContentInfoView data
  const contentInfoData = useMemo(() => {
    return mapMeetingToContentInfo({
      attachments: attachments.map((a: Attachment) => ({
        id: a.id,
        file_name: a.file_name,
        file_size: a.file_size ?? 0,
        file_type: a.file_type ?? '',
        blob_url: a.blob_url ?? null,
        is_presentation: a.is_presentation,
        is_additional: a.is_additional,
        is_executive_summary: a.is_executive_summary,
        presentation_sequence: (a as any).presentation_sequence ?? null,
      })),
      previous_meeting_attachment: (contentRequest as any)?.previous_meeting_attachment ?? null,
      general_notes: contentRequest.general_notes,
      content_officer_notes: showContentOfficerNotes ? contentRequest.content_officer_notes : null,
    }, { hideEmpty: false });
  }, [attachments, contentRequest, showContentOfficerNotes]);

  // Directives data
  const suggestedActionsItems = h.suggestedActionsItems;
  const suggestedActionsFiltered = suggestedActionsItems.filter((s) => !h.deletedSuggestedActionIds.has(String(s.id)));
  const directives = (contentRequest as ContentRequestDetailResponse).related_directives ?? [];
  const directivesFiltered = directives.filter((d) => !h.deletedExistingDirectiveIds.has(String(d.id)));
  const hasDirectives = directivesFiltered.length > 0;
  const hasOnlyIds = !hasDirectives && (contentRequest.related_directive_ids?.length ?? 0) > 0;
  const hasAiSuggestions = h.aiDirectivesSuggestions.length > 0;
  const hasSuggestedActionsFromApi = suggestedActionsFiltered.length > 0;
  const hasManualActions = h.manualAddedActions.length > 0;

  const allDirectives = useMemo(() => [
    ...directivesFiltered.map((d) => ({ ...d, isAi: false, isSuggestedAction: false })),
    ...h.aiDirectivesSuggestions.map((d) => ({
      ...d, isAi: true, isSuggestedAction: false,
      directive: h.editableAiDirectives[d.id]?.directive_text || d.directive_text,
      entity: h.editableAiDirectives[d.id]?.responsible_entity || d.responsible_entity,
      deadline: h.editableAiDirectives[d.id]?.due_date || d.due_date,
      status: h.editableAiDirectives[d.id]?.status || d.status,
    })),
    ...suggestedActionsFiltered.map((s) => ({
      id: `suggested-${s.id}`, isAi: false, isSuggestedAction: true,
      directive: s.title ?? '-', due_date: s.due_date ?? undefined, status: s.status ?? undefined,
    })),
    ...h.manualAddedActions.map((a) => ({
      id: `manual-${a.id}`, isAi: false, isSuggestedAction: false, isManualAction: true,
      directive: a.title ?? '-', due_date: a.due_date ?? undefined, status: a.status ?? undefined, manualAction: a,
    })),
  ], [directivesFiltered, h.aiDirectivesSuggestions, h.editableAiDirectives, suggestedActionsFiltered, h.manualAddedActions]);

  /* ─── Render AI actions for presentation files ─── */
  const renderFileActions = (file: ContentFileItem, sectionKey: string) => {
    if (sectionKey !== 'presentation') return null;
    const att = presAttachments.find((a: Attachment) => a.id === file.id);
    const canCompare = att?.replaces_attachment_id != null;

    return (
      <div className="flex items-center gap-1">
        {/* Compare button */}
        {canCompare ? (
          <button
            type="button"
            onClick={() => {
              h.setCompareResult(null);
              h.setCompareErrorDetail(null);
              h.setIsCompareModalOpen(true);
              h.compareByAttachmentMutation.mutate(file.id);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/8 transition-colors"
            title="تقييم الاختلاف"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            <span>مقارنة</span>
          </button>
        ) : presAttachments.length >= 2 ? null : null}

        {/* AI Insights button */}
        <button
          type="button"
          onClick={() => {
            h.insightsAbortControllerRef.current?.abort();
            h.insightsAbortControllerRef.current = new AbortController();
            h.setInsightsModalAttachment({ id: file.id, file_name: file.file_name });
            h.insightsMutation.reset();
            h.insightsMutation.mutate({ attachmentId: file.id, signal: h.insightsAbortControllerRef.current.signal });
          }}
          disabled={h.insightsMutation.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/8 transition-colors disabled:opacity-50"
          title="تحليل بالذكاء الاصطناعي"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>تحليل</span>
        </button>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto" dir="rtl">
        {/* ─── Shared Content View (presentation, optional files, notes) ─── */}
        <ContentInfoView
          data={contentInfoData}
          onViewFile={(file) => {
            if (!file.blob_url) return;
            h.setPreviewAttachment({ blob_url: file.blob_url, file_name: file.file_name, file_type: file.file_type });
          }}
          onDownloadFile={(file) => file.blob_url && window.open(file.blob_url, '_blank')}
          renderFileActions={renderFileActions}
        />

        {/* ─── إضافة التوجيهات ─── */}
        <SectionWrapper
          icon={ListChecks}
          title="إضافة التوجيهات"
          headerActions={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => h.setShowAddDirectiveRow(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>إضافة توجيه</span>
              </button>
              {(contentRequest as any)?.prev_ext_id != null && (
                <button
                  type="button"
                  onClick={h.handleRequestAiDirectives}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                >
                  {h.isLoadingAiSuggestions ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /><span>جاري التحميل...</span></>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 text-primary" /><span>اقتراح بالذكاء الاصطناعي</span></>
                  )}
                </button>
              )}
            </div>
          }
        >
          {(hasDirectives || hasAiSuggestions || hasSuggestedActionsFromApi || hasManualActions || h.showAddDirectiveRow) ? (
            <div className="w-full overflow-x-auto border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground w-16">#</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">التوجيه</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground w-32">الموعد النهائي</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground w-28">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground min-w-[120px]">المعينون</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground w-24">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allDirectives.map((directive: any, index: number) => {
                    const isAi = directive.isAi;
                    const isSuggestedAction = directive.isSuggestedAction;
                    const isManualAction = directive.isManualAction;
                    const directiveId = directive.id;

                    if (isManualAction && directive.manualAction) {
                      const a = directive.manualAction as ActionItem;
                      const dueDate = h.manualActionEdits[a.id]?.due_date !== undefined ? h.manualActionEdits[a.id].due_date : a.due_date;
                      const status = h.manualActionEdits[a.id]?.status ?? a.status ?? 'PENDING';
                      const assignees = h.getManualActionAssignees(a.id, a.assignees ?? []);
                      const assigneeInput = h.assigneeInputByActionId[a.id] ?? '';
                      return (
                        <tr key={directiveId} className="hover:bg-muted/30 transition-colors bg-green-50/50">
                          <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-foreground" dir="rtl">{a.title ?? '—'}</td>
                          <td className="px-4 py-3">
                            <FormDatePicker
                              value={dueDate ?? ''} onChange={(v) => {
                                if (v && startOfLocalDay(new Date(v + 'T12:00:00')) < startOfLocalDay(new Date())) return;
                                h.updateManualActionDueDate(a.id, v || null);
                              }}
                              placeholder="dd/mm/yyyy" className="min-w-[120px] text-right" fromDate={h.directiveDueDateFromDate}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Select value={status} onValueChange={(v) => h.updateManualActionStatus(a.id, v)} dir="rtl">
                              <SelectTrigger className="min-w-[140px] text-right" dir="rtl"><SelectValue placeholder="الحالة" /></SelectTrigger>
                              <SelectContent>
                                {ACTION_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-right">{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3" dir="rtl">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {assignees.map((email: string, i: number) => (
                                <span key={`${email}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
                                  {email}
                                  <button type="button" onClick={() => h.removeManualActionAssignee(a.id, i, assignees)} className="p-0.5 rounded hover:bg-primary/20" aria-label="حذف">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              <Input
                                value={assigneeInput}
                                onChange={(e) => h.setAssigneeInputByActionId((p) => ({ ...p, [a.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); h.addManualActionAssignee(a.id, assigneeInput, assignees); h.setAssigneeInputByActionId((p) => ({ ...p, [a.id]: '' })); }
                                }}
                                placeholder="إضافة معين..." className="h-8 min-w-[80px] max-w-[120px] text-xs text-right" dir="rtl"
                              />
                              <button type="button" onClick={() => { h.addManualActionAssignee(a.id, assigneeInput, assignees); h.setAssigneeInputByActionId((p) => ({ ...p, [a.id]: '' })); }}
                                className="p-1 rounded border border-border hover:bg-muted text-muted-foreground" title="إضافة">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button type="button" onClick={() => h.handleDeleteManualAction(a.id)} className="flex items-center justify-center gap-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (isSuggestedAction) {
                      const rawId = String(directiveId).replace(/^suggested-/, '');
                      const suggestedItem = suggestedActionsFiltered.find((s) => String(s.id) === rawId);
                      const assignees = suggestedItem ? normalizeAssignees(suggestedItem.assignees) : [];
                      return (
                        <tr key={directiveId} className="hover:bg-muted/30 transition-colors bg-muted/20">
                          <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-foreground" dir="rtl">{directive.directive ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{directive.due_date ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{directive.status ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground" dir="rtl">{assignees.length ? assignees.join('، ') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button type="button" onClick={() => h.handleDeleteSuggestedAction(directiveId)} className="flex items-center justify-center gap-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (isAi && h.editableAiDirectives[directiveId]) {
                      const editable = h.editableAiDirectives[directiveId];
                      const action = h.aiDirectiveActions[directiveId];
                      return (
                        <tr key={directiveId} className="bg-purple-50/20 hover:bg-purple-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-3">
                            <Textarea value={editable.directive_text} onChange={(e) => h.handleUpdateAiDirective(directiveId, 'directive_text', e.target.value)}
                              className="w-full text-sm min-h-[60px] resize-none" placeholder="أدخل نص التوجيه..." dir="rtl" />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{action?.due_date ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{action?.status ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground" dir="rtl">{action?.assignees?.length ? action.assignees.join('، ') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button type="button" onClick={() => h.handleDeleteAiDirective(directiveId)} className="flex items-center justify-center gap-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Regular directive row
                    return (
                      <tr key={directiveId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{directive.directive || directive.directive_text || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{directive.deadline ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{directive.directive_status ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground" dir="rtl">
                          {(directive.responsible_persons ?? []).map((p: any) => p.name).filter(Boolean).join('، ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <button type="button" onClick={() => h.handleDeleteExistingDirective(directiveId)} className="flex items-center justify-center gap-1 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="حذف">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {h.showAddDirectiveRow && (
                    <tr key="add-directive-row" className="bg-green-50/30 border-t-2 border-dashed border-primary/30">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{allDirectives.length + 1}</td>
                      <td className="px-4 py-3" dir="rtl">
                        <div className="min-w-[200px] max-w-full">
                          <FormAsyncSelectV2
                            value={h.addDirectiveSelectValue}
                            onValueChange={h.handleAddDirectiveSelectChange}
                            loadOptions={h.loadActionsForAddDirective}
                            placeholder="ابحث واختر التوجيه..."
                            searchPlaceholder="ابحث في التوجيهات..."
                            emptyMessage="لا توجد نتائج"
                            fullWidth limit={20} defaultOptions={false} className="text-right"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => { h.setShowAddDirectiveRow(false); h.setAddDirectiveSelectValue(null); }}
                          className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted">إلغاء</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : hasOnlyIds ? (
            <div className="w-full overflow-x-auto border border-border rounded-xl overflow-hidden p-4 text-sm text-muted-foreground">
              {((contentRequest.related_guidance as unknown as any[]) || []).map((g: any, i: number) => (
                <div key={i} className="py-1">{g?.directive_text ?? String(g)}</div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 rounded-xl bg-muted/15 border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">لا توجد توجيهات مرتبطة</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">اضغط على "إضافة توجيه" لإضافة توجيهات جديدة</p>
            </div>
          )}
        </SectionWrapper>

        {/* ─── إضافة ملاحظات ─── */}
        <SectionWrapper icon={StickyNote} title="إضافة ملاحظات">
          <Textarea
            value={h.guidanceNotes}
            onChange={(e) => h.setGuidanceNotes(e.target.value)}
            placeholder="أدخل محتوى التوجيهات...."
            className="min-h-[120px] resize-none"
            dir="rtl"
          />
        </SectionWrapper>

        {/* ─── الملخص التنفيذي ─── */}
        <SectionWrapper icon={FileCheck} title="الملخص التنفيذي">
          <div
            onDragOver={!h.sendToSchedulingMutation.isPending ? h.handleDragOver : undefined}
            onDragLeave={!h.sendToSchedulingMutation.isPending ? h.handleDragLeave : undefined}
            onDrop={!h.sendToSchedulingMutation.isPending ? h.handleDrop : undefined}
            onClick={!h.sendToSchedulingMutation.isPending && !h.executiveSummaryFile ? () => h.fileInputRef.current?.click() : undefined}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors
              ${h.isDragging && !h.sendToSchedulingMutation.isPending ? 'border-primary bg-primary/5' : 'border-border bg-muted/15'}
              ${h.executiveSummaryFile ? 'border-primary bg-primary/5' : ''}
              ${h.sendToSchedulingMutation.isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
            `}
          >
            <input ref={h.fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={h.handleFileSelect} disabled={h.sendToSchedulingMutation.isPending} className="hidden" />
            {h.executiveSummaryFile ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-background border border-primary rounded-xl">
                  {h.executiveSummaryFile.type === 'application/pdf' ? (
                    <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-md text-xs font-semibold text-destructive">
                      {h.executiveSummaryFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-foreground text-right">{h.executiveSummaryFile.name}</span>
                    <span className="text-xs text-muted-foreground text-right">{formatFileSize(h.executiveSummaryFile.size)}</span>
                  </div>
                  <button onClick={h.handleRemoveFile} disabled={h.sendToSchedulingMutation.isPending}
                    className="ml-4 p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-3"><Upload className="w-8 h-8 text-muted-foreground" /></div>
                <p className="text-sm text-foreground mb-1">اضغط للرفع أو اسحب الملف هنا</p>
                <p className="text-xs text-muted-foreground">PDF, WORD, EXCEL (max. 20MB)</p>
              </>
            )}
          </div>
        </SectionWrapper>

        {/* ─── Compare Modal ─── */}
        <Dialog open={h.isCompareModalOpen} onOpenChange={h.setIsCompareModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader><DialogTitle className="text-right">تقييم الاختلاف بين العروض</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 py-4 text-right">
              {h.compareByAttachmentMutation.isPending ? (
                <p className="text-center text-muted-foreground py-6">جاري تقييم الاختلاف بين العروض...</p>
              ) : h.compareByAttachmentMutation.isError ? (
                <div className="text-center py-4">
                  <p className="text-destructive font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                  {h.compareErrorDetail ? (
                    <p className="text-foreground text-sm mt-2 text-right">{translateCompareErrorDetail(h.compareErrorDetail) ?? h.compareErrorDetail}</p>
                  ) : (<p className="text-muted-foreground text-sm mt-2">يرجى المحاولة لاحقاً.</p>)}
                </div>
              ) : h.compareResult ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-1"><span className="text-muted-foreground">معرف التقييم</span><span className="font-medium text-foreground">{h.compareResult.comparison_id || '—'}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-muted-foreground">الدرجة الإجمالية</span><span className="font-medium text-foreground">{h.compareResult.overall_score ?? '—'}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-muted-foreground">مستوى الاختلاف</span><span className="font-medium text-foreground">{translateCompareValue(h.compareResult.difference_level, COMPARE_LEVEL)}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-muted-foreground">الحالة</span><span className="font-medium text-foreground">{translateCompareValue(h.compareResult.status, COMPARE_STATUS)}</span></div>
                  </div>
                  {h.compareResult.regeneration_recommendation && (
                    <div className="flex flex-col gap-1"><span className="text-muted-foreground text-sm">توصية إعادة التوليد</span><p className="text-foreground whitespace-pre-wrap">{translateCompareValue(h.compareResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}</p></div>
                  )}
                  {h.compareResult.summary && (
                    <div className="flex flex-col gap-2 border border-border rounded-lg p-3 bg-muted/30">
                      <span className="text-foreground font-medium">ملخص الشرائح</span>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>الشرائح الأصلية: {h.compareResult.summary.total_slides_original ?? '—'}</span>
                        <span>الشرائح الجديدة: {h.compareResult.summary.total_slides_new ?? '—'}</span>
                        <span>فرق العدد: {h.compareResult.summary.slide_count_difference ?? '—'}</span>
                        <span>بدون تغيير: {h.compareResult.summary.unchanged_slides ?? '—'}</span>
                        <span>تغييرات طفيفة: {h.compareResult.summary.minor_changes ?? '—'}</span>
                        <span>تغييرات متوسطة: {h.compareResult.summary.moderate_changes ?? '—'}</span>
                        <span>تغييرات كبيرة: {h.compareResult.summary.major_changes ?? '—'}</span>
                        <span>شرائح جديدة: {h.compareResult.summary.new_slides ?? '—'}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (<p className="text-muted-foreground">لا توجد نتيجة لعرضها.</p>)}
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button type="button" onClick={() => h.setIsCompareModalOpen(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors">إغلاق</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Insights Modal ─── */}
        <Dialog
          open={!!h.insightsModalAttachment}
          onOpenChange={(open) => {
            if (!open) {
              h.insightsAbortControllerRef.current?.abort();
              h.insightsAbortControllerRef.current = null;
              h.setInsightsModalAttachment(null);
              h.insightsMutation.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col overflow-hidden p-0" dir="rtl">
            <div className="relative px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <DialogHeader className="p-0"><DialogTitle className="text-right text-[16px] font-bold text-foreground">تحليل العرض التقديمي</DialogTitle></DialogHeader>
                  {h.insightsModalAttachment?.file_name && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-[13px] text-muted-foreground truncate">{h.insightsModalAttachment.file_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto">
              {h.insightsMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Loader2 className="h-7 w-7 text-primary animate-spin" /></div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[15px] font-semibold text-foreground">جاري التحليل...</span>
                    <span className="text-[13px] text-muted-foreground">يتم تحليل العرض التقديمي بواسطة الذكاء الاصطناعي</span>
                  </div>
                </div>
              ) : h.insightsMutation.isError ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-destructive" /></div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[15px] font-semibold text-foreground">تعذّر إتمام التحليل</span>
                    <span className="text-[13px] text-muted-foreground">حدث خطأ أثناء جلب الملاحظات. يرجى المحاولة لاحقاً.</span>
                  </div>
                </div>
              ) : h.insightsMutation.data != null && h.insightsModalAttachment?.id === h.insightsMutation.variables?.attachmentId ? (
                (() => {
                  const d = h.insightsMutation.data as Record<string, unknown> & AttachmentInsightsResponse;
                  const notes: string[] = Array.isArray(d.llm_notes) ? d.llm_notes : d.llm_notes != null ? [].concat(d.llm_notes as any) : [];
                  const rawSuggestions = d.llm_suggestions ?? (d as any).suggestions ?? (d.data && typeof d.data === 'object' && 'llm_suggestions' in d.data ? (d.data as any).llm_suggestions : undefined) ?? (d.data && typeof d.data === 'object' && 'suggestions' in d.data ? (d.data as any).suggestions : undefined);
                  const suggestions: string[] = Array.isArray(rawSuggestions) ? rawSuggestions.map((x: any) => typeof x === 'string' ? x : x?.text ?? String(x ?? '')) : rawSuggestions != null ? [].concat(rawSuggestions as any).map((x: unknown) => typeof x === 'string' ? x : String(x ?? '')) : [];
                  if (notes.length === 0 && suggestions.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><ClipboardCheck className="h-6 w-6 text-muted-foreground" /></div>
                        <span className="text-[14px] text-muted-foreground">لا توجد ملاحظات أو اقتراحات على هذا العرض.</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col gap-5">
                      {notes.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50"><FileText className="h-4 w-4 text-amber-600" /></div>
                            <span className="text-[14px] font-bold text-foreground">الملاحظات</span>
                            <span className="text-[12px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{notes.length}</span>
                          </div>
                          <div className="flex flex-col gap-2 mr-1">
                            {notes.map((note, idx) => (
                              <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold mt-0.5">{idx + 1}</span>
                                <p className="text-[13px] text-foreground leading-[22px] whitespace-pre-wrap flex-1">{note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {suggestions.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div>
                            <span className="text-[14px] font-bold text-foreground">الاقتراحات</span>
                            <span className="text-[12px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{suggestions.length}</span>
                          </div>
                          <div className="flex flex-col gap-2 mr-1">
                            {suggestions.map((s, idx) => (
                              <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold mt-0.5">{idx + 1}</span>
                                <p className="text-[13px] text-foreground leading-[22px] whitespace-pre-wrap flex-1">{typeof s === 'string' ? s : (s as any)?.text ?? String(s ?? '')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : !h.insightsMutation.isPending && !h.insightsMutation.isError ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground" /></div>
                  <span className="text-[14px] text-muted-foreground">لا توجد ملاحظات.</span>
                </div>
              ) : null}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button type="button" onClick={() => { h.insightsAbortControllerRef.current?.abort(); h.insightsAbortControllerRef.current = null; h.setInsightsModalAttachment(null); h.insightsMutation.reset(); }}
                className="px-5 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-[14px] font-semibold shadow-sm">
                إغلاق
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
