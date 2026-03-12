import React from "react";
import { PlusCircle, Users } from "lucide-react";
import { Button } from "@/lib/ui";
import { AiGenerateButton } from "./AiGenerateButton";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  aiGenerateFn?: (count: number) => Promise<void>;
  aiGenerateLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "لا يوجد عناصر بعد",
  description = "ابدأ بإضافة عنصر جديد",
  icon,
  onAdd,
  addLabel = "إضافة جديد",
  aiGenerateFn,
  aiGenerateLabel,
}) => {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
        {icon || <Users className="h-7 w-7 text-primary/50" />}
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {title}
      </p>
      <p className="text-xs text-muted-foreground/70 mb-4">
        {description}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {aiGenerateFn && (
          <AiGenerateButton
            onGenerate={aiGenerateFn}
            label={aiGenerateLabel}
          />
        )}
        {onAdd && (
          <Button
            variant="outline"
            onClick={onAdd}
            className="gap-2 h-10 px-5 rounded-xl border-dashed border-2 border-primary/25 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
