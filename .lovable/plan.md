

## Plan: Align title right, everything else left — RTL split layout

### Problem
Currently all elements flow sequentially in one flex row. The user wants the title (+ status icon + copy) pinned to the right side, and all metadata tags, date, status badge, and chevron pushed to the left side. Same for the collapsed actions row — actions should be left-aligned.

### Changes to `DirectiveCard.tsx`

#### Row 1: Split into right group + left group
Use `justify-between` on the flex row. Wrap title section (icon + title + copy) in one group, and wrap tags + date + badge + chevron in another group.

```text
RTL layout:
[right side: ✓ icon + title + نسخ] ←————→ [left side: tags + date + badge + ⌄]
```

- The title group (`min-w-0 flex-1`) stays on the right (start in RTL)
- The metadata group (`shrink-0 flex`) stays on the left (end in RTL)

#### Row 2: Actions aligned left
Change actions container from `mr-10` to `flex justify-end` (which is left in RTL), so action buttons align under the metadata/tags side.

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add `justify-between` to Row 1, group title vs metadata, align actions to left in Row 2 |

