

## Plan: Remove default date values only for quick meeting (header button)

### Problem
When clicking "اجتماع سريع" from the calendar header, the proposed meeting date/time fields come pre-filled. The user wants them empty. Slot-click creation should keep pre-filling.

### Changes

#### 1. `CalendarView.tsx` — Pass empty time for quick meetings
Change `handleQuickMeeting` to pass empty strings for `time` and `endTime`:
```ts
setSlot({ date: now, time: '', endTime: '', mode: 'create', isQuickMeeting: true });
```
Remove the time calculation logic (lines 101-110) since it's no longer needed.

#### 2. `CalendarSlotMeetingForm.tsx` — Default to empty when time is empty
Guard the date defaults: when `slotTime` is empty, default to `''` instead of computing a date:
```ts
const startDefault = slotTime ? toISOStart(slotDate, slotTime) : '';
const endDefault = useMemo(() => {
  if (!slotTime) return '';
  if (slotEndTime) return toISOStart(slotDate, slotEndTime);
  // ... existing calculation
}, [slotDate, slotTime, slotEndTime]);
```

### Files changed

| File | Change |
|---|---|
| `CalendarView.tsx` | Simplify `handleQuickMeeting` to pass empty time strings |
| `CalendarSlotMeetingForm.tsx` | Guard date defaults — empty when `slotTime` is empty |

