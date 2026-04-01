

## Plan: Fix calendar popover to flip top/bottom based on available space in modal

### Problem
The date picker popover opens at the bottom but when the form is scrolled down, the calendar overflows outside the modal's visible area. It should automatically flip to the top when there's no space below, and vice versa.

### Root Cause
Radix Popover uses a Portal that renders at the document body level. The `avoidCollisions` works against the **viewport**, not the modal's scroll container. Since the popover portals outside the modal, it can visually overlap the modal boundaries.

### Solution
Add `collisionBoundary` prop to constrain the popover within the modal's dialog content element, so Radix flips the popover (bottom↔top) based on available space inside the modal — not the full viewport.

### Changes

#### `DateTimePickerField.tsx`

1. Accept an optional `collisionBoundary` prop (`Element | Element[] | null`) and forward it to `PopoverContent`
2. This lets the parent (the modal form) pass its scrollable container ref so Radix constrains flipping within it

#### `CalendarSlotMeetingForm.tsx` (or wherever DateTimePickerField is used in the calendar modal)

1. Add a `ref` to the modal's scrollable content container
2. Pass `collisionBoundary={ref.current}` to `DateTimePickerField`

If passing a ref is too invasive, a simpler alternative: just ensure `sticky="partial"` (instead of `"always"`) so the popover hides when its trigger scrolls out of view, preventing the "floating detached calendar" problem.

### Recommended simpler approach
Change `sticky="always"` to `sticky="partial"` in `DateTimePickerField.tsx` line 161. This makes the popover dismiss/reposition when the trigger scrolls significantly, which is the standard UX pattern. Combined with the existing `avoidCollisions={true}` and `side="bottom"`, Radix will flip to top when bottom space is insufficient.

### Files changed

| File | Change |
|---|---|
| `DateTimePickerField.tsx` | Change `sticky="always"` to `sticky="partial"` on line 161 |

