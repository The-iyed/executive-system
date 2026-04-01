

## Plan: Simplify `isPreliminary` to use only `is_preliminary_booking`

### Problem
Line 128–132 in `EventDetailModal.tsx` has a complex fallback checking `requires_protocol` when `is_preliminary_booking` is null. Per requirement, it should only use `is_preliminary_booking` with `false` as default.

### Change

#### `EventDetailModal.tsx` (lines 128–132)
Replace:
```ts
const isPreliminary = fromApi
  ? ((meeting as any).is_preliminary_booking != null
      ? Boolean((meeting as any).is_preliminary_booking)
      : !(meeting as any).requires_protocol)
  : false;
```
With:
```ts
const isPreliminary = fromApi
  ? Boolean((meeting as any).is_preliminary_booking ?? false)
  : false;
```

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Simplify to `is_preliminary_booking ?? false`, remove `requires_protocol` fallback |

