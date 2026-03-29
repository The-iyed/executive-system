

## Plan: Fix calendar slot date/time being shifted when sent to API

### Problem

When clicking a calendar slot (e.g. 3:00 PM → 4:00 PM on 29/04/2026), the form popup shows the correct time, but the API receives a UTC-shifted time (e.g. 12:00 PM for UTC+3 timezone).

**Root cause**: Two conversion issues working together:

1. **`CalendarSlotMeetingForm.tsx`** — `toISOStart()` builds a local Date then calls `toISOStringWithTimezone()` which internally calls `.toISOString()`, converting to UTC (e.g. `2026-04-29T12:00:00.000Z` instead of `2026-04-29T15:00:00`).

2. **`CalendarView.tsx`** — `handleSlotSubmit()` wraps values again with `toISOStringWithTimezone(new Date(...))`, which converts to UTC again. If the user edits the time via the DateTimePicker (which produces local ISO strings like `2026-04-29T15:00:00`), this second conversion shifts the time to UTC.

The `DateTimePickerField` correctly produces local ISO strings (`YYYY-MM-DDThh:mm:00` without `Z`), but the surrounding code converts everything to UTC before sending.

### Fix

**File 1: `src/modules/UC02/components/CalendarSlotMeetingForm.tsx`**
- Change `toISOStart()` to produce a **local ISO string** (no UTC conversion), matching what `DateTimePickerField` produces:
  ```
  function toISOStart(date: Date, time: string): string {
    const [h = 0, m = 0] = time.split(':').map(Number);
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
  }
  ```
- Remove the `toISOStringWithTimezone` import (no longer needed in this file).

**File 2: `src/modules/UC02/features/calendar/CalendarView.tsx`**
- In `handleSlotSubmit`, stop double-converting — pass `start_date` and `end_date` values directly as-is (they are already local ISO strings from the form):
  ```
  const scheduled_start = values.start_date as string;
  const scheduled_end = values.end_date as string;
  ```
- Remove the `toISOStringWithTimezone` import.

This ensures the exact time the user selects on the calendar slot (e.g. `2026-04-29T15:00:00`) is what gets sent to the API, with no UTC shifting. The backend already receives the `X-Timezone` header to interpret the datetime correctly.

