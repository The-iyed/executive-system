import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButtons, ScreenLoader } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from './components';
import { useStep3 } from './useStep3';
import { useDeleteDraft } from '../../hooks/useDeleteDraft';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { PATH } from '../../../../routes/paths';

interface Step3Props {
  draftId: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
  isEditMode?: boolean;
  initialSlots?: string[];
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Reset to start of day
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday as first day
  return new Date(d.setDate(diff));
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
  weekEnd.setHours(23, 59, 59, 999); // Set to end of day
  return weekEnd;
};

const Step3: React.FC<Step3Props> = ({ draftId, isEditMode = false, initialSlots: propInitialSlots = [] }) => {
  const navigate = useNavigate();
  // Set default week to current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const handleSuccess = useCallback(() => {
    // Navigate to meetings list on success
    navigate(PATH.MEETINGS);
  }, [navigate]);

  const handleError = useCallback((error: Error) => {
    console.error('Step3 error:', error);
    setValidationError(error.message);
    // Clear error after 5 seconds
    setTimeout(() => setValidationError(null), 5000);
  }, []);

  // Delete draft hook with confirmation modal
  const {
    isConfirmOpen,
    isDeleting,
    openConfirm,
    closeConfirm,
    confirmDelete,
  } = useDeleteDraft({
    draftId,
    onError: handleError,
  });

  const {
    selectedSlots,
    toggleSlotSelection,
    submitStep,
    isSubmitting,
    setSelectedSlots,
  } = useStep3({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
    initialSlots: propInitialSlots,
  });

  // Set initial slots when prop changes (for edit mode)
  useEffect(() => {
    if (isEditMode && propInitialSlots.length > 0 && setSelectedSlots) {
      setSelectedSlots(propInitialSlots);
    }
  }, [isEditMode, propInitialSlots, setSelectedSlots]);

  // Fetch calendar events for the current week
  const { events: fetchedEvents, isLoading: isLoadingEvents, error: eventsError } = useCalendarEvents({
    startDate: weekStart,
    endDate: weekEnd,
    durationMinutes: 60,
    enabled: true,
  });

  // Map events with selected state and update UI for selected slots
  const events = useMemo(() => {
    return fetchedEvents.map((event) => {
      const isSelected = selectedSlots.includes(event.id);
      
      if (isSelected) {
        // Change to optional type with "تم الحجز" label when selected
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
    });
  }, [fetchedEvents, selectedSlots]);

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

  const handleAIGenerate = useCallback(() => {
    console.log('AI Generate clicked');
    // TODO: Implement AI generation logic
  }, []);

  const handleEventClick = useCallback((event: CalendarEventData) => {
    // Only allow clicking on available events
    if (event.is_available && !event.is_selected) {
      toggleSlotSelection(event.id);
      setValidationError(null); // Clear validation error when selecting
    } else if (event.is_selected) {
      // Allow deselecting
      toggleSlotSelection(event.id);
    }
  }, [toggleSlotSelection]);

  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    // Find the first available event at this time slot
    const availableEvent = events.find(
      (e) =>
        e.date.toDateString() === date.toDateString() &&
        e.startTime === time &&
        e.is_available &&
        !e.is_selected
    );
    
    if (availableEvent) {
      toggleSlotSelection(availableEvent.id);
      setValidationError(null); // Clear validation error when selecting
    }
  }, [events, toggleSlotSelection]);

  const handleBookEvent = useCallback((event: CalendarEventData) => {
    // Reserve or unreserve the slot when clicking the button
    if (event.is_available) {
      toggleSlotSelection(event.id);
      setValidationError(null); // Clear validation error when selecting/deselecting
    }
  }, [toggleSlotSelection]);

  const handleNextClick = useCallback(async () => {
    // Validate: need at least 1 slot selected
    if (selectedSlots.length === 0) {
      setValidationError('يرجى اختيار موعد واحد على الأقل');
      return;
    }
    
    setValidationError(null);
    await submitStep(false, selectedSlots);
  }, [submitStep, selectedSlots]);

  const handleSaveDraftClick = useCallback(async () => {
    setValidationError(null);
    await submitStep(true, selectedSlots);
    // If no slots selected, navigate to meetings list directly
    if (selectedSlots.length === 0) {
      navigate(PATH.MEETINGS);
    }
  }, [submitStep, selectedSlots, navigate]);

  /**
   * Handle Cancel button click - show confirmation modal
   */
  const handleCancelClick = useCallback(() => {
    openConfirm();
  }, [openConfirm]);

  // Show loader while fetching events
  if (isLoadingEvents) {
    return <ScreenLoader message="جاري تحميل المواعيد المتاحة..." />;
  }

  // Show error state if fetch failed
  if (eventsError) {
    return (
      <div className="w-full flex flex-col items-center mt-12">
        <div className="w-full flex justify-center">
          <div className="w-[1085px] flex flex-col gap-6">
            <div className="text-center text-red-600 p-4">
              حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center mt-12">
      <div className="w-full flex justify-center">
        <div className="w-[1085px] flex flex-col gap-6">
          {/* Navigation and AI Button */}
          <WeeklyCalendarNavigation
            currentDate={currentDate}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onAIGenerate={handleAIGenerate}
          />

          {/* Calendar Grid */}
          <WeeklyCalendarGrid
            weekStart={weekStart}
            events={events}
            onEventClick={handleEventClick}
            onEventBook={handleBookEvent}
            onTimeSlotClick={handleTimeSlotClick}
          />

          {/* Validation Error Message */}
          {validationError && (
            <div className="text-center text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
              {validationError}
            </div>
          )}

          {/* Selected Slots Info */}
          {selectedSlots.length > 0 && (
            <div className="text-center text-sm text-gray-600">
              تم اختيار {selectedSlots.length} من 3 مواعيد
            </div>
          )}

          {/* Action Buttons */}
          <ActionButtons
            onCancel={handleCancelClick}
            onSaveDraft={handleSaveDraftClick}
            onNext={handleNextClick}
            nextLabel="أنشئ اجتماعك الآن"
            disabled={isDeleting || isSubmitting}
          />
        </div>
      </div>

      {/* Delete Draft Confirmation Modal */}
      <DeleteDraftConfirmationModal
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Step3;