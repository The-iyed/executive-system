

## Plan: Add Scheduling Settings to Calendar Meeting Detail & Quick Meeting Form

### What

Add the two "إعدادات الجدولة" toggle fields — **مبدئي** (Preliminary = `!requires_protocol`) and **البيانات مكتملة** (Data Complete = `is_data_complete`) — in two places:

1. **EventDetailModal** (calendar meeting detail popup) — read-only display
2. **CalendarSlotMeetingForm** (quick meeting creation form) — interactive toggles

### Changes

#### 1. EventDetailModal.tsx — Read-only scheduling settings display

Add a new section after the invitees section showing two read-only status badges:
- Fetch `requires_protocol` and `is_data_complete` from `meetingDetail` API response
- Display as two styled cards (similar to the ToggleCard look but non-interactive)
- Show checkmark icon when active, empty when not
- Section title: "إعدادات الجدولة" with a calendar/settings icon

#### 2. CalendarSlotMeetingForm.tsx — Add form fields for quick meeting

- Add `requires_protocol` (boolean, default `false`) and `is_data_complete` (boolean, default `true`) to the Zod schema
- Add a "إعدادات الجدولة" section with two `ToggleCard`-style buttons (reuse the pattern from `ScheduleConfirmDialog`)
- Pass both values in `CalendarSlotMeetingFormSubmitValues`

#### 3. CalendarView.tsx — Send values in API payload

- Include `requires_protocol` and `is_data_complete` in the `handleSlotSubmit` payload sent to `createScheduledMeeting`

#### 4. calendarApi.ts — Add fields to payload type

- Add `requires_protocol?: boolean` and `is_data_complete?: boolean` to `CreateScheduledMeetingPayload`
- Include them in the `createScheduledMeeting` request body

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Add read-only scheduling settings section from API data |
| `CalendarSlotMeetingForm.tsx` | Add schema fields + ToggleCard UI section |
| `CalendarView.tsx` | Pass `requires_protocol` and `is_data_complete` in submit payload |
| `calendarApi.ts` | Add fields to `CreateScheduledMeetingPayload` and request body |

