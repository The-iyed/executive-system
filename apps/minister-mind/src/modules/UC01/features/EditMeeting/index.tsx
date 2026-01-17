import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Stepper, ScreenLoader } from '@shared';
import Step1 from '../NewMeeting/steps/Step1';
import Step2 from '../NewMeeting/steps/Step2';
import Step3 from '../NewMeeting/steps/Step3';
import { PATH } from '../../routes/paths';
import { getDraftById, transformDraftToStep1Data, transformDraftToStep2Data, transformDraftToStep3Data } from './data/draftApi';
import '@shared/styles';

const STEPS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'قائمة المدعوين' },
  { id: 'step3', label: 'موعد الاجتماع' },
];

const EditMeeting: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch draft data once - shared across all steps
  const { data: draftData, isLoading, error } = useQuery({
    queryKey: ['draft', id, 'edit'],
    queryFn: () => getDraftById(id!),
    enabled: !!id,
  });

  // Transform draft data for each step (memoized to avoid recalculation)
  const step1InitialData = useMemo(() => {
    return draftData ? transformDraftToStep1Data(draftData) : undefined;
  }, [draftData]);

  const step2InitialData = useMemo(() => {
    return draftData ? transformDraftToStep2Data(draftData) : undefined;
  }, [draftData]);

  const step3InitialSlots = useMemo(() => {
    return draftData ? transformDraftToStep3Data(draftData) : [];
  }, [draftData]);

  // Initialize step to 0 (will be updated once data is loaded)
  const [currentStep, setCurrentStep] = useState<number>(0);

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
      // Last step - navigate back to preview
      navigate(PATH.MEETING_PREVIEW.replace(':id', id!));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    // Navigate back to preview
    navigate(PATH.MEETING_PREVIEW.replace(':id', id!));
  };

  const handleSaveDraft = () => {
    // Navigate back to preview after saving
    navigate(PATH.MEETING_PREVIEW.replace(':id', id!));
  };

  // Show loading state
  if (isLoading) {
    return <ScreenLoader message="جاري تحميل البيانات..." />;
  }

  // Show error state
  if (error || !draftData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  const renderStepContent = () => {
    const stepProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      onCancel: handleCancel,
      onSaveDraft: handleSaveDraft,
    };

    switch (currentStep) {
      case 0:
        return <Step1 {...stepProps} draftId={id} isEditMode={true} initialData={step1InitialData} />;
      case 1:
        return <Step2 {...stepProps} draftId={id!} isEditMode={true} initialData={step2InitialData} />;
      case 2:
        return <Step3 {...stepProps} draftId={id!} isEditMode={true} initialSlots={step3InitialSlots} />;
      default:
        return <Step1 {...stepProps} draftId={id} isEditMode={true} initialData={step1InitialData} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
        {/* Page Title */}
        <h1
          className="text-[28px] text-[#101828] font-bold text-center mb-2"
        >
          تعديل معلومات الاجتماع
        </h1>
        <p
          className="text-[16px] text-[#475467] font-normal text-center mb-8"
        >
          يرجى تعديل الحقول المطلوبة
        </p>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="mt-8">{renderStepContent()}</div>
      </div>
    </div>
  );
};

export default EditMeeting;
