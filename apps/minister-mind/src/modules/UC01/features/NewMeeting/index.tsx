import React, { useState, useEffect, useRef } from 'react';
import { Stepper } from '@shared';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import '@shared/styles';

const STEPS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'قائمة المدعوين' },
  { id: 'step4', label: 'موعد الاجتماع' },
];

const STORAGE_KEY = 'newMeeting_currentStep';

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

  // Save step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentStep.toString());
    } catch (error) {
      console.error('Error saving step to localStorage:', error);
    }
  }, [currentStep]);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - meeting creation completed
      // Clear saved step
      try {
        localStorage.removeItem(STORAGE_KEY);
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
    // Clear saved step on cancel
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing step from localStorage:', error);
    }
    // Add cancel logic here (e.g., navigate away)
  };

  const handleSaveDraft = () => {
    console.log('Save Draft');
    // Step is already saved via useEffect
    // Add save draft logic here (e.g., save form data)
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
        return <Step1 {...stepProps} />;
      case 1:
        return <Step2 {...stepProps} />;
      case 2:
        return <Step3 {...stepProps} />;
      case 3:
        return <Step4 {...stepProps} />;
      default:
        return <Step1 {...stepProps} />;
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