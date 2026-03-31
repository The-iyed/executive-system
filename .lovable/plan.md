

## Plan: Add "Submit as Under Review" button for DRAFT meetings in 3 places

### What
Add a button to submit a DRAFT meeting (changing its status to "under review") using the existing API: `POST /api/meeting-requests/drafts/{id}/submit`. This button appears in 3 places for scheduling officers when the meeting is in DRAFT status.

### API
Already exists: `submitDraft(draftId)` in `src/modules/shared/features/meeting-request-form/api/submitDraft.ts` and `src/modules/UC01/data/draftApi.ts`.

### Changes

#### 1. WorkBasketFeature.tsx — Add "إرسال للمراجعة" card action for DRAFT meetings

- Import `submitDraft` from the shared API and `useMutation` + `useQueryClient`
- Add a new card action with `id: 'submit-draft'`, label "إرسال للمراجعة", visible only when `item.status === MeetingStatus.DRAFT`
- On click, call `submitDraft(item.id)` via mutation, on success invalidate `['work-basket', 'uc02']`
- Add a `ConfirmDialog` for confirming submission before calling the API

#### 2. MeetingActionsBar.tsx — Add "إرسال للمراجعة" to draft actions

- Add a new prop `onSubmitDraft` and `isSubmitDraftPending` to `MeetingActionsBarProps`
- Add a new action item in `draftActions` array with Send icon and label "إرسال للمراجعة"

#### 3. MeetingDetailPage.tsx — Wire up the submit draft action

- Add `submitDraft` mutation in `useMeetingDetailPage` (or inline in the page)
- Pass `onSubmitDraft` handler to `MeetingActionsBar` — calls `submitDraft(meeting.id)`, on success invalidate and navigate or refetch
- Add confirmation dialog before submitting

#### 4. SubmitterModal / ModalActionBar — Add "إرسال للمراجعة" button in edit form for DRAFT

- Add optional `extraFooterActions` prop to `MeetingModalShell` and pass through to `ModalActionBar`
- In `ModalActionBar`, render `extraFooterActions` next to the submit button on the last step
- In `SubmitterModal`, when `callerRole === SCHEDULING` and `meetingStatus === DRAFT`, pass a "إرسال للمراجعة" button that first saves the form (handleFinalSubmit flow), then calls `submitDraft(draftId)` before closing

### Files changed

| File | Change |
|---|---|
| `WorkBasketFeature.tsx` | Add submit-draft card action + confirm dialog + mutation |
| `MeetingActionsBar.tsx` | Add `onSubmitDraft` prop + action in `draftActions` |
| `MeetingDetailPage.tsx` | Wire submit draft mutation + pass to actions bar + confirm dialog |
| `MeetingModalShell.tsx` | Add `extraFooterActions` prop |
| `ModalActionBar.tsx` | Render `extraFooterActions` on last step |
| `SubmitterModal.tsx` | Pass "إرسال للمراجعة" button when scheduling officer + DRAFT |

