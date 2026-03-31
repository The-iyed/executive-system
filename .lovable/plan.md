

## Plan: Align MeetingNature enum with API values (NEW, SEQUENTIAL, PERIODIC)

### Problem
The API returns `NEW` for normal meetings, but the enum defines `NORMAL = 'NORMAL'`. So `MeetingNatureLabels['NEW']` returns `undefined`, and the raw value "NEW" is displayed instead of the Arabic label "عادي".

### Fix

**File: `src/modules/shared/types/meeting-types.ts`**
- Change `MeetingNature.NORMAL` value from `'NORMAL'` to `'NEW'`
- Labels and options auto-derive from enum values, so they'll update automatically

```ts
export enum MeetingNature {
  NORMAL = 'NEW',        // was 'NORMAL'
  SEQUENTIAL = 'SEQUENTIAL',
  PERIODIC = 'PERIODIC',
}
```

That single change fixes both:
1. **Meeting info display** — `MeetingNatureLabels['NEW']` → `'عادي'`
2. **Form select** — sends `'NEW'` to API instead of `'NORMAL'`

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/types/meeting-types.ts` | Change `NORMAL = 'NORMAL'` to `NORMAL = 'NEW'` |

1 line change, 1 file.

