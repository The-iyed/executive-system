

## Plan: Fix directive status translation in Content tab

### Problem
`translateCompareValue` converts the value to **lowercase** before looking it up (`map[String(value).toLowerCase()]`), but the map keys are **UPPERCASE** (`PENDING`, `TAKEN`, `IN_PROGRESS`, etc.). The lookup always misses and returns the raw English enum string.

### Changes

#### `src/modules/UC02/features/meeting-detail/utils/meetingDetailHelpers.ts` — Fix key lookup

Change line 23 from:
```ts
return map[String(value).toLowerCase()] ?? value;
```
to:
```ts
const v = String(value);
return map[v] ?? map[v.toUpperCase()] ?? map[v.toLowerCase()] ?? value;
```

This tries exact match first (UPPERCASE keys), then uppercase, then lowercase as fallback. Fixes the translation for all directive statuses without breaking existing compare-value usage.

### Files changed

| File | Change |
|---|---|
| `meetingDetailHelpers.ts` | Fix `translateCompareValue` to match keys case-insensitively |

