

## Plan: Use `is_preliminary_booking` for scheduling settings in calendar

### Problem
The calendar meeting form sends `requires_protocol` to the API, but the backend also expects/returns `is_preliminary_booking` (the inverse: `is_preliminary_booking = !requires_protocol`). The detail modal reads `requires_protocol` but not `is_preliminary_booking`. These need to be aligned.

### Changes

#### 1. `calendarApi.ts` — Add `is_preliminary_booking` to payload and send it
- Add `is_preliminary_booking?: boolean` to `CreateScheduledMeetingPayload`
- In `createScheduledMeeting`, send `body.is_preliminary_booking` alongside `requires_protocol`

#### 2. `CalendarSlotMeetingForm.tsx` — Submit `is_preliminary_booking`
- Add `is_preliminary_booking` to `CalendarSlotMeetingFormSubmitValues`
- In `doSubmit`, compute `is_preliminary_booking: !data.requires_protocol` and include it in the submitted values

#### 3. `CalendarView.tsx` — Pass `is_preliminary_booking` to API payload
- Map `values.is_preliminary_booking` into the payload sent to `createScheduledMeeting` / `updateScheduledMeeting`

#### 4. `EventDetailModal.tsx` — Read `is_preliminary_booking` for display
- In `display` useMemo, read `is_preliminary_booking` from API response
- Use it to determine the "مبدئي" chip state: `is_preliminary_booking ?? !requires_protocol`

### Files changed

| File | Change |
|---|---|
| `calendarApi.ts` | Add `is_preliminary_booking` to payload type and send in request body |
| `CalendarSlotMeetingForm.tsx` | Add `is_preliminary_booking` to submit values |
| `CalendarView.tsx` | Pass `is_preliminary_booking` in API payload |
| `EventDetailModal.tsx` | Read `is_preliminary_booking` from API for "مبدئي" chip |

