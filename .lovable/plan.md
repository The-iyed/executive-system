

## Plan: Preserve invitee `id` in Step 3 edit payload

### Problem
When editing a meeting, each invitee returned from the API has a server-side `id`. This `id` is currently dropped in two places:
1. **Mapper** (`transformDraftToInvitees`) — doesn't copy `inv.id` to the `TableRow`
2. **Payload builder** (`mapRowToPayload`) — doesn't include `row.id` in the outgoing payload

Without the `id`, the backend cannot match existing invitees for updates and may create duplicates or fail.

### Changes

**File 1: `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts`**
- In `transformDraftToInvitees`, preserve the invitee's `id` field from the API response onto the `TableRow`:
  ```
  id: inv.id || undefined,
  ```

**File 2: `src/lib/dynamic-table-form/payload-mapper.ts`**
- In `mapRowToPayload`, include `row.id` in the payload when it exists:
  ```
  if (row.id) {
    payload.id = row.id;
  }
  ```

### Result
- Existing invitees sent back with their server `id` for proper update matching
- New invitees (no `id`) unaffected — field simply absent from payload
- Works for both submitter and scheduler edit flows

