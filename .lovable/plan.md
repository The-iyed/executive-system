

## Plan: Show proposed time in quick meeting form + improve button styling

### Problem
1. When clicking "اجتماع سريع", the proposed meeting date/time fields are hidden (`hideProposedTime={true}`). The user wants them visible and required.
2. The quick meeting button style/size doesn't match the view mode tabs filter styling.

### Changes

#### 1. `CalendarView.tsx` — Stop hiding proposed time for quick meetings
Remove `hideProposedTime={!!slot.isQuickMeeting}` (or set to `false`) so the `MeetingDateField` always shows, pre-filled with the rounded current time.

#### 2. `CalendarSlotMeetingForm.tsx` — Remove past-time validation bypass for quick meetings
The guard `if (!hideProposedTime && start <= Date.now()) return;` will naturally work since `hideProposedTime` will be `false`.

#### 3. `CalendarHeader.tsx` — Restyle quick meeting button to match tab filter size
Change the button from the large gradient pill to a compact style matching the view mode toggle dimensions:
- Use same height/padding as tab buttons (`px-3 py-1.5 rounded-lg text-[12px] font-semibold`)
- Keep the branded teal gradient but reduce padding and icon size to align visually with the tabs row

```tsx
<button
  type="button"
  onClick={onQuickMeeting}
  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-primary-foreground bg-gradient-to-l from-[#048F86] via-[#069E95] to-[#0BB5AA] transition-all duration-200 hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.97]"
  style={FONT}
>
  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
  اجتماع سريع
</button>
```

### Files changed

| File | Change |
|---|---|
| `CalendarView.tsx` | Remove `hideProposedTime` prop from `CalendarSlotMeetingForm` |
| `CalendarHeader.tsx` | Reduce button padding/size to match view mode tabs |

