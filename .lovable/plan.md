

## Plan: Collapsible action buttons on directive cards

### Problem
The card row is visually crowded — metadata tags and action buttons all compete for space on one line. On narrower viewports this gets worse.

### Recommendation: Expandable card row
Instead of a full Radix collapsible (which adds vertical height), use a **click-to-expand approach** on the card itself:

- **Default state**: Show only the status icon, title, date, and status badge — clean and scannable
- **Expanded state**: On card click, reveal a second row below with metadata tags + action buttons
- Use a subtle chevron indicator on the right to signal expandability
- Smooth height animation via CSS `grid-template-rows` trick (0fr → 1fr)

### Changes

#### 1. `DirectiveCard.tsx` — Add expand/collapse state

- Add `expanded` state toggle on card click
- **Row 1 (always visible)**: Status icon + title + date + status badge + chevron
- **Row 2 (collapsed by default)**: Metadata tags (جدولة, مهم, عاجل, duration, صوتي) + action buttons (الأخذ بالتوجيه, طلب إجتماع) + copy button
- Animate the second row with `overflow-hidden transition-all` and `max-h-0` → `max-h-16`
- Add a small `ChevronDown` icon that rotates 180deg when expanded
- Voice player also moves into the expanded section

#### 2. No changes needed to `DirectivesFeature.tsx`
Action definitions stay the same — only the card layout changes.

### Layout

```text
Default (collapsed):
[✓] [title.................................] [28 مارس 2026] [مكتمل ●] [⌄]

Expanded (on click):
[✓] [title.................................] [28 مارس 2026] [مكتمل ●] [⌃]
    [جدولة] [مهم] [عاجل] [صوتي]  [الأخذ بالتوجيه] [طلب إجتماع]  [نسخ]
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add `expanded` state, split into two rows, animate expand/collapse with chevron indicator |

