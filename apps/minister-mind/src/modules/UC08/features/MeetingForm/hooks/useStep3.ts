import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';
import { useCalendarEvents } from './useCalendarEvents';
import type { CalendarEventData } from '@shared';
import { getWeekStart, getWeekEnd } from '../utils';
import type { Step3FormData } from '../schemas/step3.schema';
import { step3Schema } from '../schemas/step3.schema';

interface UseStep3Props {
  draftId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  initialSlots?: string[];
}

interface SchedulingPayload {
  selected_time_slot_id: string; // Required
  meeting_channel?: string; // Required for final submission, optional for draft
  scheduled_at?: string; // Required - ISO 8601 datetime string
  requires_protocol?: boolean;
  notes?: string;
}

export interface Step3Hook {
  // calendar state
  currentDate: Date;
  weekStart: Date;
  weekEnd: Date;
  events: CalendarEventData[];
  isLoadingEvents: boolean;
  eventsError: unknown;
  validationError: string | null;

  // calendar handlers
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  clearValidationError: () => void;
  handleBookEvent: (event: CalendarEventData) => void;
  handleTimeSlotClick: (date: Date, time: string) => void;
  handleEventClick: (event: CalendarEventData) => void;
  handleAIGenerate: () => void;

  // selection + submit
  selectedSlots: string[];
  toggleSlotSelection: (slotId: string) => void;
  submitStep: (isDraft: boolean, selectedSlotIds: string[]) => Promise<void>;
  isSubmitting: boolean;
  setSelectedSlots: (slots: string[]) => void;

  // form data
  formData: Partial<Step3FormData>;
  handleChange: (field: keyof Step3FormData, value: any) => void;
  handleBlur: (field: keyof Step3FormData) => void;
  
  // validation
  errors: Partial<Record<keyof Step3FormData, string>>;
  touched: Partial<Record<keyof Step3FormData, boolean>>;
}

export const useStep3 = ({
  draftId,
  onSuccess,
  onError,
  initialSlots = [],
}: UseStep3Props): Step3Hook => {
  const [currentDate, setCurrentDate] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSlots);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Step3FormData>>({
    meeting_channel: undefined,
    scheduled_at: undefined,
    requires_protocol: false,
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step3FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step3FormData, boolean>>>({});

  useEffect(() => {
    if (initialSlots.length > 0) {
      setSelectedSlots(initialSlots);
    }
  }, [initialSlots]);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const {
    events: fetchedEvents,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useCalendarEvents({
    startDate: weekStart,
    endDate: weekEnd,
    durationMinutes: 60,
    enabled: true,
  });

  const events: CalendarEventData[] = useMemo(
    () =>
      fetchedEvents.map((event) => {
        const isSelected = selectedSlots.includes(event.id);

        if (isSelected) {
          return {
            ...event,
            type: 'optional' as const,
            label: 'تم الحجز',
            is_selected: true,
          };
        }

        return {
          ...event,
          is_selected: false,
        };
      }),
    [fetchedEvents, selectedSlots],
  );

  // React Query mutation for submitting scheduling
  const submitMutation = useMutation({
    mutationFn: async (payload: SchedulingPayload) => {
      const response = await axiosInstance.put(
        `/api/meeting-requests/direct-schedule/${draftId}/step3`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: any) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const toggleSlotSelection = useCallback((slotId: string) => {
    setSelectedSlots((prev) => {
      // If slot is already selected, remove it (allow deselection)
      if (prev.includes(slotId)) {
        return [];
      }
      // Only allow one selection - replace any existing selection
      return [slotId];
    });
    setValidationError(null);
  }, []);

  const handlePreviousWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const handleBookEvent = useCallback(
    (event: CalendarEventData) => {
      if (event.is_available) {
        toggleSlotSelection(event.id);
        setValidationError(null);
      }
    },
    [toggleSlotSelection],
  );

  const handleTimeSlotClick = useCallback(
    (date: Date, time: string) => {
      const availableEvent = events.find(
        (e) =>
          e.date.toDateString() === date.toDateString() &&
          e.startTime === time &&
          e.is_available &&
          !e.is_selected,
      );

      if (availableEvent) {
        toggleSlotSelection(availableEvent.id);
        setValidationError(null);
      }
    },
    [events, toggleSlotSelection],
  );

  const handleEventClick = useCallback(
    (event: CalendarEventData) => {
      if (event.is_available && !event.is_selected) {
        toggleSlotSelection(event.id);
        clearValidationError();
      } else if (event.is_selected) {
        toggleSlotSelection(event.id);
      }
    },
    [toggleSlotSelection, clearValidationError],
  );

  const handleAIGenerate = useCallback(() => {
    console.log('AI Generate clicked');
    // TODO: Implement AI generation logic
  }, []);

  const handleChange = useCallback((field: keyof Step3FormData, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Validate field on change
      const result = step3Schema.safeParse(updated);
      if (result.success) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      } else {
        const fieldError = result.error.errors.find((err) => err.path[0] === field);
        if (fieldError) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: fieldError.message,
          }));
        }
      }
      
      return updated;
    });
  }, []);

  const handleBlur = useCallback((field: keyof Step3FormData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    
    // Validate field on blur
    const result = step3Schema.safeParse(formData);
    if (!result.success) {
      const fieldError = result.error.errors.find((err) => err.path[0] === field);
      if (fieldError) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: fieldError.message,
        }));
      }
    }
  }, [formData]);

  const submitStep = useCallback(async (
    isDraft: boolean,
    selectedSlotIds: string[]
  ): Promise<void> => {
    // If draft and no slots, skip API call
    if (isDraft && selectedSlotIds.length === 0) {
      clearValidationError();
      onSuccess?.();
      return;
    }

    // Validate: need exactly 1 slot if not draft
    if (!isDraft && selectedSlotIds.length === 0) {
      const err = new Error('يرجى اختيار موعد الاجتماع');
      onError?.(err);
      setValidationError(err.message);
      return;
    }

    // Validate form data using schema
    const validationResult = step3Schema.safeParse(formData);
    if (!isDraft && !validationResult.success) {
      const formErrors: Partial<Record<keyof Step3FormData, string>> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as keyof Step3FormData;
        formErrors[field] = err.message;
      });
      setErrors(formErrors);
      setTouched({
        meeting_channel: true,
        scheduled_at: true,
      });
      const firstError = validationResult.error.errors[0];
      const err = new Error(firstError.message);
      onError?.(err);
      return;
    }

    // Build payload - always include selected_time_slot_id if we have a selection
    const payload: SchedulingPayload = {
      selected_time_slot_id: selectedSlotIds[0],
    };

    // meeting_channel is required only for final submission (not draft)
    if (!isDraft) {
      if (!formData.meeting_channel) {
        const err = new Error('قناة الاجتماع مطلوبة');
        onError?.(err);
        return;
      }
      payload.meeting_channel = formData.meeting_channel;
    } else if (formData.meeting_channel) {
      // Include meeting_channel in draft if provided, but don't require it
      payload.meeting_channel = formData.meeting_channel;
    }

    // scheduled_at is required for final submission (date only, no time)
    if (!isDraft) {
      if (!formData.scheduled_at) {
        const err = new Error('تاريخ الاجتماع مطلوب');
        onError?.(err);
        setValidationError(err.message);
        return;
      }
      payload.scheduled_at = formData.scheduled_at;
    } else if (formData.scheduled_at) {
      // Include scheduled_at in draft if provided
      payload.scheduled_at = formData.scheduled_at;
    }
    
    // Add optional form fields to payload
    if (formData.requires_protocol !== undefined) {
      payload.requires_protocol = formData.requires_protocol;
    }
    if (formData.notes && formData.notes.trim() !== '') {
      payload.notes = formData.notes;
    }

    clearValidationError();
    submitMutation.mutate(payload);
  }, [submitMutation, onSuccess, onError, formData]);

  return {
    // calendar state
    currentDate,
    weekStart,
    weekEnd,
    events,
    isLoadingEvents,
    eventsError,
    validationError,

    // calendar handlers
    handlePreviousWeek,
    handleNextWeek,
    clearValidationError,
    handleBookEvent,
    handleTimeSlotClick,
    handleEventClick,
    handleAIGenerate,

    // selection
    selectedSlots,
    toggleSlotSelection,
    submitStep,
    isSubmitting: submitMutation.isPending,
    setSelectedSlots,

    // form data
    formData,
    handleChange,
    handleBlur,
    
    // validation
    errors,
    touched,
  };
};
