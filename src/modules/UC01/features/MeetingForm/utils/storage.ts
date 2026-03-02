/** Options from step 1 that drive step 2 content (required/optional/hidden). Persisted so step 2 shows correct state immediately on refresh. */
export interface ContentStepOptions {
  meetingCategory?: string;
  meetingConfidentiality?: string;
  isUrgent?: boolean;
}

export const STORAGE_KEYS = {
  CURRENT_STEP: 'meeting_uc01_currentStep',
  DRAFT_ID: 'meeting_uc01_draftId',
  CONTENT_STEP_OPTIONS: 'meeting_uc01_contentStepOptions',
} as const;

export const clearDraftData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
    localStorage.removeItem(STORAGE_KEYS.DRAFT_ID);
    localStorage.removeItem(STORAGE_KEYS.CONTENT_STEP_OPTIONS);
  } catch (error) {
    console.error('Error clearing draft data:', error);
  }
};

export const getContentStepOptions = (): ContentStepOptions | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTENT_STEP_OPTIONS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContentStepOptions;
    return parsed;
  } catch {
    return null;
  }
};

export const saveContentStepOptions = (options: ContentStepOptions): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTENT_STEP_OPTIONS, JSON.stringify(options));
  } catch (error) {
    console.error('Error saving content step options:', error);
  }
};

export const getStep = (): number => {
  try {
    const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    if (savedStep !== null) {
      const step = parseInt(savedStep, 10);
      if (step >= 0 && step < 4) {
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