

## Plan: Always show agenda section in MeetingInfoView

### Problem
Line 132 in `MeetingInfoView.tsx` conditionally renders the agenda section only when `data.agenda && data.agenda.length > 0`. When there are no agenda items, the entire section is hidden.

### Fix

**File: `src/modules/shared/features/meeting-info/MeetingInfoView.tsx`** (line 132)

Remove the conditional check so the agenda section always renders. When empty, show an empty state message.

Change:
```tsx
{data.agenda && data.agenda.length > 0 && (
  <div className="flex flex-col gap-3">
    <h3 className="text-base font-semibold text-foreground">أجندة الاجتماع</h3>
    <AgendaTable items={data.agenda} />
  </div>
)}
```

To:
```tsx
<div className="flex flex-col gap-3">
  <h3 className="text-base font-semibold text-foreground">أجندة الاجتماع</h3>
  {data.agenda && data.agenda.length > 0 ? (
    <AgendaTable items={data.agenda} />
  ) : (
    <div className="px-4 py-3 rounded-2xl border bg-muted/40 border-border/40 text-sm text-muted-foreground text-right">
      لا توجد أجندة
    </div>
  )}
</div>
```

Single file, 1 block changed.

