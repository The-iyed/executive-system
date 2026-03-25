

## Remove Webex Creation from Schedule Confirmation Modal

### Problem
In the "تأكيد الجدولة" (scheduling confirmation) modal on the meeting detail page, when the meeting channel is VIRTUAL or HYBRID, the system auto-creates a Webex meeting and shows an "إنشاء رابط Webex" button. This should be removed.

### Changes in `src/modules/UC02/pages/meetingDetail.tsx`

1. **Remove the auto-create Webex `useEffect`** (lines ~1338-1403) — the effect that fires when the schedule modal opens and auto-calls `createWebexMeeting` for VIRTUAL/HYBRID channels.

2. **Remove the `createWebexLink` callback** (lines ~1405-1445) — the manual "إنشاء رابط Webex" button handler.

3. **Remove the Webex section from the confirm modal UI** (lines ~3829-3853) — the block that shows either the Webex link, a spinner, or the "إنشاء رابط Webex" button.

4. **Remove the Webex gate from the confirm button** (line ~3870) — change `canConfirm` to no longer require `webexMeetingDetails` for VIRTUAL/HYBRID:
   ```typescript
   // Before
   const canConfirm = !!(effStart && effEnd && ((meetingCh !== 'VIRTUAL' && meetingCh !== 'HYBRID') || webexMeetingDetails));
   // After
   const canConfirm = !!(effStart && effEnd);
   ```

5. **Clean up state variables** — remove `webexMeetingDetails`, `isCreatingWebex` state declarations and any references to them in the `handleScheduleSubmit` payload (remove `meeting_link` and `webex_meeting_unique_identifier` fields from the submit body if they exist).

### Summary
- Single file edit: `src/modules/UC02/pages/meetingDetail.tsx`
- No API files or other components affected
- The confirm button will work immediately without waiting for Webex creation

