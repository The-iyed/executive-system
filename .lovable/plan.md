
Goal

<<<<<<< HEAD
## Plan: Remove loader on logout

### Problem
When the user clicks "تسجيل الخروج", a full-screen `ScreenLoader` flashes before the login page appears. This happens because:
- **Non-SSO**: `logout()` sets `user = null`, then does `window.location.href` reload — on reload, `isInitialised` starts as `false`, showing the loader
- **SSO**: `oidcLogout()` calls `signoutRedirect()` which navigates to IdP — while waiting, the app re-renders with no user and may flash the loader

### Solution
Skip the full-page reload for non-SSO logout. Instead, clear tokens and use React Router navigation so `isInitialised` stays `true` and the login page renders immediately with no loader.
=======
Make the Step 3 invitees optimistic update behave the same on the first edit and every later reopen of the same meeting modal.

What I found

- The Schedule/الجدولة tab is already reading from the correct shared cache path:
  - `MeetingDetailPage` passes `meeting?.invitees` into `ScheduleTab`
  - `useMeetingDetailPage` loads that from React Query key `['meeting', id]`
  - `optimisticMergeMeeting(...)` writes to `['meeting', meetingId]`
- So the display side is correct. The real bug is in the modal state lifecycle.
>>>>>>> a931e56b46f832c13d89fe5b6ccfd0b399c7f846

Root cause

<<<<<<< HEAD
**File: `src/modules/auth/context/AuthProvider.tsx`**

In the `logout` function (non-SSO branch ~line 230-233):
- Remove `window.location.href` redirect
- Keep `clearTokens()` and `setUser(null)` — this makes `isAuthenticated = false`
- The existing route catch-all (`Navigate to /login`) handles the redirect without a loader since `isInitialised` remains `true`

```ts
// Before
clearTokens();
setUser(null);
window.location.href = window.location.origin + PATH.LOGIN;

// After
clearTokens();
setUser(null);
// No reload — isInitialised stays true, router redirects to /login instantly
```

For SSO logout, the redirect is external (IdP) so we cannot avoid it, but we should not reset state before the redirect completes. The current SSO flow already avoids setting `isInitialised = false`, so no change needed there.

### Result
- Non-SSO: logout instantly shows login page, no loader flash
- SSO: no change (external redirect is unavoidable)
- 1 file, ~1 line removed
=======
- In `useModalSteps`, `resetModal()` does `setDraftId(null)`.
- That `draftId` is only restored by:
  - `useEffect(() => setDraftId(editMeetingId ?? null), [editMeetingId])`
- When you reopen the same meeting, `editMeetingId` did not change, so that effect does not run.
- Result: after the first close, the modal can reopen with `draftId === null`.
- But Step 3 submit currently uses `steps.draftId`, so on the second open it may skip the submit/refetch path entirely.
- That exactly matches your symptom: first open after refresh works, second open does not trigger the same optimistic/refetch behavior.

Implementation plan

1. Rehydrate edit state every time the modal opens
- File: `src/modules/shared/features/meeting-request-form/submitter/SubmitterModal.tsx`
  - Pass `open` into `useSubmitterModal(...)`
- File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useSubmitterModal.ts`
  - Accept `open` and forward it to `useModalSteps(...)`
- File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useModalSteps.ts`
  - Accept `open`
  - Add an effect that runs when the dialog opens:
    - `setCurrentStep(1)`
    - `setStep1Data(null)`
    - `setDraftId(editMeetingId ?? null)`
- This guarantees every reopen starts with the correct meeting id, even when reopening the same record.
>>>>>>> a931e56b46f832c13d89fe5b6ccfd0b399c7f846

2. Use the stable meeting id for Step 3 actions
- File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useSubmitterModal.ts`
- Change final Step 3 actions to use `steps.activeDraftId` (or `editMeetingId ?? steps.draftId`) instead of only `steps.draftId`
- Apply this in:
  - `handleFinalSubmit`
  - `handleSaveAsDraft`
- This makes edit mode consistent with how the hook already fetches detail data.

3. Keep the optimistic patch on the exact cache the page uses
- Keep the current raw-row optimistic patch approach:
  - read `getRows()`
  - build `buildStep3Patch(rawRows)`
  - write with `optimisticMergeMeeting(...)`
- Keep `syncMeetingDetails(meetingId, patch)` so the same `['meeting', meetingId]` cache gets refetched and patched if the backend responds stale.
- No separate local state should be introduced for ScheduleTab.

4. Add one defensive guard
- If edit mode is active but no meeting id is available, show a destructive toast instead of silently returning.
- That makes regressions obvious during testing.

Why this should fix your exact case

Right now the optimistic update is not failing because ScheduleTab reads the wrong state.  
It is failing because on reopen the modal loses the edit meeting id, so the second submission path is not operating against the same shared query state.

Once the modal re-initializes `draftId` on every open and Step 3 uses `activeDraftId`, the first edit and second edit will both target the same cache and the same refetch path.

Validation I would run after implementation

- Refresh page
- Open edit modal for the meeting
- Go to Step 3 and update invitees
- Confirm Schedule/الجدولة updates immediately
- Close modal
- Reopen the same meeting modal
- Edit invitees again
- Confirm:
  - optimistic update happens again
  - refetch runs again
  - ScheduleTab still reflects the latest list
- Repeat one more time without refreshing the page

Technical details

Files to change:
- `src/modules/shared/features/meeting-request-form/submitter/SubmitterModal.tsx`
- `src/modules/shared/features/meeting-request-form/submitter/hooks/useSubmitterModal.ts`
- `src/modules/shared/features/meeting-request-form/submitter/hooks/useModalSteps.ts`

Data flow being preserved:
- edit modal optimistic patch -> `optimisticMergeMeeting`
- query key updated -> `['meeting', meetingId]`
- detail page reads same key -> `useMeetingDetailPage`
- ScheduleTab receives updated `meeting.invitees`

Build note

There are also separate existing TypeScript/build errors in UC03, UC04, auth, guiding-light, and Supabase function files. Those are unrelated to this reopen bug, but they still need a separate cleanup pass before the project typecheck will be fully green.
