import { cn } from "@/lib/ui";
import { MeetingModalShell } from "../shared/components";
import { SubmitterStep1Form } from "./Step1Form";
import { Step2Form } from "../shared/steps/Step2Form";
import InviteesTableForm from "@/modules/shared/features/invitees-table-form/InviteesTableForm";
import { useSubmitterModal } from "./hooks/useSubmitterModal";
import { EditableFieldsProvider } from "../shared/hooks/EditableFieldsContext";

interface SubmitterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMeetingId?: string | null;
  showAiSuggest?: boolean
}

export function SubmitterModal({ open, onOpenChange, editMeetingId, showAiSuggest = false }: SubmitterModalProps) {
  const {
    currentStep,
    step1Data,
    draftId,
    activeDraftId,
    inviteesRef,
    isEditMode,
    resolvedStep1Values,
    step2InitialContentData,
    initialStep3Values,
    editableFields,
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
  } = useSubmitterModal({ editMeetingId, onClose: () => onOpenChange(false) });

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
      onNext={triggerActiveFormSubmit}
      onPrev={goToPrevStep}
      onSubmit={handleFinalSubmit}
      onSaveAsDraft={handleSaveAsDraft}
    >
      <EditableFieldsProvider editableFields={isEditMode ? editableFields : null}>
        {/* Step 1: Basic Info */}
        <div data-step={1} className={cn(currentStep !== 1 && "hidden")}>
          {(!isEditMode || resolvedStep1Values) && (
            <SubmitterStep1Form
              key={activeDraftId || "new"}
              initialValues={resolvedStep1Values}
              onSubmit={handleStep1Submit}
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
              initialContentData={step2InitialContentData}
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
            excludeColumns={["access_permission", "is_consultant"]}
            showAiSuggest={showAiSuggest}
          />
        </div>
      </EditableFieldsProvider>
    </MeetingModalShell>
  );
}
