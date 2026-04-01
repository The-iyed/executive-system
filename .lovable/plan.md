

## Plan: Make agenda optional for scheduling officers in submitter form

### Problem
When a scheduling officer uses `SubmitterStep1Form` (with `isSchedulerEdit=true`), the agenda section still shows as required (`*`) and the schema validates that at least one agenda item exists. It should be optional for scheduling officers.

### Changes

#### 1. `submitter/Step1Form.tsx` — Pass `agendaRequired={!isSchedulerEdit}`
Line 100: change `<AgendaSection form={form} />` to:
```tsx
<AgendaSection form={form} agendaRequired={!isSchedulerEdit} />
```

#### 2. `submitter/schema.ts` — Add `is_scheduler_edit` flag and skip mandatory agenda check
- Add `is_scheduler_edit: z.boolean().optional()` to the schema object
- Wrap the "must have at least one agenda item" check (line 95-96) with `!data.is_scheduler_edit`:
```ts
if (!data.is_scheduler_edit && !isPrivate && (!data.agenda_items || data.agenda_items.length === 0)) {
  ctx.addIssue({ code: "custom", path: ["agenda_items"], message: "يجب إضافة عنصر أجندة واحد على الأقل" });
}
```
- Keep item-level and duration validation as-is (only runs when items exist)

#### 3. `submitter/hooks/useStep1Form.ts` — Set `is_scheduler_edit` default
Add to defaults:
```ts
is_scheduler_edit: options?.isSchedulerEdit ?? false,
```

### Files changed

| File | Change |
|---|---|
| `submitter/Step1Form.tsx` | Pass `agendaRequired={!isSchedulerEdit}` |
| `submitter/schema.ts` | Add `is_scheduler_edit` field; skip mandatory agenda check when true |
| `submitter/hooks/useStep1Form.ts` | Set `is_scheduler_edit` from options |

