import InviteesTableForm from "@/modules/shared/features/invitees-table-form/InviteesTableForm";
import { MeetingOwnerType } from "@/modules/shared/types";
import { useSubmitterModal } from "./hooks/useSubmitterModal";
import { MeetingModalShell } from "../shared/components";
import { Step2Form } from "../shared/steps/Step2Form";
import { SubmitterStep1Form } from "./Step1Form";
import { cn } from "@/lib/ui";

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

  return (
    <MeetingModalShell
      open={open}
      onOpenChange={onOpenChange}
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      loading={loading}
      error={fetchError}
      saving={saving}
      showSaveAsDraft={canSaveAsDraft}
      submitLabel={callerRole === MeetingOwnerType.SCHEDULING ? "تحديث الطلب" : undefined}
      onNext={triggerActiveFormSubmit}
      onPrev={goToPrevStep}
      onSubmit={handleFinalSubmit}
      onSaveAsDraft={handleSaveAsDraft}
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
  );
}
