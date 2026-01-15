import React from 'react';
import { cn } from '@sanad-ai/ui';

export interface FormFieldProps {
  label: string;
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
      <label
        className="text-right"
        style={{
          fontStyle: 'normal',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#344054',
          width: 'auto',
          height: '20px',
        }}
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <div className="w-full">
        {children}
        {error && (
          <p
            className="text-right mt-2 mb-4"
            style={{
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#D13C3C',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
