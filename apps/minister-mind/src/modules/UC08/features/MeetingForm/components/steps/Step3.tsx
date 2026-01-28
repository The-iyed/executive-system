import React from 'react';
import {
  ActionButtons,
  ScreenLoader,
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  FormField,
  FormSelect,
  FormSwitch,
  FormTextArea,
  FormRow,
  FormDatePicker,
} from '@shared';
import { MEETING_CHANNEL_OPTIONS } from '../../utils/constants';
import type { Step3Hook } from '../../hooks/useStep3';

export interface Step3Props {
  step3Hook: Step3Hook;
  isDeleting: boolean;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
}

export const Step3: React.FC<Step3Props> = ({
  step3Hook,
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
    formData,
    handleChange,
    handleBlur,
    errors,
    touched,
  } = step3Hook;
  
  if (isLoadingEvents) {
    return <ScreenLoader message="جاري تحميل المواعيد المتاحة..." />;
  }

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
              تم اختيار موعد الاجتماع
            </div>
          )}

          {/* Meeting Channel, Protocol, and Notes Fields */}
          <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData?.requires_protocol || false}
              onCheckedChange={(value: boolean) => handleChange('requires_protocol', value)}
              label="هل يتطلب بروتوكول؟"
            />
            <FormField
              label="قناة الاجتماع"
              required
              error={touched?.meeting_channel ? errors?.meeting_channel : undefined}
            >
              <FormSelect
                value={formData?.meeting_channel || ''}
                onValueChange={(value: string) => {
                  handleChange('meeting_channel', value);
                  handleBlur('meeting_channel');
                }}
                options={MEETING_CHANNEL_OPTIONS}
                placeholder="قناة الاجتماع"
                error={!!(touched?.meeting_channel && errors?.meeting_channel)}
              />
            </FormField>
          </FormRow>

          {/* Scheduled Date - Required (date only, no time) */}
          <FormField
            label="تاريخ الاجتماع"
            required
            error={touched?.scheduled_at ? errors?.scheduled_at : undefined}
          >
            <FormDatePicker
              value={formData?.scheduled_at || ''}
              onChange={(value: string) => handleChange('scheduled_at', value)}
              onBlur={() => handleBlur('scheduled_at')}
              placeholder="dd/mm/yyyy"
              error={!!(touched?.scheduled_at && errors?.scheduled_at)}
            />
          </FormField>

          <FormTextArea
            label="ملاحظات"
            value={formData?.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('notes', e.target.value)}
            placeholder="ملاحظات..."
          />

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
