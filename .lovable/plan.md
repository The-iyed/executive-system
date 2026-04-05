## Plan: Equal-width status badges

### Problem
The two status badges "مكتمل" and "قيد المتابعة" have different widths because they rely on text content width. They should be the same fixed width for visual consistency.

### Change to `DirectiveCard.tsx`

On the status badge `<span>` (line 166), add a fixed width so both badges render identically:
- Add `w-[90px] justify-center` to the inner `<span>` element, making the text centered within a consistent-width badge
- Remove `whitespace-nowrap` (no longer needed with fixed width)

```text
Before: <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] ...">
After:  <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] w-[90px] justify-center ...">
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Add `w-[90px] justify-center` to status badge span for equal width |
