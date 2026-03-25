

## Issues Found in Calendar Edit Meeting Flow

### 1. Modal title is always "إنشاء اجتماع من الموعد" even when editing
Line 299 in `CalendarSlotMeetingForm.tsx` hardcodes the create title. No `mode` prop is passed to distinguish create vs edit.

### 2. Invitees not properly mapped on edit
In `handleEdit` (CalendarView.tsx lines 125-158), attendees from `CalendarEventData` only have `name` and `email`. The mapping sets `position: a.name` (wrong — copies name into position) and leaves `mobile`, `sector` empty. The real invitee data is in `meetingDetail` (fetched by EventDetailModal) but is not passed to `handleEdit`.

### 3. Submit button says "حفظ" in both modes — should say "تحديث" for edit

### 4. meetingId not passed to CalendarSlotMeetingForm — the form has no awareness of edit mode

---

## Plan

### File: `src/modules/UC02/components/CalendarSlotMeetingForm.tsx`

1. Add `mode` prop (`'create' | 'edit'`) to `CalendarSlotMeetingFormProps`
2. Change title (line 299): show "تعديل الاجتماع" when `mode === 'edit'`, else "إنشاء اجتماع من الموعد"
3. Change submit button text (line 488): show "تحديث" when `mode === 'edit'`, else "حفظ"

### File: `src/modules/UC02/features/calendar/CalendarView.tsx`

4. Pass `mode={slot.mode}` prop to `CalendarSlotMeetingForm`
5. Fix `handleEdit` to use full invitee data from `meetingDetail` API instead of the sparse `CalendarEventData.attendees`:
   - Accept the fetched `meetingDetail` as a parameter (from EventDetailModal)
   - Map `meeting.invitees` with all fields: `name`, `position`, `email`, `mobile`, `sector`, `attendance_mechanism`, `access_permission`, `is_consultant`, `meeting_owner`, `object_guid`

### File: `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`

6. Update `onEdit` callback to pass `meetingDetail` alongside the event, so `CalendarView.handleEdit` can use full invitee data from the API response:
   - Change `onEdit?: (event: CalendarEventData) => void` to `onEdit?: (event: CalendarEventData, meetingDetail?: MeetingApiResponse) => void`
   - Pass `meetingDetail` when calling `onEdit`

### File: `src/modules/UC02/features/calendar/CalendarView.tsx` (handleEdit update)

7. Update `handleEdit` signature to accept optional `meetingDetail` parameter
8. When `meetingDetail?.invitees` exists, map them with full fields instead of sparse attendees:
   ```typescript
   const initialInvitees = meetingDetail?.invitees?.length > 0
     ? meetingDetail.invitees.map((inv, i) => ({
         _id: `inv-edit-${i}-${Date.now()}`,
         name: inv.name ?? inv.external_name ?? '',
         email: inv.email ?? inv.external_email ?? '',
         position: inv.position ?? '',
         mobile: inv.mobile ?? '',
         sector: inv.sector ?? '',
         attendance_mechanism: inv.attendance_mechanism ?? 'PHYSICAL',
         access_permission: Boolean(inv.access_permission),
         is_consultant: Boolean(inv.is_consultant),
         meeting_owner: Boolean(inv.meeting_owner),
         ...(inv.object_guid ? { object_guid: inv.object_guid } : {}),
       }))
     : // fallback to sparse attendees from event
   ```

---

### Technical Details

**Files to edit:**
- `src/modules/UC02/components/CalendarSlotMeetingForm.tsx` — add `mode` prop, conditional title + button text
- `src/modules/UC02/features/calendar/CalendarView.tsx` — pass `mode`, fix invitee mapping in `handleEdit`
- `src/modules/UC02/features/calendar/components/EventDetailModal.tsx` — pass `meetingDetail` to `onEdit` callback

