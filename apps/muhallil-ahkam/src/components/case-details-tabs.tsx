import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

export type CaseDetailsTabType = 'primary' | 'appeal' | 'supreme' | 'analysis';

interface CaseDetailsTabsProps {
  value: CaseDetailsTabType;
  onValueChange: (value: CaseDetailsTabType) => void;
  className?: string;
}

const tabs: { value: CaseDetailsTabType; label: string }[] = [
  { value: 'analysis', label: 'تحليل الأحكام' },
  { value: 'supreme', label: 'المحكمة العليا' },
  { value: 'appeal', label: 'محكمة الاستئناف' },
  { value: 'primary', label: 'المحكمة الابتدائية' },
];

export const CaseDetailsTabs: React.FC<CaseDetailsTabsProps> = ({
  value,
  onValueChange,
  className,
}) => {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue as CaseDetailsTabType);
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange} className={cn('w-auto', className)}>
      <TabsList
        className={cn(
          'flex justify-center items-center gap-[11.602px] rounded-[11.602px] border-[1.45px] border-[#F2F4F7] bg-[#F2F4F7] p-[5.801px] h-auto',
          'bg-[#F2F4F7] border-[#F2F4F7]'
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'px-[17.404px] py-[11.602px] rounded-[8.702px] transition-all',
              'data-[state=active]:bg-white data-[state=active]:shadow-[0_1.45px_4.351px_0_rgba(16,24,40,0.10),0_1.45px_2.901px_0_rgba(16,24,40,0.06)]',
              'data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:text-[#1A1A1A]',
              'text-sm font-medium text-[#1A1A1A]',
              'focus-visible:outline-none focus-visible:ring-0'
            )}
            style={{ fontFamily: FONT_FAMILY }}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
