

## Plan: Improve UX of action buttons (الأخذ بالتوجيه & طلب إجتماع)

### Current issues
- Buttons are hidden by default, only appear on hover (`opacity-0 group-hover:opacity-100`) — poor discoverability on touch devices and unclear affordance
- Small text (11px), minimal padding, no visual hierarchy between the two actions
- No loading/disabled state feedback when clicked
- Positioned in a separate row below content — disconnected from the card

### Changes

#### 1. `DirectiveCard.tsx` — Always-visible buttons inline with the card row

- **Remove hover-only visibility**: Change from `opacity-0 group-hover:opacity-100` to always visible
- **Move buttons inline**: Place action buttons at the far left of the main row (before the status badge) instead of a separate secondary row
- **Better sizing**: Increase padding to `px-3.5 py-1.5`, font to `text-[12px]`, rounded to `rounded-lg`
- **Visual hierarchy**: "طلب إجتماع" (primary action) gets the branded teal gradient (`from-[#048F86] via-[#069E95] to-[#0BB5AA]`) with white text; "الأخذ بالتوجيه" gets an outlined style with subtle hover lift
- **Micro-interactions**: Add `transition-all hover:scale-[1.03] active:scale-[0.97]` matching the project's standard button pattern
- **Focus ring**: Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1` for accessibility

#### 2. `DirectivesFeature.tsx` — Update button classNames

- Update the `className` for "take" action: outlined style with hover lift (`border border-primary/30 text-primary bg-white hover:bg-primary/5 hover:shadow-sm hover:scale-[1.03] active:scale-[0.97]`)
- Update the `className` for "meeting" action: teal gradient (`bg-gradient-to-l from-[#048F86] via-[#069E95] to-[#0BB5AA] text-white shadow-sm hover:shadow hover:scale-[1.03] active:scale-[0.97]`)

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Move actions inline, always visible, better sizing/padding/rounded, add focus ring and transition |
| `DirectivesFeature.tsx` | Update action classNames with gradient primary + outlined secondary + micro-interactions |

