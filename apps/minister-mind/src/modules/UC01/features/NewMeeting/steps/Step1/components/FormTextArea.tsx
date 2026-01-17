import React from 'react';
import { Textarea } from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

export interface FormTextAreaProps extends React.ComponentProps<'textarea'> {
  error?: boolean;
  label?: string;
}

export const FormTextArea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextAreaProps
>(({ className, error, label, ...props }, ref) => {
  return (
    <div className="w-full max-w-[1085px] mx-auto flex flex-col gap-2 px-4">
      {label && (
        <label className="text-right text-[14px] font-medium text-[#344054]">
          {label}
        </label>
      )}

      <Textarea
        ref={ref}
        className={cn(
          // Layout
          'w-full min-h-[120px] md:min-h-[154px]',

          // Base styles
          'p-3 bg-white border rounded-lg',
          'text-right text-[16px] font-normal text-[#667085]',
          'placeholder:text-[#667085]',

          // Effects
          'shadow-[0px_1px_2px_rgba(16,24,40,0.05)]',
          'focus-visible:outline-none focus-visible:border-[#008774]',

          // Error
          error && 'border-[#D13C3C] text-[#344054]',
          
          className
        )}
        {...props}
      />
    </div>
  );
});

FormTextArea.displayName = 'FormTextArea';