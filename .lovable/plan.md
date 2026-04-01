

## Plan: Fix `is_presence_required` not reading API value in view mode

### Problem
The API returns `is_required` on invitee objects, but after the recent cleanup, `normalizeInvitees` in `InviteesTableForm.tsx` only checks `r.is_presence_required ?? false` — it never reads `is_required`. So the checkbox is always `false` in view/edit mode.

### Root Cause
The previous change removed all `is_required` fallbacks, but the API data still uses `is_required` as the field name. The normalization layer is the correct place to translate the API field to the UI field.

### Fix

#### `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx` (line 37)
Change:
```ts
is_presence_required: r.is_presence_required ?? false,
```
To:
```ts
is_presence_required: r.is_presence_required ?? (r as any).is_required ?? false,
```

This is the single entry point where API data is normalized for the UI. The `is_required` fallback is needed here because the API response uses that field name. All other internal code continues to use only `is_presence_required`.

### Files changed

| File | Change |
|---|---|
| `InviteesTableForm.tsx` | Restore `is_required` fallback only in `normalizeInvitees` to handle API data |

