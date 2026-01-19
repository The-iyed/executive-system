import React from 'react';
import { 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker, 
  FormTable, 
  FormTextArea, 
  FormSwitch, 
  FileUpload,
  FormRow,
  ActionButtons 
} from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from '../../utils/constants';
import { cn } from '@sanad-ai/ui';
import type { Step1FormData } from '../../schemas/step1.schema';

export interface Step1Props {
  // Form data and state
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  
  // Handlers
  handleChange: (field: keyof Step1FormData, value: any) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  handleFilesSelect: (files: File[]) => void;
  handleAddGoal: () => void;
  handleDeleteGoal: (id: string) => void;
  handleUpdateGoal: (id: string, field: string, value: any) => void;
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: any) => void;
  handleAddSupport: () => void;
  handleDeleteSupport: (id: string) => void;
  handleUpdateSupport: (id: string, field: string, value: any) => void;
  handleAddDirective: () => void;
  handleDeleteDirective: (id: string) => void;
  handleUpdateDirective: (id: string, field: string, value: any) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  
  // Utilities
  isFieldRequired: (field: keyof Step1FormData) => boolean;
}

export const Step1: React.FC<Step1Props> = ({
  formData,
  errors,
  touched,
  tableErrors,
  tableTouched,
  isSubmitting,
  isDeleting,
  handleChange,
  handleBlur,
  handleFilesSelect,
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
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  isFieldRequired,
}) => {
  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        {/* Existing form fields */}
        <div className="w-full flex flex-col items-center gap-6 sm:gap-7">
          <FormRow>
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
          </FormRow>

          <FormRow>
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
          </FormRow>

          <FormRow>
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
          </FormRow>

          <FormRow>
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
          </FormRow>

          <FormRow className='sm:justify-end'>
            <FormField
              label="القطاع"
              required={isFieldRequired('sector')}
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
          </FormRow>
        </div>

        <FileUpload
          files={formData.presentation_files}
          error={errors.presentation_files}
          onFilesSelect={handleFilesSelect}
          required={isFieldRequired('presentation_files')}
          existingFiles={formData.existingFiles}
          multiple={true}
        />

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
          errorMessage={errors?.meetingGoals}
        />

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
          errorMessage={errors?.meetingAgenda}
        />

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
          errorMessage={errors?.ministerSupport}
        />
        
        <FormRow 
          className={cn(
            'flex-wrap-reverse sm:flex-nowrap',
            formData.wasDiscussedPreviously ? 'sm:justify-between' : 'sm:justify-end')}
        >
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
          <FormSwitch
            checked={formData.wasDiscussedPreviously || false}
            onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
            label="هل تمت مناقشة الموضوع سابقاً؟"
          />
        </FormRow>

        {formData.wasDiscussedPreviously && (
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
            errorMessage={errors?.relatedDirectives}
          />
        )}

        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
          error={errors?.notes}
        />

        <ActionButtons
          onCancel={handleCancelClick}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
};