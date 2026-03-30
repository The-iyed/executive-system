

## Plan: Fix `editMeetingId` to use API-returned meeting ID

### Problem
Line 112 in `EventDetailModal.tsx` sets `meetingId: event.meeting_id`, which comes from the calendar event object and can be null. The API response (`meetingDetail`) contains the authoritative `meeting.id`, but it's ignored. This means the edit button either doesn't appear or passes the wrong ID.

### Change

**`src/modules/UC02/features/calendar/components/EventDetailModal.tsx`** — Line 112

Replace:
```ts
meetingId: event.meeting_id,
```
With:
```ts
meetingId: (fromApi ? meeting.id : undefined) ?? event.meeting_id,
```

This mirrors the pattern used in the meeting detail page (`meeting.id`), ensuring the correct UUID is passed to `SubmitterModal` for PATCH requests.

### Result
- Edit always passes the correct API-sourced meeting ID to `SubmitterModal`
- Matches the `/meeting/:id` detail page behavior exactly
- 1 file changed

