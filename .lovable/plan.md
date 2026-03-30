

## Plan: Handle missing request number in detail page header

### Problem
When `request_number` is `null` or empty, the title renders as `"testtime (null)"` — ugly and confusing.

### Approach
Instead of fixing every consumer (6 files), add smart formatting inside `DetailPageHeader` itself. If the title contains `(null)`, `()`, or `( )`, strip that suffix automatically. This is the safest, DRY approach.

### Changes

**1. `src/modules/shared/components/DetailPageHeader.tsx`**
- Sanitize the `title` prop before rendering: strip trailing `(null)`, `(undefined)`, `()`, or empty parens
- Simple regex: `title.replace(/\s*\((?:null|undefined|)\)\s*$/, '').trim()`

**2. Optionally also fix at source in all 6 consumers** (belt-and-suspenders)
- UC01 `PreviewMeeting/index.tsx` — already handles with `?? ''`, but still shows `()`
- UC02 `MeetingDetailPage.tsx`
- UC03 `consultationRequestDetail.tsx`
- UC04 `guidanceRequestDetail.tsx`
- UC05 `ContentRequestDetailPage.tsx`
- UC06 `contentConsultationRequestDetail.tsx`

Change pattern in all from:
```ts
title={`${meeting.meeting_title} (${meeting.request_number})`}
```
to:
```ts
title={meeting.request_number ? `${meeting.meeting_title} (${meeting.request_number})` : meeting.meeting_title}
```

### Recommendation
Do both: sanitize in the header component (defensive) AND fix all 6 consumers (correct). This ensures no `(null)` ever appears regardless of future consumers.

### Result
- Title shows just `"testtime"` when no request number exists
- Shows `"testtime (12345)"` when request number is present
- 7 files changed

