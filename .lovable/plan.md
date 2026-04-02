

## Plan: Move copy button (icon + label) next to title, keep tags in Row 1, only actions in collapsible

### Changes to `DirectiveCard.tsx`

#### 1. Move copy button inline next to the title (with icon + label "نسخ")
Place the copy button immediately after the title text in Row 1. It keeps both the icon and the "نسخ" label, styled as a small tag (`px-2 py-0.5 text-[10px]`).

#### 2. Move metadata tags to Row 1
Move all metadata tags (جدولة, مهم, عاجل, duration, صوتي) from the collapsible section into the main row, placed between the copy button and the date.

#### 3. Title: truncate when collapsed, full wrap when expanded
Change title class from always `truncate` to conditional: `truncate` when collapsed, `whitespace-normal` when expanded.

#### 4. Collapsible section: only action buttons + voice player
Row 2 will only contain the action buttons (الأخذ بالتوجيه, طلب إجتماع) and voice player. Update `hasExpandableContent` to `visibleActions.length > 0 || hasVoice`.

### Layout

```text
Collapsed:
[✓] [title (truncated)...] [📋 نسخ] [جدولة] [مهم] [عاجل] [28 مارس] [مكتمل ●] [⌄]

Expanded:
[✓] [title (full wrap)]    [📋 نسخ] [جدولة] [مهم] [عاجل] [28 مارس] [مكتمل ●] [⌃]
    [الأخذ بالتوجيه] [طلب إجتماع]
    [🔊 voice player]
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Move copy (icon+label) next to title in Row 1, move tags to Row 1, title conditional truncate, collapsible only has actions+voice |

