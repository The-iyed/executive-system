import { useState, useRef, useCallback, useMemo } from "react";
import { cn, toast } from "@/lib/ui";
import { MeetingModalShell } from "../shared/components";
import { SchedulerStep1Form } from "./Step1Form";
import { Step2Form } from "../shared/steps/Step2Form";
import InviteesTableForm from "@/modules/shared/features/invitees-table-form/InviteesTableForm";
import type { DynamicTableFormHandle, TableRow } from "@/lib/dynamic-table-form";
import type { SchedulerStep1Values } from "./schema";
import { useCreateSchedulerStep1, useSaveSchedulerStep2Content, useSaveSchedulerStep3Invitees } from "../hooks/useDraftMutations";
import { buildStep1FormData } from "../shared/utils";

interface SchedulerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a directive in Step 1. */
  directiveId?: string;
  directiveText?: string;
}

export function SchedulerModal({ open, onOpenChange, directiveId, directiveText }: SchedulerModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<SchedulerStep1Values | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  const directiveInitialValues = useMemo(
    () => (directiveId ? { related_directive: directiveId } : undefined),
    [directiveId],
  );
  const [invitees, setInvitees] = useState<TableRow[]>([]);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  const createStep1 = useCreateSchedulerStep1();
  const saveStep2 = useSaveSchedulerStep2Content();
  const saveStep3 = useSaveSchedulerStep3Invitees();

  const isSaving = createStep1.isPending || saveStep2.isPending || saveStep3.isPending;

  const handleStep1Submit = useCallback((data: SchedulerStep1Values) => {
    setStep1Data(data);
    const formData = buildStep1FormData(data);

    createStep1.mutate({ formData, meetingId }, {
      onSuccess: (id) => {
        setMeetingId(id);
        setCurrentStep(2);
      },
      onError: (error) => {
        console.error("Scheduler step 1 API error:", error);
        toast({title:"حدث خطأ أثناء حفظ بيانات الخطوة الأولى", variant: 'destructive'});
      },
    });
  }, [createStep1, meetingId]);

  const handleStep2Submit = useCallback((formData: FormData | null) => {
    if (!formData) {
      setCurrentStep(3);
      return;
    }

    if (!meetingId) {
      toast({title:"لم يتم العثور على معرّف الاجتماع", variant: 'destructive'});
      return;
    }

    saveStep2.mutate(
      { meetingId, payload: formData },
      {
        onSuccess: () => {
          setCurrentStep(3);
        },
        onError: (error) => {
          console.error("Scheduler step 2 API error:", error);
          toast({title:"حدث خطأ أثناء حفظ المحتوى", variant: 'destructive'});
        },
      },
    );
  }, [meetingId, saveStep2]);

  const resetModal = useCallback(() => {
    onOpenChange(false);
    setCurrentStep(1);
    setStep1Data(null);
    setMeetingId(null);
    setInvitees([]);
  }, [onOpenChange]);

  const handleStep3 = useCallback((schedule: boolean) => {
    const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    if (!meetingId) {
      toast({title:"لم يتم العثور على معرّف الاجتماع", variant: 'destructive'});
      return;
    }

    saveStep3.mutate(
      { meetingId, invitees: inviteesPayload, schedule },
      {
        onSuccess: () => {
          toast({title:schedule ? "تم إرسال طلب جدولة الاجتماع بنجاح" : "تم حفظ المسودة بنجاح"});
          resetModal();
        },
        onError: (error) => {
          console.error("Scheduler step 3 API error:", error);
          toast({title:schedule ? "حدث خطأ أثناء حفظ المدعوين" : "حدث خطأ أثناء حفظ المسودة", variant: 'destructive'});
        },
      },
    );
  }, [meetingId, saveStep3, resetModal]);

  const handleFinalSubmit = useCallback(() => handleStep3(true), [handleStep3]);
  const handleSaveAsDraft = useCallback(() => handleStep3(false), [handleStep3]);

  const triggerFormSubmit = useCallback(() => {
    if (currentStep === 3) {
      handleFinalSubmit();
      return;
    }
    const selector = `[data-step="${currentStep}"] form`;
    const form = document.querySelector<HTMLFormElement>(selector);
    console.log("[SchedulerModal] triggerFormSubmit", { currentStep, selector, formFound: !!form });
    if (form) {
      form.requestSubmit();
    } else {
      console.error("[SchedulerModal] Form not found for step", currentStep);
    }
  }, [currentStep, handleFinalSubmit]);

  return (
    <MeetingModalShell
      open={open}
      onOpenChange={onOpenChange}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      saving={isSaving}
      showSaveAsDraft={currentStep === 3}
      onNext={triggerFormSubmit}
      onPrev={() => setCurrentStep((s) => s - 1)}
      onSubmit={handleFinalSubmit}
      onSaveAsDraft={handleSaveAsDraft}
    >
      <div data-step={1} className={cn(currentStep !== 1 && "hidden")}>
        <SchedulerStep1Form
          key={step1Data ? "restore" : "fresh"}
          initialValues={step1Data ?? directiveInitialValues}
          onSubmit={handleStep1Submit}
          defaultDirectiveLabel={directiveText}
        />
      </div>

      <div data-step={2} className={cn(currentStep !== 2 && "hidden")}>
        {step1Data && (
          <Step2Form
            key="step2"
            callerRole="SCHEDULING"
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
          meetingChannel={step1Data?.meeting_channel}
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