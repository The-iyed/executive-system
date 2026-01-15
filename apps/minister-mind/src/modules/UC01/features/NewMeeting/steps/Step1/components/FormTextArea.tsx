import React from 'react';
import { Textarea } from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

export interface FormTextAreaProps extends React.ComponentProps<'textarea'> {
  error?: boolean;
}

export const FormTextArea = React.forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn(
          'p-[12px] w-[1085px] h-[154px] bg-[#FFFFFF] border border-[#D0D5DD] box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-[8px]',
          'text-right resize-none text-[16px] font-normal text-[#667085]',
          'placeholder:text-[#667085]',
          'focus-visible:outline-none focus-visible:border-[#008774]',
          error && 'border-[#D13C3C] text-[#344054]',
          !error && 'focus-visible:border-[#008774]',
          className
        )}
        {...props}
      />
    );
  }
);

FormTextArea.displayName = 'FormTextArea';