

## Plan: Change calendar start time from 00:00 to 07:00

### Problem
The weekly/daily calendar grid starts at 00:00, showing empty early-morning hours. User wants it to start at 07:00.

### Change

#### `src/modules/UC02/components/MinisterFullCalendar.tsx` (line 352)
Change:
```ts
slotMinTime="00:00:00"
```
To:
```ts
slotMinTime="07:00:00"
```

Note: Events before 07:00 will still exist in the data but won't be visible in the grid. If you have meetings scheduled before 7 AM, they will be hidden from the calendar view.

### Files changed

| File | Change |
|---|---|
| `MinisterFullCalendar.tsx` | Change `slotMinTime` from `"00:00:00"` to `"07:00:00"` |

