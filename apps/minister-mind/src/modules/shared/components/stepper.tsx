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
    <div className={cn('flex items-center justify-center w-full px-2 sm:px-4', className)} dir="rtl">
      <div className="flex items-start w-full min-w-0 max-w-4xl relative">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;
          const isLineCompleted = index < currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1 min-w-0 relative z-10">
                <div className="flex items-center justify-center mb-1 sm:mb-2 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                  {isActive ? (
                    <img src={StepActiveIcon} alt="" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 rounded-full" />
                  ) : isCompleted ? (
                    <img src={StepCompletedIcon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full" />
                  ) : (
                    <img src={StepInactiveIcon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm font-bold text-center max-w-full px-0.5',
                    'whitespace-normal sm:whitespace-nowrap break-words',
                    isActive ? 'text-[#008774]' : 'text-[#344054]'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className="flex-1 min-w-2 sm:min-w-12 max-w-12 sm:max-w-[200px] relative self-start h-0.5"
                  style={{
                    marginTop: '14px',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
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