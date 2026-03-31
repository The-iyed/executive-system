

## Plan: Production-ready agenda duration fixes

### Changes

#### 1. `AgendaSection.tsx` — Remove stale rootError display + fix min input
- **Remove lines 186-188** (`rootError && !durationMismatch` paragraph) — the duration status badge already communicates mismatch clearly
- Change `min={0}` to `min={5}` and placeholder from `"0"` to `"5"` on the duration input (line 162-165)
- Add `useEffect` to `clearErrors("agenda_items")` when durations match — this prevents stale Zod errors from persisting in `formState.errors` after submission (even though we removed the display, clearing errors keeps form state clean for submit-gate logic)

#### 2. `schema.ts` — Fix NaN error + min 5
Replace:
```ts
presentation_duration_minutes: z.coerce.number().int().min(0, "المدة يجب أن تكون 0 أو أكثر"),
```
With:
```ts
presentation_duration_minutes: z.preprocess(
  (val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  },
  z.number({ required_error: "المدة مطلوبة", invalid_type_error: "يرجى إدخال رقم صحيح" })
    .int("يرجى إدخال رقم صحيح")
    .min(5, "المدة يجب أن تكون 5 دقائق أو أكثر")
),
```

### Files changed

| File | Change |
|---|---|
| `AgendaSection.tsx` | Remove `rootError` paragraph; fix min=5 + placeholder; add clearErrors effect |
| `schema.ts` | Replace `z.coerce.number()` with `z.preprocess` + Arabic messages + `.min(5)` |

