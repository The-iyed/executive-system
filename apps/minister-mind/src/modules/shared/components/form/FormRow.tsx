import React from 'react';
import { cn } from "@sanad-ai/ui";

export interface FormRowProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export const FormRow: React.FC<FormRowProps> = ({ 
  children, 
  className,
  maxWidth = '1200px'
}) => (
  <div 
    className={cn(
      "w-full mx-auto flex flex-row-reverse items-start gap-4",
      "flex-wrap sm:flex-nowrap justify-end sm:justify-between",
      className
    )}
    style={{ maxWidth }}
  >
    {children}
  </div>
);

FormRow.displayName = 'FormRow';