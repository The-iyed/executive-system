import React from 'react';
import { cn } from '@/lib/ui';

export interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

export function ReadOnlyField({
  label,
  value,
  className,
  labelClassName = 'text-[13px] font-semibold text-[#475467] tracking-wide',
  valueClassName = 'w-full min-h-[44px] px-4 flex items-center bg-[#F9FAFB] border border-[#EAECF0] rounded-xl text-right text-[14px] text-[#101828] font-medium',
  icon,
}: ReadOnlyFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <label className={labelClassName}>
        {label}
      </label>
      <div className={cn(valueClassName, 'transition-colors')}>
        {icon && <span className="ml-2 text-[#667085]">{icon}</span>}
        {value ?? '—'}
      </div>
    </div>
  );
}