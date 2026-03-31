

## Plan: Improve past-meeting validation message

### Change

Update the validation error message in `useMeetingDetailPage.ts` from the current generic "لا يمكن اختيار تاريخ أو وقت البداية في الماضي" to a clearer message indicating the meeting time has already passed:

**New message:** `"لقد انتهى وقت هذا الاجتماع. يرجى تحديث موعد البداية لجدولته مجدداً"`

(Translation: "This meeting's time has passed. Please update the start time to reschedule it.")

### Files changed

| File | Change |
|---|---|
| `useMeetingDetailPage.ts` | Update the 3 occurrences of the old message to the new improved one |

