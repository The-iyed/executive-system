

## Plan: Use only `is_presence_required` to read الحضور إجباري value

### Problem
Multiple places fall back to `is_required` when reading the mandatory attendance value. The user wants `is_presence_required` to be the sole field used — no `is_required` fallback on the read/get side.

### Changes

#### 1. `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts` (line 118)
Change:
```ts
is_presence_required: (inv as Record<string, unknown>).is_required ?? (inv as Record<string, unknown>).is_presence_required ?? false,
```
To:
```ts
is_presence_required: (inv as Record<string, unknown>).is_presence_required ?? false,
```

#### 2. `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx` (line 37)
Change:
```ts
is_presence_required: r.is_presence_required ?? (r as Record<string, unknown>).is_required ?? false,
```
To:
```ts
is_presence_required: r.is_presence_required ?? false,
```

#### 3. `src/lib/dynamic-table-form/hooks/useTableForm.ts` (lines 15-18)
Remove the `is_required` → `is_presence_required` mapping block:
```ts
// Map API field is_required → table column is_presence_required
if ('is_required' in row && !('is_presence_required' in row)) {
  normalized.is_presence_required = Boolean(row.is_required);
}
```

### Note
The **outgoing** payload mapper (`payload-mapper.ts`) still maps `is_presence_required` → `is_required` for the API — that stays unchanged since the backend expects `is_required`.

### Files changed

| File | Change |
|---|---|
| `mappers.ts` | Remove `is_required` fallback, use only `is_presence_required` |
| `InviteesTableForm.tsx` | Remove `is_required` fallback |
| `useTableForm.ts` | Remove `is_required` → `is_presence_required` mapping |

