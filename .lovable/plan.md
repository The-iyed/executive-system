

## Plan: Simplify to single badge with source context in description

### Change

Replace the two separate badges (source + scope) with a **single badge** based on `is_internal`, plus a small text note indicating the meeting source (Outlook or النظام).

**Lines 187–204** in `EventDetailModal.tsx` — replace with:

```tsx
<div className="flex items-center gap-1.5 flex-wrap">
  {/* Scope badge — the only badge */}
  {display.is_internal !== undefined && (
    <span className={cn(
      'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
      display.is_internal ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600',
    )}>
      {display.is_internal ? <Users className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
      {display.is_internal ? 'اجتماع داخلي' : 'اجتماع خارجي'}
    </span>
  )}
  {/* Source note */}
  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
    {display.meetingId ? <Building2 className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
    {display.meetingId ? 'تم الإنشاء من النظام' : 'تمت المزامنة من Outlook'}
  </span>
</div>
```

This keeps one prominent badge for internal/external scope, and adds a subtle muted text with icon to indicate the source — no second badge, just a quiet descriptor.

Remove unused imports if any (`Building2`, `Cloud` stay; `Users`, `Globe` stay).

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Replace dual badges with single scope badge + muted source text |

