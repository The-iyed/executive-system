

## Plan: Make header scroll with content, keep only footer fixed

### Problem
Currently the header (title, subtitle, step indicator, close button) is `sticky top-0` inside the scroll container, so it stays fixed while the form scrolls beneath it. The user wants everything to scroll together, with only the footer action bar remaining fixed at the bottom.

### Change to `MeetingModalShell.tsx`

Remove the `sticky` behavior from the header by removing these classes from the header wrapper (line 71):
- Remove: `sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90`
- Keep: `border-b border-border/60`

This makes the header (close button, title, subtitle, step indicator) scroll naturally with the form content, while the `ModalActionBar` stays fixed at the bottom since it's already outside the `overflow-y-auto` container.

### Files changed

| File | Change |
|---|---|
| `MeetingModalShell.tsx` | Remove `sticky top-0 z-10` and backdrop classes from header div (line 71) |

