

## Plan: Build Sent Notifications Management Feature

### Overview
Build a production-ready admin notifications list page with status filtering, pagination, a detail modal for each notification, and a retry action for failed notifications. Uses the existing shared patterns (axios instance, `useMeetingList` hook pattern, status badges, pagination).

### Architecture

```text
src/modules/admin/
├── features/
│   └── Notifications/
│       ├── index.tsx              ← Main page component
│       ├── api.ts                 ← API layer (list, detail, retry)
│       ├── types.ts               ← Notification types
│       ├── hooks/
│       │   └── useNotifications.ts  ← List hook + retry mutation
│       └── components/
│           ├── NotificationCard.tsx       ← Card for each notification
│           ├── NotificationDetailModal.tsx ← Detail modal
│           └── NotificationFilters.tsx    ← Status filter tabs/chips
├── routes/
│   ├── paths.ts                   ← Add detail path
│   └── routes.tsx                 ← Existing (no change needed)
```

### File-by-file changes

**1. `src/modules/admin/features/Notifications/types.ts`**
- Define `NotificationStatus` enum: `PENDING`, `SENT`, `FAILED`
- Define `SentNotification` interface (id, title, body, status, recipient info, created_at, sent_at, error_message, etc.)
- Define `NotificationDetail` interface (extends with full payload details)
- Define `PaginatedNotificationsResponse` using the shared `PaginatedResponse<SentNotification>` shape

**2. `src/modules/admin/features/Notifications/api.ts`**
- Import `axiosInstance` from `@/modules/auth/utils/axios`
- `fetchNotifications(params)` → GET `/api/v1/admin/sent-notifications` with skip, limit, status
- `fetchNotificationDetail(id)` → GET `/api/v1/admin/sent-notifications/{id}`
- `retryNotification(id)` → POST `/api/v1/admin/sent-notifications/{id}/retry`

**3. `src/modules/admin/features/Notifications/hooks/useNotifications.ts`**
- Reuse `useMeetingList` hook pattern for list state (search, pagination, filters)
- `useNotificationDetail(id)` — React Query hook for detail fetch
- `useRetryNotification()` — `useMutation` for retry with toast feedback and query invalidation

**4. `src/modules/admin/features/Notifications/components/NotificationCard.tsx`**
- RTL card matching MeetingCard style (rounded-2xl, border, hover shadow)
- Show: title, recipient, timestamp, status badge (using shared `StatusBadge` with PENDING=yellow, SENT=green, FAILED=red)
- Click opens detail modal

**5. `src/modules/admin/features/Notifications/components/NotificationFilters.tsx`**
- Horizontal chip/tab row: الكل | قيد الإرسال (PENDING) | مرسل (SENT) | فشل (FAILED)
- Active chip highlighted with primary color

**6. `src/modules/admin/features/Notifications/components/NotificationDetailModal.tsx`**
- Dialog/Sheet showing full notification details
- Sections: recipient info, message content, timestamps, status, error message (if FAILED)
- Retry button (primary, with loading state) visible only for FAILED status
- Uses shared Dialog/Sheet primitives

**7. `src/modules/admin/features/Notifications/index.tsx`**
- Page wrapper with header "الإشعارات المرسلة" and Bell icon
- Status filter chips at top
- Cards grid with pagination (reuse shared `Pagination` component)
- Loading skeletons, empty state, error state
- Detail modal triggered on card click

### Technical details

- API calls use the existing `axiosInstance` (auth token, base URL, interceptors already configured)
- React Query keys: `['admin', 'sent-notifications', ...]` with status/page/search as dependencies
- Retry mutation invalidates the notification list and detail queries on success
- Toast notifications (sonner) for retry success/failure
- All text in Arabic, RTL layout
- Status badge colors mapped to shared `StatusBadge` config (add PENDING/SENT/FAILED if not present — they already exist in status-badge.tsx)

### Files changed

| File | Change |
|---|---|
| `features/Notifications/types.ts` | New — notification types |
| `features/Notifications/api.ts` | New — API functions |
| `features/Notifications/hooks/useNotifications.ts` | New — list/detail/retry hooks |
| `features/Notifications/components/NotificationCard.tsx` | New — card component |
| `features/Notifications/components/NotificationFilters.tsx` | New — status filter chips |
| `features/Notifications/components/NotificationDetailModal.tsx` | New — detail modal with retry |
| `features/Notifications/index.tsx` | Rewrite — full page with list, filters, pagination, modal |

