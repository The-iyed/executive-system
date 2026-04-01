

## Plan: Unify Invitees and Scheduling Settings into Details Card

### Problem
The "المدعوون" and "إعدادات الجدولة" sections use centered divider-style headers that look inconsistent with the clean row-based details card above (المنظم, التاريخ, الوقت, الموقع). The screenshot shows these sections floating separately with a different visual pattern.

### Changes

#### `EventDetailModal.tsx` — Move both sections into the details card as rows

**1. Invitees row** (lines 305-355): Remove the centered divider header. Add a new `divide-y` row inside the details card (after Location) with:
- Right side: User icon + "المدعوون" label + count badge (same icon-label pattern as other rows)
- Left side: Avatar stack + names preview

**2. Scheduling Settings row** (lines 357-391): Remove the centered divider header. Add another row inside the card with:
- Right side: Settings icon + "إعدادات الجدولة" label
- Left side: Inline chips for "مبدئي" and "البيانات مكتملة"

**3. Chip styling improvement**: Keep active/inactive chip styling but align them horizontally in the value area (left side of the row), consistent with other row values.

This merges everything into one unified card with `divide-y` rows, eliminating the floating divider sections.

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Move invitees and scheduling sections into the details card as standard rows matching the icon+label pattern |

