

## Problem

When switching from **month view** back to **week view**, the API fetches the wrong week (start of month instead of current week).

**Root cause**: `MinisterFullCalendar` fires `onDatesSet` during month view, which calls `setCurrentDate(arg.view.currentStart)` — this resets `currentDate` to the **1st of the month** (e.g., March 1). When you switch back to week view, `getWeekRange(March 1)` returns Feb 28 – March 7 instead of the week containing today.

**Flow**:
1. Week view → `currentDate = March 25` → fetches March 22–28 ✓
2. Switch to month → FullCalendar fires `onDatesSet` → sets `currentDate = March 1` → fetches March 1–31 ✓
3. Switch back to week → `getWeekRange(March 1)` → fetches Feb 28 – March 7 ✗

## Fix

**File: `src/modules/UC02/features/calendar/CalendarView.tsx`** (and same in `MinisterCalendarView.tsx`)

Stop passing `setCurrentDate` to `onCurrentDateChange` in month view. The navigation arrows already handle date changes correctly via `useCalendarNavigation`. FullCalendar's `onDatesSet` should not override `currentDate`.

Change line 279:
```typescript
// Before
onCurrentDateChange={viewMode === 'monthly' ? setCurrentDate : undefined}

// After
onCurrentDateChange={undefined}
```

This ensures `currentDate` stays on the actual date the user was viewing (e.g., March 25), so switching between view modes always computes the correct range around that date.

**Files to edit:**
- `src/modules/UC02/features/calendar/CalendarView.tsx` — remove `onCurrentDateChange` prop pass
- `src/modules/UC02/components/MinisterCalendarView.tsx` — same fix

