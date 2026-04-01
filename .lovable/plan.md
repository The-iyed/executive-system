

## Plan: Send `is_content_updated: true` in invitees API when scheduler officer updates content

### Problem
When a scheduling officer edits a meeting and uploads/changes the presentation file in Step 2, the Step 3 invitees API needs to receive `is_content_updated: true` so the backend knows content was modified. Currently no such flag is sent.

### How it works
- `step2Data` in `useModalSteps` is `FormData | null` — it's non-null only when Step 2 had actual content changes
- So `!!step2Data` already tells us if content was updated
- We only need to send this flag when `callerRole === MeetingOwnerType.SCHEDULING`

### Changes

#### 1. `saveDraftInvitees.ts` — Accept optional `is_content_updated` parameter
Add an optional `is_content_updated?: boolean` param and include it in the request body when truthy:
```ts
export async function saveDraftInvitees(
  draftId: string,
  invitees: Record<string, unknown>[],
  is_content_updated?: boolean,
): Promise<{ status: string }> {
  // body: { invitees, ...(is_content_updated ? { is_content_updated } : {}) }
}
```

#### 2. `useDraftMutations.ts` — Pass `is_content_updated` through the mutation params
Update `SaveInviteesParams` interface and the mutation function to forward the flag.

#### 3. `useSubmitterModal.ts` — Set `is_content_updated` when scheduler + content changed
In both `handleFinalSubmit` and `handleSaveAsDraft`, pass `is_content_updated: isSchedulerEdit && !!step2Data` to the invitees mutation.

### Files changed

| File | Change |
|---|---|
| `saveDraftInvitees.ts` | Add optional `is_content_updated` param, include in request body |
| `useDraftMutations.ts` | Add `is_content_updated` to `SaveInviteesParams` and forward it |
| `useSubmitterModal.ts` | Pass `is_content_updated: isSchedulerEdit && !!step2Data` in both submit flows |

