import { Button } from "@/lib/ui";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";

interface ModalActionBarProps {
  currentStep: number;
  totalSteps: number;
  saving?: boolean;
  showSaveAsDraft?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onSaveAsDraft?: () => void;
  extraFooterActions?: React.ReactNode;
}

export function ModalActionBar({
  currentStep,
  totalSteps,
  saving = false,
  showSaveAsDraft = false,
  submitLabel = "إرسال الطلب",
  cancelLabel = "إلغاء",
  onNext,
  onPrev,
  onCancel,
  onSubmit,
  onSaveAsDraft,
  extraFooterActions,
}: ModalActionBarProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="shrink-0 border-t border-border bg-background px-8 flex items-center justify-between py-4">
      {/* Primary actions (right side in RTL) */}
      {!isLast ? (
        <Button
          type="button"
          disabled={saving}
          className="gap-2 px-8 h-11 rounded-xl shadow-md"
          onClick={onNext}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>التالي <ChevronLeft className="h-4 w-4" /></>
          )}
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={saving}
            className="gap-2 px-8 h-11 rounded-xl shadow-md"
            onClick={onSubmit}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Send className="h-4 w-4" /> {submitLabel}</>
            )}
          </Button>
          {showSaveAsDraft && onSaveAsDraft && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              className="gap-2 px-8 h-11 rounded-xl"
              onClick={onSaveAsDraft}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ كمسودة"}
            </Button>
          )}
          {extraFooterActions}
        </div>
      )}

      {/* Secondary action (left side in RTL) */}
      {isFirst ? (
        <Button type="button" variant="outline" className="px-8 h-11 rounded-xl" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="gap-2 px-8 h-11 rounded-xl"
          onClick={onPrev}
        >
          <ChevronRight className="h-4 w-4" /> السابق
        </Button>
      )}
    </div>
  );
}
