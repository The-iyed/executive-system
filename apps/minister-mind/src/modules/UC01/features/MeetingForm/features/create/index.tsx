import React from 'react';
import { Stepper } from '@shared';
import { STEP_LABELS } from '../../utils';
import { useCreateMeeting } from '../../hooks/useCreateMeeting';
import { useFormMeetingModal } from '../../hooks';
import { Step1BasicInfo } from '../../components/steps/Step1BasicInfo';
import { Step2Content } from '../../components/steps/Step2Content';
import { Step3Invitees } from '../../components/steps/Step3Invitees';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import FormMeetingModal from '../../components/FormMeetingModal/FormMeetingModal';

export interface CreateMeetingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateMeeting: React.FC<CreateMeetingProps> = ({ open: controlledOpen, onOpenChange: controlledOnOpenChange } = {}) => {
  const uncontrolled = useFormMeetingModal();
  const open = controlledOnOpenChange !== undefined ? controlledOpen ?? false : uncontrolled.open;
  const onOpenChange = controlledOnOpenChange ?? uncontrolled.onOpenChange;
  const {
    currentStep,
    draftId,
    scrollContainerRef,
    deleteDraft,
    step1BasicInfoHook,
    step2ContentHook,
    step3InviteesHook,
    handleStep1BasicInfoNext,
    handleStep2ContentNext,
    handleStep3InviteesNext,
    handleStep3InviteesSaveDraft,
    handleCancel,
  } = useCreateMeeting();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1BasicInfo
            formData={step1BasicInfoHook.formData}
            errors={step1BasicInfoHook.errors}
            touched={step1BasicInfoHook.touched}
            tableErrors={step1BasicInfoHook.tableErrors}
            tableTouched={step1BasicInfoHook.tableTouched}
            isSubmitting={step1BasicInfoHook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step1BasicInfoHook.handleChange}
            handleBlur={step1BasicInfoHook.handleBlur}
            handleAddAgenda={step1BasicInfoHook.handleAddAgenda}
            handleDeleteAgenda={step1BasicInfoHook.handleDeleteAgenda}
            handleUpdateAgenda={step1BasicInfoHook.handleUpdateAgenda}
            handleNextClick={handleStep1BasicInfoNext}
            handleCancelClick={handleCancel}
            isStep1BasicInfoFieldRequired={step1BasicInfoHook.isStep1BasicInfoFieldRequired}
          />
        );
      case 1:
        if (!draftId) return null;
        return (
          <Step2Content
            formData={step2ContentHook.formData}
            errors={step2ContentHook.errors}
            touched={step2ContentHook.touched}
            presentationRequired={step2ContentHook.presentationRequired}
            showPresentationBlock={step2ContentHook.showPresentationBlock}
            showAttachmentTiming={step2ContentHook.showAttachmentTiming}
            attachmentTimingRequired={step2ContentHook.attachmentTimingRequired}
            isSubmitting={step2ContentHook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step2ContentHook.handleChange}
            handleBlur={step2ContentHook.handleBlur}
            handleFilesSelect={step2ContentHook.handleFilesSelect}
            handleAdditionalFilesSelect={step2ContentHook.handleAdditionalFilesSelect}
            handleDeleteExistingAttachment={step2ContentHook.handleDeleteExistingAttachment}
            handleReplacePresentationFile={step2ContentHook.handleReplacePresentationFile}
            handleReplaceAdditionalFile={step2ContentHook.handleReplaceAdditionalFile}
            handleClearReplacementPresentation={step2ContentHook.handleClearReplacementPresentation}
            handleClearReplacementAdditional={step2ContentHook.handleClearReplacementAdditional}
            replacementPresentationFiles={step2ContentHook.replacementPresentationFiles}
            replacementAdditionalFiles={step2ContentHook.replacementAdditionalFiles}
            handleNextClick={handleStep2ContentNext}
            handleCancelClick={handleCancel}
          />
        );
      case 2:
        if (!draftId) return null;
        const step1 = step1BasicInfoHook.formData;
        const suggestAttendeesMeetingParams = {
          meeting: {
            meeting_subject: step1.meetingSubject || '',
            meeting_type: step1.meetingCategory || '',
            meeting_classification: step1.meetingClassification1 || step1.meetingConfidentiality || '',
            meeting_justification: step1.meetingReason || '',
            related_topic: step1.relatedTopic || null,
            objectives: [],
            agenda_items: (step1.meetingAgenda || []).map((item) => ({ agenda_item: item.agenda_item || '' })),
            minister_support: (step1.meetingAgenda || []).map((item) => ({
              support_description: item.minister_support_type === 'أخرى' ? (item.minister_support_other || '') : (item.minister_support_type || ''),
            })),
          },
        };
        return (
          <Step3Invitees
            formData={step3InviteesHook.formData}
            errors={step3InviteesHook.errors}
            touched={step3InviteesHook.touched}
            inviteesRequired={step3InviteesHook.inviteesRequired}
            tableErrorMessage={step3InviteesHook.tableErrorMessage}
            isSubmitting={step3InviteesHook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleAddAttendee={step3InviteesHook.handleAddAttendee}
            handleDeleteAttendee={step3InviteesHook.handleDeleteAttendee}
            handleUpdateAttendee={step3InviteesHook.handleUpdateAttendee}
            handleNextClick={handleStep3InviteesNext}
            handleSaveDraftClick={handleStep3InviteesSaveDraft}
            handleCancelClick={handleCancel}
            suggestAttendeesMeetingParams={suggestAttendeesMeetingParams}
            onSuggestAttendeesSuccess={(data) => data?.suggestions && step3InviteesHook.handleAddSuggestedAttendees(data.suggestions)}
          />
        );
      default:
        return null;
    }
  };

  const content = (
    <>
      <div ref={scrollContainerRef} className="flex-1 p-6">
        <h1 className="text-[28px] text-[#101828] font-bold text-center mb-2">
          قم بإضافة معلومات الاجتماع
        </h1>
        <p className="text-[16px] text-[#475467] font-normal text-center mb-8">
          يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع
        </p>

        <div className="mb-8">
          <Stepper steps={STEP_LABELS} currentStep={currentStep} />
        </div>

        <div className="mt-8">{renderStepContent()}</div>
      </div>

      <DeleteDraftConfirmationModal
        isOpen={deleteDraft.isConfirmOpen}
        onClose={deleteDraft.closeConfirm}
        onConfirm={deleteDraft.confirmDelete}
        isDeleting={deleteDraft.isDeleting}
      />
    </>
  );

  if (controlledOnOpenChange !== undefined) {
    return content;
  }
  return (
    <FormMeetingModal open={open} onOpenChange={onOpenChange}>
      {content}
    </FormMeetingModal>
  );
};

export default CreateMeeting;