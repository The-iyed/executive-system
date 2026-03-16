import { useMemo, useState } from "react";
import type { IsicChoicePayload } from "@gl/api/types";

/** Backend may send options as objects { ISIC_ID, ISIC_DESC, MASTER_ACTIVITY_NAME }; normalize to display string + id. */
function normalizeIsicOptions(
  options: unknown[],
  ISIC_IDs: (string | number)[]
): { displayName: string; id: string }[] {
  const raw = options.map((opt, i) => {
    const id = ISIC_IDs[i] != null ? String(ISIC_IDs[i]) : String(i);
    if (opt != null && typeof opt === "object" && !Array.isArray(opt)) {
      const o = opt as Record<string, unknown>;
      // Prefer ISIC_DESC (per-option) so multiple options under same MASTER_ACTIVITY_NAME don't all show the same label
      const desc = (o.ISIC_DESC as string)?.trim();
      const master = (o.MASTER_ACTIVITY_NAME as string)?.trim();
      const name = desc || master || (o.ISIC_ID != null ? String(o.ISIC_ID) : "") || id;
      return { displayName: String(name), id };
    }
    return { displayName: typeof opt === "string" ? opt : String(opt ?? id), id };
  });
  // If multiple options share the same displayName, append id for each so chips are distinguishable
  const displayNameCounts = new Map<string, number>();
  for (const { displayName } of raw) {
    displayNameCounts.set(displayName, (displayNameCounts.get(displayName) ?? 0) + 1);
  }
  return raw.map(({ displayName, id }) => {
    const isDuplicate = (displayNameCounts.get(displayName) ?? 0) > 1;
    const uniqueName = isDuplicate ? `${displayName} (${id})` : displayName;
    return { displayName: uniqueName, id };
  });
}

interface IsicChoiceCardProps {
  payload: IsicChoicePayload;
  onSubmit: (choice: string[] | "all", displayText: string) => void;
  disabled?: boolean;
}

function IsicChoiceCard({ payload, onSubmit, disabled = false }: IsicChoiceCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const rawOptions = payload.options ?? [];
  const rawIds = payload.ISIC_IDs ?? [];
  const normalized = useMemo(
    () => normalizeIsicOptions(Array.isArray(rawOptions) ? rawOptions : [], Array.isArray(rawIds) ? rawIds : []),
    [rawOptions, rawIds]
  );
  const optionDisplayNames = normalized.map((o) => o.displayName);
  const ISIC_IDs = normalized.map((o) => o.id);

  const toggleOption = (id: string) => {
    if (selectAll) setSelectAll(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectAll((prev) => !prev);
    setSelected(new Set());
  };

  const canSubmit = selectAll || selected.size > 0;

  const handleSubmit = () => {
    if (!canSubmit || disabled || submitted) return;
    setSubmitted(true);
    if (selectAll) {
      onSubmit("all", "اخترت: الكل");
    } else {
      const chosenIds: string[] = Array.from(selected);
      const chosenNames = chosenIds.map((id) => {
        const idx = ISIC_IDs.indexOf(id);
        return idx !== -1 ? optionDisplayNames[idx] : id;
      });
      onSubmit(chosenIds, `اخترت: ${chosenNames.join("، ")}`);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-card/60 backdrop-blur-md p-5 pb-4 flex flex-col gap-4 shadow-sm" dir="rtl">
      <div className="flex flex-col gap-1.5">
        <p className="text-[14px] font-bold text-foreground">
          اختر النشاط المناسب
        </p>
        {payload.user_search_term && (
          <p className="text-[12.5px] text-muted-foreground">
            البحث عن: <span className="text-foreground/70 font-medium">{payload.user_search_term}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {/* All option */}
        <button
          type="button"
          disabled={disabled || submitted}
          onClick={toggleAll}
          className={`px-5 py-2.5 rounded-full text-[13px] font-medium border-2 transition-all duration-200 cursor-pointer ${
            selectAll
              ? "bg-primary/10 text-primary border-primary shadow-sm shadow-primary/10"
              : "border-border/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5 bg-background"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          الكل
        </button>

        {/* Individual options */}
        {normalized.map(({ id, displayName }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled || submitted || selectAll}
              onClick={() => toggleOption(id)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-medium border-2 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary/10 text-primary border-primary shadow-sm shadow-primary/10"
                  : "border-border/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5 bg-background"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/20">
        <button
          type="button"
          disabled={!canSubmit || disabled || submitted}
          onClick={handleSubmit}
          className="px-6 py-2 rounded-full text-[13px] font-semibold bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-primary/15"
        >
          تأكيد
        </button>
        <span className="text-[12px] text-muted-foreground/60">
          {submitted
            ? "تم الإرسال ✓"
            : selectAll
              ? "تم تحديد الكل"
              : selected.size > 0
                ? `${selected.size} محدد`
                : "اختر خياراً واحداً أو أكثر"}
        </span>
      </div>
    </div>
  );
}

export { IsicChoiceCard };
