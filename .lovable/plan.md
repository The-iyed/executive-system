

## Plan: Remove all optimistic updates & refetch with skeleton on edit

### Problem
After editing a meeting, the app patches the React Query cache optimistically (steps 1, 2, 3 including invitees). This can show stale data. The user wants to remove all optimistic logic and instead do a clean refetch with a proper skeleton.

### Changes

#### 1. `useSubmitterModal.ts` — Remove all optimistic logic
- Remove import of `optimisticMergeMeeting`, `buildStep1Patch`, `buildStep2Patch`, `buildStep3Patch`
- Remove all 4 `optimisticMergeMeeting()` calls (lines 137-139, 149-151, 156-158, 229-231)
- In `syncMeetingDetails`: remove the `setTimeout` — invalidate meeting detail queries immediately (the background async block ensures server has data by then)

#### 2. `useMeetingDetailPage.ts` — Expose `isFetching`
- Destructure `isFetching` from the `useQuery` call (line 113) and include it in the hook's return value
- This signals when React Query is doing a background refetch after invalidation

#### 3. `MeetingDetailPage.tsx` — Use `isFetching` for full-page skeleton
- Remove the manual `isRefreshingInfo` state and `setTimeout(2000)` logic
- Use `h.isFetching` to show a skeleton overlay across **all tabs** (not just meeting-info), so invitees, content, etc. all show skeleton during refetch
- Create a generic `MeetingDetailSkeleton` component inline that covers the tab content area

#### 4. `MeetingInfoTab.tsx` — Remove `isRefreshing` prop
- The skeleton is now handled at the page level, so remove the `isRefreshing` prop and the `MeetingInfoSkeleton` conditional rendering (keep the skeleton component for the page-level use)

### Files changed

| File | Change |
|---|---|
| `useSubmitterModal.ts` | Remove optimistic imports/calls; immediate invalidation |
| `useMeetingDetailPage.ts` | Expose `isFetching` from useQuery |
| `MeetingDetailPage.tsx` | Replace `isRefreshingInfo` with `isFetching` skeleton overlay for all tabs |
| `MeetingInfoTab.tsx` | Remove `isRefreshing` prop usage |

