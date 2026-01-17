import React from 'react';
import { cn } from '@sanad-ai/ui';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-[6px]',
        'w-[534.5px] h-[70px]',
        className
      )}
    >
      {label && <label
        className="text-right text-[14px] font-medium text-[#344054] width: 'auto',
          height: '20px',
        "
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>}
      <div className="w-full">
        {children}
          <p
            data-error-field={label}
            className={cn(
              'text-right mt-1 mb-4 text-[14px] font-normal',
              error ? 'text-[#D13C3C] visible' : 'invisible'
            )}
            style={{ minHeight: '20px' }}
          >
            {error || ' '}
          </p>
      </div>
    </div>
  );
};