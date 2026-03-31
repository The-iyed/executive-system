

## Plan: Keep modal open during save, close only after refetch completes

### Problem
Currently `handleFinalSubmit` closes the modal immediately (line 116-117), then fires API calls in the background. The user sees stale data briefly before the skeleton/refetch kicks in — bad UX.

### Solution
Keep the modal open with a loading/saving state while API calls run. Only close the modal after all saves + query invalidation complete.

### Changes

#### 1. `useSubmitterModal.ts` — Remove instant-close, await everything inline

- Set `isFinalizing = true` at the start of `handleFinalSubmit`
- Remove the early `onSubmitSuccess()` + `onClose()` calls (lines 115-117)
- Remove the background `(async () => { ... })()` wrapper — run everything inline with `await`
- After all API calls + `syncMeetingDetails` complete, call `onSubmitSuccess()` then `onClose()`
- Set `isFinalizing = false` in `finally` block
- The `saving` state (derived from `isFinalizing`) will disable the submit button and show loading in the modal shell

#### 2. `MeetingDetailPage.tsx` — Simplify `handleSubmitSuccess`

- Remove `h.setIsRefreshingAfterEdit(true)` from `handleSubmitSuccess` since the modal now stays open until data is refreshed — no gap of stale data
- Keep `h.setActiveTab('meeting-info')` so the user lands on the right tab after close

#### 3. `useMeetingDetailPage.ts` — Keep `isRefreshingAfterEdit` (optional safety net)

- No changes needed — the `isRefreshingAfterEdit` logic remains as a safety net but won't be triggered in the normal edit flow

### Files changed

| File | Change |
|---|---|
| `useSubmitterModal.ts` | Move `onClose` after all API calls complete; wrap in try/finally with `isFinalizing` |
| `MeetingDetailPage.tsx` | Remove `setIsRefreshingAfterEdit(true)` from `handleSubmitSuccess` |

