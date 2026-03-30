

## Plan: Refactor & Polish Calendar UI/UX

### Problem
The current calendar has cluttered meeting cards with too much text (dates, arrows, long titles all crammed), poor spacing between overlapping events, and inconsistent typography. The screenshot shows cards overflowing their cells and text being cut off.

### Approach
Improve the FullCalendar CSS and event rendering without touching any API logic. The calendar already uses `@fullcalendar/react` with custom CSS in `minister-fullcalendar.css` and event mapping in `MinisterFullCalendar.tsx`. Changes target 4 areas: event card rendering, CSS polish, day-panel for overflow, and responsive behavior.

### Changes

**1. `src/modules/UC02/components/minister-fullcalendar.css`** — Major CSS overhaul
- Increase slot height from 53px to 60px for breathing room
- Improve event card styles: larger border-radius (10px), better padding (6px 8px), subtle `box-shadow`, `overflow: hidden`, `text-overflow: ellipsis`
- Add hover effect: `transform: scale(1.02)`, slight shadow increase, `transition: all 0.15s ease`
- Improve time label typography: slightly larger, better color contrast
- Better column header spacing and today highlight
- Add `max-height` + `overflow: hidden` on event text to prevent spilling
- Style the `fc-more-link` ("+X more") as a teal pill badge
- Style the FC popover (more events popup) with modern rounded card, shadow, consistent font
- Improve now-indicator line thickness and glow effect
- Add month view event card improvements: tighter padding, single-line truncation

**2. `src/modules/UC02/components/MinisterFullCalendar.tsx`** — Cleaner event rendering
- Add `eventContent` render prop to FullCalendar for custom event card layout:
  - Show only: title (truncated, 1 line) + time range (compact format like `12:00 - 1:00`)
  - Remove all extra text (dates, arrows, "موعد الاجتماع المقترح*")
  - Apply colored left/right border accent strip (3px)
- Set `dayMaxEvents={3}` for week view (currently 4) to reduce clutter
- Set `eventMaxStack={3}` to limit visible overlapping events
- Add `moreLinkContent` to render a styled "+X" pill
- Adjust `slotDuration` display to keep events clean

**3. New: `src/modules/UC02/features/calendar/components/DayMeetingsPanel.tsx`** — Side panel for "+X more"
- Slide-in panel from the left (RTL) showing all meetings for a selected day
- Triggered when user clicks "+X more" or a day header in month view
- Shows meeting list: title, time range, colored accent dot, status
- Clicking a meeting opens the existing `EventDetailModal`
- Smooth slide animation with backdrop
- Close button + click-outside to dismiss
- Responsive: drawer on mobile, side panel on desktop

**4. `src/modules/UC02/features/calendar/CalendarView.tsx`** — Wire up day panel
- Add `selectedDayForPanel` state
- Pass `moreLinkClick` callback to `MinisterFullCalendar` that opens the panel instead of FC's default popover
- Pass panel open/close handlers
- Connect panel meeting click to existing `handleEventClick`

**5. `src/modules/UC02/components/MinisterFullCalendar.tsx`** — Wire moreLinkClick
- Change `moreLinkClick="popover"` to a callback that emits the clicked date + events to the parent
- Add `onMoreClick?: (date: Date, events: CalendarEventData[]) => void` prop

**6. `src/modules/shared/components/calendar/CalendarEvent.tsx`** — Not modified
- The shared component stays as-is since FullCalendar uses its own rendering via `eventContent`

### Technical details

Custom `eventContent` render function (in MinisterFullCalendar):
```tsx
eventContent={(arg) => {
  const start = arg.event.start;
  const end = arg.event.end;
  const timeStr = start && end 
    ? `${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : '';
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden px-1 py-0.5">
      <span className="text-[11px] font-bold truncate">{arg.event.title}</span>
      <span className="text-[10px] opacity-75">{timeStr}</span>
    </div>
  );
}}
```

DayMeetingsPanel animation: `translate-x` transition with `duration-300 ease-out`.

### Result
- Clean, modern event cards showing only title + time
- No text overflow or clutter
- "+3 more" pill opens a polished side panel with full day meeting list
- Smooth hover effects on all interactive elements
- Better spacing, typography, and visual hierarchy
- Responsive drawer on mobile
- No API changes — same data, better presentation
- ~5 files created/modified

