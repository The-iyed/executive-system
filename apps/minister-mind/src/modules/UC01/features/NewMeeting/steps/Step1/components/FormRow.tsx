import { cn } from "@sanad-ai/ui"

interface FormRowProps {
    children: React.ReactNode
    className?: string
  }
  
export const FormRow = ({ children, className }: FormRowProps) => (
    <div className={cn(
      "w-full mx-auto max-w-[1085px] min-h-[70px] flex flex-row-reverse items-start gap-4",
      "flex-wrap sm:flex-nowrap justify-end sm:justify-between",
      className)}>
      {children}
    </div>
)