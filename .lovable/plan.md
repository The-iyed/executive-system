

## UI/UX Critique of EventDetailModal

### Join Button Problems
1. **Lost in the footer** — The most important action (joining a meeting) is buried at the bottom, below all metadata. Users must scroll past organizer, date, time, location, and invitees before they can act. The primary CTA should be immediately visible.
2. **Gradient is generic** — `bg-gradient-to-l from-primary to-primary/85` is barely perceptible. It doesn't convey urgency or differentiate from the secondary buttons enough.
3. **No time context** — The button looks the same whether the meeting starts in 2 minutes or 3 days. A meeting starting soon should feel urgent.
4. **Redundant link row** — The location/link row already shows copy + open icons for the same URL. Having both the link row AND the join button is redundant and dilutes focus.

### General Modal Problems
5. **Flat information hierarchy** — Every row looks identical (icon + text). Nothing stands out. The modal reads like a data dump, not a quick-glance card.
6. **860px max-width is excessive** — This is a detail popover, not a form. Content doesn't fill the width, creating awkward whitespace.
7. **No visual grouping** — Organizer, date, time, location, invitees are all in one flat list with identical `border-b` separators. No semantic grouping.
8. **Double border-t on actions** — The body ends with a `border-b` on invitees, then actions start with `border-t`, creating a visual double-line.

---

## Plan

**File: `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`**

### 1. Move Join button to the top (hero position)
- Place the join CTA immediately after the header, before any metadata
- When meeting has a link: show a prominent card-like join area with the Video icon, meeting title context, and the button
- When no link: skip this section entirely, body starts with metadata

### 2. Add time-awareness to Join button
- If meeting starts within 15 minutes or is currently happening: show a pulsing green dot and text like "الاجتماع يبدأ قريبا" or "جاري الآن"
- If meeting is in the future (>15 min): show normal state
- If meeting is past: hide the join button entirely or show it as disabled/muted

### 3. Reduce modal width
- Change `max-w-[860px]` to `max-w-[480px]` — this is a quick-glance card, not a dashboard

### 4. Group metadata into a compact card
- Wrap date + time into a single row: "الأربعاء 25 مارس · 14:00 – 15:00"
- Wrap organizer into a smaller inline display
- This reduces 3 separate rows into 1-2

### 5. Simplify the link row
- When there's a join button (hero), remove the redundant MapPin link row entirely — the join button already handles it
- When there's a physical location (not a URL), keep the MapPin row

### 6. Compact invitees
- Show invitees as overlapping avatar circles (stack) with a count badge, not a vertical list
- On hover or click of the stack, expand to show the full list

### 7. Clean up action footer
- Remove the join button from the footer (moved to hero)
- Keep only "عرض التفاصيل" and "تعديل" as equal secondary buttons
- Both always use outline/border style since the primary CTA is now at the top

---

### Technical Details

**Single file edit:** `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`

- Compute `meetingStatus`: compare `scheduledStart`/`scheduledEnd` against `new Date()` to determine `'upcoming-soon' | 'live' | 'future' | 'past'`
- Restructure JSX: Header → Join Hero (conditional) → Compact metadata card → Avatar stack → Footer actions
- Reduce `max-w` from 860px to 480px
- Merge date + time into one `InfoRow`
- Replace invitee vertical list with an avatar circle stack (`flex` with negative margins `-mr-2`) plus a count label
- Add a `isPast` check to hide/disable the join button
- No new files or dependencies

