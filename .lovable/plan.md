

## Plan: Improve directives card UI/UX to match reference + rename status label

### What changes

The reference image shows a **single-row horizontal layout** where everything sits on one line:
- **Right**: Check icon + title
- **Center/Left**: Tags (جدولة, مهم, عاجل) + duration (—) + date (30 مارس 2026) + status badge (تم اعتماد التوجيه) — all inline in a single row

Currently the card uses a two-row layout (title+badge on row 1, tags+actions on row 2). We need to flatten this into one clean row.

Also rename `قيد الانتظار` → `قيد المتابعة`.

### Changes

#### 1. `minister-directive-enums.ts` — Rename OPEN label
Change line 42: `OPEN: 'قيد الانتظار'` → `OPEN: 'قيد المتابعة'`

#### 2. `DirectiveCard.tsx` — Flatten to single-row horizontal layout
Redesign the card to match the reference image:
- Single horizontal flex row with `items-center`
- Right side: status icon (CheckCircle2 or Clock) + title (truncated single line)
- Center: metadata tags in a row (directive type, importance, priority, duration)
- Left side: date + status badge
- Remove the two-row layout, voice player stays below if present
- Actions row stays below as a secondary row (only visible on hover or always visible)
- Remove copy button from inline (or keep it subtle on hover)

The layout follows this horizontal flow (RTL):
```text
[✓ icon] [title...] ——— [جدولة] [مهم] [عاجل] [—] [30 مارس 2026] [تم اعتماد التوجيه ●]
```

### Files changed

| File | Change |
|---|---|
| `minister-directive-enums.ts` | `OPEN: 'قيد المتابعة'` |
| `DirectiveCard.tsx` | Flatten card to single-row horizontal layout matching reference image |

