

## Plan: Use shared `DIRECTIVE_STATUS_LABELS` enum in Content tab directives table

### Problem
Line 189 of `ContentTab.tsx` uses an inline object to translate `directive_status` values to Arabic labels. This should use the shared `DIRECTIVE_STATUS_LABELS` from `directiveMapper.ts` (or combine both maps) for consistency.

### Changes

#### 1. `src/modules/UC02/features/meeting-detail/tabs/ContentTab.tsx`

**Import** the shared labels:
```ts
import { DIRECTIVE_STATUS_LABELS } from '@/modules/shared/types/minister-directive-enums';
```

**Replace line 189** — swap the inline map with one that merges the shared enum labels plus the content-approval-specific statuses:
```tsx
{translateCompareValue(row.directive_status, {
  ...DIRECTIVE_STATUS_LABELS,
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  CLOSED: 'مغلق',
  OPEN: 'مفتوح',
})}
```

This keeps the existing fallback values for statuses not in the shared enum (PENDING, IN_PROGRESS, etc.) while using the shared labels for TAKEN/ADOPTED via spread.

### Files changed

| File | Change |
|---|---|
| `ContentTab.tsx` | Import `DIRECTIVE_STATUS_LABELS`; spread into the inline status map |

