

## Plan: Change default values for two checkbox columns

### Change to `src/modules/shared/features/invitees-table-form/columns.ts`

Update the `defaultValue` for two columns:
- `access_permission` ("صلاحية الاطلاع"): `false` → `true`
- `is_presence_required` ("الحضور اختياري"): `false` → `true`

### Files changed

| File | Change |
|---|---|
| `columns.ts` | Set `defaultValue: true` for `access_permission` and `is_presence_required` columns |

