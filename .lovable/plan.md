

## Plan: Ensure `is_presence_required` is always used when loading invitee data

### Problem
The `normalizeRows` fix in `useTableForm.ts` maps `is_required` → `is_presence_required`, but two paths bypass it:
1. **`transformDraftToInvitees`** in `mappers.ts` — never includes `is_presence_required` or `is_required` at all
2. **`InviteesTableForm`** — stores `initialInvitees` directly in `useState`/`useEffect` without normalization, so raw API data with `is_required` never gets mapped

### Changes

#### 1. `mappers.ts` — `transformDraftToInvitees` (line 106-120)
Add `is_presence_required: inv.is_required ?? inv.is_presence_required ?? false` to the mapped invitee object (after line 117).

#### 2. `InviteesTableForm.tsx` — Normalize on init and sync (lines 35-39)
Add inline normalization so any `is_required` field is mapped to `is_presence_required`:
```ts
const normalize = (rows: TableRow[]) => rows.map(r => ({
  ...r,
  is_presence_required: r.is_presence_required ?? r.is_required ?? false,
}));

const [invitees, setInvitees] = useState<TableRow[]>(normalize(initialInvitees ?? []));

useEffect(() => {
  setInvitees(normalize(initialInvitees ?? []));
}, [initialInvitees]);
```

This ensures every entry point — draft loading, view mode, edit mode — consistently uses `is_presence_required`.

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts` | Add `is_presence_required` mapping in `transformDraftToInvitees` |
| `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx` | Normalize `initialInvitees` to map `is_required` → `is_presence_required` |

