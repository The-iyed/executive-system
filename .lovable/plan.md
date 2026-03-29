

## Plan: Require directives + executive summary before sending to scheduler

### Problem
Currently the "إرسال إلى مسؤول الجدولة" button only checks for the executive summary file. It should also require at least 1 directive (from any source: existing, AI, suggested, or manually added).

### Changes

**File: `src/modules/UC05/features/content-request-detail/hooks/useContentRequestDetailPage.ts`**

Add a computed boolean `hasDirectives` that checks if there's at least one directive from any source (existing non-deleted + AI with actions + suggested non-deleted + manual). Export it from the hook.

```ts
const hasDirectives = useMemo(() => {
  const existingCount = (contentRequest?.related_directives ?? [])
    .filter(d => !deletedExistingDirectiveIds.has(String(d.id))).length;
  const aiCount = aiDirectivesSuggestions.filter(d => aiDirectiveActions[d.id]).length;
  const suggestedCount = suggestedActionsItems.filter(s => !deletedSuggestedActionIds.has(String(s.id))).length;
  const manualCount = manualAddedActions.length;
  return (existingCount + aiCount + suggestedCount + manualCount) > 0;
}, [contentRequest, deletedExistingDirectiveIds, aiDirectivesSuggestions, aiDirectiveActions, suggestedActionsItems, deletedSuggestedActionIds, manualAddedActions]);
```

Also add an early return in `handleSendToScheduling` to guard against no directives.

**File: `src/modules/UC05/features/content-request-detail/ContentRequestDetailPage.tsx`**

Update the send button's `disabled` and `disabledReason` (lines 108-109):

```ts
disabled: h.sendToSchedulingMutation.isPending || !h.executiveSummaryFile || !h.hasDirectives,
disabledReason: !h.hasDirectives
  ? 'يرجى إضافة توجيه واحد على الأقل أولاً'
  : !h.executiveSummaryFile
    ? 'يرجى إرفاق الملخص التنفيذي أولاً'
    : undefined,
```

Two files, minimal changes.

