

## Plan: Add "هل تطلب الاجتماع نيابة عن غيرك؟" to Scheduler Form (matching submitter behavior)

### Changes

#### 1. `scheduler/Step1Form.tsx` — Add `OnBehalfField` + conditional `MeetingOwnerField`
- Import `OnBehalfField`
- Add `<OnBehalfField />` after the submitter field (line 51)
- Wrap `<MeetingOwnerField />` with `{visibility.meeting_owner && ...}` (like submitter does)

#### 2. `scheduler/useStep1Form.ts` — Add visibility + cleanup for `meeting_owner`
- Add `meeting_owner: watched.is_on_behalf_of === BOOL.TRUE` to the `visibility` object
- Add `watched.is_on_behalf_of` to the `useMemo` deps
- Add `meeting_owner: [{ name: "meeting_owner", resetValue: null }]` to `SCHEDULER_FIELD_RESET_MAP`

#### 3. `scheduler/schema.ts` — Make `meeting_owner` conditionally required
- Change `meeting_owner` from always-required (`superRefine` inline) to `meetingUserSchema.nullable().optional()`
- Add conditional check in the main `superRefine` block:
  ```ts
  if (data.is_on_behalf_of === BOOL.TRUE && !data.meeting_owner) {
    ctx.addIssue({ code: "custom", path: ["meeting_owner"], message: "يرجى تحديد مالك الاجتماع" });
  }
  ```

### Files changed

| File | Change |
|---|---|
| `scheduler/Step1Form.tsx` | Import & render `OnBehalfField`; conditionally show `MeetingOwnerField` |
| `scheduler/useStep1Form.ts` | Add `meeting_owner` visibility, cleanup map entry, deps |
| `scheduler/schema.ts` | Make `meeting_owner` conditionally required based on `is_on_behalf_of` |

