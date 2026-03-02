import React from 'react';
import { ActionButtons, FileUpload, FormField, FormSwitch } from '@shared';
import type { Step2FormData } from '../../schemas/step2.schema';

export interface Step2Props {
  formData: Partial<Step2FormData>;
  errors: Partial<Record<keyof Step2FormData, string>>;
  touched: Partial<Record<keyof Step2FormData, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step2FormData, value: unknown) => void;
  handleBlur: (field: keyof Step2FormData) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  /** Only when true is "العرض مطلوب؟" shown (Urgent meeting). Hidden by default; value resets when hidden. */
  showPresentationRequiredField?: boolean;
  isPresentationRequiredRequired?: boolean;
}

export const Step2: React.FC<Step2Props> = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isDeleting,
  handleChange,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  showPresentationRequiredField = false,
  isPresentationRequiredRequired = false,
}) => {
  return (
    <div className="w-full min-w-0 flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center w-full min-w-0 max-w-full">
        <div className="grid grid-cols-1 gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 space-y-0">
          <FileUpload
            label="ملف العرض التقديمي"
            file={formData.presentation_file ?? undefined}
            onFileSelect={(file) => handleChange('presentation_file', file ?? null)}
            error={touched.presentation_file ? errors.presentation_file : undefined}
            required={false}
          />

          {showPresentationRequiredField && (
            <FormField
              label="العرض مطلوب؟"
              required={isPresentationRequiredRequired}
              error={touched.presentation_required ? errors.presentation_required : undefined}
              className="w-full max-w-[1200px] h-auto"
            >
              <FormSwitch
                checked={formData.presentation_required === true}
                onCheckedChange={(checked) => handleChange('presentation_required', checked)}
              />
            </FormField>
          )}

          <FileUpload
            label="مرفقات اختيارية"
            multiple
            files={formData.optional_attachments ?? []}
            onFilesSelect={(files) => handleChange('optional_attachments', files)}
            error={touched.optional_attachments ? errors.optional_attachments : undefined}
            required={false}
          />
        </div>

        <ActionButtons
          onCancel={handleCancelClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
};