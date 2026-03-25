

## Problem

Two issues in `useCalendarEvents` hook at `src/modules/UC02/features/calendar/hooks/useCalendarEvents.ts`:

1. **Missing daily range**: The range calculation only handles `monthly` vs everything else (falls back to `getWeekRange`). When `viewMode === 'daily'`, it still fetches an entire week instead of a single day.

2. **`placeholderData` prevents skeleton**: `placeholderData: (prev) => prev` keeps stale data visible during fetches, which conflicts with `showSkeleton = isLoading || isFetching` — `isLoading` is only true on first load, and `isFetching` is true but the old data is still rendered, so the skeleton never appears on view/date switches.

## Plan

### 1. Add `getDayRange` helper in `src/api/meetings/getMeetingsTimeline.ts`

Add a new function alongside `getWeekRange` and `getMonthRange`:

```typescript
export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}
```

### 2. Update range logic in `useCalendarEvents.ts`

- Import `getDayRange`
- Update the `useMemo` to handle all three view modes:

```typescript
const range =
  viewMode === 'monthly' ? getMonthRange(currentDate) :
  viewMode === 'daily'   ? getDayRange(currentDate) :
                           getWeekRange(currentDate);
```

### 3. Remove `placeholderData` from the query

Remove `placeholderData: (prev) => prev` so that when the query key changes (date or view mode change), `isLoading` becomes `true` and the skeleton displays correctly.

---

### Technical Details

- **Files changed**: `src/api/meetings/getMeetingsTimeline.ts`, `src/modules/UC02/features/calendar/hooks/useCalendarEvents.ts`
- No new APIs or dependencies — uses the existing `getOutlookTimelineEvents` endpoint with corrected `start`/`end` params
- The existing `showSkeleton = isLoading || isFetching` in `CalendarView.tsx` will work correctly once `placeholderData` is removed

