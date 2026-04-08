

## Plan: Improve internal/external badge with source context and descriptive labels

### Change to `EventDetailModal.tsx`

Replace the current single-word badge ("داخلي" / "خارجي") with **two badges** side by side:

1. **Source badge** — based on `display.meetingId`:
   - Has `meetingId` → `Building2` icon + **"النظام"** (teal: `bg-primary/10 text-primary`)
   - No `meetingId` → `Cloud` icon + **"Outlook"** (blue: `bg-blue-500/10 text-blue-600`)

2. **Scope badge** — based on `display.is_internal`:
   - Internal → `Users` icon + **"اجتماع داخلي"** (teal: `bg-primary/10 text-primary`)
   - External → `Globe` icon + **"اجتماع خارجي"** (amber: `bg-amber-500/10 text-amber-600`)

Both badges use `text-[10px]`, `rounded-full`, `px-2 py-0.5`, `flex items-center gap-1` for consistency.

### Implementation

**Lines 187–196** — replace the single badge block with:

```tsx
<div className="flex items-center gap-1.5 flex-wrap">
  {/* Source */}
  <span className={cn(
    'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
    display.meetingId ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-600',
  )}>
    {display.meetingId ? <Building2 className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
    {display.meetingId ? 'النظام' : 'Outlook'}
  </span>
  {/* Scope */}
  {display.is_internal !== undefined && (
    <span className={cn(
      'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
      display.is_internal ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600',
    )}>
      {display.is_internal ? <Users className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
      {display.is_internal ? 'اجتماع داخلي' : 'اجتماع خارجي'}
    </span>
  )}
</div>
```

Add `Building2`, `Cloud`, `Users`, `Globe` to the lucide-react imports. Ensure `display.meetingId` is already available (it is — from `event.meetingId`).

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Add 4 icon imports; replace single badge with two badges (source + scope) |

