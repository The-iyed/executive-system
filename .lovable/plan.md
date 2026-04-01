

## Plan: Hide meeting link for حضوري (PHYSICAL) meetings

### Problem
When a meeting's channel is "PHYSICAL" (حضوري), the modal still shows the meeting link with Video icon and the "انضم للاجتماع" (Join Meeting) button. These should be hidden for physical meetings.

### Changes

#### `EventDetailModal.tsx`

**1. Extract `meeting_channel` in `display` useMemo** (around line 96-148):
- Read `meeting_channel` from both API response (`meeting.meeting_channel`) and event object (`event.meeting_channel`)
- Add `isPhysical` flag: `channel === 'PHYSICAL'`
- Include in returned object

**2. Fix `locationText` logic** (line 110-112):
- When `isPhysical`, use only `meeting_location` (not `meeting_link`/`meeting_url`)
- When not physical, keep current logic

**3. Hide link UI for PHYSICAL** (lines 273-292):
- When `isPhysical`, force `isLink: false` so the location row renders as plain text only (no Video icon, no copy button)

**4. Hide "انضم للاجتماع" button** (lines 405-415):
- Add `!display.isPhysical` condition to the join-meeting button wrapper

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Add `isPhysical` from `meeting_channel`, use only location for physical, hide link UI and join button |

