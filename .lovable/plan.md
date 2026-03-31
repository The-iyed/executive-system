

## Plan: Fix weird animation on submit by removing premature `resetModal()` calls

### Root cause

When the user clicks "تحديث الطلب", `handleFinalSubmit` completes the API calls then runs:

```ts
steps.resetModal();  // currentStep → 1, step1Data → null, step2Data → null
onClose();           // triggers dialog close animation
```

`resetModal()` fires **before** the dialog's close animation starts. This causes the modal content to jump from step 3 back to step 1 (and unmount step 2/3 content) while the modal is still visually open. The close animation then plays on this already-changed content — producing the "weird animation."

The reset is **redundant** because `useModalSteps.ts` already has a `useEffect` that resets all state when `open` becomes `false`.

### Fix

Remove `steps.resetModal()` on 3 lines in `useSubmitterModal.ts`:

| Line | Context |
|---|---|
| 162 | Scheduler-edit branch in `handleFinalSubmit` |
| 180 | Normal submit branch in `handleFinalSubmit` |
| 240 | `handleSaveAsDraft` |

Just call `onClose()` directly — the `useEffect` handles the cleanup after the dialog finishes closing.

### Files changed

| File | Change |
|---|---|
| `useSubmitterModal.ts` | Remove 3 `steps.resetModal()` lines |

