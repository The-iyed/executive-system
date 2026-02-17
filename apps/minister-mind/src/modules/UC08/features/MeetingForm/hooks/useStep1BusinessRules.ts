import { useMemo } from 'react';
import type { Step1FormData } from '../schemas/step1.schema';
import { MEETING_INFO_FIELDS } from '../types/step1.types';
import { isStep1FieldVisible } from '../utils/step1FieldConditions';

export function useStep1BusinessRules(formData: Partial<Step1FormData>) {
  const isFollowUpOrRecurring = useMemo(
    () => isStep1FieldVisible('previousMeeting', formData),
    [formData.meetingNature]
  );

  const isFieldDisabled = useMemo(() => {
    return (field: keyof Step1FormData): boolean => {
      if (!isFollowUpOrRecurring) return false;
      return !MEETING_INFO_FIELDS.includes(field);
    };
  }, [isFollowUpOrRecurring]);

  return {
    isFollowUpOrRecurring,
    isFieldDisabled,
  };
}