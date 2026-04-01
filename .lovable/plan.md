

## Plan: Fix now-indicator to show local time instead of UTC

### Problem
The calendar uses `timeZone="UTC"` so events render without timezone shifts, but the built-in `nowIndicator` also uses UTC — placing the red line 1+ hours off from the user's actual local time (e.g., 7:30 instead of 8:30 in Riyadh).

### Solution
Use FullCalendar's `now` prop to feed it the local time expressed as a UTC timestamp, tricking the UTC-mode calendar into drawing the indicator at the correct visual position.

### How it works
FullCalendar's `now` prop accepts a function returning a `Date`. Since the calendar renders in UTC mode, we return a **fake UTC date** whose UTC hours/minutes match the user's **local** hours/minutes:

```ts
now={() => {
  const local = new Date();
  return new Date(Date.UTC(
    local.getFullYear(), local.getMonth(), local.getDate(),
    local.getHours(), local.getMinutes(), local.getSeconds()
  ));
}}
```

This makes the UTC-mode calendar draw the now-indicator line at the user's actual local time. No custom CSS overlay needed — the built-in `nowIndicator` keeps working.

### Changes

#### `MinisterFullCalendar.tsx`
- **Keep** `nowIndicator` (line 355)
- **Add** `now` prop with the local-to-UTC conversion function above (next to `nowIndicator`)

### Files changed

| File | Change |
|---|---|
| `MinisterFullCalendar.tsx` | Add `now` prop that returns local time as fake UTC date |

