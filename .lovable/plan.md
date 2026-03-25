

## Add Optimistic Update for Edit Flow

### Current State
- **Create** already has optimistic update: inserts a temporary event into the cache immediately, then replaces it with the real one after API responds.
- **Edit** has NO optimistic update: it calls `updateScheduledMeeting()`, waits for it to finish, then calls `invalidateQueries` which triggers a full refetch. The user sees no immediate feedback on the calendar.

### Problem
When editing a meeting (title, time, etc.), the calendar doesn't reflect changes until the API round-trip completes and the timeline refetches. This feels slow.

### Plan

**File: `src/modules/UC02/features/calendar/CalendarView.tsx`**

In the `handleSlotSubmit` function, add optimistic cache update for the **edit** path (lines 210-215):

1. **Before calling `updateScheduledMeeting`**, snapshot the old cache and immediately update the event in the cache:
   ```typescript
   // Save previous cache for rollback
   const previousEvents = queryClient.getQueryData<CalendarTimelineEvent[]>([...queryKey]);
   
   // Optimistically update the edited event in cache
   queryClient.setQueryData<CalendarTimelineEvent[]>(
     [...queryKey],
     (old) => (old ?? []).map((e) =>
       e.meetingId === slot!.meetingId
         ? { ...e, title: values.title, start: scheduled_start, end: scheduled_end,
             meetingTitle: values.title, meetingChannel: values.meeting_channel,
             meetingLocation: values.meeting_location, meetingLink: values.meeting_link }
         : e
     ),
   );
   ```

2. **Close the modal immediately** — move `setSlot(null)` before the API call for edits so the user sees the updated calendar right away.

3. **On success**, still call `invalidateQueries` to sync with server (background refetch).

4. **On error**, rollback the cache to the snapshot and show the error toast:
   ```typescript
   queryClient.setQueryData<CalendarTimelineEvent[]>([...queryKey], previousEvents);
   ```

5. **Also for create**, close the modal immediately after the optimistic insert (move `setSlot(null)` before `createScheduledMeeting` call) so the user doesn't wait.

### Summary of Changes

- Store `previousEvents` snapshot before optimistic write
- For **edit**: optimistically update the matching event by `meetingId`, close modal, call API, rollback on error
- For **create**: close modal right after optimistic insert (already inserts optimistically, just move `setSlot(null)` earlier)
- On error in either path: rollback cache to snapshot, show error via toast instead of inline `slotError`

### Technical Details

**Single file edit:** `src/modules/UC02/features/calendar/CalendarView.tsx`

No new files, dependencies, or API changes needed.

