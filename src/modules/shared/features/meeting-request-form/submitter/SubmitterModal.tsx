import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import InviteesTableForm from "@/modules/shared/features/invitees-table-form/InviteesTableForm";
import { MeetingOwnerType } from "@/modules/shared/types";
import { MeetingStatus } from "../shared/types/types";
import { useSubmitterModal } from "./hooks/useSubmitterModal";
import { MeetingModalShell } from "../shared/components";
import { Step2Form } from "../shared/steps/Step2Form";
import { SubmitterStep1Form } from "./Step1Form";
import { cn, Button, useToast } from "@/lib/ui";
import { Send, Loader2 } from "lucide-react";
import { submitDraft } from "../api/submitDraft";
import { ConfirmDialog } from "@/modules/shared/components/confirm-dialog";

interface SubmitterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMeetingId?: string | null;
  callerRole?: MeetingOwnerType;
  showAiSuggest?: boolean;
  excludeColumns?: string[];
  onSubmitSuccess?: () => void;
}

export function SubmitterModal({ open, onOpenChange, editMeetingId, callerRole, showAiSuggest = false, excludeColumns, onSubmitSuccess }: SubmitterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitDraftConfirmOpen, setIsSubmitDraftConfirmOpen] = useState(false);

  const {
    currentStep,
    step1Data,
    draftId,
    activeDraftId,
    inviteesRef,
    isEditMode,
    initialStep1Values,
    initialStep2Values,
    initialStep3Values,
    meetingStatus,
    loading,
    saving,
    canSaveAsDraft,
    fetchError,
    handleStep1Submit,
    handleStep2Submit,
    handleFinalSubmit,
    handleSaveAsDraft,
    goToPrevStep,
    triggerActiveFormSubmit,
    setCurrentStep,
  } = useSubmitterModal({ open, editMeetingId, onClose: () => onOpenChange(false), onSubmitSuccess, callerRole });

  const isDraftSchedulerEdit = callerRole === MeetingOwnerType.SCHEDULING && meetingStatus === MeetingStatus.DRAFT;

  const submitDraftMutation = useMutation({
    mutationFn: async () => {
      // First save, then submit
      await handleFinalSubmit();
      if (activeDraftId) {
        await submitDraft(activeDraftId);
      }
    },
    onSuccess: () => {
      toast({ title: 'تم إرسال الطلب للمراجعة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', activeDraftId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-draft', activeDraftId] });
      setIsSubmitDraftConfirmOpen(false);
    },
    onError: (err) => {
      toast({ title: err instanceof Error ? err.message : 'فشل إرسال الطلب', variant: 'destructive' });
    },
  });

  const extraFooterActions = isDraftSchedulerEdit ? (
    <Button
      type="button"
      disabled={saving || submitDraftMutation.isPending}
      className="gap-2 px-8 h-11 rounded-xl shadow-md bg-blue-600 hover:bg-blue-700"
      onClick={() => setIsSubmitDraftConfirmOpen(true)}
    >
      {submitDraftMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <><Send className="h-4 w-4" /> إرسال للمراجعة</>
      )}
    </Button>
  ) : undefined;

  return (
    <>
    <MeetingModalShell
      open={open}
      onOpenChange={onOpenChange}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      loading={loading}
      error={fetchError}
      saving={saving || submitDraftMutation.isPending}
      showSaveAsDraft={canSaveAsDraft}
      submitLabel={callerRole === MeetingOwnerType.SCHEDULING ? "تحديث الطلب" : undefined}
      onNext={triggerActiveFormSubmit}
      onPrev={goToPrevStep}
      onSubmit={handleFinalSubmit}
      onSaveAsDraft={handleSaveAsDraft}
      extraFooterActions={extraFooterActions}
    >
      {/* Step 1: Basic Info */}
      <div data-step={1} className={cn(currentStep !== 1 && "hidden")}>
        {(!isEditMode || initialStep1Values) && (
          <SubmitterStep1Form
            key={activeDraftId || "new"}
            initialValues={initialStep1Values}
            onSubmit={handleStep1Submit}
            isSchedulerEdit={callerRole === MeetingOwnerType.SCHEDULING}
            meetingStatus={meetingStatus}
          />
        )}
      </div>

      {/* Step 2: Content */}
      <div data-step={2} className={cn(currentStep !== 2 && "hidden")}>
        {step1Data && (
          <Step2Form
            key={`step2-${draftId || "new"}`}
            step1Data={{
              meeting_classification: step1Data.meeting_classification,
              meeting_confidentiality: step1Data.meeting_confidentiality,
              is_urgent: step1Data.is_urgent,
            }}
            onSubmit={handleStep2Submit}
            initialContentData={initialStep2Values}
            isEditMode={!!draftId}
            meetingStatus={meetingStatus}
          />
        )}
      </div>

      {/* Step 3: Invitees */}
      <div className={cn(currentStep !== 3 && "hidden")}>
        <InviteesTableForm
          tableRef={inviteesRef}
          initialInvitees={initialStep3Values}
          mode="create"
          showAiSuggest={showAiSuggest}
          excludeColumns={excludeColumns}
          meetingChannel={step1Data?.meeting_channel}
          meetingParams={step1Data ? {
            meeting_subject: step1Data.meeting_title,
            meeting_type: step1Data.meeting_type,
            meeting_classification: step1Data.meeting_classification,
            meeting_justification: step1Data.meeting_justification,
            related_topic: step1Data.related_topic,
            agenda_items: step1Data.agenda_items,
          } : undefined}
        />
      </div>
    </MeetingModalShell>

    <ConfirmDialog
      open={isSubmitDraftConfirmOpen}
      onOpenChange={setIsSubmitDraftConfirmOpen}
      title="إرسال للمراجعة"
      description="سيتم حفظ التعديلات وإرسال الطلب للمراجعة. هل أنت متأكد؟"
      confirmLabel="تأكيد الإرسال"
      loadingLabel="جاري الإرسال..."
      onConfirm={() => submitDraftMutation.mutate()}
      isLoading={submitDraftMutation.isPending}
      variant="primary"
    />
    </>
  );
}
