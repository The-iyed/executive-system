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
import { getStep2EditableMap } from '../utils/editableFields';

interface UseStep2ContentProps {
  draftId: string;
  initialData?: Partial<Step2ContentFormData>;
  meetingCategory?: string;
  meetingConfidentiality?: string;
  isUrgent?: boolean;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  /** From get meeting details: API editable_fields. Used to disable non-editable fields in edit. */
  editableFields?: string[] | null;
}

interface SubmitStep2ContentPayload {
  formData: Partial<Step2ContentFormData>;
  isDraft: boolean;
  draftId: string;
  schemaOptions: Step2ContentSchemaOptions;
  replacementPresentationFiles: Record<string, File>;
  replacementAdditionalFiles: Record<string, File>;
}

const prepareContentFormData = (
  formData: Partial<Step2ContentFormData>,
  replacementPresentationFiles: Record<string, File>,
  replacementAdditionalFiles: Record<string, File>
): FormData => {
  const formDataToSend = new FormData();

  if (formData.presentation_attachment_timing && formData.presentation_attachment_timing !== '') {
    const date = new Date(formData.presentation_attachment_timing + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      formDataToSend.append('presentation_attachment_timing', formData.presentation_attachment_timing);
    }
  }

  const existingPresentation = formData.existingFiles ?? [];
  const presentationReplacedIds: (string | null)[] = existingPresentation.map((e) =>
    replacementPresentationFiles[e.id] ? e.id : null
  );
  const presentationReplacementFiles = existingPresentation
    .filter((e) => replacementPresentationFiles[e.id])
    .map((e) => replacementPresentationFiles[e.id]!);
  const presentationNewFiles = formData.presentation_files ?? [];
  const allPresentationFiles = [...presentationReplacementFiles, ...presentationNewFiles];
  const presentationReplacesIds = [
    ...presentationReplacedIds.filter((id): id is string => id !== null),
    ...presentationNewFiles.map(() => null),
  ];

  allPresentationFiles.forEach((file) => {
    formDataToSend.append('presentation_files', file);
  });
  if (presentationReplacesIds.length > 0) {
    formDataToSend.append('replaces_attachment_ids', JSON.stringify(presentationReplacesIds));
  }

  const existingAdditional = formData.existingAdditionalFiles ?? [];
  const additionalReplacementFiles = existingAdditional
    .filter((e) => replacementAdditionalFiles[e.id])
    .map((e) => replacementAdditionalFiles[e.id]!);
  const additionalNewFiles = formData.additional_files ?? [];
  const allAdditionalFiles = [...additionalReplacementFiles, ...additionalNewFiles];
  const additionalReplacesIds = [
    ...existingAdditional
      .filter((e) => replacementAdditionalFiles[e.id])
      .map((e) => e.id),
    ...additionalNewFiles.map(() => null),
  ];

  allAdditionalFiles.forEach((file) => {
    formDataToSend.append('additional_files', file);
  });
  if (additionalReplacesIds.length > 0) {
    formDataToSend.append('replaces_additional_attachment_ids', JSON.stringify(additionalReplacesIds));
  }

  const deletedIds = formData.deleted_attachment_ids ?? [];
  if (deletedIds.length > 0) {
    formDataToSend.append('deleted_attachment_ids', JSON.stringify(deletedIds));
  }

  return formDataToSend;
};

/** Returns true if the FormData has at least one entry (so we send multipart). */
function hasFormDataEntries(fd: FormData): boolean {
  return !fd.entries().next().done;
}

/** Returns true if we have deleted attachment ids to send (may need JSON body). */
function hasDeletedAttachmentIds(formData: Partial<Step2ContentFormData>): boolean {
  const ids = formData.deleted_attachment_ids ?? [];
  return ids.length > 0;
}

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

  const formDataToSend = prepareContentFormData(
    formData,
    payload.replacementPresentationFiles,
    payload.replacementAdditionalFiles
  );
  const url = `/api/meeting-requests/drafts/${draftId}/content`;

  if (hasFormDataEntries(formDataToSend)) {
    await axiosInstance.patch(url, formDataToSend);
  } else if (hasDeletedAttachmentIds(formData)) {
    await axiosInstance.patch(url, { deleted_attachment_ids: formData.deleted_attachment_ids }, { headers: { 'Content-Type': 'application/json' } });
  } else {
    await axiosInstance.patch(url, {}, { headers: { 'Content-Type': 'application/json' } });
  }
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
  editableFields,
}: UseStep2ContentProps) => {
  const step2EditableMap = useMemo(
    () => getStep2EditableMap(editableFields ?? undefined),
    [editableFields]
  );
  const [formData, setFormData] = useState<Partial<Step2ContentFormData>>({
    presentation_files: [],
    additional_files: [],
    existingFiles: [],
    existingAdditionalFiles: [],
    deleted_attachment_ids: [],
    ...initialData,
  });
  const [replacementPresentationFiles, setReplacementPresentationFiles] = useState<Record<string, File>>({});
  const [replacementAdditionalFiles, setReplacementAdditionalFiles] = useState<Record<string, File>>({});
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
    mutationFn: (payload: {
      formData: Partial<Step2ContentFormData>;
      isDraft: boolean;
      replacementPresentationFiles: Record<string, File>;
      replacementAdditionalFiles: Record<string, File>;
    }) =>
      submitStep2ContentData({
        formData: payload.formData,
        isDraft: payload.isDraft,
        draftId,
        schemaOptions,
        replacementPresentationFiles: payload.replacementPresentationFiles,
        replacementAdditionalFiles: payload.replacementAdditionalFiles,
      }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error: unknown) => {
      const editStateMessage = 'لا يمكنك التعديل على هذا الاجتماع في حالته الحالية';
      let message = isEditMode ? editStateMessage : 'حدث خطأ أثناء الحفظ';

      if (!isEditMode) {
        if (error && typeof error === 'object') {
          const anyError = error as { detail?: unknown };
          if (typeof anyError.detail === 'string') message = anyError.detail;
        } else if (typeof error === 'string') {
          message = error;
        }
      }

      const err = error instanceof Error ? error : new Error(message);
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

  const handleDeleteExistingAttachment = useCallback(
    (attachmentId: string, type: 'presentation' | 'additional') => {
      setFormData((prev) => {
        const deletedIds = [...(prev.deleted_attachment_ids ?? []), attachmentId];
        if (type === 'presentation') {
          const existingFiles = (prev.existingFiles ?? []).filter((f) => f.id !== attachmentId);
          return { ...prev, deleted_attachment_ids: deletedIds, existingFiles };
        }
        const existingAdditionalFiles = (prev.existingAdditionalFiles ?? []).filter((f) => f.id !== attachmentId);
        return { ...prev, deleted_attachment_ids: deletedIds, existingAdditionalFiles };
      });
      if (type === 'presentation') {
        setReplacementPresentationFiles((prev) => {
          const next = { ...prev };
          delete next[attachmentId];
          return next;
        });
      } else {
        setReplacementAdditionalFiles((prev) => {
          const next = { ...prev };
          delete next[attachmentId];
          return next;
        });
      }
    },
    []
  );

  const handleReplacePresentationFile = useCallback((existingId: string, file: File) => {
    setReplacementPresentationFiles((prev) => ({ ...prev, [existingId]: file }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.presentation_files;
      return next;
    });
  }, []);

  const handleReplaceAdditionalFile = useCallback((existingId: string, file: File) => {
    setReplacementAdditionalFiles((prev) => ({ ...prev, [existingId]: file }));
  }, []);

  const handleClearReplacementPresentation = useCallback((existingId: string) => {
    setReplacementPresentationFiles((prev) => {
      const next = { ...prev };
      delete next[existingId];
      return next;
    });
  }, []);

  const handleClearReplacementAdditional = useCallback((existingId: string) => {
    setReplacementAdditionalFiles((prev) => {
      const next = { ...prev };
      delete next[existingId];
      return next;
    });
  }, []);

  const submitStep = useCallback(
    async (isDraft = false): Promise<void> => {
      if (!isDraft && !validateAll(true)) {
        return;
      }

      submitMutation.mutate({
        formData,
        isDraft,
        replacementPresentationFiles,
        replacementAdditionalFiles,
      });
    },
    [formData, replacementPresentationFiles, replacementAdditionalFiles, validateAll, submitMutation]
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
    replacementPresentationFiles,
    replacementAdditionalFiles,
    handleChange,
    handleBlur,
    handleFilesSelect,
    handleAdditionalFilesSelect,
    handleDeleteExistingAttachment,
    handleReplacePresentationFile,
    handleReplaceAdditionalFile,
    handleClearReplacementPresentation,
    handleClearReplacementAdditional,
    validateAll,
    submitStep,
    step2EditableMap,
  };
};