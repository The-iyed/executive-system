

## Plan: Use `is_preliminary_booking` directly for مبدئي field

### Problem
The "مبدئي" toggle currently uses `requires_protocol` internally and inverts it (`!requires_protocol`) everywhere. This is error-prone. Should use `is_preliminary_booking` as the canonical field.

### Changes

#### 1. `useMeetingDetailPage.ts`
- In `ScheduleForm` interface: replace `requires_protocol` with `is_preliminary_booking: boolean`
- Default: `is_preliminary_booking: false`
- Init from meeting (line ~163): `is_preliminary_booking: meeting.is_preliminary_booking ?? !meeting.requires_protocol ?? false`
- Submit payload (line ~411-415): send `is_preliminary_booking: scheduleForm.is_preliminary_booking` and derive `requires_protocol: !scheduleForm.is_preliminary_booking`
- Rescheduling diff check (line ~219): use `is_preliminary_booking` instead of `requires_protocol`

#### 2. `ScheduleConfirmDialog.tsx`
- Rename prop `requiresProtocol` → `isPreliminaryBooking`
- Rename callback `onRequiresProtocolChange` → `onPreliminaryBookingChange`
- ToggleCard "مبدئي" (line 120-121): `checked={isPreliminaryBooking}`, `onChange={onPreliminaryBookingChange}` — no inversion

#### 3. `MeetingDetailPage.tsx` (lines 361, 369)
- Pass `isPreliminaryBooking={h.scheduleForm.is_preliminary_booking}`
- Pass `onPreliminaryBookingChange={(v) => h.setScheduleForm(prev => ({ ...prev, is_preliminary_booking: v }))}`

#### 4. `CalendarSlotMeetingForm.tsx`
- In zod schema (line ~82): replace `requires_protocol` with `is_preliminary_booking: z.boolean().default(false)`
- Default values (line ~132): `is_preliminary_booking: false`
- Controller (line ~328): bind to `is_preliminary_booking` field directly, `checked={field.value}` (no inversion)
- Submit (line ~258-260): send `is_preliminary_booking: data.is_preliminary_booking`, derive `requires_protocol: !data.is_preliminary_booking`

### Files changed

| File | Change |
|---|---|
| `useMeetingDetailPage.ts` | Replace `requires_protocol` with `is_preliminary_booking` in form state and submission |
| `ScheduleConfirmDialog.tsx` | Rename props, remove boolean inversion on مبدئي toggle |
| `MeetingDetailPage.tsx` | Update prop bindings |
| `CalendarSlotMeetingForm.tsx` | Use `is_preliminary_booking` in schema, controller, and submit |

