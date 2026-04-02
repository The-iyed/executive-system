

## Plan: Fix empty submitter/owner display on edit form

### Root Cause
The edit API returns user objects with different field names (`id`, `name`, `ar_name`, `email`) than the directory search API (`objectGUID`, `displayNameAR`, `mail`). Current `getUserId()` and `getUserLabel()` only check directory-style fields.

### Changes

#### 1. `searchUsersByEmail.ts` — Add edit-API fields to `UserSearchResult` type
Add optional: `id`, `name`, `username`, `email`, `first_name`, `last_name`, `ar_name`

#### 2. `useManagerSearch.ts` — Expand `getUserId` with `id` first
```ts
export function getUserId(user: UserSearchResult): string {
  return user.id || user.objectGUID || user.mail || user.email
    || user.cn || user.displayName || user.givenName
    || `user-${user.sn || ''}-${user.mobile || ''}`;
}
```

#### 3. `useManagerSearch.ts` — Expand `getUserLabel`
```ts
export function getUserLabel(user: UserSearchResult): string {
  return user.displayNameAR || user.ar_name
    || user.displayName || user.name
    || user.displayNameEN
    || user.givenName || user.username
    || [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.mail || user.email || '—';
}
```

### Files changed

| File | Change |
|---|---|
| `searchUsersByEmail.ts` | Add optional `id`, `name`, `username`, `email`, `first_name`, `last_name`, `ar_name` to `UserSearchResult` |
| `useManagerSearch.ts` | `getUserId`: `id` first, then `objectGUID`, etc. `getUserLabel`: add `ar_name`, `name`, `username`, `first_name+last_name`, `email` |

