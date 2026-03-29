

## Plan: Hide "إرسال للمحتوى" when no presentation attachment

### File 1: `src/modules/shared/components/MeetingActionsBar.tsx`
- Add `hasPresentation?: boolean` prop to `MeetingActionsBarProps`
- In `defaultUnderReviewActions`: update the "إرسال للمحتوى" entry to use `disabled: !hasContent || !hasPresentation` and set `disabledReason` to `'أضف عرضاً تقديمياً في تبويب المحتوى لتفعيل الإرسال'` when `!hasPresentation`
- In `scheduledSchedulingActions`: same guard on the "إرسال للمحتوى" entry

### File 2: `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`
- Derive: `const hasPresentation = meeting?.attachments?.some(a => a.is_presentation) ?? false;`
- Pass `hasPresentation={hasPresentation}` to `<MeetingActionsBar />`

Two files, minimal changes.

