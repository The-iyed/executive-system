

## Plan: Add confidentiality check to presentation required logic

### Current state

The `useStep2Visibility` hook in `useStep2Form.ts` already correctly:
- Hides presentation when category = `DISCUSSION_WITHOUT_PRESENTATION`
- Makes it optional for `PRIVATE_MEETING`, `BILATERAL_MEETING`, `WORKSHOP`
- Makes it optional when `is_urgent = true`

**Missing**: It does not check `meeting_confidentiality === 'CONFIDENTIAL'` (سرّي). When confidentiality is Secret, the presentation should also be optional.

### Change

**File: `src/modules/shared/features/meeting-request-form/shared/hooks/useStep2Form.ts`**

Add one condition to the `presentationRequired` logic:

```ts
const isSecret = step1Data.meeting_confidentiality === MeetingConfidentiality.CONFIDENTIAL;

const presentationRequired =
  !hidePresentation &&
  !isExemptCategory &&
  !isUrgent &&
  !isSecret;
```

Also import `MeetingConfidentiality` from the enums file alongside the existing imports.

### Files changed

| File | Change |
|---|---|
| `useStep2Form.ts` | Import `MeetingConfidentiality`, add `isSecret` check to `presentationRequired` |

1 file, ~3 lines changed.

