

## Confirmation: All UC05 tabs match UC02

After inspecting all tabs in both UC05 and UC02, here's the status:

| Tab | Shared Component | UC05 matches UC02? |
|---|---|---|
| معلومات الطلب (RequestInfo) | `RequestInfo` + `mapMeetingToRequestInfo` | ✅ Yes |
| معلومات الاجتماع (MeetingInfo) | `MeetingInfoView` + `mapMeetingToInfo` | ✅ Yes |
| المحتوى (Content) | `ContentInfoView` + `mapMeetingToContentInfo` | ✅ Yes |
| قائمة المدعوين (Invitees) | `InviteesTableForm` | ⚠️ Missing wrapper div |
| الملاحظات (Notes) | `RequestNotesView` | ✅ Yes |

### Only change needed

**`UC05/tabs/InviteesTab.tsx`** — Add `<div className="w-full max-w-4xl mx-auto" dir="rtl">` wrapper around `InviteesTableForm` to match UC02's layout.

This is the same single-file change from the previous plan.

