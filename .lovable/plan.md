

## Plan: Move إعدادات الجدولة above المدعوون and style as standard field row

### Problem
إعدادات الجدولة is currently nested inside the المدعوون section. It should be its own standalone row above المدعوون, styled like other fields (icon+label on right, values on left).

### Change

#### `EventDetailModal.tsx`

1. **Move the scheduling settings block** (lines 322–346) out of the المدعوون `<div>` (which starts at line 312) and place it as a new `<div>` between الموقع (ends line 310) and المدعوون (line 311), using the same row pattern as الموقع:

```tsx
{/* Scheduling Settings */}
{display.meetingId && (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
        <Settings className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <span className="text-[12px] font-semibold text-muted-foreground">إعدادات الجدولة</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">مبدئي:</span>
        <span className="text-[11px] font-semibold text-foreground">
          {display.isPreliminary ? 'نعم' : 'لا'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">البيانات مكتملة:</span>
        <span className="text-[11px] font-semibold text-foreground">
          {display.isDataComplete ? 'نعم' : 'لا'}
        </span>
      </div>
    </div>
  </div>
)}
```

2. **Remove the old scheduling settings block** from inside the المدعوون section (lines 322–346).

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Move إعدادات الجدولة to its own row above المدعوون, matching standard field layout |

