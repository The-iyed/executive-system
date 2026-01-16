import { useState, useCallback } from 'react';
import { step3Schema, type Step3FormData } from './schema';
import axiosInstance from '@auth/utils/axios';
import type { CalendarEventData } from './components';

interface UseStep3Props {
  draftId: string;
  initialData?: Partial<Step3FormData>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useStep3 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
}: UseStep3Props) => {
  const [formData, setFormData] = useState<Partial<Step3FormData>>({
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step3FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step3FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAll = useCallback((): boolean => {
    const result = step3Schema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<Record<keyof Step3FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof Step3FormData;
        if (path) {
          newErrors[path] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    return true;
  }, [formData]);

  const handleSelectEvent = useCallback((event: CalendarEventData | null) => {
    if (event) {
      setFormData((prev) => ({
        ...prev,
        selectedEvent: {
          id: event.id,
          type: event.type,
          label: event.label,
          startTime: event.startTime,
          endTime: event.endTime,
          date: event.date,
          title: event.title,
        },
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.selectedEvent;
        return newErrors;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedEvent: undefined,
      }));
    }
  }, []);

  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    if (!isDraft && !validateAll()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        selectedEvent: formData.selectedEvent
          ? {
              id: formData.selectedEvent.id,
              type: formData.selectedEvent.type,
              startTime: formData.selectedEvent.startTime,
              endTime: formData.selectedEvent.endTime,
              date: formData.selectedEvent.date.toISOString(),
              title: formData.selectedEvent.title,
            }
          : undefined,
      };

      await axiosInstance.patch(
        `/api/meeting-requests/drafts/${draftId}/scheduling`,
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
    handleSelectEvent,
    validateAll,
    submitStep,
  };
};
