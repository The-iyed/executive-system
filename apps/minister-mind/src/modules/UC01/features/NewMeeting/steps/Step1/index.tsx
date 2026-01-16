import React, { useCallback } from 'react';
import { FormField, FormInput, FormSelect, FormDatePicker, FormTable, FormTextArea, FormSwitch, FileUpload } from './components';
import { ActionButtons } from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from './constants';
import { useStep1 } from './useStep1';
import { useDeleteDraft } from '../../hooks/useDeleteDraft';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';

interface Step1Props {
  draftId?: string;
  onNext?: (draftId: string) => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: (draftId: string) => void;
}

const Step1: React.FC<Step1Props> = ({ draftId, onNext, onCancel, onSaveDraft }) => {
  const handleSuccess = useCallback((newDraftId: string) => {
    console.log('newDraftId', newDraftId);
    // Draft ID is handled by the hook, parent component will receive it via callbacks
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Step1 error:', error);
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
    tableErrors,
    tableTouched,
    isSubmitting,
    // isLoading,
    // isError,
    // isSuccess,
    // error: submitError,
    isFieldRequired,
    handleChange,
    handleBlur,
    handleFileSelect,
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoal,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    handleAddSupport,
    handleDeleteSupport,
    handleUpdateSupport,
    handleAddDirective,
    handleDeleteDirective,
    handleUpdateDirective,
    validateAll,
    submitStep,
  } = useStep1({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleNextClick = useCallback(async () => {
    try {
      const newDraftId = await submitStep(false);
      if (newDraftId) {
        onNext?.(newDraftId);
      }
      // If validation fails, submitStep returns null and errors are already displayed
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error submitting step 1:', error);
    }
  }, [submitStep, onNext]);

  const handleSaveDraftClick = useCallback(async () => {
    try {
      // Always validate and show errors, but don't block submission for drafts
      const newDraftId = await submitStep(true);
      if (newDraftId) {
        onSaveDraft?.(newDraftId);
      }
      // Even if validation fails, we still try to save as draft
      // Errors are displayed but don't block the save
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error saving draft:', error);
    }
  }, [submitStep, onSaveDraft]);

  /**
   * Handle Cancel button click - show confirmation modal
   */
  const handleCancelClick = useCallback(() => {
    openConfirm();
  }, [openConfirm]);

  // Placeholder styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input::placeholder,
      input[data-placeholder],
      textarea::placeholder {
        font-style: normal !important;
        font-weight: 400 !important;
        font-size: 16px !important;
        color: #667085 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        {/* Existing form fields */}
        <div className="w-full flex flex-col items-center gap-8">
          {/* Row 1 */}
          <div
            className="w-[1085px] h-[70px] flex flex-row-reverse items-start gap-4"
          >
            <FormField
              label="نوع الاجتماع"
              required
              error={touched.meetingType ? errors.meetingType : undefined}
            >
              <FormSelect
                value={formData.meetingType}
                onValueChange={(value) => handleChange('meetingType', value)}
                options={MEETING_TYPE_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingType && errors.meetingType)}
              />
            </FormField>
            <FormField
              label="موضوع الاجتماع"
              required
              error={touched.meetingSubject ? errors.meetingSubject : undefined}
            >
              <FormInput
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="-------"
                error={!!(touched.meetingSubject && errors.meetingSubject)}
              />
            </FormField>
          </div>

          {/* Row 2 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="مبرر اللقاء"
              required={isFieldRequired('meetingReason')}
              error={touched.meetingReason ? errors.meetingReason : undefined}
            >
              <FormInput
                value={formData.meetingReason || ''}
                onChange={(e) => handleChange('meetingReason', e.target.value)}
                onBlur={() => handleBlur('meetingReason')}
                placeholder="-------"
                error={!!(touched.meetingReason && errors.meetingReason)}
              />
            </FormField>
            <FormField
              label="فئة الاجتماع"
              required
              error={touched.meetingCategory ? errors.meetingCategory : undefined}
            >
              <FormSelect
                value={formData.meetingCategory}
                onValueChange={(value) => handleChange('meetingCategory', value)}
                options={MEETING_CATEGORY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingCategory && errors.meetingCategory)}
              />
            </FormField>
          </div>

          {/* Row 3 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="تاريخ الاستحقاق"
              required={isFieldRequired('dueDate')}
              error={touched.dueDate ? errors.dueDate : undefined}
            >
              <FormDatePicker
                value={formData.dueDate}
                onChange={(value) => handleChange('dueDate', value)}
                onBlur={() => handleBlur('dueDate')}
                placeholder="dd:mm:yyyy"
                error={!!(touched.dueDate && errors.dueDate)}
              />
            </FormField>
            <FormField
              label="الموضوع المرتبط"
              required={isFieldRequired('relatedTopic')}
              error={touched.relatedTopic ? errors.relatedTopic : undefined}
            >
              <FormInput
                value={formData.relatedTopic || ''}
                onChange={(e) => handleChange('relatedTopic', e.target.value)}
                onBlur={() => handleBlur('relatedTopic')}
                placeholder="-------"
                error={!!(touched.relatedTopic && errors.relatedTopic)}
              />
            </FormField>
          </div>

          {/* Row 4 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
          <FormField
              label="سرية الاجتماع"
              required
              error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
            >
              <FormSelect
                value={formData.meetingConfidentiality}
                onValueChange={(value) => handleChange('meetingConfidentiality', value)}
                options={CONFIDENTIALITY_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              />
            </FormField>
            <FormField
              label="تصنيف الاجتماع"
              required
              error={touched.meetingClassification1 ? errors.meetingClassification1 : undefined}
            >
              <FormSelect
                value={formData.meetingClassification1}
                onValueChange={(value) => handleChange('meetingClassification1', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingClassification1 && errors.meetingClassification1)}
              />
            </FormField>
          </div>

          {/* Row 5 */}
          <div
            // className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="القطاع"
              error={touched.sector ? errors.sector : undefined}
            >
              <FormInput
                value={formData.sector || ''}
                onChange={(e) => handleChange('sector', e.target.value)}
                onBlur={() => handleBlur('sector')}
                placeholder="-------"
                error={!!(touched.sector && errors.sector)}
              />
            </FormField>
          </div>
        </div>

        {/* File Upload */}
        <FileUpload
          file={formData.file}
          error={errors.file}
          onFileSelect={handleFileSelect}
          required={isFieldRequired('file')}
        />

        {/* Table 1: Meeting Goals */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="الهدف من الاجتماع"
              required
              columns={MEETING_GOALS_COLUMNS}
              rows={formData.meetingGoals || []}
              onAddRow={handleAddGoal}
              onDeleteRow={handleDeleteGoal}
              onUpdateRow={handleUpdateGoal}
              addButtonLabel="إضافة هدف"
              errors={tableErrors}
              touched={tableTouched}
              hasError={!!(errors.meetingGoals || Object.keys(tableErrors).length > 0)}
              errorMessage={errors.meetingGoals || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة هدف واحد على الأقل' : undefined)}
            />
          </div>
        </div>

        {/* Table 2: Meeting Agenda */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="أجندة الاجتماع"
              required={isFieldRequired('meetingAgenda')}
              columns={MEETING_AGENDA_COLUMNS}
              rows={formData.meetingAgenda || []}
              onAddRow={handleAddAgenda}
              onDeleteRow={handleDeleteAgenda}
              onUpdateRow={handleUpdateAgenda}
              addButtonLabel="إضافة أجندة"
              errors={tableErrors}
              touched={tableTouched}
              hasError={!!(errors.meetingAgenda || Object.keys(tableErrors).length > 0)}
              errorMessage={errors.meetingAgenda || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة عنصر أجندة واحد على الأقل عند وجود ملف عرض تقديمي' : undefined)}
            />
          </div>
        </div>

        {/* Table 3: Minister Support */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="الدعم المطلوب من الوزير"
              required
              columns={MINISTER_SUPPORT_COLUMNS}
              rows={formData.ministerSupport || []}
              onAddRow={handleAddSupport}
              onDeleteRow={handleDeleteSupport}
              onUpdateRow={handleUpdateSupport}
              addButtonLabel="إضافة دعم"
              errors={tableErrors}
              touched={tableTouched}
              hasError={!!(errors.ministerSupport || Object.keys(tableErrors).length > 0)}
              errorMessage={errors.ministerSupport || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة دعم واحد على الأقل' : undefined)}
            />
          </div>
        </div>

        {/* Toggle Switch and Date Picker */}
        <div className="w-full flex justify-center">
          <div
            className="w-[1085px] h-[70px] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-6 w-full h-full">
              <FormSwitch
                checked={formData.wasDiscussedPreviously || false}
                onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
                label="هل تمت مناقشة الموضوع سابقاً؟"
              />
              {formData.wasDiscussedPreviously && (
                <FormField
                  label="تاريخ الاجتماع السابق"
                  required={isFieldRequired('previousMeetingDate')}
                  error={touched.previousMeetingDate ? errors.previousMeetingDate : undefined}
                >
                  <FormDatePicker
                    value={formData.previousMeetingDate}
                    onChange={(value) => handleChange('previousMeetingDate', value)}
                    onBlur={() => handleBlur('previousMeetingDate')}
                    placeholder="dd:mm:yyyy"
                    error={!!(touched.previousMeetingDate && errors.previousMeetingDate)}
                  />
                </FormField>
              )}
            </div>
          </div>
        </div>

        {/* Table 4: Related Directives - Only show when wasDiscussedPreviously is checked */}
        {formData.wasDiscussedPreviously && (
          <div className="w-full flex justify-center">
            <div style={{ width: '1085px' }}>
              <FormTable
                title="التوجيه المرتبط"
                columns={RELATED_DIRECTIVES_COLUMNS}
                rows={formData.relatedDirectives || []}
                onAddRow={handleAddDirective}
                onDeleteRow={handleDeleteDirective}
                onUpdateRow={handleUpdateDirective}
                addButtonLabel="إضافة توجيه مرتبط"
              />
            </div>
          </div>
        )}

        {/* Notes TextArea */}
        <div className="w-full flex justify-center">
          <div
            className="flex flex-col gap-2"
            style={{ width: '1085px' }}
          >
            <label
              className="text-right text-[14px] font-medium text-[#344054]"
            >
              ملاحظات
            </label>
            <FormTextArea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="ملاحظات...."
            />
          </div>
        </div>
            <ActionButtons
              onCancel={handleCancelClick}
              onSaveDraft={handleSaveDraftClick}
              onNext={handleNextClick}
              disabled={isSubmitting || isDeleting}
            />
      </form>

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

export default Step1;
