

## Plan: Set "الحضور اختياري" default to `false`

### Change to `src/modules/shared/features/invitees-table-form/columns.ts`

Set `defaultValue: false` for the `is_presence_required` column (الحضور اختياري).

Also fix the build error in `useContentRequestDetailPage.ts` — move `hasDirectives` declaration above its first usage.

### Files changed

| File | Change |
|---|---|
| `columns.ts` | `is_presence_required` → `defaultValue: false` |
| `useContentRequestDetailPage.ts` | Move `hasDirectives` declaration before its first reference to fix TS2448 |

