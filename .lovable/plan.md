

## Fix: Prevent any visual interaction on past calendar time slots

### Problem
Clicking on past time slots shows a visual highlight (select mirror) before the handler rejects it. The user sees a response but nothing happens — bad UX.

### Solution
Add the `selectAllow` prop to FullCalendar. This is a built-in callback that runs **before** any visual selection feedback. If it returns `false`, FullCalendar won't show the select mirror or highlight at all.

### Changes

**File: `src/modules/UC02/components/MinisterFullCalendar.tsx`**

1. Add a `selectAllow` callback that rejects any selection where `start` is in the past:

```typescript
selectAllow={(selectInfo) => {
  return selectInfo.start.getTime() >= Date.now() - 60000;
}}
```

2. Add this prop to the `<FullCalendar>` component alongside the existing `selectable` prop.

This is a single-line addition. The existing `openSlotFromDate` null-check remains as a safety net, but the user will no longer see any visual feedback when clicking/dragging on past slots.

### Technical Details
- `selectAllow` is a FullCalendar API that prevents the selection mirror from rendering
- The 60-second buffer matches the existing logic in `openSlotFromDate`
- No new files or dependencies needed

