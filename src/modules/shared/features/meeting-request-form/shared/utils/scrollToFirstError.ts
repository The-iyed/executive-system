import type { UseFormReturn, FieldErrors } from "react-hook-form";

/**
 * Focuses the first errored field via react-hook-form's setFocus,
 * then scrolls the nearest scrollable container so the error is visible.
 *
 * Two-phase approach:
 *  1. Immediate: setFocus on the first error field (works for registered inputs)
 *  2. Delayed DOM scan: find the first [role="alert"] or aria-invalid element
 *     and scroll it into view (handles Controller-based fields like Select)
 */
export function scrollToFirstError(
  form?: UseFormReturn<any>,
  errors?: FieldErrors,
  delay = 120,
): void {
  // Phase 1 — focus first error field via RHF (instant, no DOM dependency)
  if (form && errors) {
    const firstKey = findFirstErrorKey(errors);
    if (firstKey) {
      try {
        form.setFocus(firstKey as any);
      } catch {
        // setFocus may throw for Controller fields — fall through to DOM scan
      }
    }
  }

  // Phase 2 — DOM-based scroll after React re-render
  setTimeout(() => {
    // Try [role="alert"] first (error messages), then aria-invalid inputs
    const el =
      document.querySelector('[role="alert"]') ??
      document.querySelector('[aria-invalid="true"]');

    if (!el) return;

    const scrollContainer = el.closest(".overflow-y-auto");
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const errorRect = el.getBoundingClientRect();

      // Only scroll if the element is outside the visible area
      const isAbove = errorRect.top < containerRect.top;
      const isBelow = errorRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        scrollContainer.scrollBy({
          top: errorRect.top - containerRect.top - 80,
          behavior: "smooth",
        });
      }
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, delay);
}

/** Recursively find the first error key (handles nested errors like agenda_items.0.title) */
function findFirstErrorKey(errors: FieldErrors): string | undefined {
  for (const key of Object.keys(errors)) {
    const err = errors[key];
    if (!err) continue;
    if (err.message) return key;
    if (err.root?.message) return key;
    // For array/object errors, return the parent key
    if (typeof err === "object") return key;
  }
  return undefined;
}
