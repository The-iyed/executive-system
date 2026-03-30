

## Plan: Complete meeting info tab fields and hide empty fields

### Problem
The "معلومات الاجتماع" tab in the meeting detail view (`/meeting/:id`) is missing fields that exist in the Step 1 form, and currently shows "—" for empty fields instead of hiding them.

### Missing fields to add

| Form field | Arabic label | API source | Action |
|---|---|---|---|
| `meeting_nature` | طبيعة الاجتماع | Derived: `is_sequential` → "إلحاقي", else "عادي" | Add to mapper |
| `requires_protocol` | هل يتطلب بروتوكول؟ | `requires_protocol` (boolean) | Add to mapper |

### Field display logic fix
The `is_urgent` field currently only shows when `true`. It should show "لا" when `false` and hide when `null/undefined` — matching the form behavior where it's always a toggle.

### Changes

**File 1: `src/modules/shared/features/meeting-info/meetingInfoMapper.ts`**

- Add `requires_protocol?: boolean` and `meeting_nature?: string` to `RawMeetingForInfo`
- Add `meeting_nature` field at the top of `basicFields` — derive label from `MeetingNatureLabels` if present, otherwise infer from `is_sequential` (true → "إلحاقي", false → "عادي")
- Add `requires_protocol` field after `meeting_channel` — display as yes/no toggle value
- Fix `is_urgent` to always show yes/no (not only when true): `yesNo(meeting.is_urgent ?? false)`
- Import `MeetingNatureLabels` from shared types

**File 2: `src/modules/shared/features/meeting-info/MeetingInfoView.tsx`**

- Change field rendering to **hide fields with null value** instead of showing "—":
  - In the grid, filter out fields where `value` is `null` (mapper already returns `null` for empty fields)
  - This means: `data.sections[0].fields.filter(f => f.value !== null)` before mapping
  - Same for directive section fields

This matches the user's request: "hide when has no data" — the mapper already returns `null` for missing data, we just need the view to skip those fields.

### Summary

| File | Change |
|---|---|
| `meetingInfoMapper.ts` | Add `meeting_nature` + `requires_protocol` fields, fix `is_urgent` display, update interface |
| `MeetingInfoView.tsx` | Filter out null-value fields instead of showing "—" |

2 files edited. All fields from Step 1 form will be represented in the detail view, hidden when no data.

