

## Plan: Improve Notifications List Layout and Detail Modal

### Problem
1. The list page has too much white space — rows are spread across full width with content clustered to the right
2. The detail modal has an unnecessary colored border-top bar, shows raw links instead of copyable values, and uses inline date formatting instead of the shared `formatDateTimeArabic` / `formatTimeAgoArabic` utilities
3. The variable "link" shows as raw text — should be a copy button instead

### Changes

**1. List Page (`index.tsx` + `NotificationCard.tsx`) — Grid layout**
- Switch from full-width row list to a **2-column grid** (`grid grid-cols-1 md:grid-cols-2`) inside the container
- Each card becomes a compact bordered card (`rounded-xl border border-border/30 p-4`) with hover elevation
- Remove the `border-b` divider pattern, use gap spacing instead (`gap-3 p-4`)
- Cards show: status dot + subject on top row, type badge + recipient on second row, relative time (using `formatTimeAgoArabic`) on bottom
- Adjust loading skeletons to match grid layout

**2. Detail Modal (`NotificationDetailModal.tsx`) — Polish**
- Remove the colored top border bar (`h-1.5` accent div)
- Use `formatDateTimeArabic` from `@/modules/shared/utils/format` instead of inline `toLocaleDateString`
- For template variables that contain URLs (detect `http` prefix): render a "نسخ الرابط" copy button instead of showing the raw URL text
- Add `link` to `variableLabelMap` as `'الرابط'`
- Tighten spacing and improve section visual hierarchy

**3. Card Date (`NotificationCard.tsx`)**
- Replace inline `toLocaleDateString` with `formatTimeAgoArabic` for list view (shows "منذ ساعة" etc.)
- Use `formatDateTimeArabic` in the detail modal for full date

### Technical details
- Import `formatTimeAgoArabic` and `formatDateTimeArabic` from `@/modules/shared/utils/format`
- URL detection: `String(value).startsWith('http')` → render copy button with `navigator.clipboard.writeText`
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-3 p-4` inside the container div

### Files changed

| File | Change |
|---|---|
| `Notifications/index.tsx` | Switch list div to 2-column grid layout, adjust skeleton grid |
| `Notifications/components/NotificationCard.tsx` | Compact card style with border/rounded, use `formatTimeAgoArabic` |
| `Notifications/components/NotificationDetailModal.tsx` | Remove top accent bar, use shared date utils, copy button for URL variables, add `link` label |

