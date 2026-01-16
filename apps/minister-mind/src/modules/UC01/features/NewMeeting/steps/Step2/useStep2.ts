import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { step2Schema, type Step2FormData } from './schema';
import axiosInstance from '@auth/utils/axios';

interface UseStep2Props {
  draftId: string;
  initialData?: Partial<Step2FormData>;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
}

interface SubmitStep2Payload {
  formData: Partial<Step2FormData>;
  isDraft: boolean;
  draftId: string;
}

interface SubmitStep2Response {
  success: boolean;
}

/**
 * API function to submit Step 2 data
 */
const submitStep2Data = async (payload: SubmitStep2Payload): Promise<SubmitStep2Response> => {
  const { formData, isDraft, draftId } = payload;

  // Validate if not draft
  if (!isDraft) {
    const validationResult = step2Schema.safeParse(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const body = {
    invitees: formData.invitees?.map((invitee) => ({
      name: invitee.name,
      position: invitee.position || undefined,
      mobile: invitee.mobile || undefined,
      email: invitee.email || undefined,
      isMainAttendee: invitee.isMainAttendee || false,
    })) || [],
  };

  await axiosInstance.patch(
    `/api/meeting-requests/drafts/${draftId}/invitees`,
    body
  );

  return { success: true };
};

export const useStep2 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
}: UseStep2Props) => {
  const [formData, setFormData] = useState<Partial<Step2FormData>>({
    invitees: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});

  // React Query mutation for submitting step 2
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

  // Validation result memoized
  const validationResult = useMemo(() => {
    return step2Schema.safeParse(formData);
  }, [formData]);

  /**
   * Validate all form data
   */
  const validateAll = useCallback((): boolean => {
    if (!validationResult.success) {
      const newErrors: Record<string, Record<string, string>> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0] === 'invitees' && err.path[1] !== undefined) {
          const inviteeIndex = err.path[1] as number;
          const field = err.path[2] as string;
          const invitee = formData.invitees?.[inviteeIndex];
          if (invitee?.id) {
            if (!newErrors[invitee.id]) {
              newErrors[invitee.id] = {};
            }
            newErrors[invitee.id][field] = err.message;
          }
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData, validationResult]);

  /**
   * Add a new attendee to the list
   */
  const handleAddAttendee = useCallback(() => {
    const newAttendee = {
      id: nanoid(),
      name: '',
      position: '',
      mobile: '',
      email: '',
      isMainAttendee: false,
    };
    setFormData((prev) => ({
      ...prev,
      invitees: [...(prev.invitees || []), newAttendee],
    }));
  }, []);

  /**
   * Delete an attendee from the list
   */
  const handleDeleteAttendee = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees || []).filter((a) => a.id !== id),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    setTouched((prev) => {
      const newTouched = { ...prev };
      delete newTouched[id];
      return newTouched;
    });
  }, []);

  /**
   * Update an attendee field
   */
  const handleUpdateAttendee = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
    
    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: true,
      },
    }));
    
    // Clear error if field is valid
    if (field === 'name' && value) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[id]) {
          delete newErrors[id][field];
          if (Object.keys(newErrors[id]).length === 0) {
            delete newErrors[id];
          }
        }
        return newErrors;
      });
    }
  }, []);

  /**
   * Submit step 2 data (with validation if not draft)
   */
  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    // Validate before submitting if not draft
    if (!isDraft && !validateAll()) {
      return;
    }

    submitMutation.mutate({
      formData,
      isDraft,
    });
  }, [formData, validateAll, submitMutation]);

  return {
    formData,
    errors,
    touched,
    isSubmitting: submitMutation.isPending,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    validateAll,
    submitStep,
  };
};
