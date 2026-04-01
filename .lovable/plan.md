

## Plan: Improve EventDetailModal UI/UX

### Current Issues (from screenshots)
- Date row shows truncated text ("الأربع" instead of full day name)
- Time row shows only start time ("10:50") without end time range
- Location row shows raw URL without friendly formatting
- Invitees section lacks visual hierarchy — flat list with no clear separation
- Scheduling settings cards look functional but lack polish
- Footer buttons are plain and don't draw attention to the primary action
- No visual separator between header title and body content
- Empty fields (no organizer row visible in image 1) still take space

### Design Improvements

#### 1. Header — Add subtle gradient accent bar + better spacing
- Add a thin 3px gradient accent bar at the top (`from-[#048F86] to-[#0BB5AA]`) for brand identity
- Increase title max-width handling — use `line-clamp-2` instead of `truncate` so long titles wrap to 2 lines
- Move the internal/external badge inline next to the calendar icon header

#### 2. Details Card — Richer formatting
- **Date**: Show full date with year: "الأربعاء 2 أبريل 2026م"
- **Time**: Always show range with dash: "10:50 – 11:35" with a subtle duration pill (e.g., "45 دقيقة")
- **Location**: For links, show a clickable chip-style button with Video icon + domain text; for physical locations show MapPin icon inline
- **Organizer**: Show avatar initials circle (like invitees) for visual consistency

#### 3. Invitees Section — Stacked avatars + expandable
- Replace individual cards with a compact **avatar stack** (overlapping circles) for the first 5 invitees
- Show names on hover via tooltip
- Keep the "+N آخرين" counter as a pill badge
- Add subtle section divider line above

#### 4. Scheduling Settings — Chip-style badges
- Convert from card grid to inline horizontal chips/badges
- Active state: filled teal chip with checkmark icon
- Inactive state: outlined muted chip

#### 5. Footer — Elevated primary CTA
- "انضم للاجتماع" button: use branded gradient (`from-[#048F86] to-[#0BB5AA]`) with `hover:scale-[1.03]` micro-interaction
- "عرض التفاصيل" button: subtle outlined style with arrow icon
- "تعديل" button: ghost/icon-only style to reduce visual noise

#### 6. Polish
- Add `backdrop-blur-sm` to overlay for frosted glass effect
- Smoother entry animation via `data-[state=open]:animate-in` scale + fade
- Consistent 14px/12px/10px type scale throughout

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Redesign header with accent bar, improve date/time formatting with duration, avatar stack for invitees, chip-style scheduling badges, gradient primary CTA, polish animations and spacing |

