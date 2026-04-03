

## Plan: Align collapsed actions with metadata tags

### Problem
The action buttons in the expanded row don't have the same left-side spacing as the metadata tags above them. The chevron and status badge area creates a visual indent on the left that the actions row doesn't match.

### Change to `DirectiveCard.tsx`

On line 161, the actions container has `pr-9` for right padding but no left padding. Add `pl-9` to match the left-side spacing of the chevron + badge area, so actions visually align under the metadata tags.

```text
Before:  <div className="flex justify-end items-center gap-1.5 flex-wrap pr-9">
After:   <div className="flex justify-end items-center gap-1.5 flex-wrap pr-9 pl-9">
```

### Layout
```text
Row 1: [✓] [title...] ——— [نسخ] [جدولة] [مهم] [عاجل] [28 مارس] [مكتمل ●] [⌄]
Row 2:      [padding-r]    [طلب إجتماع]                          [padding-l]
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add `pl-9` to actions row container (line 161) |

