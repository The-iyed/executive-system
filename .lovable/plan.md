

## Plan: Align tags, improve collapsible actions, hide chevron when no actions, add ellipsis + tooltip

### Problems (from screenshot)
1. Tags (نسخ, جدولة, مهم, عاجل, date, status) are not column-aligned across cards — each card's tags shift based on content
2. Action buttons in collapsible row are tiny tag-styled — need modern UX
3. Chevron shown even when no expandable content (e.g. CLOSED directives with no visible actions and no voice)
4. Long titles truncate but have no tooltip to reveal full text

### Changes to `DirectiveCard.tsx`

#### 1. Fixed-width tag columns for alignment
Wrap each tag type in a fixed `min-w-[...]` container so tags across cards align vertically:
- Copy button: `min-w-[52px]`
- Type tag (جدولة): `min-w-[68px]`
- Importance (مهم): `min-w-[52px]`
- Priority (عاجل): `min-w-[60px]`
- Date: `min-w-[100px]`
- Status badge: `min-w-[90px]`

When a tag is absent (e.g. not urgent), render an empty placeholder `<span>` with the same `min-w` to maintain alignment.

#### 2. Hide chevron and collapsible when no expandable content
Already handled by `hasExpandableContent` — but the `hidden` check may not be filtering correctly for all cards. Verify that `visibleActions.length > 0 || hasVoice` is the correct gate. The chevron and `onClick` toggle are already gated — no change needed here (already correct in code).

#### 3. Modern action buttons in collapsible row
Replace the tiny `px-2 py-0.5 text-[10px]` tag-style buttons with proper small buttons:
- Size: `px-3.5 py-1.5 text-[11px] rounded-lg`
- "الأخذ بالتوجيه": solid primary gradient `bg-gradient-to-l from-[#048F86] to-[#0BB5AA] text-white shadow-sm`
- "طلب إجتماع": outlined style `border border-teal-400 text-teal-600 bg-white hover:bg-teal-50`
- Both keep `hover:scale-[1.03] active:scale-[0.97] transition-all`
- Icon size bump to `size-3.5`

Update classNames in both `DirectiveCard.tsx` (default styles) and `DirectivesFeature.tsx` (action definitions).

#### 4. Title ellipsis with tooltip
- Keep `truncate` on title when collapsed
- Wrap title `<h3>` in a `<span title={directive.title}>` so native browser tooltip shows full text on hover
- This is lightweight and works without additional dependencies

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add fixed min-w placeholders for each tag slot; wrap title with `title` attr for tooltip; increase action button size in Row 2 |
| `DirectivesFeature.tsx` | Update action `className` to modern gradient/outlined styles, icon size to `size-3.5` |

