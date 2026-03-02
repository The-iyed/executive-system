import React from 'react';
import { cn } from '@/lib/ui';

export interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function ReadOnlyField({
  label,
  value,
  className,
  labelClassName = 'text-sm font-medium text-gray-700',
  valueClassName = 'w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right',
}: ReadOnlyFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      <label className={labelClassName}>
        {label}
      </label>
      <div className={valueClassName}>
        {value ?? '—'}
      </div>
    </div>
  );
}