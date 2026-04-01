

## Plan: Add `is_presentation_required: false` default to invitees payload

### Problem
When saving invitees, the payload doesn't include `is_presentation_required`. It should default to `false` for every invitee row.

### Changes

#### 1. `src/lib/dynamic-table-form/payload-mapper.ts` — Add default field
In `mapRowToPayload`, after building the payload from columns, add:
```ts
if (payload.is_presentation_required === undefined) {
  payload.is_presentation_required = false;
}
```

This ensures every invitee row sent to the API includes `is_presentation_required: false` by default, without needing a visible column.

### Files changed

| File | Change |
|---|---|
| `src/lib/dynamic-table-form/payload-mapper.ts` | Add `is_presentation_required: false` default to `mapRowToPayload` |

