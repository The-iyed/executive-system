

## Plan: Defer all API calls to final submit

### Current behavior (problem)
Each step hits the API immediately when the user clicks "Next":
- Step 1 → `PATCH /drafts/{id}/basic-info` → waits → goes to step 2
- Step 2 → `PATCH /drafts/{id}/content` → waits → goes to step 3
- Step 3 → `PATCH /drafts/{id}/invitees` + `POST /submit`

This means 3 round-trips during navigation, with loading spinners between steps.

### New behavior
- Steps 1→2→3: **no API calls** — just validate form, store data in memory, advance step instantly
- Final button ("تحديث الطلب" / "إرسال"): fire all 3 API calls sequentially (step 1 must complete first for new drafts since it returns the `draftId` needed by steps 2 and 3)

### Important constraint
For **new** meetings (no `editMeetingId`), step 1's `POST` returns the `draftId`. Steps 2 and 3 need that ID. So on final submit we must call them sequentially: step1 → get ID → step2 + step3 → submit. For **edit** mode, the ID already exists so steps 1-3 can run in parallel (but sequential is safer to avoid race conditions).

### Changes

**File 1: `useModalSteps.ts`** — Remove API calls from step handlers

- `handleStep1Submit`: Remove `basicInfoMutation.mutate()`. Just store `step1Data` in state and `setCurrentStep(2)` immediately
- `handleStep2Submit`: Remove `contentMutation.mutate()`. Store `step2FormData` in a new `useState<FormData | null>` and `setCurrentStep(3)` immediately
- Add `step2Data` to the returned state so `useSubmitterModal` can access it
- Remove `basicInfoMutation` and `contentMutation` imports — they move to `useSubmitterModal`
- Remove `onStepSaved` callback (no longer needed per-step)
- `isStepSaving` becomes always `false` (remove or keep as `false`)

**File 2: `useSubmitterModal.ts`** — Consolidate all API calls into `handleFinalSubmit`

- Import `useSaveDraftBasicInfo` and `useSaveDraftContent`
- In `handleFinalSubmit`:
  1. Build step 1 FormData from `steps.step1Data` via `buildStep1FormData`
  2. Call `saveDraftBasicInfo(formData, draftId)` → get `meetingId`
  3. If `steps.step2Data` exists, call `saveDraftContent(meetingId, step2Data)`
  4. Call `saveDraftInvitees(meetingId, inviteesPayload)` (existing logic)
  5. Call submit/resubmit action (existing logic)
  6. Sync caches and close modal
- Same pattern for `handleSaveAsDraft` (steps 1-3 without the submit action)
- Remove `onStepSaved` from `useModalSteps` options
- Update `saving` to include the new mutations' pending states

### Summary

| File | Change |
|---|---|
| `useModalSteps.ts` | Remove API calls from step handlers, add `step2Data` state, navigation-only |
| `useSubmitterModal.ts` | Move all 3 API calls into `handleFinalSubmit` and `handleSaveAsDraft` |

2 files changed. Steps navigate instantly, all APIs fire on final button click.

