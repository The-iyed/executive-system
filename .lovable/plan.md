

## Improve EventDetailModal UI/UX

### Current Issues (from screenshot)
1. **Organizer row** shows "—" for both name and email — no useful info
2. **Meeting link** is a raw long URL that's hard to read and truncated poorly
3. **Invitees** only show email addresses with no names — just "messenger@webex.com"
4. **No quick "Join Meeting" action** — user must copy the link manually
5. **Too much vertical whitespace** — rows are spaced far apart with little content
6. **Actions at bottom are small** — "عرض التفاصيل" and "تعديل" buttons blend together

### Plan

**File: `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`**

#### 1. Add prominent "Join Meeting" button
- When `locationOrLink` is a URL (starts with `http`), render a large green/primary "انضم للاجتماع" button with a `Video` or `ExternalLink` icon at the top of the actions area
- Opens the link in a new tab
- This is the most important action for users

#### 2. Improve meeting link display
- Instead of showing the raw URL, show a short label like "رابط الاجتماع" with a copy button and a small "open" icon
- Truncate the URL visually but keep it clickable

#### 3. Better invitee display
- Show invitee name prominently; if no name, show email as the primary text
- Add avatar initials circle (first letter) for visual distinction
- Cap visible invitees at 5, show "+N more" if exceeding

#### 4. Reduce vertical spacing
- Tighten `py-3.5` to `py-2.5` on info rows
- Remove excessive gaps between sections

#### 5. Improve header
- Make title larger (18px) and bolder
- Move the internal/external badge inline with title instead of below it

#### 6. Improve action buttons
- Make "Join Meeting" the primary CTA (full-width, prominent)
- Keep "عرض التفاصيل" and "تعديل" as secondary actions in a row below

#### 7. Add copy link button
- Small icon button next to the meeting link to copy to clipboard with a toast/tooltip confirmation

### Technical Details

**Single file edit:** `src/modules/UC02/features/calendar/components/EventDetailModal.tsx`

- Add `ExternalLink`, `Copy`, `Video` icons from lucide-react
- Add a `copyToClipboard` handler using `navigator.clipboard.writeText`
- Restructure the actions section: join button on top (conditional), detail + edit below
- Extract domain from URL for cleaner display (e.g., "meet...webex.com")
- No new dependencies or files needed

