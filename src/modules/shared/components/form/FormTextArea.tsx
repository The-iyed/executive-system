import React from 'react';
import { Textarea } from '@/lib/ui';
import { cn } from '@/lib/ui';

export interface FormTextAreaProps extends Omit<React.ComponentProps<'textarea'>, 'size'> {
  error?: string;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
  containerClassName?: string;
}

export const FormTextArea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextAreaProps
>(({ className, error, label, required, fullWidth = true, containerClassName, onChange: propsOnChange, onInput: propsOnInput, ...props }, ref) => {
  return (
    <div className={cn(
      'flex flex-col gap-2',
      fullWidth ? 'w-full max-w-[1200px] mx-auto px-4' : '',
      containerClassName
    )}>
      {label && (
        <label className="text-right text-[14px] font-medium text-[#344054]">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
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

          // Disabled: can't be bypassed by removing attributes in devtools
          props.disabled && 'cursor-not-allowed pointer-events-none select-none',

          className
        )}
        required={required}
        readOnly={props.readOnly || props.disabled}
        onChange={(e) => {
          if (props.disabled) {
            (e.target as HTMLTextAreaElement).value = String(props.value ?? '');
            return;
          }
          propsOnChange?.(e);
        }}
        onInput={(e) => {
          if (props.disabled) {
            (e.target as HTMLTextAreaElement).value = String(props.value ?? '');
            return;
          }
          propsOnInput?.(e);
        }}
        {...props}
      />
      {error && (
        <p className="text-right text-[14px] text-[#D13C3C] mt-1 mb-1">
          {error}
        </p>
      )}
    </div>
  );
});

FormTextArea.displayName = 'FormTextArea';
