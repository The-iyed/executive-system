
## Plan: Equal-width status badges

### Problem
The two status badges "مكتمل" and "قيد المتابعة" have different widths because they size based on text content. They should be the same fixed width for visual consistency (as shown in the screenshot).

### Change to `DirectiveCard.tsx`

On the status badge `<span>` (line 165), add a fixed width and center alignment so both badges render identically:

- Replace `whitespace-nowrap` with `w-[90px] justify-center`

```text
Before: 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap'
After:  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold w-[90px] justify-center'
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add `w-[90px] justify-center` to status badge span, remove `whitespace-nowrap` |
