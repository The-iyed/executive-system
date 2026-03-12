import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

/**
 * Maps visibility flags to the field names they control.
 * When a visibility flag flips from true → false, the associated
 * fields are reset to their default (empty) values.
 *
 * This keeps the form payload clean and prevents stale hidden-field
 * data from being sent to the backend.
 */
export type FieldResetEntry = string | { name: string; resetValue: unknown };
type FieldResetMap = Record<string, FieldResetEntry[]>;

function getResetInfo(entry: FieldResetEntry): { name: string; value: unknown } {
  if (typeof entry === "string") return { name: entry, value: "" };
  return { name: entry.name, value: entry.resetValue };
}

export function useVisibilityCleanup(
  form: UseFormReturn<any>,
  visibility: Record<string, boolean>,
  fieldResetMap: FieldResetMap,
) {
  const prevVisibility = useRef<Record<string, boolean>>(visibility);

  useEffect(() => {
    const prev = prevVisibility.current;

    for (const [key, entries] of Object.entries(fieldResetMap)) {
      const wasVisible = prev[key];
      const isVisible = visibility[key];

      // Only clear when transitioning from visible → hidden
      if (wasVisible && !isVisible) {
        for (const entry of entries) {
          const { name, value } = getResetInfo(entry);
          form.setValue(name, value, { shouldValidate: false });
        }
      }
    }

    prevVisibility.current = { ...visibility };
  }, [visibility, form, fieldResetMap]);
}