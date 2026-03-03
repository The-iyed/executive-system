import React from 'react';
import { Stepper } from '@/modules/shared';
import { STEP_LABELS } from '../../utils';
import { useCreateMeeting } from '../../hooks/useCreateMeeting';
import { Step1 } from '../../components/steps/Step1';
import { Step2 } from '../../components/steps/Step2';
import { Step3 } from '../../components/steps/Step3';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import { FormMeetingModal } from '../../components/FormMeetingModal/FormMeetingModal';
import { useFormMeetingModal } from '../../hooks/useFormMeetingModal';
import '@/modules/shared/styles';

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
    step1Hook,
    step2Hook,
    step3Hook,
    handleStep1Next,
    handleStep1SaveDraft,
    handleStep2Next,
    handleStep2SaveDraft,
    handleStep3Next,
    handleStep3SaveDraft,
    handleCancel,
    handlePrevious,
  } = useCreateMeeting({
    onClose: controlledOnOpenChange ? () => controlledOnOpenChange(false) : undefined,
  });

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1
            formData={step1Hook.formData}
            errors={step1Hook.errors}
            touched={step1Hook.touched}
            tableErrors={step1Hook.tableErrors}
            tableTouched={step1Hook.tableTouched}
            isSubmitting={step1Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step1Hook.handleChange}
            handleBlur={step1Hook.handleBlur}
            handleAddAgenda={step1Hook.handleAddAgenda}
            handleDeleteAgenda={step1Hook.handleDeleteAgenda}
            handleUpdateAgenda={step1Hook.handleUpdateAgenda}
            fillFormFromPreviousMeeting={step1Hook.fillFormFromPreviousMeeting}
            handleNextClick={handleStep1Next}
            handleSaveDraftClick={handleStep1SaveDraft}
            handleCancelClick={handleCancel}
            isFieldVisible={step1Hook.isFieldVisible}
          />
        );
      case 1:
        if (!draftId) return null;
        return (
          <Step2
            formData={step2Hook.formData}
            errors={step2Hook.errors}
            touched={step2Hook.touched}
            isSubmitting={step2Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step2Hook.handleChange}
            handleBlur={step2Hook.handleBlur}
            handleNextClick={handleStep2Next}
            handleSaveDraftClick={handleStep2SaveDraft}
            handleBackClick={handlePrevious}
            handleCancelClick={handleCancel}
            showPresentationRequiredField={step2Hook.showPresentationRequiredField}
            isPresentationRequiredRequired={step2Hook.isPresentationRequiredRequired}
          />
        );
      case 2:
        if (!draftId) return null;
        const step1 = step1Hook.formData;
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
              support_description:
                item.minister_support_type === 'أخرى'
                  ? (item.minister_support_other || '')
                  : (item.minister_support_type || ''),
            })),
          },
        };
        return (
          <Step3
            formData={step3Hook.formData}
            errors={step3Hook.errors}
            touched={step3Hook.touched}
            isSubmitting={step3Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleAddInvitee={step3Hook.handleAddInvitee}
            handleDeleteInvitee={step3Hook.handleDeleteInvitee}
            handleUpdateInvitee={step3Hook.handleUpdateInvitee}
            handleAddMinisterInvitee={step3Hook.handleAddMinisterInvitee}
            handleDeleteMinisterInvitee={step3Hook.handleDeleteMinisterInvitee}
            handleUpdateMinisterInvitee={step3Hook.handleUpdateMinisterInvitee}
            setProposerObjectGuids={step3Hook.setProposerObjectGuids}
            handleNextClick={handleStep3Next}
            handleSaveDraftClick={handleStep3SaveDraft}
            handleBackClick={handlePrevious}
            handleCancelClick={handleCancel}
            nonDeletableInviteeIds={step3Hook.nonDeletableInviteeIds}
            suggestAttendeesMeetingParams={suggestAttendeesMeetingParams}
            onSuggestAttendeesSuccess={(data) =>
              data?.suggestions && step3Hook.handleAddSuggestedMinisterInvitees(data.suggestions)
            }
          />
        );
      default:
        return null;
    }
  };

  const content = (
    <>
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 p-6"
        >
          <h1 className="text-[28px] text-[#101828] font-bold text-center mb-2">
            قم بإضافة معلومات الاجتماع
          </h1>
          <p className="text-[16px] text-[#475467] font-normal text-center mb-8">
            يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع
          </p>

          <div className="mb-8">
            <Stepper steps={STEP_LABELS} currentStep={currentStep} />
          </div>

          <div className="mt-8 min-w-0">{renderStepContent()}</div>
        </div>
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