import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { STEP_LABELS, getStep, saveStep, clearDraftData } from '../utils';

const MAX_STEP = STEP_LABELS.length - 1;
const MIN_STEP = 0;

export const useStepNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isNewSession = new URLSearchParams(location.search).get('new') === 'true' || 
  location.state?.isNewMeeting === true;

  const initialStep = isNewSession ? 0 : getStep();
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  useEffect(() => {
    if (isNewSession) {
      clearDraftData();
      
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('new');
      const newSearch = searchParams.toString();
      const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      
      navigate(newPath, { 
        replace: true, 
        state: undefined 
      });
    }
  }, [isNewSession, location.search, location.pathname, navigate]);

  useEffect(() => {
      saveStep(currentStep);
  }, [currentStep]);

  const handleNext = useCallback((newDraftId?: string) => {
    setCurrentStep((prev) => {
      if (prev < MAX_STEP) {
        return prev + 1;
      }
      return prev;
    });
    return newDraftId;
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, MIN_STEP));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(MIN_STEP, Math.min(step, MAX_STEP)));
  }, []);

  return {
    currentStep,
    setCurrentStep,
    handleNext,
    handlePrevious,
    goToStep,
  };
};