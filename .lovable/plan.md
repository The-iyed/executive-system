

## Plan: Expand invitees list and move scheduling settings below

### Problem
Currently the invitees section shows only a compact avatar stack. The user wants a full invitee list (like the uploaded screenshot) showing each invitee's name, email, and avatar initial — with a "+N آخرين" overflow indicator. The scheduling settings row should appear **after** the expanded invitees list.

### Changes

#### `EventDetailModal.tsx`

**1. Replace compact avatar stack with expanded invitee list**
- Remove the current single-row invitees layout (lines 303-344)
- Replace with a section that has the icon+label header row, followed by a vertical list of invitee cards
- Each invitee card shows: colored avatar circle with initials (right), name in bold (center-right), email below in muted text
- Show up to 5 invitees; if more, show a "+N آخرين" text link at the bottom
- Layout matches the uploaded screenshot: right-aligned, each invitee in its own row with subtle bottom border

**2. Move scheduling settings row after the invitees list**
- Keep the existing scheduling settings row (lines 346-376) but position it as the last row after the invitees list, still inside the card with `divide-y`

**3. Invitee row structure** (per invitee):
```text
┌──────────────────────────────────────────────────┐
│  [Avatar]  Name (bold)                           │
│            email@domain.com (muted, smaller)     │
├──────────────────────────────────────────────────┤
│  ...next invitee...                              │
└──────────────────────────────────────────────────┘
           +14 آخرين (if overflow)
```

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Replace avatar-stack invitees row with expanded list showing name+email per invitee; keep scheduling settings as last row |

