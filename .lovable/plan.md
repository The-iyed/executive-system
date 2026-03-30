

## Plan: Move toggles & notes into the scheduling confirmation dialog

### Problem
The "مبدئي" and "البيانات مكتملة" toggles sit in the page header, and the notes field is buried in the الجدولة tab. The user must navigate between multiple places before confirming a schedule. All scheduling inputs should be consolidated into the تأكيد الجدولة confirmation dialog for a streamlined flow.

### Changes

**1. `src/modules/UC02/features/meeting-detail/components/ScheduleConfirmDialog.tsx`**
- Add new props: `notes: string`, `onNotesChange: (v: string) => void`, `onRequiresProtocolChange: (v: boolean) => void`, `onDataCompleteChange: (v: boolean) => void`
- Replace the static InfoRow for "مبدئي" with an interactive checkbox-style toggle (same design as was in the header)
- Replace the static InfoRow for "البيانات مكتملة" with an interactive checkbox-style toggle
- Add a textarea field for notes below the info rows, bound to `notes`/`onNotesChange`
- Keep the existing read-only InfoRows for dates, channel, and location

**2. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Remove the `quickActions` prop from `DetailPageHeader` (delete lines 155-198)
- Pass new props to `ScheduleConfirmDialog`: `notes`, `onNotesChange`, `onRequiresProtocolChange`, `onDataCompleteChange` — all wired to `h.scheduleForm` / `h.setScheduleForm`

**3. `src/modules/UC02/features/meeting-detail/tabs/ScheduleTab.tsx`**
- Remove the notes `FormTextArea` from the tab (it now lives in the dialog)
- Keep only the invitees table and the success/error banners

**4. `src/modules/shared/components/DetailPageHeader.tsx`**
- Remove the `quickActions` prop and its rendering (cleanup, since no one uses it anymore)

### Result
When the schedule officer clicks "جدولة" or "جدولة مجدداً", the confirmation dialog shows all scheduling controls (toggles + notes + summary) in one place. No more switching tabs or scanning the header. 4 files changed.

