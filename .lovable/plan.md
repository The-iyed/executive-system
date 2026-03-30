

## Analysis: Invitees Optimistic Update Issue

### What happens now (the flow)

1. User edits invitees in Step 3 → hits "تحديث الطلب"
2. `saveInvitees()` calls `validateAndGetPayload()` which returns **mapped payload** objects (via `mapRowToPayload` — containing `item_number`, raw field keys, etc.)
3. `buildStep3Patch(inviteesPayload)` wraps this as `{ invitees: [...payloadObjects] }`
4. `optimisticMergeMeeting()` writes this into the `['meeting', id]` cache
5. `syncMeetingDetails()` then **refetches** `['meeting', id]` from the API
6. After refetch completes, the code **re-applies** the optimistic patch again

### The problems

**1. Data shape mismatch (intermittent display issues)**
- `validateAndGetPayload()` returns payload-formatted objects (e.g., `{ item_number: 0, email: "...", access_permission: false }`)
- The API response returns invitees in a different shape (e.g., with `id`, `name`, `position`, etc. — full server-enriched objects)
- The ScheduleTab/InviteesTab reads `meeting.invitees` and passes it to `InviteesTableForm` which expects `TableRow[]`
- When the optimistic patch replaces the server data, the table may show incomplete/misformatted rows

**2. Race condition with refetch**
- After saving, `syncMeetingDetails` refetches from the API. If the backend hasn't finished processing yet, the refetch returns stale data (old invitees)
- The code tries to fix this by re-applying the optimistic patch after refetch — but this uses the wrong data shape (see problem 1)
- Sometimes the backend is fast enough and returns correct data, sometimes not → **intermittent behavior**

**3. Re-apply after refetch overwrites correct server data**
- If the refetch DOES return updated data, the re-application of the optimistic patch **overwrites** the properly-formatted server response with the raw payload format

### Proposed fix

**File: `src/modules/shared/features/meeting-request-form/shared/utils/optimisticCacheUpdate.ts`**
- Update `buildStep3Patch` to accept both the payload (for API) and the original `TableRow[]` (for cache), or transform the payload back to `TableRow` format

**File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useSubmitterModal.ts`**
- Capture the original `TableRow[]` from `inviteesRef.current` (the raw form state) before mapping to payload
- Use the original `TableRow[]` for the optimistic patch instead of the mapped payload
- Remove the re-application of the optimistic patch after refetch — instead, add a short delay before refetching, or trust the refetch to return correct data

### Specific changes

1. **`useSubmitterModal.ts` — `saveInvitees` function**: Get raw invitees from the form ref (`inviteesRef.current` rows) separately from the payload, and pass the raw rows to `buildStep3Patch`

2. **`useSubmitterModal.ts` — `handleFinalSubmit`**: Remove the post-refetch re-application of optimistic patch (lines 128-131, 149-152, 174-177). The refetch should be the source of truth. If stale data is a concern, add a 500ms delay before refetching.

3. **Get raw rows from the table ref**: Need to check if the `DynamicTableFormHandle` exposes the raw `TableRow[]` — if not, add a `getRows()` method alongside `validateAndGetPayload()`

