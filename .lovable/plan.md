

## Why Navigation Feels Slow on First Click

The slowness is caused by **lazy loading** (`lazy(() => import(...))`) on every route. When you click a nav item for the first time, React must:

1. Download the JS chunk for that page
2. Parse and execute it
3. Then render the component

During this time, the user sees the `Suspense` fallback (a full-screen loader or content area spinner), which feels like a long redirect.

### Additional contributing factor

Inside `renderRoutes()`, the functions `filterRoutesByUseCase()` and `getDefaultRouteForUser()` run on **every render** (no memoization), recalculating route filtering unnecessarily.

## Plan

### 1. Prefetch lazy route chunks on idle

Add a utility that calls `import()` for each UC-02 route chunk after the app mounts and the browser is idle (using `requestIdleCallback`). This way, by the time the user clicks a nav item, the chunk is already downloaded.

**File: `src/modules/UC02/routes/prefetchRoutes.ts`** (new)
- Export a `prefetchUC02Routes()` function that eagerly imports all lazy page chunks
- Use `requestIdleCallback` (with `setTimeout` fallback) so it doesn't block initial render

**File: `src/modules/UC02/routes/UC02LayoutRouter.tsx`**
- Call `prefetchUC02Routes()` once on mount via `useEffect`

### 2. Apply the same prefetch pattern for other UC modules

**File: `src/modules/shared/routes/prefetchRoutes.ts`** (new)
- Prefetch UC-01, UC-03, UC-04, etc. route chunks on idle after auth completes

**File: `src/modules/shared/routes/index.tsx`**
- Call the shared prefetch in a `useEffect` after `isInitialised && isAuthenticated`

### 3. Memoize route filtering in `renderRoutes`

Wrap `filterRoutesByUseCase` results in `useMemo` to avoid recalculating on every render.

---

### Technical Details

**Prefetch pattern:**
```typescript
// src/modules/UC02/routes/prefetchRoutes.ts
const chunks = [
  () => import('../pages/dashboard'),
  () => import('../pages/directives'),
  () => import('../pages/calendar'),
  () => import('../pages/workBasket'),
  () => import('../pages/meetingDetail'),
  () => import('../pages/waitingList'),
  () => import('../pages/scheduledMeetings'),
];

export function prefetchUC02Routes() {
  const load = () => chunks.forEach(fn => fn().catch(() => {}));
  if ('requestIdleCallback' in window) {
    requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
```

**Files to create:**
- `src/modules/UC02/routes/prefetchRoutes.ts`
- `src/modules/shared/routes/prefetchRoutes.ts`

**Files to edit:**
- `src/modules/UC02/routes/UC02LayoutRouter.tsx` — call prefetch on mount
- `src/modules/shared/routes/index.tsx` — call shared prefetch + memoize filtering

