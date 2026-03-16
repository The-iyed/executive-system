import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2 } from "lucide-react";
import { createMinisterDirective } from "@gl/api/minister-directives";
import { queryKeys } from "@gl/api/queryKeys";
import { cn } from "@gl/lib/utils";

interface CreateDirectiveModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateDirectiveModal({ open, onClose }: CreateDirectiveModalProps) {
  const [title, setTitle] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (t: string) =>
      createMinisterDirective({ title: t, status: "TAKEN", scheduling_officer_status: "OPEN" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ministerDirectives() });
      setTitle("");
      onClose();
    },
  });

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-foreground">توجيه جديد</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Title input */}
        <div className="mb-5">
          <label className="block text-[12px] font-medium text-muted-foreground mb-2">
            عنوان التوجيه
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="أدخل عنوان التوجيه..."
            autoFocus
            className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <p className="text-[11px] text-destructive mb-4">
            حدث خطأ أثناء الإنشاء، يرجى المحاولة مرة أخرى
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            إنشاء
          </button>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl border border-border/50 bg-card px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export { CreateDirectiveModal };
