

## Plan: Prioritize `displayNameAR` in invitee search name resolution

### Problem
When selecting a user from search in the invitees table, the name field uses `displayName || displayNameEN || givenName`, skipping `displayNameAR`.

### Change

#### `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx` (line 81)
Change:
```ts
name: result.displayName || result.displayNameEN || result.givenName || "",
```
To:
```ts
name: result.displayNameAR || result.displayName || result.displayNameEN || result.givenName || "",
```

### Files changed

| File | Change |
|---|---|
| `InviteesTableForm.tsx` | Add `displayNameAR` as first priority in name resolution |

