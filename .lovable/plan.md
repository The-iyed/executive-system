

## Plan: Map `is_presence_required` ↔ `is_required` across create, edit, and view modes

### Problem
The table form column uses key `is_presence_required`, but the API sends/receives `is_required`. Currently:
- **Create/Submit**: `is_presence_required` is never mapped to `is_required` in the payload — the API never receives the mandatory attendance flag
- **Edit/View**: When loading invitees from the API, `is_required` is never mapped to `is_presence_required` — the checkbox always shows unchecked

### Changes

#### 1. `payload-mapper.ts` — Map `is_presence_required` → `is_required` on submit
After building the payload, add:
```ts
if ('is_presence_required' in payload) {
  payload.is_required = Boolean(payload.is_presence_required);
}
```

#### 2. `CalendarView.tsx` — Include `is_presence_required` → `is_required` in invitees mapper (line ~148-159)
Add to the invitee mapping object:
```ts
is_required: Boolean(m.is_presence_required),
```

#### 3. `MinisterCalendarView.tsx` — Same fix in its invitees mapper (line ~799-804)
Add `is_required: Boolean(m.is_presence_required)` to the mapping.

#### 4. `normalizeRows` / loading from API — Map `is_required` → `is_presence_required`
When invitees from the API are passed as `initialInvitees`, they contain `is_required` but not `is_presence_required`. In `useTableForm.ts` `normalizeRows`, add:
```ts
if ('is_required' in row && !('is_presence_required' in row)) {
  normalized.is_presence_required = Boolean(row.is_required);
}
```
This ensures edit and view modes display the correct checkbox state.

### Files changed

| File | Change |
|---|---|
| `src/lib/dynamic-table-form/payload-mapper.ts` | Map `is_presence_required` → `is_required` in outgoing payload |
| `src/lib/dynamic-table-form/hooks/useTableForm.ts` | Map `is_required` → `is_presence_required` in `normalizeRows` |
| `src/modules/UC02/features/calendar/CalendarView.tsx` | Add `is_required` to invitees submit mapper |
| `src/modules/UC02/components/MinisterCalendarView.tsx` | Add `is_required` to invitees submit mapper |

