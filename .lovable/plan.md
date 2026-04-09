

## Plan: Fix navbar for admin — show only admin nav items

### Problem
`getNavigationItemsForUser` checks `useCases` first. When admin has `use_cases: []`, it hits line 261–262 and falls back to UC-01 nav items ("الطلبات الحالية"), ignoring the admin role entirely.

### Change to `src/modules/shared/utils/useCaseConfig.ts`

In `getNavigationItemsForUser` (line 257), add an ADMIN role check **before** the empty use_cases fallback:

```typescript
// Add after line 259, before the empty useCases check:
if (userRoles?.some((r) => r.code === 'ADMIN')) {
  return USE_CASE_CONFIGS['ADMIN'].navigationItems;
}
```

This returns only the admin navigation items (الإشعارات) for admin users, instead of falling back to UC-01.

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/utils/useCaseConfig.ts` | Add ADMIN role check at top of `getNavigationItemsForUser` to return admin-only nav items |

