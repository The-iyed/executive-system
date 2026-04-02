

## Plan: Remove descriptions from ToggleCards and unify إعدادات الجدولة style

### Problem
Both مبدئي and البيانات مكتملة have sub-descriptions underneath them in three places. User wants these removed. Additionally, the calendar create form's إعدادات الجدولة should match the تأكيد الجدولة modal's ToggleCard style (centered, card-based).

### Changes

#### 1. `ScheduleConfirmDialog.tsx` — Remove description from ToggleCard
- Remove the `description` prop and its rendering (line 77) from the `ToggleCard` component
- Remove `description` from the two `<ToggleCard>` usages (lines 119, 125)

#### 2. `CalendarSlotMeetingForm.tsx` — Remove descriptions + match modal style
- Remove the description lines (348 "يتطلب بروتوكول" and 374 "جميع البيانات جاهزة")
- Restyle both toggle buttons to match `ScheduleConfirmDialog`'s centered ToggleCard layout: vertical flex-col centered with checkbox on top, label below, no description

### Files changed

| File | Change |
|---|---|
| `ScheduleConfirmDialog.tsx` | Remove `description` prop/rendering from `ToggleCard`, remove description from both usages |
| `CalendarSlotMeetingForm.tsx` | Remove description text, restyle toggles to centered card layout matching the modal |

