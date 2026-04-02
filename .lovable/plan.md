

## Plan: Make action buttons tag-sized and highlighted

### Problem
The action buttons (الأخذ بالتوجيه, طلب إجتماع) are currently larger than the metadata tags (`px-3.5 py-1.5 text-[12px] rounded-lg`). They should match the tag size and sit alongside them in the metadata tags row, with highlighted colors to stand out.

### Changes

#### 1. `DirectiveCard.tsx` — Resize buttons to tag size and move into tags row

- **Move** the action buttons block from after the date (line 128-145) into the metadata tags `<div>` (line 86-117), placing them right after the existing tags
- **Shrink** button base classes from `px-3.5 py-1.5 rounded-lg text-[12px]` → `px-2 py-0.5 rounded-md text-[10px]` to match the tag dimensions exactly
- **Icon size**: reduce from `w-3.5 h-3.5` to `size-3` (matching tag icons)

#### 2. `DirectivesFeature.tsx` — Update action classNames for highlight colors

- **الأخذ بالتوجيه** (take): `bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all`
- **طلب إجتماع** (meeting): `bg-teal-500/10 border border-teal-500/30 text-teal-600 font-semibold hover:bg-teal-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all`
- Update icon classes from `w-3.5 h-3.5` to `size-3`

### Layout result (RTL)
```text
[✓] [title...] [copy] [جدولة] [مهم] [عاجل] [الأخذ بالتوجيه] [طلب إجتماع] [صوتي] — [date] [status●]
```

### Files changed

| File | Change |
|---|---|
| `DirectiveCard.tsx` | Move actions into tags div, shrink to `px-2 py-0.5 rounded-md text-[10px]` |
| `DirectivesFeature.tsx` | Update action classNames to highlighted tag-like colors, icon size to `size-3` |

