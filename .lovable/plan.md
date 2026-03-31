

## Plan: Fix meeting_channel not updating on refetch

### Root cause

In `useMeetingDetailPage.ts` (line 145), the schedule form initialization is guarded by:
```ts
if (lastInitializedMeetingIdRef.current === meeting.id) return;
```

This prevents re-initialization when the meeting data is refetched (same ID). So `scheduleForm.meeting_channel` keeps its original value even after the API returns updated data.

The `MeetingInfoTab` then receives `channelOverride={h.scheduleForm.meeting_channel}` which shows the stale local state instead of the fresh API value.

### Fix

In `useMeetingDetailPage.ts`, remove the `lastInitializedMeetingIdRef` early-return guard and instead use a proper dependency that detects when meeting data has actually changed (e.g., use `meeting`'s `updated_at` or a data fingerprint, or simply always re-sync from the meeting object).

Simplest approach: replace the ref guard with a comparison that allows re-initialization when `isRefreshingAfterEdit` transitions from `true` to `false`, or more robustly, always re-sync the schedule form from the meeting data whenever the meeting object reference changes — but only for fields the user hasn't manually modified in the schedule drawer.

**Chosen approach**: Reset `lastInitializedMeetingIdRef.current` when `isRefreshingAfterEdit` is set (i.e., after an edit save), so the next time meeting data arrives, the form re-initializes with fresh values.

### Changes

#### `useMeetingDetailPage.ts`
- Add an effect: when `isRefreshingAfterEdit` becomes `true`, reset `lastInitializedMeetingIdRef.current = null` so the existing initialization effect re-runs with fresh data on the next render cycle

This is a one-line addition — minimal and targeted.

### Files changed

| File | Change |
|---|---|
| `useMeetingDetailPage.ts` | Reset `lastInitializedMeetingIdRef` when `isRefreshingAfterEdit` is set, allowing schedule form to re-sync from fresh API data |

