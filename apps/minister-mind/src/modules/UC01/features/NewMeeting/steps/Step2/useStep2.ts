import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { step2Schema, type Step2FormData } from './schema';
import axiosInstance from '@auth/utils/axios';
import type { FormTableRow } from '../Step1/components';

interface UseStep2Props {
  draftId: string;
  initialData?: Partial<Step2FormData>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAll = useCallback((): boolean => {
    const result = step2Schema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, Record<string, string>> = {};
      result.error.errors.forEach((err) => {
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
    
    return true;
  }, [formData]);

  const handleAddAttendee = useCallback(() => {
    const newAttendee: FormTableRow = {
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

  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    if (!isDraft && !validateAll()) {
      return;
    }

    setIsSubmitting(true);
    try {
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

      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, formData, validateAll, onSuccess, onError]);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    validateAll,
    submitStep,
  };
};
