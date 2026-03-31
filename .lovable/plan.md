

## Plan: Improve UC05 Content Tab UI using shared ContentInfoView pattern

### Current state

The UC05 `ContentTab` uses the older `Mou7tawaContentTab` shared component for presentation files, optional attachments, and notes. Below that, it has UC05-specific sections (directives table, guidance notes, executive summary upload) with inconsistent styling — plain `div`s, raw headings, and no section card wrappers.

### Goal

1. **Replace `Mou7tawaContentTab`** with the shared `ContentInfoView` component (from `src/modules/shared/features/content-info/`) which has a more polished card-based layout with icon headers, proper empty states, and consistent styling.
2. **Wrap UC05-specific sections** (directives, guidance notes, executive summary) in the same visual card pattern as `ContentInfoView` sections — bordered card with icon header bar — so the entire tab looks cohesive.
3. **Keep all UC05-specific logic** (AI compare, insights modals, directive CRUD, executive summary upload) intact — only improve the visual wrapper.

### Technical approach

**File: `src/modules/UC05/features/content-request-detail/tabs/ContentTab.tsx`**

1. **Replace `Mou7tawaContentTab` import** with `ContentInfoView` and its mapper/types from `@/modules/shared/features/content-info`
2. **Build `ContentInfoViewData`** from the content request data — map presentation files, optional files, and notes into the sections format that `ContentInfoView` expects
3. **Pass `renderFileActions` prop** to inject the UC05-specific AI buttons (compare, insights) per presentation file — this is exactly what `ContentInfoView` supports
4. **Wrap the directives section** in a `<section>` with the same visual pattern: `rounded-xl border border-border/60 bg-background` with a header bar containing an icon and title
5. **Wrap the executive summary section** in the same card pattern
6. **Wrap the guidance notes section** in the same card pattern
7. Keep compare modal and insights modal code unchanged

### Files changed

| File | Change |
|---|---|
| `ContentTab.tsx` | Replace `Mou7tawaContentTab` with `ContentInfoView`, wrap UC05 sections in matching card UI |

### Visual result

All sections in the tab will follow the same pattern:
```text
┌─ Icon ── Section Title ──────────────────────┐
│                                                │
│  [content: files / table / textarea / upload]  │
│                                                │
└────────────────────────────────────────────────┘
```

Consistent with the shared `ContentInfoView` section cards used across the app.

### Note on build errors

The `guiding-light` module errors are pre-existing and unrelated to this task. They will not be addressed in this change.

