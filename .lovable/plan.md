

## Plan: Make meeting date always required + directive fields optional for scheduler

### Problem
1. **موعد الاجتماع المقترح** (meeting date) is currently optional in the scheduler schema and conditionally required only for non-scheduler in the submitter schema. It should be **always required** in both forms.
2. **Directive fields** (طريقة التوجيه, نص التوجيه, محضر الاجتماع) are validated as required when `is_based_on_directive === TRUE`, even when a scheduler officer is editing. They should be **optional for scheduler edits**.

### Changes

#### 1. `scheduler/schema.ts` — make dates required
In the `superRefine` block (after line 76), add validation that `meeting_start_date` and `meeting_end_date` are required:

```ts
if (!data.meeting_start_date) {
  ctx.addIssue({ code: "custom", path: ["meeting_start_date"], message: "موعد الاجتماع مطلوب" });
}
if (!data.meeting_end_date) {
  ctx.addIssue({ code: "custom", path: ["meeting_end_date"], message: "موعد نهاية الاجتماع مطلوب" });
}
```

Also update `SchedulerStep1Form.tsx` line 62 to set `required={true}` (or remove `required={false}`).

#### 2. `submitter/schema.ts` — make dates always required
Remove the `if (!data.is_scheduler_edit)` guard around the date validation (lines 109–115), so dates are required regardless of scheduler edit mode.

#### 3. `submitter/schema.ts` — skip directive validation for scheduler edits
Wrap the directive validation block (lines 141–152) with `if (!data.is_scheduler_edit)`:

```ts
if (!data.is_scheduler_edit && data.is_based_on_directive === BOOL.TRUE) {
  // directive_method, file, text validations...
}
```

This makes طريقة التوجيه, محضر الاجتماع, and نص التوجيه optional when a scheduler officer edits.

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | Add required validation for `meeting_start_date` and `meeting_end_date` |
| `scheduler/Step1Form.tsx` | Change `MeetingDateField` required prop to true |
| `submitter/schema.ts` | Remove `is_scheduler_edit` guard from date validation; add `is_scheduler_edit` guard to directive validation |

