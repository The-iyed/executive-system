import React from 'react';
import { Stepper, ScreenLoader } from '@shared';
import { STEP_LABELS } from '../../utils';
import { useEditMeeting } from '../../hooks/useEditMeeting';
import { Step1 } from '../../components/steps/Step1';
import { Step2 } from '../../components/steps/Step2';
import { Step3 } from '../../components/steps/Step3';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import { FormMeetingModal } from '../../components/FormMeetingModal/FormMeetingModal';
import { useFormMeetingModal } from '../../hooks/useFormMeetingModal';
import '@shared/styles';

export interface EditMeetingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  meetingId?: string;
}

export const EditMeeting: React.FC<EditMeetingProps> = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  meetingId,
} = {}) => {
  const uncontrolled = useFormMeetingModal();
  const open = controlledOnOpenChange !== undefined ? controlledOpen ?? false : uncontrolled.open;
  const onOpenChange = controlledOnOpenChange ?? uncontrolled.onOpenChange;
  const {
    currentStep,
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
    isLoading,
    error,
    draftData,
  } = useEditMeeting(meetingId != null ? { meetingIdOverride: meetingId } : undefined);

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
            setTableErrors={step1Hook.setTableErrors}
            setTableTouched={step1Hook.setTableTouched}
            isSubmitting={step1Hook.isSubmitting}
            isDeleting={deleteDraft.isDeleting}
            handleChange={step1Hook.handleChange}
            handleBlur={step1Hook.handleBlur}
            fillFormFromPreviousMeeting={step1Hook.fillFormFromPreviousMeeting}
            handleAddGoal={step1Hook.handleAddGoal}
            handleDeleteGoal={step1Hook.handleDeleteGoal}
            handleUpdateGoal={step1Hook.handleUpdateGoal}
            handleAddAgenda={step1Hook.handleAddAgenda}
            handleDeleteAgenda={step1Hook.handleDeleteAgenda}
            handleUpdateAgenda={step1Hook.handleUpdateAgenda}
            handleAddSupport={step1Hook.handleAddSupport}
            handleDeleteSupport={step1Hook.handleDeleteSupport}
            handleUpdateSupport={step1Hook.handleUpdateSupport}
            handleAddPreviousMeeting={step1Hook.handleAddPreviousMeeting}
            handleDeletePreviousMeeting={step1Hook.handleDeletePreviousMeeting}
            handleUpdatePreviousMeeting={step1Hook.handleUpdatePreviousMeeting}
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

  const content = isLoading ? (
    <ScreenLoader message="جاري تحميل البيانات..." />
  ) : error || !draftData ? (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-lg text-red-500">حدث خطأ في تحميل البيانات</div>
    </div>
  ) : (
    <>
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 p-6"
        >
          <h1 className="text-[28px] text-[#101828] font-bold text-center mb-2">
            تعديل معلومات الاجتماع
          </h1>
          <p className="text-[16px] text-[#475467] font-normal text-center mb-8">
            يرجى تعديل الحقول المطلوبة
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
    return <>{content}</>;
  }
  return (
    <FormMeetingModal open={open} onOpenChange={onOpenChange}>
      {content}
    </FormMeetingModal>
  );
};

export default EditMeeting;
