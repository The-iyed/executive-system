import React from 'react';
import { Stepper } from '@shared';
import { STEP_LABELS } from '../../utils';
import { useCreateMeeting } from '../../hooks/useCreateMeeting';
import { Step1 } from '../../components/steps/Step1';
import { Step2 } from '../../components/steps/Step2';
import { Step3 } from '../../components/steps/Step3';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import { FormMeetingModal } from '../../components/FormMeetingModal/FormMeetingModal';
import { useFormMeetingModal } from '../../hooks/useFormMeetingModal';
import '@shared/styles';

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
  } = useCreateMeeting();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1
            formData={step1Hook.formData}
            errors={step1Hook.errors}
            touched={step1Hook.touched}
            isSubmitting={step1Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step1Hook.handleChange}
            handleBlur={step1Hook.handleBlur}
            fillFormFromPreviousMeeting={step1Hook.fillFormFromPreviousMeeting}
            handleNextClick={handleStep1Next}
            handleSaveDraftClick={handleStep1SaveDraft}
            handleCancelClick={handleCancel}
            isFieldRequired={step1Hook.isFieldRequired}
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
            handleAddAttendee={step2Hook.handleAddAttendee}
            handleDeleteAttendee={step2Hook.handleDeleteAttendee}
            handleUpdateAttendee={step2Hook.handleUpdateAttendee}
            handleAddUserFromSelect={step2Hook.handleAddUserFromSelect}
            handleNextClick={handleStep2Next}
            handleSaveDraftClick={handleStep2SaveDraft}
            handleCancelClick={handleCancel}
          />
        );
      case 2:
        if (!draftId) return null;
        return (
          <Step3
            step3Hook={step3Hook}
            isDeleting={deleteDraft.isDeleting}
            handleNextClick={handleStep3Next}
            handleSaveDraftClick={handleStep3SaveDraft}
            handleCancelClick={handleCancel}
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