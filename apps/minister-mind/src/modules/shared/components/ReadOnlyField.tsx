import React from 'react';
import { cn } from '@sanad-ai/ui';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

export interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  /** Optional label class (e.g. for RTL or size) */
  labelClassName?: string;
  /** Optional value container class */
  valueClassName?: string;
}

/**
 * Shared read-only field: label + value in a consistent box.
 * Replaces repeated label + div patterns in request-info and similar tabs.
 */
export function ReadOnlyField({
  label,
  value,
  className,
  labelClassName = 'text-sm font-medium text-gray-700',
  valueClassName = 'w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right',
}: ReadOnlyFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      <label className={labelClassName} style={fontStyle}>
        {label}
      </label>
      <div className={valueClassName} style={fontStyle}>
        {value ?? '—'}
      </div>
    </div>
  );
}
