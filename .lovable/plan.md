

## Plan: Support users without objectGUID by falling back to mail

### Problem
When a user returned by the search API has no `objectGUID`, the `toOption` function sets `value` to `undefined`/empty string. Clicking such a user in the dropdown does nothing meaningful because:
1. `opt.value` is empty → `key` is empty, `selectedId` matching breaks
2. The `selectedId` check (`value?.objectGUID`) returns empty → clear button hidden, display shows placeholder

### Root cause
`toOption` in `useManagerSearch.ts` uses `user.objectGUID` as the sole identifier. `ManagerSelect.tsx` also relies on `value?.objectGUID` for selection state.

### Fix

**File 1: `src/modules/shared/features/meeting-request-form/shared/hooks/useManagerSearch.ts`**
- In `toOption`, change `value` to: `user.objectGUID || user.mail || user.cn || ''`
- This ensures users without a GUID still get a usable unique identifier

**File 2: `src/modules/shared/features/meeting-request-form/shared/fields/ManagerSelect.tsx`**
- Change `selectedId` derivation (line 39) from `value?.objectGUID ?? ""` to `value?.objectGUID || value?.mail || ""`
- Change the clear button condition (line 77) from `selectedId` to same pattern (already covered by the variable)
- Filter out options with empty `value` to prevent edge cases with truly unidentifiable users

**File 3: `src/modules/shared/features/meeting-request-form/api/searchUsersByEmail.ts`**
- Make `objectGUID` optional in the `UserSearchResult` interface (change to `objectGUID?: string`) since the API can return users without it

Three files, minimal changes. All consumers (submitter form, edit form, /directives create) benefit automatically.

