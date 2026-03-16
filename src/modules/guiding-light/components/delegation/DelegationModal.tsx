import { useState, useEffect, useCallback } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { useModalStore } from "@gl/stores/modal-store";
import type { ModalDataMap } from "@gl/stores/modal-store";
import { delegateMeeting } from "@gl/api/unified/client";
import { SlideToDelegate } from "./SlideToDelegate";
import { DelegateeSelect } from "./DelegateeSelect";
import { cn } from "@gl/lib/utils";

type DelegationStatus = "idle" | "success";

function SuccessContent() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Check className="size-8 text-primary" />
      </div>
      <p className="text-lg font-semibold text-foreground">
        تم منح الإنابة بنجاح
      </p>
    </div>
  );
}

function DelegationModal() {
  const activeModal = useModalStore((s) => s.activeModal);
  const modalData = useModalStore((s) => s.modalData) as
    | ModalDataMap["delegation"]
    | null;
  const closeModal = useModalStore((s) => s.closeModal);

  const isOpen = activeModal === "delegation";
  const meetingId = modalData?.meetingId;
  const aiRecommendation = modalData?.aiRecommendation;

  const [status, setStatus] = useState<DelegationStatus>("idle");
  const [selectedDelegatee, setSelectedDelegatee] = useState<string | undefined>();
  const [guidanceText, setGuidanceText] = useState("");
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [delegationError, setDelegationError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setSelectedDelegatee(undefined);
      setGuidanceText("");
      setDelegationError(null);
    }
  }, [isOpen]);

  const handleDelegationComplete = useCallback(async () => {
    if (!meetingId) return;
    const delegateUserId = selectedDelegatee;
    if (!delegateUserId) {
      setDelegationError("اختر من تريد إنابته للاجتماع.");
      return;
    }
    setDelegationError(null);
    setDelegationLoading(true);
    try {
      await delegateMeeting(meetingId, {
        delegate_user_id: delegateUserId,
        guidance_text: guidanceText || undefined,
      });
      setStatus("success");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setDelegationError(err instanceof Error ? err.message : "فشل منح الإنابة");
    } finally {
      setDelegationLoading(false);
    }
  }, [meetingId, selectedDelegatee, guidanceText, closeModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border/60 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            type="button"
            onClick={closeModal}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">إنابة</h2>
        </div>

        {status === "idle" ? (
          <div className="px-5 pb-5 space-y-4">
            {/* AI Recommendation Banner */}
            {aiRecommendation && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed text-foreground">
                    ينصحكم بالنظام بإنابة هذا الاجتماع إلى السيد{" "}
                    <span className="font-bold text-primary">{aiRecommendation}</span>.
                  </p>
                  <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
                </div>
              </div>
            )}

            {/* Slide to delegate */}
            <SlideToDelegate onComplete={handleDelegationComplete} />

            {/* Manual selection */}
            <p className="text-sm text-muted-foreground text-right">
              أو اختر يدوياً لمن تريد إنابة الاجتماع:
            </p>

            {/* Delegatee Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground text-right">النائب</label>
              <DelegateeSelect
                value={selectedDelegatee}
                onValueChange={setSelectedDelegatee}
              />
            </div>

            {/* Guidance text input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground text-right">توجيهات (اختياري)</label>
              <textarea
                value={guidanceText}
                onChange={(e) => setGuidanceText(e.target.value)}
                placeholder="أضف توجيهات أو ملاحظات للنائب..."
                rows={3}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground text-right",
                  "placeholder:text-muted-foreground resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                  "transition-colors"
                )}
              />
            </div>

            {/* Error */}
            {delegationError && (
              <p className="text-sm text-destructive text-right">{delegationError}</p>
            )}
          </div>
        ) : (
          <div className="px-5 pb-5">
            <SuccessContent />
          </div>
        )}
      </div>
    </div>
  );
}

export { DelegationModal };
