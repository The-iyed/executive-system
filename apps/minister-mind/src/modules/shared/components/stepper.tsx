import React from 'react';
import StepActiveIcon from '../assets/step-active.svg';
import StepInactiveIcon from '../assets/step-inactive.svg';
import StepCompletedIcon from '../assets/step-completed.svg';
import { cn } from '@sanad-ai/ui';

export interface StepperStep {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn('flex items-center justify-center w-full', className)} dir="rtl">
      <div className="flex items-start w-full max-w-4xl relative">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;
          // Line is green if it connects a completed step to the active step
          const isLineCompleted = index < currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1 relative z-10">
                <div 
                  className="flex items-center justify-center mb-2"
                  style={{
                    height: '32px',
                    width: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isActive ? (
                    <img src={StepActiveIcon} alt="" className="w-8 h-8 flex-shrink-0 rounded-full" />
                  ) : isCompleted ? (
                    <img src={StepCompletedIcon} alt="" className="w-6 h-6 flex-shrink-0 rounded-full" />
                  ) : (
                    <img src={StepInactiveIcon} alt="" className="w-6 h-6 flex-shrink-0 rounded-full" />
                  )}
                </div>
                {/* Step label */}
                <span
                  className={cn(
                    'text-sm font-bold text-center whitespace-nowrap',
                    isActive ? 'text-[#008774]' : 'text-[#344054]'
                  )}
                  style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector only between current and next step */}
              {!isLast && (
                <div
                  className="flex-none relative"
                  style={{
                    width: '233px',
                    height: '2px',
                    flexGrow: 0,
                    alignSelf: 'flex-start',
                    marginTop: '16px', // aligns to icon center
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: isLineCompleted ? '#009883' : '#EAECF0',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
