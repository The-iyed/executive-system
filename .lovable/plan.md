

## Plan: Fix optimistic update for Step 3 invitees

### Root Cause
The optimistic cache update patches query keys `['meeting', id]` and `['meeting-draft', id]`, but the UC01 detail page fetches with `['meeting', id, 'preview']`. The cache key mismatch means the patched data never reaches the view the user sees after closing the modal.

### Changes

**1. `src/modules/shared/features/meeting-request-form/shared/utils/optimisticCacheUpdate.ts`**
- Add `['meeting', id, 'preview']` to the list of query key prefixes that `optimisticMergeMeeting` patches
- Change the loop from `["meeting", "meeting-draft"]` to `[["meeting"], ["meeting-draft"], ["meeting", meetingId, "preview"]]` pattern, or simply add the third key variant

**2. `src/modules/shared/features/meeting-request-form/submitter/hooks/useSubmitterModal.ts`**
- Also invalidate `['meeting', meetingId, 'preview']` inside `syncMeetingDetails` so the refetch covers the UC01 preview query too

### Result
After editing invitees in Step 3 and saving, the view page instantly reflects the updated invitees list without requiring a manual page refresh. 2 files changed.

