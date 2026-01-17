import React, { useCallback } from 'react';
import { FormField, FormInput, FormSelect, FormDatePicker, FormTable, FormTextArea, FormSwitch, FormRow } from './components';
import { FormCheckbox } from '@shared';
import { ActionButtons } from '@shared';
import {
  REQUESTER_OPTIONS,
  RELATED_DIRECTIVE_OPTIONS,
  MEETING_NATURE_OPTIONS,
  PREVIOUS_MEETING_OPTIONS,
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  SECTOR_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  PREVIOUS_MEETING_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from './constants';
import { useStep1 } from './useStep1';
import { cn } from '@sanad-ai/ui';

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
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Step1 error:', error);
  }, []);

  const {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoal,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    handleAddSupport,
    handleDeleteSupport,
    handleUpdateSupport,
    handleAddPreviousMeeting,
    handleDeletePreviousMeeting,
    handleUpdatePreviousMeeting,
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
    } catch (error) {
      console.error('Error submitting step 1:', error);
    }
  }, [submitStep, onNext]);

  const handleSaveDraftClick = useCallback(async () => {
    try {
      const newDraftId = await submitStep(true);
      if (newDraftId) {
        onSaveDraft?.(newDraftId);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [submitStep, onSaveDraft]);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        <div className="w-full flex flex-col items-center gap-4 sm:gap-7">
          {/* Row 1 */}
          <FormRow>
            <FormField
              label="مقدّم الطلب"
              error={touched.requester ? errors.requester : undefined}
            >
              <FormSelect
                value={formData.requester}
                onValueChange={(value) => handleChange('requester', value)}
                options={REQUESTER_OPTIONS}
                placeholder="-------"
                error={!!(touched.requester && errors.requester)}
              />
            </FormField>
            <FormField
              label="التوجيه المرتبط"
              error={touched.relatedDirective ? errors.relatedDirective : undefined}
            >
              <FormSelect
                value={formData.relatedDirective}
                onValueChange={(value) => handleChange('relatedDirective', value)}
                options={RELATED_DIRECTIVE_OPTIONS}
                placeholder="-------"
                error={!!(touched.relatedDirective && errors.relatedDirective)}
              />
            </FormField>
          </FormRow>

          {/* Row 2 */}
          <FormRow>
            <FormField
              label="طبيعة الاجتماع"
              required
              error={touched.meetingNature ? errors.meetingNature : undefined}
            >
              <FormSelect
                value={formData.meetingNature}
                onValueChange={(value) => handleChange('meetingNature', value)}
                options={MEETING_NATURE_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingNature && errors.meetingNature)}
              />
            </FormField>
            <FormField
              label="الاجتماع السابق"
              error={touched.previousMeeting ? errors.previousMeeting : undefined}
            >
              <FormSelect
                value={formData.previousMeeting}
                onValueChange={(value) => handleChange('previousMeeting', value)}
                options={PREVIOUS_MEETING_OPTIONS}
                placeholder="-------"
                error={!!(touched.previousMeeting && errors.previousMeeting)}
              />
            </FormField>
          </FormRow>

          {/* Row 3 */}
          <FormRow>
            <FormField
              label="موضوع الاجتماع"
              required
              error={touched.meetingSubject ? errors.meetingSubject : undefined}
            >
              <FormTextArea
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="-------"
                error={!!(touched.meetingSubject && errors.meetingSubject)}
                label=""
              />
            </FormField>
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
          </FormRow>

          {/* Row 4 */}
          <FormRow>
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
            <FormField
              label="مبرّر اللقاء"
              error={touched.meetingReason ? errors.meetingReason : undefined}
            >
              <FormTextArea
                value={formData.meetingReason || ''}
                onChange={(e) => handleChange('meetingReason', e.target.value)}
                onBlur={() => handleBlur('meetingReason')}
                placeholder="-------"
                error={!!(touched.meetingReason && errors.meetingReason)}
                label=""
              />
            </FormField>
          </FormRow>

          {/* Row 5 */}
          <FormRow>
            <FormField
              label="الموضوع المرتبط"
              error={touched.relatedTopic ? errors.relatedTopic : undefined}
            >
              <FormTextArea
                value={formData.relatedTopic || ''}
                onChange={(e) => handleChange('relatedTopic', e.target.value)}
                onBlur={() => handleBlur('relatedTopic')}
                placeholder="-------"
                error={!!(touched.relatedTopic && errors.relatedTopic)}
                label=""
              />
            </FormField>
            <FormField
              label="تاريخ الاستحقاق"
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
          </FormRow>

          {/* Row 6 */}
          <FormRow>
            <FormField
              label="تصنيف الاجتماع"
              error={touched.meetingClassification ? errors.meetingClassification : undefined}
            >
              <FormSelect
                value={formData.meetingClassification}
                onValueChange={(value) => handleChange('meetingClassification', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingClassification && errors.meetingClassification)}
              />
            </FormField>
            <FormField
              label="سريّة الاجتماع"
              error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
            >
              <FormSelect
                value={formData.meetingConfidentiality}
                onValueChange={(value) => handleChange('meetingConfidentiality', value)}
                options={CONFIDENTIALITY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              />
            </FormField>
          </FormRow>

          {/* Row 7 */}
          <FormRow className="sm:justify-end">
            <FormField
              label="القطاع"
              error={touched.sector ? errors.sector : undefined}
            >
              <FormSelect
                value={formData.sector}
                onValueChange={(value) => handleChange('sector', value)}
                options={SECTOR_OPTIONS}
                placeholder="-------"
                error={!!(touched.sector && errors.sector)}
              />
            </FormField>
          </FormRow>
        </div>

        {/* Table 1: Meeting Goals */}
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

        {/* Table 2: Meeting Agenda */}
        <FormTable
          title="أجندة الاجتماع"
          columns={MEETING_AGENDA_COLUMNS}
          rows={formData.meetingAgenda || []}
          onAddRow={handleAddAgenda}
          onDeleteRow={handleDeleteAgenda}
          onUpdateRow={handleUpdateAgenda}
          addButtonLabel="إضافة أجندة"
          errors={tableErrors}
          touched={tableTouched}
        />

        {/* Table 3: Minister Support */}
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

        {/* Switch: Was Discussed Previously */}
        <FormRow className={cn(
          'flex-wrap-reverse sm:flex-nowrap',
          formData.wasDiscussedPreviously ? 'sm:justify-end' : 'sm:justify-end'
        )}>
          <FormSwitch
            checked={formData.wasDiscussedPreviously || false}
            onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
            label="هل تمت مناقشة الموضوع سابقًا؟"
          />
        </FormRow>

        {/* Table 4: Previous Meetings - Only show when wasDiscussedPreviously is checked */}
        {formData.wasDiscussedPreviously && (
          <FormTable
            title="تاريخ الاجتماع السابق"
            columns={PREVIOUS_MEETING_COLUMNS}
            rows={formData.previousMeetings || []}
            onAddRow={handleAddPreviousMeeting}
            onDeleteRow={handleDeletePreviousMeeting}
            onUpdateRow={handleUpdatePreviousMeeting}
            addButtonLabel="إضافة إجتماع سابق"
            errors={tableErrors}
            touched={tableTouched}
          />
        )}

        {/* Table 5: Related Directives */}
        <FormTable
          title="التوجيه المرتبط"
          columns={RELATED_DIRECTIVES_COLUMNS}
          rows={formData.relatedDirectives || []}
          onAddRow={handleAddDirective}
          onDeleteRow={handleDeleteDirective}
          onUpdateRow={handleUpdateDirective}
          addButtonLabel="إضافة توجيه مرتبط"
          errors={tableErrors}
          touched={tableTouched}
        />

        {/* Notes TextArea */}
        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
        />

        {/* Checkbox: Is Complete */}
        <div className="w-full max-w-[1085px] mx-auto px-4">
          <FormCheckbox
            checked={formData.isComplete || false}
            onCheckedChange={(checked) => handleChange('isComplete', checked)}
            label="هل الطلب مكتمل؟"
            required
            error={touched.isComplete ? errors.isComplete : undefined}
          />
        </div>

        <ActionButtons
          onCancel={onCancel}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting}
        />
      </form>
    </div>
  );
};

export default Step1;
