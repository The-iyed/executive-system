import React from 'react';
import { cn } from '@/lib/utils';
import { QuestionIcon } from '@/assets/icons/QuestionIcon';

export interface RelatedQuestionProps {
  question: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}



export const RelatedQuestion: React.FC<RelatedQuestionProps> = ({
  question,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-end p-2.5 rounded-[13px] transition-all',
        isActive
          ? 'bg-white shadow-[0px_4px_25.4px_0px_rgba(0,0,0,0.1)]'
          : 'bg-transparent',
        className
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
      <QuestionIcon
        />
        <p
          className={cn(
            'font-normal leading-[25.233px] text-base text-right',
            isActive ? 'text-[#00a69c]' : 'text-[#101828]'
          )}
          style={{ fontFamily: '"Somar Sans", sans-serif' }}
        >
          {question}
        </p>
      
      </div>
    </button>
  );
};

export interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick?: (question: string) => void;
  activeQuestion?: string;
  className?: string;
}

export const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({
  questions,
  onQuestionClick,
  activeQuestion,
  className,
}) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-3 items-start', className)} dir="rtl">
      <p
        className="font-bold leading-[25.233px] text-base text-[#00a79d] text-right"
        style={{ fontFamily: '"Somar Sans", sans-serif' }}
      >
        أسئلة ذات صلة:
      </p>
      <div className="flex flex-col gap-2.25 items-start w-full">
        {questions.map((question, index) => (
          <RelatedQuestion
            key={index}
            question={question}
            isActive={activeQuestion === question}
            onClick={() => onQuestionClick?.(question)}
          />
        ))}
      </div>
    </div>
  );
};

