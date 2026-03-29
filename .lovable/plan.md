

## Plan: Fix `toISOStringWithTimezone` to emit local ISO with timezone offset

### Problem
`toISOStringWithTimezone` calls `date.toISOString()` which converts to UTC and appends `Z`. Selecting 3:00–4:00 in UTC+3 sends `02:00:00.000Z` and `03:00:00.000Z`.

### Fix

**File: `src/lib/ui/lib/dateUtils.ts`**

Replace both functions to output local time with the browser's timezone offset (e.g. `2026-03-30T03:00:00+03:00`):

```typescript
function getTimezoneOffsetString(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

export function toISOStringWithTimezone(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${getTimezoneOffsetString(date)}`;
}

export function toISOStringWithTimezoneFromString(isoOrEmpty: string): string {
  if (!isoOrEmpty || typeof isoOrEmpty !== 'string') return isoOrEmpty;
  const date = new Date(isoOrEmpty);
  if (Number.isNaN(date.getTime())) return isoOrEmpty;
  return toISOStringWithTimezone(date);
}
```

Single file change. All call sites (calendar slot form, date-time picker, etc.) automatically send the correct local time with offset.

