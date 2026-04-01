

## Plan: Move Scheduling Settings directly under المدعوون header

### Problem
Currently the "إعدادات الجدولة" row sits **after** the full invitees list. The user wants it repositioned to appear **directly below** the المدعوون header (between the header and the invitee list).

### Change

#### `EventDetailModal.tsx` (lines 308–382)

Reorder the JSX so the scheduling settings chips appear right after the المدعوون label+count row, before the invitee list:

```
المدعوون header (icon + label + count badge)
↓
إعدادات الجدولة row (icon + label + chips)
↓
Invitee list (avatar + name + email per row)
```

Concretely:
1. Move the scheduling settings block (lines 352–382) to right after line 318 (after the المدعوون header `div`)
2. Keep everything else unchanged

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Move scheduling settings block from after invitee list to after المدعوون header, before the invitee rows |

