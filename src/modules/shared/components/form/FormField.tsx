import React from 'react';
import { cn } from '@/lib/ui';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  className,
  labelClassName,
  errorClassName,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-[6px]',
        'w-[535px] h-[70px]',
        className
      )}
    >
      {label && (
        <label
          className={cn(
            'text-right text-[14px] font-medium text-[#344054]',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <div className="w-full">
        {children}
        {error && (
          <p
          data-error-field={label}
          className={cn(
            'text-right text-[14px] font-normal',
            'text-[#D13C3C]',
            errorClassName
          )}
        >
          {error}
        </p>
        )}
      </div>
    </div>
  );
};

FormField.displayName = 'FormField';