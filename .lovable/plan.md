

## Plan: Show skeleton immediately after edit save, refetch details

### Problem
After clicking "submit" in the edit modal, the modal closes instantly but API calls run in background. The skeleton only appears once React Query starts refetching (after `invalidateQueries`), leaving a gap where stale data is visible.

### Solution
Add a manual `isRefreshingAfterEdit` state in `useMeetingDetailPage` that turns on immediately when the edit modal submits (via `onSubmitSuccess` callback) and turns off when `isFetching` transitions from true to false (refetch complete).

### Changes

#### 1. `useMeetingDetailPage.ts` — Add `isRefreshingAfterEdit` state
- Add `const [isRefreshingAfterEdit, setIsRefreshingAfterEdit] = useState(false)`
- Add a `useEffect` that watches `isFetching`: when it transitions to `false` while `isRefreshingAfterEdit` is `true`, set `isRefreshingAfterEdit` to `false`
- Expose `isRefreshingAfterEdit` and `setIsRefreshingAfterEdit` in the return object

#### 2. `MeetingDetailPage.tsx` — Trigger skeleton on submit + use combined condition
- In `handleSubmitSuccess`, call `h.setIsRefreshingAfterEdit(true)` alongside `h.setActiveTab('meeting-info')`
- Change skeleton condition from `h.isFetching && !h.isLoading` to `(h.isFetching || h.isRefreshingAfterEdit) && !h.isLoading`

This ensures the skeleton shows the instant the modal closes and stays visible until the refetch completes.

### Files changed

| File | Change |
|---|---|
| `useMeetingDetailPage.ts` | Add `isRefreshingAfterEdit` state + auto-reset effect |
| `MeetingDetailPage.tsx` | Set flag in `handleSubmitSuccess`, update skeleton condition |

