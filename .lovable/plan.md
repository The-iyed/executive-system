

## Plan: Make calendar detail modal production-ready for large data

### Problem
When a meeting has many invitees or a long title/organizer name, the modal content can overflow or truncate poorly. The invitees list is hard-capped at 5 with no way to see more, and long text fields lack proper wrapping.

### Changes

#### `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`

1. **Increase visible invitees from 5 to 10** — change `MAX_VISIBLE_INVITEES` constant and update the slice. When there are more than 10, show a scrollable container with `max-h-[280px] overflow-y-auto` so all invitees are accessible.

2. **Title text wrapping** — change the title `<h3>` from `line-clamp-2` to `break-words` with no line clamp, allowing full title display inside the scrollable body.

3. **Organizer name/email overflow** — increase `max-w-[260px]` to `max-w-[300px]` and add `break-all` for long email addresses without spaces.

4. **Location text overflow** — add `break-all` to the location text span for long URLs displayed as plain text, increase max-width.

5. **Invitee name/email overflow** — add `max-w-[280px]` to invitee name and email spans to prevent horizontal overflow on narrow viewports.

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Scrollable invitees list, better text overflow handling for title/organizer/location/invitees |

