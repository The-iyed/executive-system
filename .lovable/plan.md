

## Plan: Fix inverted مبدئي chip logic in EventDetailModal

### Problem
The مبدئي chip at line 334 uses `display.requiresProtocol` to determine active state, but `requiresProtocol = !isPreliminary`. So when `is_preliminary_booking` is `false`, `requiresProtocol` becomes `true`, making the chip appear checked — the exact opposite of the correct behavior.

### Root Cause
Line 131: `const requiresProtocol = !isPreliminary;`
Line 334: chip highlights when `display.requiresProtocol` is true → highlights when `is_preliminary_booking` is **false**.

### Fix

#### `EventDetailModal.tsx`

1. **Replace `requiresProtocol` with `isPreliminary` in the return object** (line 154):
   - Change `requiresProtocol` → `isPreliminary` in the `display` useMemo return
   - Remove the `requiresProtocol` derived variable (line 131)

2. **Update chip rendering** (lines 334–339):
   - Replace `display.requiresProtocol` with `display.isPreliminary` for both the styling condition and the checkmark icon

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Replace `requiresProtocol` with `isPreliminary` in display object and chip rendering |

