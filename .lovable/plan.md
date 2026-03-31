

## Plan: Restructure meeting detail modal with label-value layout

### What changes

Replace the current icon-only detail card with a clear **label → value** pattern for each field, making the information more readable and structured.

### New layout structure

```text
┌─ Title + Badge ──────────────── [X] ─┐
│                                       │
│  ┌─────────────────────────────────┐  │
│  │  المنظم      Scheduling Officer │  │
│  │              scheduling@...     │  │
│  ├─────────────────────────────────┤  │
│  │  التاريخ     الخميس 2 أبريل    │  │
│  ├─────────────────────────────────┤  │
│  │  الوقت       01:00 – 00:00     │  │
│  ├─────────────────────────────────┤  │
│  │  الموقع      الغدير             │  │
│  └─────────────────────────────────┘  │
│                                       │
│  المدعوون (1)                         │
│  ┌─ [M] monem@gmail.com ──────────┐  │
│                                       │
│  إعدادات الجدولة                      │
│  ┌─ مبدئي ─┐  ┌─ البيانات ────────┐  │
│                                       │
├───────────────────────────────────────┤
│           عرض التفاصيل   تعديل       │
└───────────────────────────────────────┘
```

### Detail card rows — each row becomes:
- **Right side**: icon + Arabic label (e.g. `المنظم`, `التاريخ`, `الوقت`, `الموقع`)
- **Left side**: the value, right-aligned

This gives a consistent two-column feel: label on the right, value on the left, separated by dividers.

### Specific changes in `EventDetailModal.tsx`

1. **Organizer row**: Add label "المنظم" next to icon, value = name + email
2. **Date row**: Add label "التاريخ", value = formatted date
3. **Time row**: Separate from date — label "الوقت", value = start – end  
4. **Location row**: Add label "الموقع", value = location text or link
5. Keep scheduling settings and invitees sections as-is (already good)

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Restructure detail card rows to label-value pattern |

