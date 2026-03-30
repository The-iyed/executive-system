

## Plan: Replace CancelDialog with shared ConfirmDialog

### Problem
The "إلغاء" (Cancel) action uses a custom `CancelDialog` with form fields (reason + notes), while the "إضافة إلى قائمة الانتظار" uses the shared `ConfirmDialog` — a simpler, cleaner confirmation modal. The user wants consistency.

### Approach
Replace the `CancelDialog` usage with the shared `ConfirmDialog` component (warning variant), removing the reason/notes form fields. The cancel mutation will fire without extra form data.

### Changes

**1. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Replace the `<CancelDialog>` block with a `<ConfirmDialog>` using variant `"danger"`, title "إلغاء الاجتماع", description "هل أنت متأكد من إلغاء هذا الاجتماع؟"
- Remove `CancelDialog` import, add/reuse `ConfirmDialog` import
- Call `h.cancelMutation.mutate({})` on confirm (no form data)

**2. `src/modules/UC02/features/meeting-detail/hooks/useMeetingDetailPage.ts`**
- Remove `cancelForm` and `setCancelForm` state (no longer needed)
- Keep `isCancelModalOpen` / `setIsCancelModalOpen` as-is

### Result
- Cancel action uses the same polished shared dialog as the waiting list action
- Consistent UX across all action bar confirmations
- 2 files changed

