

## Plan: Add confirmation dialog before sending to scheduler

### Change

Add a confirmation step using the shared `ConfirmDialog` component before executing the send-to-scheduling mutation. When clicking "إرسال إلى مسؤول الجدولة", a confirmation dialog appears first. Only on confirm does the actual API call fire.

### Changes to `useContentRequestDetailPage.ts`

1. Add state: `const [showSendConfirm, setShowSendConfirm] = useState(false)`
2. Rename current `handleSendToScheduling` logic into `confirmSendToScheduling`
3. New `handleSendToScheduling` just validates directives then opens the dialog: `setShowSendConfirm(true)`
4. Export `showSendConfirm`, `setShowSendConfirm`, `confirmSendToScheduling`

### Changes to `ContentRequestDetailPage.tsx`

1. Import `ConfirmDialog` from `@/modules/shared/components/confirm-dialog/ConfirmDialog`
2. Add `<ConfirmDialog>` with:
   - `open={h.showSendConfirm}`
   - `onOpenChange={h.setShowSendConfirm}`
   - `title="إرسال إلى مسؤول الجدولة"`
   - `description="هل أنت متأكد من إرسال هذا الطلب إلى مسؤول الجدولة؟"`
   - `confirmLabel="إرسال"`
   - `cancelLabel="إلغاء"`
   - `onConfirm={h.confirmSendToScheduling}`
   - `isLoading={h.sendToSchedulingMutation.isPending}`
   - `loadingLabel="جاري الإرسال..."`
   - `variant="primary"`

### Files changed

| File | Change |
|---|---|
| `hooks/useContentRequestDetailPage.ts` | Add confirm dialog state, split handler into open-dialog + confirm |
| `ContentRequestDetailPage.tsx` | Add `ConfirmDialog` render with primary variant |

