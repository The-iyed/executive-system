import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';
import type { Step2ContentFormData } from '../schemas/step2Content.schema';
import {
  createStep2ContentSchema,
  isPresentationRequired,
  isPresentationHidden,
  isAttachmentTimingRequired,
  isAttachmentTimingVisible,
  type Step2ContentSchemaOptions,
} from '../schemas/step2Content.schema';

interface UseStep2ContentProps {
  draftId: string;
  initialData?: Partial<Step2ContentFormData>;
  meetingCategory?: string;
  meetingConfidentiality?: string;
  isUrgent?: boolean;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
}

interface SubmitStep2ContentPayload {
  formData: Partial<Step2ContentFormData>;
  isDraft: boolean;
  draftId: string;
  schemaOptions: Step2ContentSchemaOptions;
}

const prepareContentFormData = (formData: Partial<Step2ContentFormData>): FormData => {
  const formDataToSend = new FormData();

  if (formData.presentation_attachment_timing && formData.presentation_attachment_timing !== '') {
    const date = new Date(formData.presentation_attachment_timing + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      formDataToSend.append('presentation_attachment_timing', formData.presentation_attachment_timing);
    }
  }

  if (formData.presentation_files && formData.presentation_files.length > 0) {
    formData.presentation_files.forEach((file) => {
      formDataToSend.append('presentation_files', file);
    });
  }
  if (formData.additional_files && formData.additional_files.length > 0) {
    formData.additional_files.forEach((file) => {
      formDataToSend.append('additional_files', file);
    });
  }

  return formDataToSend;
};

export const submitStep2ContentData = async (payload: SubmitStep2ContentPayload): Promise<void> => {
  const { formData, isDraft, draftId, schemaOptions } = payload;

  if (!isDraft) {
    const schema = createStep2ContentSchema(schemaOptions);
    const validationResult = schema.safeParse(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const formDataToSend = prepareContentFormData(formData);

  await axiosInstance.patch(
    `/api/meeting-requests/drafts/${draftId}/content`,
    formDataToSend
  );
};

export const useStep2Content = ({
  draftId,
  initialData,
  meetingCategory,
  meetingConfidentiality,
  isUrgent = false,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep2ContentProps) => {
  const [formData, setFormData] = useState<Partial<Step2ContentFormData>>({
    presentation_files: [],
    additional_files: [],
    existingFiles: [],
    existingAdditionalFiles: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step2ContentFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step2ContentFormData, boolean>>>({});

  const schemaOptions = useMemo(
    () => ({ meetingCategory, meetingConfidentiality, isUrgent }),
    [meetingCategory, meetingConfidentiality, isUrgent]
  );

  const presentationRequired = useMemo(
    () => isPresentationRequired(schemaOptions),
    [schemaOptions]
  );

  const showPresentationBlock = useMemo(
    () => !isPresentationHidden(schemaOptions),
    [schemaOptions]
  );

  const showAttachmentTiming = useMemo(
    () => isAttachmentTimingVisible(schemaOptions),
    [schemaOptions]
  );

  const attachmentTimingRequired = useMemo(
    () => isAttachmentTimingRequired(schemaOptions),
    [schemaOptions]
  );

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        existingFiles: initialData.existingFiles || prev.existingFiles || [],
        existingAdditionalFiles: initialData.existingAdditionalFiles || prev.existingAdditionalFiles || [],
      }));
    }
  }, [initialData, isEditMode]);

  const submitMutation = useMutation({
    mutationFn: (payload: { formData: Partial<Step2ContentFormData>; isDraft: boolean }) =>
      submitStep2ContentData({
        ...payload,
        draftId,
        schemaOptions,
      }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const schema = useMemo(() => createStep2ContentSchema(schemaOptions), [schemaOptions]);
  const validationResult = useMemo(() => schema.safeParse(formData), [formData, schema]);

  const validateAll = useCallback(
    (markTouched = true): boolean => {
      if (!validationResult.success) {
        const newErrors: Partial<Record<keyof Step2ContentFormData, string>> = {};
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0] as keyof Step2ContentFormData;
          if (field) newErrors[field] = err.message;
        });
        setErrors(newErrors);
        if (markTouched) {
          const toTouch: Partial<Record<keyof Step2ContentFormData, boolean>> = { additional_files: true };
          if (showPresentationBlock) toTouch.presentation_files = true;
          if (showAttachmentTiming) toTouch.presentation_attachment_timing = true;
          setTouched(toTouch);
        }
        // Scroll to first field with error after re-render
        setTimeout(() => {
          const firstErrorElement = document.querySelector('[data-error-field]');
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            const formContainer = document.querySelector('[data-form-container]');
            if (formContainer) {
              formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 100);
        return false;
      }
      setErrors({});
      return true;
    },
    [validationResult, showPresentationBlock, showAttachmentTiming]
  );

  const handleChange = useCallback((field: keyof Step2ContentFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = useCallback((field: keyof Step2ContentFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleFilesSelect = useCallback((files: File[]) => {
    setFormData((prev) => ({ ...prev, presentation_files: files }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.presentation_files;
      return next;
    });
  }, []);

  const handleAdditionalFilesSelect = useCallback((files: File[]) => {
    setFormData((prev) => ({ ...prev, additional_files: files || [] }));
  }, []);

  const submitStep = useCallback(
    async (isDraft = false): Promise<void> => {
      if (!isDraft && !validateAll(true)) {
        return;
      }

      submitMutation.mutate({
        formData,
        isDraft,
      });
    },
    [formData, validateAll, submitMutation]
  );

  return {
    formData,
    errors,
    touched,
    presentationRequired,
    showPresentationBlock,
    showAttachmentTiming,
    attachmentTimingRequired,
    isSubmitting: submitMutation.isPending,
    handleChange,
    handleBlur,
    handleFilesSelect,
    handleAdditionalFilesSelect,
    validateAll,
    submitStep,
  };
};