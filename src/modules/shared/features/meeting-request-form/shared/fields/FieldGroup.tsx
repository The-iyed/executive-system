import { cn, Label } from "@/lib/ui";
import type { FieldErrors } from "react-hook-form";

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  errors: FieldErrors;
  description?: string;
  colSpan?: number;
  children: React.ReactNode;
}

export function FormField({ label, name, required, errors, description, colSpan, children }: FormFieldProps) {
  const error = errors[name];
  const errorMsg = error?.message as string | undefined;
  const hasError = !!error;

  return (
    <div className={cn(
      "space-y-1.5",
      colSpan && colSpan >= 12 ? "col-span-full" 
        : colSpan && colSpan >= 6 ? "md:col-span-2 lg:col-span-2" 
        : ""
    )}>
      <Label htmlFor={name} className={cn("", hasError && "text-destructive")}>
        {label}
        {required && <span className="mr-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {errorMsg && (
        <p role="alert" className="text-xs text-destructive animate-in slide-in-from-top-1">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

interface SectionWrapperProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  columns?: number;
}

export function SectionWrapper({ title, description, children }: SectionWrapperProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
        {children}
      </div>
    </div>
  );
}

export const inputClass = (hasError: boolean) =>
  cn(
    "rounded-lg border transition-all w-full h-10",
    "focus:ring-2 focus:ring-ring focus:border-ring",
    hasError ? "border-destructive" : "border-input"
  );
