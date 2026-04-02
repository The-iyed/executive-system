

## Plan: Change مبدئي and البيانات مكتملة from chips to label-value rows

### Problem
Currently in the calendar detail modal, مبدئي and البيانات مكتملة are displayed as styled chips (active/inactive). The user wants them shown as simple label + yes/no value pairs, consistent with other rows in the modal.

### Change

#### `EventDetailModal.tsx` (lines 331–350)
Replace the two chip `<div>`s with two label-value pairs using نعم/لا:

```tsx
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
```

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Replace chip-style display with label: نعم/لا format for both fields |

