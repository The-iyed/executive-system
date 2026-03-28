# Plan: Shared Generic List Page Feature (Cards)

## Status: ⏳ PENDING APPROVAL

---

## Goal
Create a reusable, config-driven `SharedListPage` feature that any module can use to render a full list page with: title, description, optional filters/tabs, optional add button, card list, card actions, pagination, loading/error/empty states — all synced to URL query params.

---

## What Already Exists (Reuse vs Build)

| Component | Path | Decision |
|---|---|---|
| `DirectivesList` | `shared/features/directives-list/` | ✅ Keep as-is (directive-specific) |
| `Pagination` | `shared/components/pagination.tsx` | ✅ Reuse directly |
| `SearchInput` | `shared/components/search-input.tsx` | ✅ Reuse directly |
| `useDirectivesList` | `shared/hooks/useDirectivesList.ts` | ❌ Too specific — new generic hook |
| `CardsGrid` | `shared/components/cards-grid.tsx` | ❌ Meeting-specific — new generic grid |

---

## Architecture

```
src/modules/shared/features/list-page/
├── components/
│   ├── ListPageLayout.tsx        # Full page orchestrator
│   ├── ListHeader.tsx            # Title + description + right slot
│   ├── ListFiltersBar.tsx        # Config-driven filter dropdowns + search
│   ├── ListTabs.tsx              # Optional horizontal tabs with counts
│   ├── ListCardsGrid.tsx         # Responsive card grid
│   ├── ListCardActions.tsx       # Dynamic action buttons per card
│   ├── ListEmptyState.tsx        # Empty state UI
│   ├── ListErrorState.tsx        # Error state with retry
│   └── ListCardSkeleton.tsx      # Loading skeleton cards
│
├── hooks/
│   ├── useListQueryState.ts      # URL query params ↔ state sync
│   └── useListData.ts            # React Query generic wrapper
│
├── types/
│   └── list.types.ts             # All shared types (generic <T>)
│
└── index.ts                      # Public API
```

---

## Key Types

```ts
// Generic paginated API response
interface PaginatedResponse<T> { items: T[]; total: number; }

// Filter config (config-driven)
interface FilterConfig {
  key: string; label: string; type: 'select';
  options: { value: string; label: string }[];
  defaultValue?: string;
}

// Tab config
interface TabConfig { value: string; label: string; count?: number; }

// Card action config
interface CardAction<T> {
  id: string; label: string; icon: ReactNode; className?: string;
  onClick: (item: T) => void;
  hidden?: (item: T) => boolean;
  loading?: (item: T) => boolean;
}

// Main orchestrator props
interface ListPageLayoutProps<T> {
  title: string; description?: string;
  headerIcon?: ReactNode; headerRight?: ReactNode;
  tabs?: TabConfig[]; activeTab?: string; onTabChange?: (v: string) => void;
  filtersConfig?: FilterConfig[];
  queryKey: string[];
  queryFn: (params: Record<string, any>) => Promise<PaginatedResponse<T>>;
  fixedParams?: Record<string, any>;
  cardComponent: React.FC<{ item: T; actions?: CardAction<T>[] }>;
  cardActions?: CardAction<T>[];
  pageSize?: number;
  className?: string;
}
```

---

## Hooks

### `useListQueryState()`
- Uses `useSearchParams` (react-router)
- Manages: `search` (debounced 300ms), `page`, `limit`, dynamic filter keys
- All state in URL → survives refresh
- Returns: `{ search, filters, page, limit, setSearch, setFilter, setPage, resetFilters, allParams }`

### `useListData<T>(queryKey, queryFn, params)`
- Wraps `useQuery`
- Returns: `{ items, total, totalPages, isLoading, isError, error, refetch }`

---

## Components Summary

| Component | Renders when |
|---|---|
| `ListHeader` | Always |
| `ListTabs` | `tabs` prop provided |
| `ListFiltersBar` | `filtersConfig` prop provided |
| `ListCardSkeleton` | `isLoading === true` |
| `ListEmptyState` | `items.length === 0 && !isLoading` |
| `ListErrorState` | `isError === true` |
| `ListCardsGrid` | `items.length > 0` |
| `Pagination` | `totalPages > 1` |

---

## Usage Example

```tsx
<ListPageLayout
  title="الاجتماعات"
  description="إدارة ومتابعة الاجتماعات"
  queryKey={['meetings']}
  queryFn={(params) => getMeetings(params)}
  filtersConfig={[
    { key: 'status', label: 'الحالة', type: 'select',
      options: [{ value: 'all', label: 'الكل' }, { value: 'SCHEDULED', label: 'مجدولة' }] },
  ]}
  cardComponent={MeetingCard}
  cardActions={[
    { id: 'view', label: 'عرض', icon: <Eye />, onClick: (m) => navigate(`/m/${m.id}`) },
  ]}
  headerRight={<Button>إنشاء اجتماع</Button>}
/>
```

---

## Implementation Order

1. **Types** → `list.types.ts`
2. **Hooks** → `useListQueryState.ts` → `useListData.ts`
3. **Sub-components** → skeleton, empty, error, tabs, filters, actions, grid
4. **Orchestrator** → `ListPageLayout.tsx`
5. **Barrel export** → `index.ts`
6. **First consumer** → integrate into one page to validate

---

## Key Principles

- **Zero business logic** in shared feature — all config-driven
- **URL-first state** — filters/search/pagination in query params
- **Generic `<T>`** — no assumption about data shape
- **RTL-ready** — `dir="rtl"` throughout
- **Semantic design tokens** — no hardcoded colors
- **Memoized** — `React.memo` on grid, debounced search
- **Production-ready** — error boundaries, loading, empty states

