

## Plan: Send local ISO dates with timezone offset

### Problem
`toISOStringWithTimezone` uses `date.toISOString()` which converts to UTC and appends `Z`. When a user in UTC+3 selects 5:00, the API receives `02:00:00.000Z` — a 3-hour shift.

### Fix

**File: `src/lib/ui/lib/dateUtils.ts`**

Update both functions to output local time with the timezone offset (e.g. `2026-04-01T05:00:00+03:00`):

```typescript
function getTimezoneOffsetString(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
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

### Result
Selecting 5:00–6:00 will send `2026-04-01T05:00:00+03:00` — exact local time with offset. Single file change, all 23+ call sites automatically fixed.

