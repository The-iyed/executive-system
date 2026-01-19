import React from 'react';
import { Input } from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

export interface FormInputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  error?: boolean;
  fullWidth?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, fullWidth = false, style, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          'text-right',
          'placeholder:text-[#667085]',
          'focus-visible:outline-none focus-visible:border-[#008774]',
          error && 'border-[#D13C3C]',
          !error && 'focus-visible:border-[#008774]',
          fullWidth && 'w-full',
          className
        )}
        style={{
          height: '44px',
          padding: '10px 14px',
          background: '#FFFFFF',
          border: error ? '1px solid #D13C3C' : '1px solid #D0D5DD',
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
          borderRadius: '8px',
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '24px',
          color: props.value ? '#344054' : '#667085',
          width: fullWidth ? '100%' : '534.5px',
          ...style,
        }}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
