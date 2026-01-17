import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stepper } from '@shared';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import { PATH } from '../../routes/paths';
import {
  clearDraftData,
  getCurrentStep,
  saveCurrentStep,
  getDraftId,
  saveDraftId,
} from './utils/storage';
import '@shared/styles';

const STEPS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'قائمة المدعوين' },
  { id: 'step3', label: 'موعد وقناة الاجتماع' },
];

const NewMeeting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if this is a new meeting request (via query param or state)
  const isNewMeeting = new URLSearchParams(location.search).get('new') === 'true' || 
                       location.state?.isNewMeeting === true;

  // Clear old data when creating a new meeting and remove query/state
  useEffect(() => {
    if (isNewMeeting) {
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
  }, [isNewMeeting, location.search, location.pathname, navigate]);

  // Initialize from localStorage or default to 0
  const [currentStep, setCurrentStep] = useState<number>(() => {
    // Don't load if creating new meeting
    if (isNewMeeting) return 0;
    return getCurrentStep();
  });

  // Initialize draft ID from localStorage
  const [draftId, setDraftId] = useState<string | undefined>(() => {
    // Don't load if creating new meeting
    if (isNewMeeting) return undefined;
    return getDraftId();
  });

  // Save step to localStorage whenever it changes
  useEffect(() => {
    saveCurrentStep(currentStep);
  }, [currentStep]);

  // Save draft ID to localStorage whenever it changes
  useEffect(() => {
    saveDraftId(draftId);
  }, [draftId]);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNext = (newDraftId?: string) => {
    if (newDraftId) {
      setDraftId(newDraftId);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - meeting creation completed
      // Clear all draft data
      clearDraftData();
      // Add completion logic here (e.g., navigate to success page)
      console.log('Meeting creation completed');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    // Cancel logic is handled by each step using useDeleteDraft hook
    // This is just a placeholder - steps will handle the actual cancel with confirmation
  };

  const handleSaveDraft = (newDraftId?: string) => {
    if (newDraftId) {
      setDraftId(newDraftId);
    }
    // Clear all draft data and navigate to meetings list
    clearDraftData();
    // Navigate to meetings list page
    navigate(PATH.MEETINGS);
  };

  const renderStepContent = () => {
    const stepProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onCancel: handleCancel,
      onSaveDraft: handleSaveDraft,
    };

    switch (currentStep) {
      case 0:
        return <Step1 {...stepProps} draftId={draftId} />;
      case 1:
        return draftId ? <Step2 {...stepProps} draftId={draftId} /> : null;
      case 2:
        return draftId ? <Step3 {...stepProps} draftId={draftId} /> : null;
      default:
        return <Step1 {...stepProps} draftId={draftId} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
        {/* Page Title */}
        <h1
          className="text-[28px] text-[#101828] font-bold text-center mb-2"
        >
          قم بإضافة معلومات الاجتماع
        </h1>
        <p
          className="text-[16px] text-[#475467] font-normal text-center mb-8"
        >
          يرجى تعبئة جميع الحقول المطلوبة لإكمال إنشاء الاجتماع
        </p>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="mt-8">{renderStepContent()}</div>
      </div>
    </div>
  );
};

export default NewMeeting;
