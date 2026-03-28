import { ReactNode } from "react";
import { Dialog, DialogContent, Button } from "@/lib/ui";
import { Loader2 } from "lucide-react";
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
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onSaveAsDraft?: () => void;
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
  onNext,
  onPrev,
  onSubmit,
  onSaveAsDraft,
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
        className="max-w-[calc(100vw-3rem)] w-[calc(100vw-3rem)] sm:max-w-[1450px] h-[calc(100vh-6rem)] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl"
        dir="rtl"
      >
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="pt-8 pb-6 shrink-0">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <p className="text-base text-teal mt-2">{subtitle}</p>
            </div>
            {!hideSteps && (
              <StepIndicator steps={activeSteps} currentStep={currentStep} onStepClick={onStepClick} />
            )}
          </div>


          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-teal mb-3" />
              <p className="text-sm text-muted-foreground">جاري تحميل بيانات الاجتماع...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Action bar */}
        {!loading && !error && (
          <ModalActionBar
            currentStep={currentStep}
            totalSteps={activeSteps.length}
            saving={saving}
            showSaveAsDraft={showSaveAsDraft}
            submitLabel={submitLabel}
            onNext={onNext}
            onPrev={() => onStepClick(currentStep - 1)}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
            onSaveAsDraft={onSaveAsDraft}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
