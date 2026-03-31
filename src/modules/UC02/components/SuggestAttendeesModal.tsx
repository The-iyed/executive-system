import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Button,
} from '@/lib/ui';
import { useSuggestMeetingAttendees, type UseSuggestMeetingAttendeesParams } from '../hooks/useSuggestMeetingAttendees';

interface SuggestAttendeesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: any) => void;
  meetingParams: UseSuggestMeetingAttendeesParams;
}

const SuggestAttendeesModal: React.FC<SuggestAttendeesModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  meetingParams,
}) => {
  const [numberOfAttendees, setNumberOfAttendees] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [noSuggestionsMessage, setNoSuggestionsMessage] = useState<string | null>(null);
  const { suggestAttendees, isLoading, error } = useSuggestMeetingAttendees();

  const MIN_ATTENDEES = 1;
  const MAX_ATTENDEES = 50;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setNumberOfAttendees(value);
      if (validationError) setValidationError(null);
      if (noSuggestionsMessage) setNoSuggestionsMessage(null);
      // Validate range if value is not empty
      if (value !== '') {
        const num = parseInt(value, 10);
        if (num < MIN_ATTENDEES) {
          setValidationError(`الحد الأدنى هو ${MIN_ATTENDEES}`);
        } else if (num > MAX_ATTENDEES) {
          setValidationError(`الحد الأقصى هو ${MAX_ATTENDEES}`);
        } else {
          setValidationError(null);
        }
      }
    }
  };

  const handleSubmit = async () => {
    const num = parseInt(numberOfAttendees, 10);
    if (!num || num < MIN_ATTENDEES || num > MAX_ATTENDEES) {
      if (num < MIN_ATTENDEES) {
        setValidationError(`الحد الأدنى هو ${MIN_ATTENDEES}`);
      } else if (num > MAX_ATTENDEES) {
        setValidationError(`الحد الأقصى هو ${MAX_ATTENDEES}`);
      }
      return;
    }

    setNoSuggestionsMessage(null);
    const result = await suggestAttendees(num, meetingParams);
    if (result) {
      const suggestions = result.suggestions ?? [];
      if (suggestions.length === 0) {
        setNoSuggestionsMessage('لا توجد توصيات متاحة حالياً بناءً على بيانات الاجتماع. يرجى التأكد من إدخال تفاصيل الاجتماع بشكل كافٍ والمحاولة مرة أخرى.');
        return;
      }
      onSuccess?.(result);
      setNumberOfAttendees('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNumberOfAttendees('');
      setValidationError(null);
      setNoSuggestionsMessage(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_open) => !isLoading && handleClose()}>
      <DialogContent 
        className="sm:max-w-[500px] bg-white" 
        dir="rtl"
        onInteractOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-right text-[18px] font-semibold text-[#101828]">
            إضافة مدعوين آليًا
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-[#344054] text-right"
            >
              عدد المدعوين المطلوب
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={MIN_ATTENDEES}
              max={MAX_ATTENDEES}
              value={numberOfAttendees}
              onChange={handleNumberChange}
              placeholder={`أدخل عدد المدعوين (${MIN_ATTENDEES}-${MAX_ATTENDEES})`}
              className="h-[44px] text-right"
              style={{ fontSize: '16px', lineHeight: '24px' }}
              disabled={isLoading}
            />
            {validationError && (
              <p className="text-sm text-red-600 text-right mt-1">{validationError}</p>
            )}
            {error && !validationError && (
              <p className="text-sm text-red-600 text-right mt-1">{error}</p>
            )}
            {noSuggestionsMessage && (
              <p className="text-sm text-amber-600 text-right mt-1 bg-amber-50 p-3 rounded-md border border-amber-200">
                {noSuggestionsMessage}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              !numberOfAttendees ||
              isLoading ||
              !!validationError ||
              parseInt(numberOfAttendees, 10) < MIN_ATTENDEES ||
              parseInt(numberOfAttendees, 10) > MAX_ATTENDEES
            }
            className="bg-[#048F86] hover:bg-[#037A72] text-white"
          >
            {isLoading ? 'جاري المعالجة...' : 'إرسال'}
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isLoading}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestAttendeesModal;