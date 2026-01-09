import React from 'react';
import { cn } from '@/lib/utils';

export interface RelatedQuestionProps {
  question: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

// Question Icon SVG
const QuestionIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  className,
  isActive,
}) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      cx="9"
      cy="9"
      r="8.5"
      stroke={isActive ? '#00a69c' : '#101828'}
      strokeWidth="1"
    />
    <path
      d="M9 13V9.5C9 9.22386 9.22386 9 9.5 9H10C10.2761 9 10.5 8.77614 10.5 8.5V8C10.5 7.72386 10.2761 7.5 10 7.5H8.5C8.22386 7.5 8 7.72386 8 8V8.5"
      stroke={isActive ? '#00a69c' : '#101828'}
      strokeWidth="1"
      strokeLinecap="round"
    />
    <circle cx="9" cy="13.5" r="0.5" fill={isActive ? '#00a69c' : '#101828'} />
  </svg>
);

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
      <div className="flex items-center gap-2.5">
        <p
          className={cn(
            'font-normal leading-[25.233px] text-base text-right',
            isActive ? 'text-[#00a69c]' : 'text-[#101828]'
          )}
          style={{ fontFamily: '"Somar Sans", sans-serif' }}
        >
          {question}
        </p>
        <QuestionIcon
          className="w-[18px] h-[18px] shrink-0"
          isActive={isActive}
        />
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
    <div className={cn('flex flex-col gap-3 items-end', className)} dir="rtl">
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

