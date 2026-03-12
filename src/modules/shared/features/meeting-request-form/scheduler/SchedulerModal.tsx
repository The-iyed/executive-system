import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/ui";
import { MeetingModalShell } from "../shared/components";
import { SchedulerStep1Form } from "./Step1Form";
import { Step2Form } from "../shared/steps/Step2Form";
import InviteesTableForm from "@/modules/shared/features/invitees-table-form/InviteesTableForm";
import type { DynamicTableFormHandle, TableRow } from "@/lib/dynamic-table-form";
import type { SchedulerStep1Values } from "./schema";

interface SchedulerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchedulerModal({ open, onOpenChange }: SchedulerModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<SchedulerStep1Values | null>(null);
  const [invitees, setInvitees] = useState<TableRow[]>([]);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  const handleStep1Submit = useCallback((data: SchedulerStep1Values) => {
    setStep1Data(data);
    setCurrentStep(2);
  }, []);

  const handleStep2Submit = useCallback((formData: FormData) => {
    if (formData) {
      console.log("Step2 FormData entries:", Array.from(formData.entries()));
    }
    setCurrentStep(3);
  }, []);

  const resetModal = useCallback(() => {
    onOpenChange(false);
    setCurrentStep(1);
    setStep1Data(null);
    setInvitees([]);
  }, [onOpenChange]);

  const handleFinalSubmit = useCallback(() => {
    const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;
    console.log("Scheduler final:", { step1: step1Data, invitees: inviteesPayload });
    resetModal();
  }, [step1Data, resetModal]);

  const triggerFormSubmit = useCallback(() => {
    const form = document.querySelector<HTMLFormElement>(`[data-step="${currentStep}"] form`);
    form?.requestSubmit();
  }, [currentStep]);

  return (
    <MeetingModalShell
      open={open}
      onOpenChange={onOpenChange}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      showSaveAsDraft
      onNext={triggerFormSubmit}
      onPrev={() => setCurrentStep((s) => s - 1)}
      onSubmit={handleFinalSubmit}
      onSaveAsDraft={() => console.log("Save as draft:", { step1: step1Data, invitees })}
    >
      <div data-step={1} className={cn(currentStep !== 1 && "hidden")}>
        <SchedulerStep1Form
          key={step1Data ? "restore" : "fresh"}
          initialValues={step1Data ?? undefined}
          onSubmit={handleStep1Submit}
        />
      </div>

      <div data-step={2} className={cn(currentStep !== 2 && "hidden")}>
        {step1Data && (
          <Step2Form
            key="step2"
            step1Data={{
              meeting_classification: step1Data.meeting_classification,
              meeting_confidentiality: step1Data.meeting_confidentiality,
              is_urgent: step1Data.is_urgent,
            }}
            onSubmit={handleStep2Submit}
          />
        )}
      </div>

      <div className={cn(currentStep !== 3 && "hidden")}>
        <InviteesTableForm
          tableRef={inviteesRef}
          initialInvitees={invitees}
          mode="create"
          meetingParams={step1Data ? {
            meeting_subject: step1Data.meeting_title,
            meeting_type: step1Data.meeting_type,
            meeting_classification: step1Data.meeting_classification,
            meeting_justification: step1Data.meeting_justification,
            related_topic: step1Data.related_topic,
            agenda_items: step1Data.agenda_items?.map((a) => ({ agenda_item: a.agenda_item })),
          } : undefined}
        />
      </div>
    </MeetingModalShell>
  );
}