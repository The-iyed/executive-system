

## Plan: Modernize Admin Notifications List and Detail Modal

### Summary
Remove the statistics row, improve the list page layout with a cleaner header and smarter pagination (showing limited page numbers with ellipsis instead of all 298 pages), and polish the detail modal.

### Changes

**1. Page Layout (`index.tsx`)**
- Remove the stats row (3 mini cards) entirely
- Remove `statusCounts` computation and `stats` array
- Keep header with gradient icon but make it cleaner — add total count as a subtle badge
- Move filters into a cleaner inline bar with the header area
- Replace the current pagination (which renders ALL page numbers — visible in screenshot showing 274-298) with a smart pagination that shows: first, last, current +/- 1, and ellipsis between gaps
- Add a "showing X of Y" text label next to pagination

**2. Notification Card (`NotificationCard.tsx`)**
- Tighten vertical spacing for a denser, more professional list feel
- Improve the layout hierarchy — subject bolder, metadata subtler

**3. Filters (`NotificationFilters.tsx`)**
- Remove count badges (since stats are removed, counts from single page are inaccurate anyway)
- Simplify `counts` prop — make it optional/unused

**4. Detail Modal (`NotificationDetailModal.tsx`)**
- Render all template variables dynamically (loop over `variables` object keys) instead of hardcoding only 3 fields
- Add a label mapping for known variable keys (Arabic labels)
- Improve body section with a label header
- Better spacing and section grouping

**5. Smart Pagination Logic**
- Show pages: 1, ..., current-1, current, current+1, ..., lastPage
- Use `PaginationEllipsis` from the pagination component
- Cap visible page buttons to ~7 max

### Technical details
- No new dependencies
- All Arabic RTL text preserved
- Uses existing `cn()`, `StatusBadge`, `Pagination` components

### Files changed

| File | Change |
|---|---|
| `Notifications/index.tsx` | Remove stats row, smart pagination with ellipsis, "showing X of Y" label |
| `Notifications/components/NotificationCard.tsx` | Tighter spacing, improved hierarchy |
| `Notifications/components/NotificationFilters.tsx` | Remove count badges, simplify |
| `Notifications/components/NotificationDetailModal.tsx` | Dynamic template variables rendering, better sections |

