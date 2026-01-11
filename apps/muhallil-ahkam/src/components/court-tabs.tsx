import React from 'react';
import { cn } from '@sanad-ai/ui';


export type CourtType = 'primary' | 'appeal' | 'supreme';

interface CourtTabsProps {
  value: CourtType;
  onValueChange: (value: CourtType) => void;
  className?: string;
}

const tabs: { value: CourtType; label: string }[] = [
  { value: 'primary', label: 'حكم المحكمة الابتدائية' },
  { value: 'appeal', label: 'حكم محكمة الاستئناف' },
  { value: 'supreme', label: 'حكم المحكمة العليا' },
];

export const CourtTabs: React.FC<CourtTabsProps> = ({
  value,
  onValueChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex gap-0 rounded-[8px] bg-[#F3F4F6] p-1',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              'flex-1 rounded-[6px] px-4 py-2 text-center transition-colors',
              isActive
                ? 'bg-[#055859] text-white'
                : 'text-[#6B7280] hover:text-[#1A1A1A]'
            )}
           
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
