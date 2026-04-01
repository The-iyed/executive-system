

## Plan: Always send `is_content_updated` when caller is scheduler

### Problem
The `is_content_updated` field should **always** be sent in the Step 3 invitees API call when the caller is a scheduling officer — set to `true` if content was changed (`step2Data` is non-null), `false` otherwise. Currently the field is not sent at all.

### Changes

#### 1. `saveDraftInvitees.ts` — Accept optional `is_content_updated`
Add param and include in request body when defined.

#### 2. `useDraftMutations.ts` — Add `is_content_updated` to `SaveInviteesParams`
Forward the flag from the mutation params to the API function.

#### 3. `useSubmitterModal.ts` — Always pass the field when scheduler
In both `handleFinalSubmit` and `handleSaveAsDraft`:
```ts
await inviteesMutation.mutateAsync({
  draftId: meetingId,
  invitees: inviteesPayload,
  ...(isSchedulerEdit && { is_content_updated: !!step2Data }),
});
```
This sends `is_content_updated: true` or `false` only for scheduler officers.

### Files changed

| File | Change |
|---|---|
| `saveDraftInvitees.ts` | Add optional `is_content_updated` param, include in body |
| `useDraftMutations.ts` | Add `is_content_updated?` to `SaveInviteesParams`, forward to API |
| `useSubmitterModal.ts` | Pass `is_content_updated` in both submit flows when `isSchedulerEdit` |

