

## Plan: Fix admin user default route

### Problem
When an admin logs in with `use_cases: []` and `roles: [{ code: "ADMIN" }]`, the `getDefaultRouteForUser` function falls into the `if (!useCases || useCases.length === 0)` branch and returns `/meetings` (UC-01 default). The admin has no use_cases, so they should be routed to `/notifications` instead.

### Change to `src/modules/shared/utils/useCaseConfig.ts`

In `getDefaultRouteForUser`, add an ADMIN role check **before** the empty use_cases fallback:

```typescript
// After minister check (line 230), before the empty useCases check (line 232):
if (roles?.some((r) => r.code === 'ADMIN')) {
  return '/notifications';
}
```

This ensures admin users with empty `use_cases` are routed to their admin dashboard (`/notifications`) instead of `/meetings`.

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/utils/useCaseConfig.ts` | Add ADMIN role check in `getDefaultRouteForUser` before the empty use_cases fallback, redirecting to `/notifications` |

