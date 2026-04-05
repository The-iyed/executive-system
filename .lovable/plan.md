

## Plan: Show sync message when `meeting_id` is null

### Problem
When clicking a calendar event from Outlook that has `meeting_id: null`, the modal still shows "عرض التفاصيل" (which navigates to `/meeting/undefined`) and "تعديل" buttons. These are broken for Outlook-only events.

### How it works now
- `display.meetingId` is derived from the API response or event data (line 153)
- The "تعديل" button is already gated on `display.meetingId` (line 377)
- The "عرض التفاصيل" button falls back to `event.id` when no meetingId (line 390) — navigating to an Outlook item ID which doesn't work

### Changes to `EventDetailModal.tsx`

#### 1. When `!display.meetingId`: replace footer actions with sync banner
- Hide "عرض التفاصيل" and "تعديل" buttons
- Show a muted info banner with `RefreshCw` icon (animated spin) and text: "جاري مزامنة البيانات من Outlook، يرجى الانتظار لحظات"
- Keep "انضم للاجتماع" link if `display.isLink` exists (the meeting link comes from Outlook directly)

#### 2. Footer logic
```text
if (display.meetingId):
  [تعديل] [عرض التفاصيل] [انضم للاجتماع]   ← current

if (!display.meetingId):
  [🔄 جاري مزامنة البيانات من Outlook، يرجى الانتظار لحظات]
  [انضم للاجتماع]   ← only if link exists
```

### Files changed

| File | Change |
|---|---|
| `EventDetailModal.tsx` | Wrap edit+details buttons in `display.meetingId` check; add sync banner with `RefreshCw` icon when no meetingId |

