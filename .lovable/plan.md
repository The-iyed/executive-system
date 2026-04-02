

## Plan: Move copy button before tags + add right padding to collapsed actions

### Changes to `DirectiveCard.tsx`

#### 1. Move copy button to the right of tags (before metadata tags)
Currently the copy button sits after the status badge (line 137-144). Move it to be the **first element** in the left group (line 92), so it appears to the right of all tags in RTL.

#### 2. Add right-side spacing to the actions row
The collapsed actions row (line 161) currently uses `justify-end` with no indentation. Add `pr-9` (matching the icon+gap width) to indent actions from the right edge, creating visual separation from the title.

### Layout

```text
Row 1:
[✓] [title...] ——— [نسخ] [جدولة] [مهم] [عاجل] [28 مارس] [مكتمل ●] [⌄]

Row 2 (expanded):
         [padding]                    [الأخذ بالتوجيه] [طلب إجتماع]
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Move copy button before tags in left group; add `pr-9` to actions row |

