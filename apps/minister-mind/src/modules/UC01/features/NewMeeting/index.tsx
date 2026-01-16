import React, { useState, useEffect, useRef } from 'react';
import { Stepper } from '@shared';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import '@shared/styles';

const STEPS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'قائمة المدعوين' },
  { id: 'step3', label: 'موعد الاجتماع' },
];

const STORAGE_KEY = 'newMeeting_currentStep';
const DRAFT_ID_KEY = 'newMeeting_draftId';

const NewMeeting: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage or default to 0
  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_KEY);
      if (savedStep !== null) {
        const step = parseInt(savedStep, 10);
        // Validate step is within bounds
        if (step >= 0 && step < STEPS.length) {
          return step;
        }
      }
    } catch (error) {
      console.error('Error reading step from localStorage:', error);
    }
    return 0;
  });

  // Initialize draft ID from localStorage
  const [draftId, setDraftId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(DRAFT_ID_KEY) || undefined;
    } catch (error) {
      console.error('Error reading draft ID from localStorage:', error);
      return undefined;
    }
  });

  // Save step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentStep.toString());
    } catch (error) {
      console.error('Error saving step to localStorage:', error);
    }
  }, [currentStep]);

  // Save draft ID to localStorage whenever it changes
  useEffect(() => {
    try {
      if (draftId) {
        localStorage.setItem(DRAFT_ID_KEY, draftId);
      } else {
        localStorage.removeItem(DRAFT_ID_KEY);
      }
    } catch (error) {
      console.error('Error saving draft ID to localStorage:', error);
    }
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
      // Clear saved step and draft ID
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DRAFT_ID_KEY);
      } catch (error) {
        console.error('Error clearing step from localStorage:', error);
      }
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
    console.log('Cancel');
    // Clear saved step and draft ID on cancel
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DRAFT_ID_KEY);
    } catch (error) {
      console.error('Error clearing step from localStorage:', error);
    }
    // Add cancel logic here (e.g., navigate away)
  };

  const handleSaveDraft = (newDraftId?: string) => {
    if (newDraftId) {
      setDraftId(newDraftId);
    }
    // Step is already saved via useEffect
    // Draft ID is saved via useEffect
    console.log('Save Draft', newDraftId);
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
          className="text-[28px] font-bold text-center mb-2"
          style={{
            fontWeight: 700,
            fontSize: '28px',
            textAlign: 'center',
            color: '#101828',
          }}
        >
          قم بإضافة معلومات الاجتماع
        </h1>
        <p
          className="text-base mb-8"
          style={{
            fontWeight: 400,
            fontSize: '16px',
            textAlign: 'center',
            color: '#475467',
          }}
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