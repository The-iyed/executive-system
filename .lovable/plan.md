

## Plan: Improve إعدادات الجدولة in detail modal + fix form defaults

### Two changes

#### 1. EventDetailModal — Better styling for scheduling settings

Current: small checkbox-style cards without descriptions, tight spacing.

**Improve to**: larger cards matching the form style — each card shows the label + a sub-description, with a proper checkmark icon, consistent with the creation form's ToggleCard pattern.

- "مبدئي" → sub-text "يتطلب بروتوكول"
- "البيانات مكتملة" → sub-text "جميع البيانات جاهزة"
- Larger padding, rounded-xl, RTL-friendly layout matching the form toggles

#### 2. CalendarSlotMeetingForm — Both defaults to `false` (not selected)

Change `is_data_complete` default from `true` to `false` so both toggles start unselected when creating a quick meeting.

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Restyle scheduling settings cards — bigger, add sub-descriptions |
| `CalendarSlotMeetingForm.tsx` | Change `is_data_complete` default from `true` to `false` (line 82 + line 125) |

