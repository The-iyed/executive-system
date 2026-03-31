

## Plan: Update MeetingLocation enum values to include "مبنى"

### Change

**File: `src/modules/shared/types/meeting-types.ts`**

Update two location values:
- `ALIYA: 'العليا'` → `ALIYA: 'مبنى العليا'`
- `GHADEER: 'الغدير'` → `GHADEER: 'مبنى الغدير'`

Since labels are derived from the values (`label: MeetingLocation.ALIYA`), both the stored value and display label update automatically. The preset array and helper functions all reference `MeetingLocation.ALIYA` / `MeetingLocation.GHADEER`, so no other changes needed.

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/types/meeting-types.ts` | Update 2 string values on lines 365-366 |

