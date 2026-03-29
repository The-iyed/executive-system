

## Plan: Add new rows to bottom + auto-scroll

### Problem
Both the invitees table (dynamic-table-form) and agenda table (FormTable) prepend new rows to the top. User wants them appended to the bottom with auto-scroll to the new item.

### Changes

**File 1: `src/lib/dynamic-table-form/hooks/useTableForm.ts`**

Change `addRow` to append instead of prepend (line 69):
```ts
// Before
const updated = [createEmptyRow(), ...rows];
setErrors((prev) => [{}, ...prev]);

// After
const updated = [...rows, createEmptyRow()];
setErrors((prev) => [...prev, {}]);
```

**File 2: `src/lib/dynamic-table-form/components/TableFormSection.tsx`** (or equivalent renderer)

After adding a row, scroll the table container to the bottom. Use a `useEffect` that triggers on `rows.length` change to scroll the container's last row into view:
```ts
useEffect(() => {
  // scroll container to bottom when row count increases
}, [rows.length]);
```

**File 3: `src/modules/shared/components/form/FormTable.tsx`**

Add auto-scroll to bottom after `onAddRow` is called. Wrap the add button's onClick to also trigger a scroll-to-bottom on the table list container after a short RAF delay:
```ts
onClick={() => {
  if (disabled) return;
  onAddRow();
  requestAnimationFrame(() => {
    // scroll the ul/list container to bottom
  });
}}
```

This ensures both the agenda (FormTable) and invitees (TableFormSection) append to bottom and auto-scroll. The agenda consumer callbacks that build the new row array also need to append instead of prepend — those are in the meeting form hooks that call `onAddRow`.

### Summary
- 3 files changed
- New rows go to bottom in both table types
- Auto-scroll to the newly added row via `requestAnimationFrame` + `scrollIntoView`

