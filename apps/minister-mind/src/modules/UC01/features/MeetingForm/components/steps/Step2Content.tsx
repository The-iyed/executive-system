import React from 'react';
import { FormField, FormDatePicker, FileUpload, ActionButtons, FormRow } from '@shared';
import type { Step2ContentFormData } from '../../schemas/step2Content.schema';

// PDF only for presentation
const PRESENTATION_ACCEPTED_TYPES = ['application/pdf'];
const PRESENTATION_ACCEPTED_EXTENSIONS = ['.pdf'];

// PDF, Word, Excel for optional attachments
const ADDITIONAL_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ADDITIONAL_ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

export interface Step2ContentProps {
  formData: Partial<Step2ContentFormData>;
  errors: Partial<Record<keyof Step2ContentFormData, string>>;
  touched: Partial<Record<keyof Step2ContentFormData, boolean>>;
  presentationRequired: boolean;
  showPresentationBlock: boolean;
  showAttachmentTiming: boolean;
  attachmentTimingRequired: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step2ContentFormData, value: unknown) => void;
  handleBlur: (field: keyof Step2ContentFormData) => void;
  handleFilesSelect: (files: File[]) => void;
  handleAdditionalFilesSelect: (files: File[]) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
}

export const Step2Content: React.FC<Step2ContentProps> = ({
  formData,
  errors,
  touched,
  presentationRequired,
  showPresentationBlock,
  showAttachmentTiming,
  attachmentTimingRequired,
  isSubmitting,
  isDeleting,
  handleChange,
  handleBlur,
  handleFilesSelect,
  handleAdditionalFilesSelect,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
}) => {
  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        <div className="w-full max-w-[1085px] flex flex-col gap-8">
          {showPresentationBlock && (
            <div {...(errors.presentation_files ? { 'data-error-field': true } : {})}>
              <FileUpload
                files={formData.presentation_files}
                error={errors.presentation_files}
                onFilesSelect={handleFilesSelect}
                required={presentationRequired}
                existingFiles={formData.existingFiles}
                multiple
                label="العرض التقديمي"
                acceptedTypes={PRESENTATION_ACCEPTED_TYPES}
                acceptedExtensions={PRESENTATION_ACCEPTED_EXTENSIONS}
              />
            </div>
          )}

          {showAttachmentTiming && (
            <FormRow className='sm:justify-end' {...(errors.presentation_attachment_timing ? { 'data-error-field': true } : {})}>
              <FormField
                label="متى سيتم إرفاق العرض؟"
                required={attachmentTimingRequired}
                error={touched.presentation_attachment_timing ? errors.presentation_attachment_timing : undefined}
              >
                <FormDatePicker
                  value={formData.presentation_attachment_timing}
                  onChange={(value) => handleChange('presentation_attachment_timing', value)}
                  onBlur={() => handleBlur('presentation_attachment_timing')}
                  placeholder="dd/mm/yyyy"
                  error={!!(touched.presentation_attachment_timing && errors.presentation_attachment_timing)}
                />
              </FormField>
            </FormRow>
          )}

          <div {...(errors.additional_files ? { 'data-error-field': true } : {})}>
            <FileUpload
              files={formData.additional_files}
              onFilesSelect={handleAdditionalFilesSelect}
              existingFiles={formData.existingAdditionalFiles}
              multiple
              label="مرفقات اختيارية (PDF، Word، Excel)"
              acceptedTypes={ADDITIONAL_ACCEPTED_TYPES}
              acceptedExtensions={ADDITIONAL_ACCEPTED_EXTENSIONS}
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
    </div>
  );
};
