

## Plan: Replace ProposersSelect API search with static options

### Problem
The المقترحون dropdown currently searches users via API. It should instead show two hardcoded options: `EO@momah.gov.sa` and `Minister.office@momah.gov.sa`.

### Changes

**File: `src/modules/shared/features/meeting-request-form/shared/fields/ProposersSelect.tsx`**

1. Remove the `useManagerSearch` hook import and usage (lines 4, 28-29, 42-44)
2. Remove debounced search logic and search input from dropdown
3. Replace the dynamic `options` array with a static list:
```ts
const STATIC_OPTIONS: ManagerOption[] = [
  {
    value: "EO@momah.gov.sa",
    label: "EO@momah.gov.sa",
    subtitle: "EO@momah.gov.sa",
    user: { objectGUID: "EO@momah.gov.sa", mail: "EO@momah.gov.sa", displayName: "EO@momah.gov.sa" } as UserSearchResult,
  },
  {
    value: "Minister.office@momah.gov.sa",
    label: "Minister.office@momah.gov.sa",
    subtitle: "Minister.office@momah.gov.sa",
    user: { objectGUID: "Minister.office@momah.gov.sa", mail: "Minister.office@momah.gov.sa", displayName: "Minister.office@momah.gov.sa" } as UserSearchResult,
  },
];
```
4. Use `STATIC_OPTIONS` directly as the options list — no loading spinner, no infinite scroll, no search filtering needed
5. Remove the search input bar from the dropdown since there are only 2 options

Single file change.

