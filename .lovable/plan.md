

## How Webex Auto-Creation Works

When the user selects **VIRTUAL** or **HYBRID** in the "آلية انعقاد الاجتماع" field, a `useEffect` (lines 266-317 in `CalendarSlotMeetingForm.tsx`) automatically calls `createWebexMeeting()` API (`POST /api/v1/webex/meetings`) after a 500ms debounce. It creates a Webex meeting room and stores the join link + unique ID. The form then:
- Shows a spinner "جاري إنشاء اجتماع Webex..."
- Displays the link in a read-only input
- Blocks submit until the link is ready
- Sends `meeting_link` and `webex_meeting_unique_identifier` with the form payload

## Plan: Remove Webex Auto-Creation from Calendar Slot Form

### File: `src/modules/UC02/components/CalendarSlotMeetingForm.tsx`

1. **Remove Webex state** — delete `isCreatingWebex`, `webexMeetingLink`, `webexMeetingUniqueId`, `webexError`, `webexCreatedForSlotRef`, `webexSlotRef` (lines 234-240, 263)

2. **Remove Webex useEffects** — delete the auto-create effect (lines 266-317) and the slot-change clear effect (lines 320-331)

3. **Remove Webex from `handleMeetingChannelChange`** — remove the lines that clear Webex state when switching to PHYSICAL (lines 251-254)

4. **Remove Webex UI block** — delete the spinner, error, and link display section (lines 448-469)

5. **Remove Webex from submit** — remove `meeting_link` and `webex_meeting_unique_identifier` from `handleSubmit` payload (lines 386-387) and remove the `isRemote && !webexMeetingLink` submit guard (line 356)

6. **Remove Webex from submit button disabled** — remove `(isRemote && (!webexMeetingLink || isCreatingWebex))` condition (line 604)

7. **Remove import** — remove `import { createWebexMeeting } from '../data/meetingsApi'` (line 14)

8. **Clean props/interface** — remove `initialMeetingLink`, `initialWebexMeetingUniqueId` from `CalendarSlotMeetingFormProps` and the component destructuring

### File: `src/modules/UC02/features/calendar/CalendarView.tsx`

9. **Remove Webex fields from slot submission** — remove `meeting_link`, `webex_meeting_unique_identifier` from the values passed to the API in the submit handler

10. **Remove Webex props** — remove `initialMeetingLink`, `initialWebexMeetingUniqueId` props passed to `CalendarSlotMeetingForm`

### File: `src/modules/UC02/features/calendar/types.ts`

11. **Remove from SlotSelection** — remove `meetingLink` and `webexMeetingUniqueId` fields

### Interface cleanup

12. **Remove from `CalendarSlotMeetingFormSubmitValues`** — remove `meeting_link` and `webex_meeting_unique_identifier` fields

### What stays untouched
- The `createWebexMeeting` API function in `meetingsApi.ts` — it's still used in `meetingDetail.tsx` for the scheduling modal
- The `calendarApi.ts` payload types — they still accept optional `meeting_link` / `webex_meeting_unique_identifier` for other flows

