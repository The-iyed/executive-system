

## Plan: Pass `callerRole` to Step2Form in SchedulerModal

### Problem
The `SchedulerModal` (create flow for scheduling officers) renders `Step2Form` without passing `callerRole`. The validation skip logic (`callerRole !== "SCHEDULING"`) already exists in `Step2Form`, but it never receives the role, so presentation validation still applies.

### Fix

**File: `SchedulerModal.tsx` (line 153)**

Add `callerRole="SCHEDULING"` to the `<Step2Form>` component. Since the `SchedulerModal` is exclusively used by scheduling officers, hardcode the value:

```tsx
<Step2Form
  key="step2"
  callerRole="SCHEDULING"
  step1Data={{...}}
  onSubmit={handleStep2Submit}
/>
```

### Files changed

| File | Change |
|---|---|
| `SchedulerModal.tsx` | Add `callerRole="SCHEDULING"` to `Step2Form` |

