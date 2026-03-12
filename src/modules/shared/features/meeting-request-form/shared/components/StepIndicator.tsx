import { cn } from "@/lib/ui";
import stepActive from "@/modules/shared/assets/step-active.svg";
import stepCompleted from "@/modules/shared/assets/step-completed.svg";
import stepInactive from "@/modules/shared/assets/step-inactive.svg";

export interface StepDef {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <button
            type="button"
            onClick={() => {
              if (step.number < currentStep) onStepClick?.(step.number);
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center justify-center">
              {step.number < currentStep ? (
                <img src={stepCompleted} alt="completed" className="h-7 w-7 rounded-full" />
              ) : currentStep === step.number ? (
                <img src={stepActive} alt="active" className="h-9 w-9 rounded-full" />
              ) : (
                <img src={stepInactive} alt="inactive" className="h-7 w-7 rounded-full" />
              )}
            </div>
            <span
              className={cn(
                "text-sm font-semibold whitespace-nowrap",
                step.number < currentStep
                  ? "text-teal"
                  : currentStep === step.number
                    ? "text-teal"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </button>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "w-28 h-[2px] mx-3 mt-[-24px]",
                step.number < currentStep ? "bg-primary/90" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
