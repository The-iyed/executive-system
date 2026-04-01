

## Plan: Remove validation error from ScheduleTab, keep only in modal

### Problem
The `validationError` (e.g. "وقت النهاية يجب أن يكون بعد وقت البداية") is displayed inside the الجدولة tab via `ScheduleTab`. This error should only appear inside the scheduling confirmation modal (`ScheduleConfirmDialog`), not on the tab itself.

### Changes

#### 1. `src/modules/UC02/features/meeting-detail/tabs/ScheduleTab.tsx`
- Remove `validationError` from the props interface
- Remove the error banner rendering block (lines 18–22)

#### 2. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx` (~line 161)
- Remove `validationError={h.validationError}` prop from the `<ScheduleTab>` usage

### Files changed

| File | Change |
|---|---|
| `ScheduleTab.tsx` | Remove `validationError` prop and error banner |
| `MeetingDetailPage.tsx` | Stop passing `validationError` to `ScheduleTab` |

