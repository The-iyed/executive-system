import React from 'react';
import { Stepper } from '@shared';
import { STEP_LABELS } from '../../utils';
import { useCreateMeeting } from '../../hooks/useCreateMeeting';
import { Step1 } from '../../components/steps/Step1';
import { Step2 } from '../../components/steps/Step2';
import { Step3 } from '../../components/steps/Step3';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import '@shared/styles';

export const CreateMeeting: React.FC = () => {
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
            tableErrors={step1Hook.tableErrors}
            tableTouched={step1Hook.tableTouched}
            isSubmitting={step1Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step1Hook.handleChange}
            handleBlur={step1Hook.handleBlur}
            handleFilesSelect={step1Hook.handleFilesSelect}
            handleAdditionalFilesSelect={step1Hook.handleAdditionalFilesSelect}
            handleAddGoal={step1Hook.handleAddGoal}
            handleDeleteGoal={step1Hook.handleDeleteGoal}
            handleUpdateGoal={step1Hook.handleUpdateGoal}
            handleAddAgenda={step1Hook.handleAddAgenda}
            handleDeleteAgenda={step1Hook.handleDeleteAgenda}
            handleUpdateAgenda={step1Hook.handleUpdateAgenda}
            handleAddDirective={step1Hook.handleAddDirective}
            handleDeleteDirective={step1Hook.handleDeleteDirective}
            handleUpdateDirective={step1Hook.handleUpdateDirective}
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
            inviteesRequired={step2Hook.inviteesRequired}
            tableErrorMessage={step2Hook.tableErrorMessage}
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
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

      {/* Delete Draft Confirmation Modal */}
      <DeleteDraftConfirmationModal
        isOpen={deleteDraft.isConfirmOpen}
        onClose={deleteDraft.closeConfirm}
        onConfirm={deleteDraft.confirmDelete}
        isDeleting={deleteDraft.isDeleting}
      />
    </div>
  );
};

export default CreateMeeting;
