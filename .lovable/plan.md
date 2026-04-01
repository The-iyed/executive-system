

## Plan: Improve calendar popover positioning in meeting form

### Problem
The date picker popover currently uses `side="left"` which can overflow when the dialog is near screen edges. The popover needs smarter positioning — showing on whichever side has space (top/bottom/right/center).

### Analysis
The `DateTimePickerField.tsx` already has `avoidCollisions={true}` and `collisionPadding={8}`, but hardcodes `side="left"`. Radix's `PopoverContent` supports automatic repositioning when collisions are detected — we just need to allow it.

### Changes

#### `DateTimePickerField.tsx` (lines 153-161)

1. **Change `side` from `"left"` to `"bottom"`** — bottom is the natural default for dropdown-style pickers and works best inside a scrollable dialog
2. **Add `sideOffset={6}`** — slight breathing room
3. **Increase `collisionPadding` to `16`** — ensures the popover doesn't hug viewport edges
4. **Add `onOpenAutoFocus` with `e.preventDefault()`** — prevents scroll jump when popover opens inside a scrollable container
5. **Constrain max dimensions** — change `max-h-[calc(100vh-2rem)]` to `max-h-[min(480px,calc(100vh-2rem))]` so the inner content stays compact and the popover fits even in tight spaces

This leverages Radix's built-in collision detection: when `side="bottom"` doesn't fit, it flips to `"top"`. When neither vertical side fits, `avoidCollisions` shifts the popover horizontally. Combined with `align="center"` it centers relative to the trigger.

### Files changed

| File | Change |
|---|---|
| `DateTimePickerField.tsx` | Change `side` to `"bottom"`, `align` to `"center"`, increase `collisionPadding`, add `onOpenAutoFocus` preventDefault, constrain max-height |

