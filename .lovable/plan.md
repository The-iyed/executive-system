

## Plan: Remove presentation validation for scheduling officers

### Problem
When a scheduling officer creates or edits a meeting, the العرض التقديمي (PDF) field still requires upload. It should be optional for scheduling officers, while preserving all existing logic around status checks and executive summary for upload-more-than-one behavior.

### Fix

#### 1. `Step2Form.tsx` — Add `callerRole` prop, skip validation for schedulers

- Add `callerRole?: string` to `Step2FormProps`
- In `validate()`, skip the presentation requirement when `callerRole === MeetingOwnerType.SCHEDULING`:
  ```ts
  if (presentationRequired && !hasPresentationFile && callerRole !== MeetingOwnerType.SCHEDULING) {
  ```
- Update `required` prop on the FormField: `required={presentationRequired && callerRole !== MeetingOwnerType.SCHEDULING}`

#### 2. `SubmitterModal.tsx` — Pass `callerRole` to Step2Form

- Pass `callerRole={callerRole}` prop to `<Step2Form>`

### Files changed

| File | Change |
|---|---|
| `Step2Form.tsx` | Add `callerRole` prop; skip presentation validation for scheduling officers |
| `SubmitterModal.tsx` | Pass `callerRole` to `Step2Form` |

