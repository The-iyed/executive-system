

## Plan: Improve Template Variables Display with Smart Formatting

### Problem
The detail modal shows raw variable keys (e.g. `is_preliminary_booking`, `online_meeting_link`, `webex_meeting_join_link`) without Arabic labels, boolean values as raw "true"/"false" strings, and empty/useless variables that should be hidden.

### Changes

**1. Expand `variableLabelMap` (`NotificationDetailModal.tsx`)**
Add Arabic labels for all known variable keys:
```
is_preliminary_booking → 'حجز مبدئي'
has_presentation → 'يوجد عرض تقديمي'
online_meeting_link → 'رابط الاجتماع الإلكتروني'
webex_meeting_join_link → 'رابط Webex للانضمام'
meeting_number → 'رقم الاجتماع'
webex_meeting_number → 'رقم اجتماع Webex'
password → 'كلمة المرور'
webex_password → 'كلمة مرور Webex'
sip_address → 'عنوان SIP'
webex_sip_address → 'عنوان SIP Webex'
video_system → 'نظام الفيديو'
host_key → 'مفتاح المضيف'
webex_host_key → 'مفتاح مضيف Webex'
consultant_name → 'اسم المستشار'
```

**2. Smart value formatting**
Add a `formatVariableValue` function that handles:
- **Booleans**: `"true"` → `"نعم"` with green badge, `"false"` → `"لا"` with gray badge
- **URLs**: Keep current copy button behavior
- **Empty/dash values**: Already filtered — no change needed

**3. Filter out truly empty variables**
Enhance the filter to also exclude keys where value is `""`, `"—"`, `null`, or only whitespace — already mostly done, but also skip keys like `meeting_number`, `password`, `sip_address` etc. when their value is empty string (the current filter handles this).

### Files changed

| File | Change |
|---|---|
| `NotificationDetailModal.tsx` | Expand `variableLabelMap` with all known keys, add boolean formatting with Arabic labels and colored badges |

