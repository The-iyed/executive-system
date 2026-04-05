

## Plan: Unify status badge style with other tags

### Problem
The status badges ("مكتمل", "قيد المتابعة") use `rounded-full px-3 py-1 text-[11px]` — making them taller and rounder than the other metadata tags which use `rounded-md px-2 py-0.5 text-[10px]`. They should match.

### Changes to `DirectiveCard.tsx`

#### 1. Match status badge sizing to other tags
Change the status badge span (line 166) from:
- `rounded-full px-3 py-1 text-[11px]` → `rounded-md px-2 py-0.5 text-[10px]`

This matches the exact sizing of the copy, type, importance, priority, and voice tags.

#### 2. Keep fixed-width container
The `min-w-[90px]` wrapper stays to ensure alignment across cards. Both "مكتمل" and "قيد المتابعة" will render at the same width.

#### 3. Keep the colored dot indicator
The small `size-1.5 rounded-full` dot stays — it provides a quick visual signal without adding height.

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Update status badge classes from `rounded-full px-3 py-1 text-[11px]` to `rounded-md px-2 py-0.5 text-[10px]` |

