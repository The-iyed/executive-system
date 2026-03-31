
Goal: make `/calendar` display backend meeting times exactly as sent (e.g. `2026-04-07T09:00:00+03:00` must render at 09:00), with zero browser timezone shifting.

Plan

1) Confirm and lock the `/calendar` rendering path
- Keep scope on `src/modules/UC02/features/calendar/CalendarView.tsx` → `src/modules/UC02/components/MinisterFullCalendar.tsx` → `EventDetailModal.tsx`.
- Ensure every event shown in this route uses one parsing strategy only (no mixed `new Date(iso)` parsing).

2) Centralize “no-conversion” datetime parsing
- Reuse/standardize helpers in `src/modules/UC02/features/calendar/utils.ts`:
  - parse ISO by regex (extract raw `YYYY-MM-DD`, `HH:mm` directly).
  - return local calendar date + raw time parts without timezone math.
- Export one shared helper for calendar placement and one for display text (to prevent drift between grid and modal).

3) Remove remaining UTC boundary drift in timeline fetch
- Update range serialization used by `useCalendarEvents` (`toISORange` in `src/api/meetings/getMeetingsTimeline.ts`) so it does not force UTC conversion with `.toISOString()` for calendar windows.
- Serialize with fixed/local-offset format (same approach used elsewhere) so requested day/week/month boundaries align with displayed wall-clock times.

4) Harden FullCalendar event placement
- In `MinisterFullCalendar.tsx`, ensure `start`/`end` are built only from extracted raw components (09 stays 09).
- Keep 24h display formatting and remove any fallback path that can reintroduce native ISO timezone parsing for timeline events.

5) Keep details modal aligned with grid
- In `EventDetailModal.tsx` and mapper (`outlookEventToCalendarDetail`), continue using the same raw ISO parser so modal time text and calendar slot position always match.

Technical details (files to adapt)
- `src/api/meetings/getMeetingsTimeline.ts` (range serialization)
- `src/modules/UC02/features/calendar/utils.ts` (single source of truth parser/formatters)
- `src/modules/UC02/components/MinisterFullCalendar.tsx` (event placement inputs)
- `src/modules/UC02/features/calendar/components/EventDetailModal.tsx` (consistency check)

Validation checklist
- Weekly view: event `09:00+03:00` appears on 09:00 row.
- Daily view: same event remains 09:00.
- Monthly popover/details: shows `09:00 – 10:00`.
- Open meeting details modal from calendar: same times as backend.
- Regression check by changing browser timezone: displayed meeting time remains fixed (still 09:00).
