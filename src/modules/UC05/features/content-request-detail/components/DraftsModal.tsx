/**
 * UC05 Drafts modal – مسودات الاستشارات.
 */
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/lib/ui';
import { formatDateArabic } from '@/modules/shared/utils';
import type { ConsultationRecord } from '../../../../UC02/data/meetingsApi';

export interface DraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftsRecords: ConsultationRecord[];
  isLoading: boolean;
  onPublishDraft: (consultationId: string) => void;
  isPublishing: boolean;
}

export function DraftsModal({
  open, onOpenChange, draftsRecords, isLoading, onPublishDraft, isPublishing,
}: DraftsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">مسودات الاستشارات</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">جاري التحميل...</div>
            </div>
          ) : draftsRecords.length > 0 ? (
            draftsRecords.map((draft) => {
              const draftAnswer =
                draft.consultation_answers?.find((a) => a.is_draft) ?? draft.consultation_answers?.[0];
              const answerText = draftAnswer?.consultation_answer ?? draft.consultation_answer ?? '';
              const draftId = draft.id || draft.consultation_id;
              const draftQuestion = draft.question || draft.consultation_question;
              return (
                <div key={draftId} className="flex flex-col gap-3 p-4 bg-muted/30 border border-border rounded-lg">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between">
                      <span className="text-sm font-medium text-foreground text-right">سؤال الاستشارة:</span>
                      <span className="text-xs text-muted-foreground">{formatDateArabic(draft.requested_at)}</span>
                    </div>
                    <p className="text-sm text-foreground text-right">{draftQuestion}</p>
                  </div>

                  {answerText && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground text-right">الإجابة:</span>
                      <p className="text-sm text-foreground text-right whitespace-pre-wrap bg-background p-3 rounded border border-border">
                        {answerText}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-row justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onPublishDraft(draftId!)}
                      disabled={isPublishing}
                      className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-primary text-primary-foreground rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPublishing ? 'جاري النشر...' : 'نشر'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-right">لا توجد مسودات</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-start gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-background text-foreground rounded-lg border border-border shadow-sm hover:bg-muted transition-colors"
          >
            إغلاق
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
