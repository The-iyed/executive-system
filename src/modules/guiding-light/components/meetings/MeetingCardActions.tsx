import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import closeIcon from "@gl/assets/icons/close.svg";
import delegateIcon from "@gl/assets/icons/delegate.svg";
import forwardIcon from "@gl/assets/icons/forward.svg";

import { Button } from "@gl/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gl/components/ui/dialog";
import { cn } from "@gl/lib/utils";
import { useModalStore } from "@gl/stores/modal-store";
import {
  getMeetingAssessments,
  cancelMeeting,
  passMeeting,
  type MeetingAssessmentItem,
} from "@gl/api/unified/client";
import { CLASSIFICATION_LABELS } from "@gl/types/meeting-detail";

interface MeetingCardActionsProps {
  meetingId: string;
  /** Pass when different from meetingId for GET /api/meeting-assessments */
  meetingRequestId?: string;
}

type ConfirmAction = "cancel" | "forward" | null;

/** Single assessment card: structured UI for one item (result + assessment_payload). */
function AssessmentDetail({ item }: { item: MeetingAssessmentItem }) {
  const result = item.analysis_payload?.result;
  const assessment = item.assessment_payload;
  const title = result?.meeting_title ?? assessment?.meeting_title ?? "تقييم الاجتماع";
  const overallScore = result?.overall_score;
  const datetime = result?.datetime;
  const timeStr =
    datetime?.start != null && datetime?.end != null
      ? `${datetime.start} - ${datetime.end}`
      : assessment?.meeting_time ?? "—";
  const durationStr =
    datetime?.duration_hr != null ? `${datetime.duration_hr} ساعة` : null;

  return (
    <div dir="rtl" className="space-y-5 text-right">
      {/* Hero */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {item.status != null && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                item.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
              )}
            >
              {item.status === "completed" ? "مكتمل" : item.status}
            </span>
          )}
          {result?.mode != null && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              {CLASSIFICATION_LABELS[result.mode.toUpperCase()] ?? result.mode}
            </span>
          )}
          {result?.sector != null && (
            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              {result.sector}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{timeStr}</span>
          {durationStr != null && <span>• {durationStr}</span>}
          {result?.attendees_count != null && (
            <span>• {result.attendees_count} حضور</span>
          )}
        </div>
        {overallScore != null && (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl font-bold text-primary">{overallScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        )}
      </div>

      {/* Executive summary */}
      {(result?.executive_summary?.length ?? 0) > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">الملخص التنفيذي</h4>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/90">
            {result!.executive_summary!.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Dimension scores */}
      {(result?.dimension_scores?.length ?? 0) > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">أبعاد التقييم</h4>
          <div className="space-y-3">
            {result!.dimension_scores!.map((d, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{d.dimension}</span>
                  <span className="text-sm text-muted-foreground">
                    {d.score} / {d.max_score} ({d.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, d.percentage ?? 0)}%` }}
                  />
                </div>
                {d.comment != null && d.comment !== "" && (
                  <p className="text-xs text-muted-foreground mt-1.5">{d.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Urgency & Importance */}
      {(assessment?.urgency_rationale != null || assessment?.importance_rationale != null || result?.urgency_rationale != null || result?.importance_rationale != null) && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">الأولوية والأهمية</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {assessment?.is_urgent != null && (
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", assessment.is_urgent ? "bg-amber-500/20 text-amber-700" : "bg-muted text-muted-foreground")}>
                {assessment.is_urgent ? "عاجل" : "غير عاجل"}
              </span>
            )}
            {assessment?.is_important != null && (
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", assessment.is_important ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {assessment.is_important ? "مهم" : "غير مهم"}
              </span>
            )}
          </div>
          {(result?.urgency_rationale ?? assessment?.urgency_rationale) != null && (
            <p className="text-sm text-muted-foreground mb-2">عجلة: {(result?.urgency_rationale ?? assessment?.urgency_rationale)}</p>
          )}
          {(result?.importance_rationale ?? assessment?.importance_rationale) != null && (
            <p className="text-sm text-muted-foreground">أهمية: {(result?.importance_rationale ?? assessment?.importance_rationale)}</p>
          )}
        </section>
      )}

      {/* Strengths & To improve */}
      {((result?.feedback_summary?.strengths?.length ?? 0) > 0 || (result?.feedback_summary?.to_improve?.length ?? 0) > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {(result!.feedback_summary!.strengths?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-emerald-500/5 p-3">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">نقاط القوة</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-foreground/90">
                {result!.feedback_summary!.strengths!.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {(result?.feedback_summary?.to_improve?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-amber-500/5 p-3">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">ما يمكن تحسينه</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-foreground/90">
                {result!.feedback_summary!.to_improve!.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Delegation recommendations */}
      {((result?.delegation_recommendations?.length ?? 0) > 0 || (assessment?.delegation_recommendations?.length ?? 0) > 0) && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">توصيات الإنابة</h4>
          <div className="space-y-3">
            {(result?.delegation_recommendations ?? assessment?.delegation_recommendations)?.map((rec, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">{rec.name}</p>
                {rec.role != null && rec.role !== "" && (
                  <p className="text-xs text-muted-foreground">{rec.role}</p>
                )}
                {rec.reason != null && rec.reason !== "" && (
                  <p className="text-sm text-foreground/90 mt-1">{rec.reason}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documents */}
      {(result?.documents?.length ?? 0) > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">المستندات</h4>
          <div className="space-y-3">
            {result!.documents!.map((doc, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">{doc.title ?? doc.document_id}</p>
                {doc.key_takeaway != null && doc.key_takeaway !== "" && (
                  <p className="text-xs text-muted-foreground mt-1">الخلاصة: {doc.key_takeaway}</p>
                )}
                {doc.executive_insight != null && doc.executive_insight !== "" && (
                  <p className="text-xs text-foreground/90 mt-1">{doc.executive_insight}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reflection cards */}
      {result?.reflection_cards != null && Object.keys(result.reflection_cards).length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">بطاقات التأمل</h4>
          <div className="space-y-3">
            {Object.entries(result.reflection_cards).map(([key, card]) => (
              <div key={key} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {key.replace(/_/g, " ")}
                </p>
                {card.summary != null && card.summary !== "" && (
                  <p className="text-sm text-foreground/90 mb-1">{card.summary}</p>
                )}
                {card.ministerial_insight != null && card.ministerial_insight !== "" && (
                  <p className="text-sm text-primary font-medium mt-1.5">{card.ministerial_insight}</p>
                )}
                {(card.details?.length ?? 0) > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {card.details!.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action / category */}
      {(assessment?.action != null || assessment?.category != null) && (
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-2">الإجراء والتصنيف</h4>
          <div className="flex flex-wrap gap-2">
            {assessment?.action != null && (
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                {assessment.action}
              </span>
            )}
            {assessment?.category != null && (
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {assessment.category}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border">
        {item.created_at != null && <span>أنشئ: {item.created_at}</span>}
        {item.updated_at != null && <span>حدّث: {item.updated_at}</span>}
      </div>
    </div>
  );
}

function MeetingCardActions({ meetingId, meetingRequestId }: MeetingCardActionsProps) {
  const openModal = useModalStore((s) => s.openModal);
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [forwardNotes, setForwardNotes] = useState("");
  const [assessmentsOpen, setAssessmentsOpen] = useState(false);
  const [assessments, setAssessments] = useState<MeetingAssessmentItem[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);

  const requestId = meetingRequestId ?? meetingId;

  /** Optimistically remove this meeting from all cached ministerSchedule queries */
  const removeMeetingFromCache = useCallback(() => {
    queryClient.setQueriesData<import("@gl/api/unified/types").MinisterScheduleResponse>(
      { queryKey: ["ministerSchedule"] },
      (old) => {
        if (!old) return old;
        const filterById = <T extends { id?: string }>(arr?: T[]) =>
          arr?.filter((m) => m.id !== meetingId);
        const filterGrouped = (grouped?: Record<string, Array<{ id?: string }>>) => {
          if (!grouped) return grouped;
          const result: Record<string, Array<{ id?: string }>> = {};
          for (const [key, items] of Object.entries(grouped)) {
            const filtered = items.filter((m) => m.id !== meetingId);
            if (filtered.length > 0) result[key] = filtered;
          }
          return result;
        };
        return {
          ...old,
          meetings: filterById(old.meetings) ?? [],
          grouped_by_classification_type: filterGrouped(old.grouped_by_classification_type) as typeof old.grouped_by_classification_type,
          grouped_by_type: filterGrouped(old.grouped_by_type) as typeof old.grouped_by_type,
          grouped_by_classification: filterGrouped(old.grouped_by_classification) as typeof old.grouped_by_classification,
        };
      }
    );
  }, [queryClient, meetingId]);

  const fetchAndShowAssessments = useCallback(async () => {
    setAssessmentsOpen(true);
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    try {
      const res = await getMeetingAssessments(requestId, 10);
      setAssessments(res.items ?? []);
    } catch (err) {
      setAssessmentsError(err instanceof Error ? err.message : "فشل تحميل التقييمات");
      setAssessments([]);
    } finally {
      setAssessmentsLoading(false);
    }
  }, [requestId]);

  const handleConfirmCancel = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      await cancelMeeting(meetingId, { reason: "canceled by the minister", notes: "" });
      removeMeetingFromCache();
      setConfirmAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "فشل إلغاء الاجتماع");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmForward = async () => {
    setActionError(null);
    setActionLoading(true);
    // Optimistic: remove card immediately
    removeMeetingFromCache();
    setConfirmAction(null);
    try {
      await passMeeting(meetingId, { notes: forwardNotes.trim() || undefined });
      setForwardNotes("");
    } catch (err) {
      // Rollback: refetch to restore the card
      queryClient.invalidateQueries({ queryKey: ["ministerSchedule"] });
      setActionError(err instanceof Error ? err.message : "فشل تمرير الاجتماع");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-row-reverse items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md active:scale-95"
          onClick={(e) => { e.stopPropagation(); setActionError(null); setConfirmAction("forward"); }}
        >
          <img src={forwardIcon} alt="" className="size-3.5 shrink-0 pointer-events-none" />
          تمرير
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5 rounded-xl px-4 py-2 text-[11px] font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
          onClick={(e) => { e.stopPropagation(); setActionError(null); setConfirmAction("cancel"); }}
        >
          <img src={closeIcon} alt="" className="size-3.5 shrink-0 pointer-events-none" />
          إلغاء
        </Button>
      </div>

      {/* Confirmation: إلغاء */}
      <Dialog open={confirmAction === "cancel"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الإلغاء</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء هذا الاجتماع؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          {actionError && confirmAction === "cancel" && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
          <DialogFooter showCloseButton={false} className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
              تراجع
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={actionLoading}>
              {actionLoading ? "جاري الإلغاء..." : "نعم، إلغاء الاجتماع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation: تمرير */}
      <Dialog open={confirmAction === "forward"} onOpenChange={(open) => { if (!open) { setConfirmAction(null); setForwardNotes(""); } }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={forwardIcon} alt="" className="size-5 shrink-0" />
              تمرير الاجتماع
            </DialogTitle>
            <DialogDescription>
              سيتم تمرير هذا الاجتماع. يمكنك إضافة ملاحظة توضيحية قبل التأكيد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1" dir="rtl">
            <label htmlFor="forward-notes" className="text-sm font-medium text-foreground">
              ملاحظات <span className="text-muted-foreground font-normal">(اختياري)</span>
            </label>
            <textarea
              id="forward-notes"
              value={forwardNotes}
              onChange={(e) => setForwardNotes(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/50 focus:ring-[3px] outline-none resize-none transition-shadow"
            />
          </div>

          {actionError && confirmAction === "forward" && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
          <DialogFooter showCloseButton={false} className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmAction(null); setForwardNotes(""); }} disabled={actionLoading}>
              تراجع
            </Button>
            <Button
              className="bg-sky-600 hover:bg-sky-700 text-white"
              onClick={handleConfirmForward}
              disabled={actionLoading}
            >
              <img src={forwardIcon} alt="" className="size-3.5 shrink-0 brightness-0 invert" />
              {actionLoading ? "جاري التمرير..." : "تأكيد التمرير"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting assessments (AI) modal */}
      <Dialog open={assessmentsOpen} onOpenChange={setAssessmentsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-5 shrink-0" viewBox="0 0 72 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="url(#paint0_modal)" />
                <defs>
                  <linearGradient id="paint0_modal" x1="56.5658" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--color-surface-colored)" />
                    <stop offset="1" stopColor="var(--color-surface-light)" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <DialogTitle>تقييمات الاجتماع</DialogTitle>
                <DialogDescription>
                  تحليل وتوصيات التقييم لطلب الاجتماع
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 space-y-6">
            {assessmentsLoading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">جاري التحميل...</p>
              </div>
            )}
            {assessmentsError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{assessmentsError}</p>
              </div>
            )}
            {!assessmentsLoading && !assessmentsError && assessments.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">لا توجد تقييمات.</p>
              </div>
            )}
            {!assessmentsLoading && !assessmentsError && assessments.map((item) => (
              <AssessmentDetail key={item.id} item={item} />
            ))}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border">
            <Button variant="outline" onClick={() => setAssessmentsOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MeetingCardActions };
