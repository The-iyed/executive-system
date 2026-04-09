

## Plan: Modern Admin Notifications UI Redesign

### Design Direction

Elevate the notifications page from a basic list to a polished admin dashboard view, aligning with the app's existing design language (teal gradients, rounded-2xl cards, branded micro-interactions).

### Changes

**1. Page Layout (`index.tsx`) — Unified card container**
- Wrap filters + list + pagination inside a single `rounded-2xl border-2 border-border/40 bg-card shadow-sm` container (matching the shared list container pattern from Directives/Meetings)
- Header stays outside the container with a teal gradient icon background instead of flat `bg-primary/10`
- Add a summary stats row between header and container: 3 mini stat cards showing counts for Sent / Pending / Failed with colored dot indicators
- Improve empty state with a more expressive illustration-style layout

**2. Filters (`NotificationFilters.tsx`) — Inside container header**
- Move filters inside the container as a top bar with `border-b border-border/30 bg-muted/20 px-5 py-3`
- Add count badges next to each filter label (e.g., "مرسل (12)")
- Active filter uses teal gradient background (`from-[#048F86] to-[#0BB5AA]`) instead of flat `bg-primary`
- Inactive filters get subtle hover with `hover:bg-muted/60` transition

**3. Notification Card (`NotificationCard.tsx`) — Row-style redesign**
- Replace bordered card with a clean row layout inside the container (no individual borders, use `border-b border-border/20` dividers between items)
- Left side: colored status dot (green/yellow/red) as a vertical accent
- Layout: subject line + type badge on first row, recipient + timestamp on second row, status badge on the far left (RTL far side)
- Add hover state: `bg-muted/30` background transition with `hover:translate-x-1` for subtle RTL slide effect
- Use `transition-all duration-200` for smooth micro-interactions

**4. Detail Modal (`NotificationDetailModal.tsx`) — Polish**
- Add a colored top accent bar based on status (teal for SENT, amber for PENDING, red for FAILED)
- Retry button uses teal gradient (`from-[#048F86] via-[#069E95] to-[#0BB5AA]`) with `hover:scale-[1.03] active:scale-[0.97]` micro-interaction
- Template data section uses a cleaner key-value grid with alternating subtle backgrounds
- Better visual hierarchy with section dividers

**5. Loading Skeletons**
- Match new row layout instead of card layout
- Add shimmer animation effect

### Technical details

- All text remains Arabic RTL
- Uses existing `cn()` utility, `StatusBadge`, shared `Pagination`
- No new dependencies needed
- Font: IBM Plex Sans Arabic (existing)
- Colors: teal gradient `from-[#048F86] to-[#0BB5AA]` for interactive elements (matching app standard)

### Files changed

| File | Change |
|---|---|
| `Notifications/index.tsx` | Unified container layout, stats row, improved empty state |
| `Notifications/components/NotificationFilters.tsx` | Gradient active state, count badges, container-integrated style |
| `Notifications/components/NotificationCard.tsx` | Row-style layout with status dot, dividers, hover micro-interactions |
| `Notifications/components/NotificationDetailModal.tsx` | Status accent bar, gradient retry button, polished sections |

