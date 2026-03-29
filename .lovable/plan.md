

## Plan: Move scheduling quick-action toggles to the DetailPageHeader

### Problem
The "مبدئي" and "البيانات مكتملة" toggles are inside the الجدولة tab, forcing the schedule officer to switch tabs just to toggle them. This is a bad UX — they should be accessible directly from the page header.

### Changes

**1. `src/modules/shared/components/DetailPageHeader.tsx`**
- Add a new optional prop `quickActions?: React.ReactNode` to the interface
- Render it in the header row (Row 1), between the status area and the action buttons — so it's always visible regardless of active tab

**2. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Pass `quickActions` to `DetailPageHeader` with the two toggle buttons (مبدئي / البيانات مكتملة), using `h.scheduleForm` state and `h.setScheduleForm` — only when `h.isScheduleOfficer` is true
- The buttons use the same chip styling already in ScheduleTab (teal active, gray inactive)

**3. `src/modules/UC02/features/meeting-detail/tabs/ScheduleTab.tsx`**
- Remove the two toggle buttons from the section header (lines 38-59) since they now live in the page header
- Keep the section header with just the icon and title

### Result
Schedule officers see the مبدئي / البيانات مكتملة toggles in the page header on every tab. The ScheduleTab keeps only the notes field and invitees table.

3 files changed.

