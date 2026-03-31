

## Plan: Fix meeting_channel display on detail page

### Problem

On the detail page (`/meeting/{id}`), `MeetingInfoTab` receives `channelOverride={h.scheduleForm.meeting_channel}`. The schedule form initializes `meeting_channel` by checking against a hardcoded valid channels list — if the API returns a value not in that list (or the form hasn't re-initialized after edit), it defaults to `PHYSICAL`, showing the wrong value.

### Fix

**File: `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**

Remove the `channelOverride` from `MeetingInfoTab` so it reads `meeting_channel` directly from the meeting API response instead of the schedule form's local state:

```tsx
// Before
channelOverride={h.scheduleForm.meeting_channel}

// After — remove channelOverride entirely, let MeetingInfoTab use meeting.meeting_channel directly
// (remove the prop)
```

This way the detail page always shows the actual API value. The schedule form's local `meeting_channel` state is only relevant inside the `ScheduleDrawer` for scheduling actions — it should not override the display on the info tab.

### Files changed

| File | Change |
|---|---|
| `MeetingDetailPage.tsx` | Remove `channelOverride={h.scheduleForm.meeting_channel}` from `MeetingInfoTab` |

