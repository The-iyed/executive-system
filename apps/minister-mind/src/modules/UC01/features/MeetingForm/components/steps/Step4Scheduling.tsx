import React from 'react';
import {
  ActionButtons,
  ScreenLoader,
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
} from '@shared';
import type { Step4SchedulingHook } from '../../hooks/useStep4Scheduling';

export interface Step4SchedulingProps {
  step4SchedulingHook: Step4SchedulingHook;
  isDeleting: boolean;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
}

export const Step4Scheduling: React.FC<Step4SchedulingProps> = ({
  step4SchedulingHook,
  isDeleting,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
}) => {
  const {
    currentDate,
    weekStart,
    events,
    isLoadingEvents,
    eventsError,
    validationError,
    selectedSlots,
    handlePreviousWeek,
    handleNextWeek,
    handleEventClick,
    handleBookEvent,
    handleTimeSlotClick,
    handleAIGenerate,
    isSubmitting,
  } = step4SchedulingHook;
  
  if (isLoadingEvents) {
    return <ScreenLoader message="جاري تحميل المواعيد المتاحة..." />;
  }

  if (eventsError) {
    return (
      <div className="w-full flex flex-col items-center mt-12">
        <div className="w-full flex justify-center">
          <div className="w-[1200px] flex flex-col gap-6">
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
        <div className="w-[1200px] flex flex-col gap-6">
       {/* <div className="flex items-center justify-between w-full mb-6">
         {onAIGenerate && (
         <AIGenerateButton onClick={onAIGenerate} />
        )} */}
            <WeeklyCalendarNavigation
            currentDate={currentDate}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onAIGenerate={handleAIGenerate}
            className='justify-center'
            />

          <WeeklyCalendarGrid
            weekStart={weekStart}
            events={events}
            onEventClick={handleEventClick}
            onEventBook={handleBookEvent}
            onTimeSlotClick={handleTimeSlotClick}
          />

          {validationError && (
            <div className="text-center text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
              {validationError}
            </div>
          )}

          {selectedSlots.length > 0 && (
            <div className="text-center text-sm text-gray-600">
              تم اختيار {selectedSlots.length} من 3 مواعيد
            </div>
          )}

          <ActionButtons
            onCancel={handleCancelClick}
            onSaveDraft={handleSaveDraftClick}
            onNext={handleNextClick}
            nextLabel="أنشئ اجتماعك الآن"
            disabled={isDeleting || isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};
