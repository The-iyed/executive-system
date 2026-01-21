import React, { useCallback } from 'react';
import { FormTable } from '@shared';
import { ActionButtons } from '@shared';
import { useStep2 } from './useStep2';
import { useDeleteDraft } from '../../hooks/useDeleteDraft';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import {
  INVITEES_TABLE_COLUMNS,
  INVITEES_TABLE_TITLE,
  ADD_INVITEE_BUTTON_LABEL,
} from './constants';

interface Step2Props {
  draftId: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

const Step2: React.FC<Step2Props> = ({ draftId, onNext, onSaveDraft }) => {
  const handleSuccess = useCallback(
    (isDraft: boolean) => {
      if (isDraft) {
        onSaveDraft?.();
      } else {
        onNext?.();
      }
    },
    [onNext, onSaveDraft]
  );

  const handleError = useCallback((error: Error) => {
    console.error('Step2 error:', error);
    // TODO: Show error toast/notification
  }, []);

  // Delete draft hook with confirmation modal
  const {
    isConfirmOpen,
    isDeleting,
    openConfirm,
    closeConfirm,
    confirmDelete,
  } = useDeleteDraft({
    draftId,
    onError: handleError,
  });

  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    submitStep,
  } = useStep2({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  /**
   * Handle Next button click - validates before submitting
   */
  const handleNextClick = useCallback(() => {
    submitStep(false);
  }, [submitStep]);

  /**
   * Handle Save Draft button click - no validation required
   */
  const handleSaveDraftClick = useCallback(() => {
    submitStep(true);
  }, [submitStep]);

  /**
   * Handle Cancel button click - show confirmation modal
   */
  const handleCancelClick = useCallback(() => {
    openConfirm();
  }, [openConfirm]);

  /**
   * Handle AI Generate button click
   */
  // const handleAIGenerate = useCallback(() => {
  //   console.log('AI Generate clicked');
  //   // TODO: Implement AI generation logic
  // }, []);
console.log(errors)
console.log(formData.invitees)

  return (
    <div className="w-full flex flex-col items-center">
        <div className="relative w-full flex flex-col gap-6">
          {/* Table */}
            <FormTable
              title={INVITEES_TABLE_TITLE}
              columns={INVITEES_TABLE_COLUMNS}
              rows={formData.invitees || []}
              onAddRow={handleAddAttendee}
              onDeleteRow={handleDeleteAttendee}
              onUpdateRow={handleUpdateAttendee}
              addButtonLabel={ADD_INVITEE_BUTTON_LABEL}
              errors={errors}
              touched={touched}
            />
            {/* AI Generate Button */}
            {/* <div className="absolute -bottom-[4px] right-[175px]">
              <AIGenerateButton onClick={handleAIGenerate} />
            </div> */}

          {/* Action Buttons */}
          <ActionButtons
            onCancel={handleCancelClick}
            onSaveDraft={handleSaveDraftClick}
            onNext={handleNextClick}
            disabled={isSubmitting || isDeleting}
          />
      </div>

      {/* Delete Draft Confirmation Modal */}
      <DeleteDraftConfirmationModal
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Step2;
