

## Plan: Gate admin routes by ADMIN role instead of use_cases

### Problem
Admin routes (e.g. `/notifications`) are currently accessible to all authenticated users because they have no `useCase` filter. The user wants them restricted to users with `roles: [{ code: "ADMIN" }]`.

### Approach
Add a `requiresRoleCodes` property to the route config type and update the filter logic. Admin routes will specify `requiresRoleCodes: ['ADMIN']`, and `filterRoutesByUseCase` will exclude routes when the user lacks the required role.

### Changes

**1. `src/modules/shared/utils/routeFilter.ts`**
- Add `requiresRoleCodes?: string[]` to the `RouteConfig` type
- After the existing `excludeRoleCodes` filter, add a check: if `route.requiresRoleCodes` is set, the user must have at least one matching role code — otherwise the route is excluded

**2. `src/modules/admin/routes/routes.tsx`**
- Add `requiresRoleCodes: ['ADMIN']` to each admin route config (currently the notifications route)
- Add `requiresRoleCodes` to the local `RouteConfig` type

### Files changed

| File | Change |
|---|---|
| `src/modules/shared/utils/routeFilter.ts` | Add `requiresRoleCodes` to type + filtering logic |
| `src/modules/admin/routes/routes.tsx` | Add `requiresRoleCodes: ['ADMIN']` to notifications route |

