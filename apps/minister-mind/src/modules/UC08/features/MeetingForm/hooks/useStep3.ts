import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';
import { useCalendarEvents } from './useCalendarEvents';
import type { CalendarEventData } from '@shared';
import { getWeekStart, getWeekEnd } from '../utils';

interface UseStep3Props {
  draftId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  initialSlots?: string[];
}

interface SchedulingPayload {
  selected_time_slot_id?: string;
  alternative_time_slot_id_1?: string;
  alternative_time_slot_id_2?: string;
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
      const response = await axiosInstance.patch(
        `/api/meeting-requests/drafts/${draftId}/scheduling`,
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
      // If slot is already selected, remove it
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }
      // If we already have 3 slots, don't add more
      if (prev.length >= 3) {
        return prev;
      }
      // Add the slot
      return [...prev, slotId];
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

  const submitStep = useCallback(async (
    isDraft: boolean,
    selectedSlotIds: string[]
  ): Promise<void> => {
    // Validate: need at least 1 slot if not draft
    if (!isDraft && selectedSlotIds.length === 0) {
      const err = new Error('يرجى اختيار موعد واحد على الأقل');
      onError?.(err);
      setValidationError(err.message);
      return;
    }

    // If draft and no slots, skip API call
    if (isDraft && selectedSlotIds.length === 0) {
      clearValidationError();
      onSuccess?.();
      return;
    }

    // Build payload
    const payload: SchedulingPayload = {};
    if (selectedSlotIds.length > 0) {
      payload.selected_time_slot_id = selectedSlotIds[0];
    }
    if (selectedSlotIds.length > 1) {
      payload.alternative_time_slot_id_1 = selectedSlotIds[1];
    }
    if (selectedSlotIds.length > 2) {
      payload.alternative_time_slot_id_2 = selectedSlotIds[2];
    }

    clearValidationError();
    submitMutation.mutate(payload);
  }, [submitMutation, onSuccess, onError]);

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
  };
};
