import React, { useState, useCallback } from 'react';
import { ActionButtons } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from './components';
import { useStep3 } from './useStep3';
import { useDeleteDraft } from '../../hooks/useDeleteDraft';
import { DeleteDraftConfirmationModal } from '../../components/DeleteDraftConfirmationModal';

interface Step3Props {
  draftId: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday as first day
  return new Date(d.setDate(diff));
};

const Step3: React.FC<Step3Props> = ({ draftId, onNext, onPrevious, onCancel, onSaveDraft }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = getWeekStart(currentDate);

  const handleSuccess = useCallback(() => {
    // Success is handled by parent component
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Step3 error:', error);
    // TODO: Show error toast/notification
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
    // formData,
    // errors,
    // isSubmitting,
    handleSelectEvent,
    submitStep,
  } = useStep3({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Sample events data - replace with actual data
  const [events] = useState<CalendarEventData[]>([
    {
      id: '1',
      type: 'reserved',
      label: 'محجوز',
      startTime: '07:00',
      endTime: '08:00',
      date: new Date(weekStart.getTime() + 0 * 24 * 60 * 60 * 1000), // Monday
      title: 'موعد الاجتماع : الاقتراح الأول',
    },
    {
      id: '2',
      type: 'optional',
      label: 'اختياري',
      startTime: '16:00',
      endTime: '17:00',
      date: new Date(weekStart.getTime() + 0 * 24 * 60 * 60 * 1000), // Monday
      title: 'موعد الاجتماع : الاقتراح الثاني',
    },
    {
      id: '3',
      type: 'compulsory',
      label: 'إجباري',
      startTime: '16:00',
      endTime: '17:00',
      date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000), // Wednesday
      title: 'موعد الاجتماع : الاقتراح الثاني',
    },
    {
      id: '4',
      type: 'reserved',
      label: 'محجوز',
      startTime: '10:00',
      endTime: '11:00',
      date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000), // Wednesday
    },
    {
      id: '5',
      type: 'compulsory',
      label: 'إجباري',
      startTime: '14:00',
      endTime: '15:00',
      date: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000), // Friday
    },
    {
      id: '6',
      type: 'reserved',
      label: 'محجوز',
      startTime: '09:00',
      endTime: '10:00',
      date: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000), // Friday
    },
    {
      id: '7',
      type: 'optional',
      label: 'اختياري',
      startTime: '13:00',
      endTime: '14:00',
      date: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000), // Tuesday
    },
    {
      id: '8',
      type: 'optional',
      label: 'اختياري',
      startTime: '17:00',
      endTime: '18:00',
      date: new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000), // Saturday
    },
    {
      id: '9',
      type: 'optional',
      label: 'اختياري',
      startTime: '11:00',
      endTime: '12:00',
      date: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), // Sunday
    },
  ]);

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
    console.log('Event clicked:', event);
    // TODO: Handle event click
  }, []);


  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    console.log('Time slot clicked:', date, time);
    // TODO: Handle time slot click
  }, []);

  const handleBookEvent = useCallback((event: CalendarEventData) => {
    handleSelectEvent(event);
  }, [handleSelectEvent]);

  const handleNextClick = useCallback(async () => {
    await submitStep(false);
    onNext?.();
  }, [submitStep, onNext]);

  const handleSaveDraftClick = useCallback(async () => {
    await submitStep(true);
    onSaveDraft?.();
  }, [submitStep, onSaveDraft]);

  /**
   * Handle Cancel button click - show confirmation modal
   */
  const handleCancelClick = useCallback(() => {
    openConfirm();
  }, [openConfirm]);

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

          {/* Action Buttons */}
          <ActionButtons
            onCancel={handleCancelClick}
            onSaveDraft={handleSaveDraftClick}
            onNext={handleNextClick}
            nextLabel="أنشئ اجتماعك الآن"
            disabled={isDeleting}
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
