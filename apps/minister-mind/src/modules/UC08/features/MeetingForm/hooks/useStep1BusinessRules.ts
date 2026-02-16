import { useMemo } from 'react';
import type { Step1FormData } from '../schemas/step1.schema';
import { MEETING_INFO_FIELDS } from '../types/step1.types';

const FOLLOW_UP_OR_RECURRING_NATURES = ['SEQUENTIAL', 'PERIODIC'] as const;

export function useStep1BusinessRules(formData: Partial<Step1FormData>) {
  const nature = formData.meetingNature;

  const isFollowUpOrRecurring = useMemo(
    () => Boolean(nature && FOLLOW_UP_OR_RECURRING_NATURES.includes(nature as (typeof FOLLOW_UP_OR_RECURRING_NATURES)[number])),
    [nature]
  );

  const isPreviousMeetingVisible = useMemo(
    () => isFollowUpOrRecurring,
    [isFollowUpOrRecurring]
  );

  const isPreviousMeetingRequired = useMemo(
    () => isFollowUpOrRecurring,
    [isFollowUpOrRecurring]
  );

  const isOtherSectionsDisabled = useMemo(
    () => isFollowUpOrRecurring,
    [isFollowUpOrRecurring]
  );

  const isFieldDisabled = useMemo(() => {
    return (field: keyof Step1FormData): boolean => {
      if (!isFollowUpOrRecurring) return false;
      return !MEETING_INFO_FIELDS.includes(field);
    };
  }, [isFollowUpOrRecurring]);

  const isGuidanceDisabled = isOtherSectionsDisabled;

  return {
    isFollowUpOrRecurring,
    isPreviousMeetingVisible,
    isPreviousMeetingRequired,
    isOtherSectionsDisabled,
    isFieldDisabled,
    isGuidanceDisabled,
  };
}
