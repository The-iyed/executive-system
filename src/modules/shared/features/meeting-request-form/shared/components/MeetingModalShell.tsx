import { ReactNode } from "react";
import { Dialog, DialogContent, Button } from "@/lib/ui";
import { Loader2, X } from "lucide-react";
import { StepIndicator, type StepDef } from "./StepIndicator";
import { ModalActionBar } from "./ModalActionBar";

const MEETING_STEPS: StepDef[] = [
  { number: 1, label: "معلومات الاجتماع" },
  { number: 2, label: "المحتوى" },
  { number: 3, label: "المدعوون" },
];

interface MeetingModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStep: number;
  onStepClick: (step: number) => void;
  loading?: boolean;
  error?: string | null;
  saving?: boolean;
  showSaveAsDraft?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onSaveAsDraft?: () => void;
  extraFooterActions?: ReactNode;
  children: ReactNode;
  /** Hide the step indicator */
  hideSteps?: boolean;
  /** Custom title (defaults to "قم بإضافة معلومات الاجتماع") */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
  /** Custom steps array (defaults to MEETING_STEPS) */
  steps?: StepDef[];
}

export function MeetingModalShell({
  open,
  onOpenChange,
  currentStep,
  onStepClick,
  loading = false,
  error = null,
  saving = false,
  showSaveAsDraft = false,
  submitLabel,
  cancelLabel,
  onNext,
  onPrev,
  onSubmit,
  onSaveAsDraft,
  extraFooterActions,
  children,
  hideSteps = false,
  title = "قم بإضافة معلومات الاجتماع",
  subtitle = "يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع",
  steps: customSteps,
}: MeetingModalShellProps) {
  const activeSteps = customSteps ?? MEETING_STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-3rem)] w-[calc(100vw-3rem)] sm:max-w-[1450px] h-[calc(100vh-6rem)] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl [&>button]:hidden"
        dir="rtl"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
              <div className="w-10 shrink-0" aria-hidden="true" />
            </div>

            <div className="px-8 pb-6">
              <div className="text-center mb-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-base text-teal">{subtitle}</p>
              </div>
              {!hideSteps && (
                <StepIndicator steps={activeSteps} currentStep={currentStep} onStepClick={onStepClick} />
              )}
            </div>
          </div>

          <div className="px-8 pb-8 pt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-teal" />
                <p className="text-sm text-muted-foreground">جاري تحميل بيانات الاجتماع...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="mb-4 text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {!loading && !error && (
          <ModalActionBar
            currentStep={currentStep}
            totalSteps={activeSteps.length}
            saving={saving}
            showSaveAsDraft={showSaveAsDraft}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            onNext={onNext}
            onPrev={() => onStepClick(currentStep - 1)}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
            onSaveAsDraft={onSaveAsDraft}
            extraFooterActions={extraFooterActions}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
