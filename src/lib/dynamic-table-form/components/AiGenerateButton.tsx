import React, { useState } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger, Input } from "@/lib/ui";
import { Sparkles, Loader2 } from "lucide-react";

interface AiGenerateButtonProps {
  onGenerate: (count: number) => Promise<void>;
  label?: string;
  disabled?: boolean;
}

export const AiGenerateButton: React.FC<AiGenerateButtonProps> = ({
  onGenerate,
  label = "اقتراح بالذكاء الاصطناعي",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(3);
  const isValid = count >= 1 && count <= 50;
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await onGenerate(count);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2 h-10 px-5 rounded-xl border-2 border-dashed border-violet-400/40 text-violet-600 hover:bg-violet-50 hover:border-violet-400/60 dark:text-violet-400 dark:hover:bg-violet-950/30 transition-all font-medium"
        >
          <Sparkles className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-5 rounded-xl" align="end" dir="rtl">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">عدد المدعوين</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            أدخل عددًا بين 1 و 50. سيقوم الذكاء الاصطناعي بتوليد
            ما بين 0 إلى العدد المحدد بناءً على مدى ملاءمتهم.
          </p>
          <Input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setCount(Math.min(50, Math.max(1, val)));
            }}
            className="h-10 rounded-lg text-center text-lg font-bold"
          />
          {!isValid && (
            <p className="text-xs text-destructive">يجب أن يكون العدد بين 1 و 50</p>
          )}
          <Button
            onClick={handleGenerate}
            disabled={loading || !isValid}
            className="w-full gap-2 h-10 rounded-xl font-medium bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ التوليد...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                توليد حتى {count} مقترح
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
