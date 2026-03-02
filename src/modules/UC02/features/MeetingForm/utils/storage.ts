
export const STORAGE_KEYS = {
  CURRENT_STEP: 'meeting_currentStep',
  DRAFT_ID: 'meeting_draftId',
} as const;

export const clearDraftData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
    localStorage.removeItem(STORAGE_KEYS.DRAFT_ID);
  } catch (error) {
    console.error('Error clearing draft data:', error);
  }
};

export const getStep = (): number => {
  try {
    const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    if (savedStep !== null) {
      const step = parseInt(savedStep, 10);
      if (step >= 0 && step < 3) {
        return step;
      }
    }
  } catch (error) {
    console.error('Error reading step from localStorage:', error);
  }
  return 0;
};

export const saveStep = (step: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step.toString());
  } catch (error) {
    console.error('Error saving step to localStorage:', error);
  }
};

export const getDraftId = (): string | undefined => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_ID) || undefined;
  } catch (error) {
    console.error('Error reading draft ID from localStorage:', error);
    return undefined;
  }
};

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