/**
 * Storage keys for meeting draft data
 */
export const STORAGE_KEYS = {
  CURRENT_STEP: 'newMeeting_currentStep',
  DRAFT_ID: 'newMeeting_draftId',
} as const;

/**
 * Clear all meeting draft data from localStorage
 */
export const clearDraftData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
    localStorage.removeItem(STORAGE_KEYS.DRAFT_ID);
  } catch (error) {
    console.error('Error clearing draft data:', error);
  }
};

/**
 * Get current step from localStorage
 */
export const getCurrentStep = (): number => {
  try {
    const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    if (savedStep !== null) {
      const step = parseInt(savedStep, 10);
      // Validate step is within bounds (0 to STEPS.length - 1)
      if (step >= 0 && step < 3) {
        return step;
      }
    }
  } catch (error) {
    console.error('Error reading step from localStorage:', error);
  }
  return 0;
};

/**
 * Save current step to localStorage
 */
export const saveCurrentStep = (step: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step.toString());
  } catch (error) {
    console.error('Error saving step to localStorage:', error);
  }
};

/**
 * Get draft ID from localStorage
 */
export const getDraftId = (): string | undefined => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_ID) || undefined;
  } catch (error) {
    console.error('Error reading draft ID from localStorage:', error);
    return undefined;
  }
};

/**
 * Save draft ID to localStorage
 */
export const saveDraftId = (draftId: string | undefined): void => {
  try {
    if (draftId) {
      localStorage.setItem(STORAGE_KEYS.DRAFT_ID, draftId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_ID);
    }
  } catch (error) {
    console.error('Error saving draft ID to localStorage:', error);
  }
};
