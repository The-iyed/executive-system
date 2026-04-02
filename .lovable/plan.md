

## Plan: Robust user selection fields with proper name priority and clean payload

### Problem
The API can return users where `objectGUID`, `mail`, `cn` are all `null`. This causes:
- Option `value` becomes `''` — multiple users collapse into one
- Selected label doesn't display, X button doesn't appear
- The payload sends all null fields unnecessarily

### Changes

#### 1. `useManagerSearch.ts` — robust `toOption` with name priority

Add two helper functions and update `toOption`:

```ts
function getUserId(user: UserSearchResult): string {
  return user.objectGUID || user.mail || user.cn 
    || user.displayName || user.givenName 
    || `user-${user.sn || ''}-${user.mobile || ''}`;
}

function getUserLabel(user: UserSearchResult): string {
  return user.displayNameAR || user.displayName || user.displayNameEN 
    || user.givenName || user.mail || '—';
}

function toOption(user: UserSearchResult): ManagerOption {
  return {
    value: getUserId(user),
    label: getUserLabel(user),
    subtitle: user.mail || user.title || '—',
    user,
  };
}
```

Export `getUserId` and `getUserLabel` for reuse.

#### 2. `ManagerSelect.tsx` — use same ID/label resolution

- Change `selectedId` to use the same fallback chain
- Show label from value directly when no option match found
- Show X button when `value` exists (not just when `selectedId` is truthy)

#### 3. `buildStep1FormData.ts` — clean null fields from user objects before sending

Strip null/undefined/empty fields from nested objects before `JSON.stringify` to send clean payloads.

### Files changed

| File | Change |
|---|---|
| `useManagerSearch.ts` | Add `getUserId`/`getUserLabel` helpers with full fallback chain, export them |
| `ManagerSelect.tsx` | Use same fallback chain for selectedId, show label/X when value exists |
| `buildStep1FormData.ts` | Strip null/undefined fields from nested objects before JSON.stringify |

