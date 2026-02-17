import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';
import {
  validateStep2,
  type Step2FormData,
  type Step2ValidationContext,
} from '../schemas/step2.schema';
import { getMeetingTimeDifferenceHours } from '../utils/date';
import { MAX_ALLOWED_HOURS_WITHOUT_PRESENTATION } from '../utils/constants';
import type { Step1FormData } from '../schemas/step1.schema';

const MEETING_NATURE_NO_PREFILL = new Set(['SEQUENTIAL', 'PERIODIC']);

interface UseStep2Props {
  draftId: string;
  initialData?: Partial<Step2FormData>;
  /** Step 1 data for dynamic validation and for not auto-filling presentation when nature is SEQUENTIAL/PERIODIC */
  step1FormData?: Partial<Step1FormData>;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  /** Only NEW meetings may allow auto-prefill of presentation_file; when false, do not prefill from initialData when nature is SEQUENTIAL/PERIODIC */
  isNewMeeting?: boolean;
}

interface SubmitStep2Payload {
  formData: Partial<Step2FormData>;
  isDraft: boolean;
  draftId: string;
}

const submitStep2Data = async (payload: SubmitStep2Payload): Promise<{ success: boolean }> => {
  const { formData, draftId } = payload;

  const hasPresentationFile =
    formData.presentation_file instanceof File && formData.presentation_file.size > 0;
  const hasOptionalAttachments =
    Array.isArray(formData.optional_attachments) && formData.optional_attachments.length > 0;

  if (hasPresentationFile || hasOptionalAttachments) {
    const body = new FormData();
    body.append('presentation_required', String(formData.presentation_required === true));
    if (hasPresentationFile) {
      body.append('presentation_file', formData.presentation_file!);
    }
    (formData.optional_attachments ?? []).forEach((file) => {
      body.append('optional_attachments', file);
    });
    await axiosInstance.put(`/api/meeting-requests/direct-schedule/${draftId}/step2`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } else {
    await axiosInstance.put(
      `/api/meeting-requests/direct-schedule/${draftId}/step2`,
      {
        presentation_required: formData.presentation_required === true,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return { success: true };
};

function buildValidationContext(step1FormData?: Partial<Step1FormData>): Step2ValidationContext {
  const is_urgent = step1FormData?.isUrgent ?? false;
  const meetingStartDate =
    typeof step1FormData?.meetingStartDate === 'string'
      ? step1FormData.meetingStartDate
      : undefined;
  const meeting_time_difference_hours = getMeetingTimeDifferenceHours(meetingStartDate ?? undefined);
  return {
    is_urgent,
    meeting_time_difference_hours,
    max_allowed_hours_without_presentation: MAX_ALLOWED_HOURS_WITHOUT_PRESENTATION,
  };
}

export const useStep2 = ({
  draftId,
  initialData,
  step1FormData,
  onSuccess,
  onError,
  isEditMode = false,
  isNewMeeting = true,
}: UseStep2Props) => {
  const sanitizedInitial = useMemo(() => {
    if (!initialData) return undefined;
    const nature = step1FormData?.meetingNature;
    const shouldNotPrefillPresentation =
      typeof nature === 'string' &&
      MEETING_NATURE_NO_PREFILL.has(nature) &&
      !isNewMeeting;
    if (shouldNotPrefillPresentation) {
      const { presentation_file: _, ...rest } = initialData;
      return { ...rest, presentation_file: undefined };
    }
    return initialData;
  }, [initialData, step1FormData?.meetingNature, isNewMeeting]);

  const [formData, setFormData] = useState<Partial<Step2FormData>>({
    presentation_file: undefined,
    presentation_required: undefined,
    optional_attachments: [],
    ...sanitizedInitial,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step2FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step2FormData, boolean>>>({});

  useEffect(() => {
    if (sanitizedInitial && isEditMode) {
      setFormData((prev) => {
        const nature = step1FormData?.meetingNature;
        const shouldNotPrefillPresentation =
          typeof nature === 'string' &&
          MEETING_NATURE_NO_PREFILL.has(nature) &&
          !isNewMeeting;
        const merged = { ...prev, ...sanitizedInitial };
        if (shouldNotPrefillPresentation) {
          return { ...merged, presentation_file: undefined };
        }
        return merged;
      });
    }
  }, [sanitizedInitial, isEditMode, isNewMeeting, step1FormData?.meetingNature]);

  const validationContext = useMemo(
    () => buildValidationContext(step1FormData),
    [step1FormData]
  );

  const submitMutation = useMutation({
    mutationFn: (payload: { formData: Partial<Step2FormData>; isDraft: boolean }) =>
      submitStep2Data({ ...payload, draftId }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const validateAll = useCallback((): boolean => {
    const result = validateStep2(formData, validationContext);
    if (!result.success) {
      const newErrors: Partial<Record<keyof Step2FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const path0 = err.path[0];
        if (typeof path0 === 'string' && path0 in formData) {
          newErrors[path0 as keyof Step2FormData] = err.message;
        }
      });
      setErrors(newErrors);
      setTouched({
        presentation_file: true,
        presentation_required: true,
        optional_attachments: true,
      });
      return false;
    }
    setErrors({});
    return true;
  }, [formData, validationContext]);

  const handleChange = useCallback((field: keyof Step2FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = useCallback((field: keyof Step2FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const submitStep = useCallback(
    async (isDraft: boolean = false): Promise<void> => {
      if (!isDraft && !validateAll()) {
        return;
      }
      submitMutation.mutate({
        formData,
        isDraft,
      });
    },
    [formData, validateAll, submitMutation]
  );

  const isPresentationRequiredRequired = useMemo(() => {
    const hasFile =
      formData.presentation_file != null &&
      formData.presentation_file !== undefined &&
      (formData.presentation_file instanceof File ? formData.presentation_file.size > 0 : true);
    if (hasFile) return false;
    const { is_urgent, meeting_time_difference_hours, max_allowed_hours_without_presentation } =
      validationContext;
    const timeExceeds =
      meeting_time_difference_hours != null &&
      meeting_time_difference_hours > max_allowed_hours_without_presentation;
    return is_urgent || timeExceeds;
  }, [formData.presentation_file, validationContext]);

  return {
    formData,
    errors,
    touched,
    isSubmitting: submitMutation.isPending,
    handleChange,
    handleBlur,
    validateAll,
    submitStep,
    isPresentationRequiredRequired,
  };
};
