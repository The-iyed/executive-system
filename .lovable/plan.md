

## Plan: Improve monthly view "+X more" popover with scroll and constrained height

### Problem
In monthly view, clicking "+X أخرى" opens FullCalendar's built-in popover which grows unbounded when there are many events (e.g. 34+ meetings), pushing content off-screen with no scrolling.

### Solution
FullCalendar uses `moreLinkClick="popover"` which renders a `.fc-popover` element. We need to add CSS rules to constrain the popover body (`.fc-popover .fc-popover-body`) with a `max-height` and `overflow-y: auto` for scrolling, plus a `min-height` so it doesn't collapse for days with few extra events.

### Change

#### `src/modules/UC02/components/MinisterFullCalendar.tsx`
Add CSS styles (either via a `<style>` tag or in an existing CSS file) targeting the FullCalendar popover:

```css
.minister-fc .fc-popover {
  max-width: 320px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.minister-fc .fc-popover .fc-popover-body {
  min-height: 80px;
  max-height: 320px;
  overflow-y: auto;
}
```

This will be injected as a `<style>` block inside the component's wrapper div, or appended to the existing calendar CSS file if one exists.

### Files changed

| File | Change |
|---|---|
| `MinisterFullCalendar.tsx` | Add scoped CSS for `.fc-popover` with min/max height and scroll on the popover body |

