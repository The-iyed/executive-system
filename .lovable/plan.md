

## Plan: Replace calendar meeting modal with modern compact dialog + fix invitees bug

### Problem 1 — Modal is too heavy
The calendar "create meeting" form uses `MeetingModalShell` — a full-screen, near-viewport-sized modal (`1450px wide, calc(100vh-6rem) tall`) designed for the 3-step meeting request flow. For the calendar's simple single-step form (title, dates, channel, invitees), this is overkill. The user wants the cleaner, compact style used by `ScheduleConfirmDialog` — a `sm:max-w-[520px]` dialog with structured sections, muted header, and sticky footer.

### Problem 2 — Invitees disappear on save
**Root cause**: In `CalendarSlotMeetingForm.tsx` line 292, `initialInvitees` is passed as `(initialInvitees ?? []) as any`. This creates a **new array reference on every render**. The `InviteesTableForm` has a `useEffect` (line 37-39) that watches `initialInvitees` and calls `setInvitees(initialInvitees ?? [])` whenever it changes. Because the reference changes on each parent re-render (e.g. when the user types in a field), the effect fires and **resets the invitee list to the initial empty array**, wiping user-added rows.

### Solution

**File 1: `src/modules/UC02/components/CalendarSlotMeetingForm.tsx`** — Replace modal + fix bug

1. **Replace `MeetingModalShell`** with a compact `Dialog/DialogContent` following the `ScheduleConfirmDialog` design pattern:
   - `sm:max-w-[680px]` (slightly wider than ScheduleConfirmDialog to fit the invitees table)
   - Muted header section with title + subtitle
   - Scrollable body with form sections separated by subtle dividers
   - Sticky footer with save/cancel buttons matching the ScheduleConfirmDialog style
   - Remove the `MeetingModalShell` import entirely

2. **Fix invitees bug**: Memoize the `initialInvitees` fallback so the reference stays stable:
   ```ts
   const stableInitialInvitees = useMemo(
     () => initialInvitees ?? [],
     [initialInvitees]
   );
   ```
   Pass `stableInitialInvitees` to `InviteesTableForm` instead of `(initialInvitees ?? []) as any`.

### Files changed

| File | Change |
|---|---|
| `src/modules/UC02/components/CalendarSlotMeetingForm.tsx` | Replace `MeetingModalShell` with compact dialog layout; memoize `initialInvitees` |

1 file, 2 fixes.

