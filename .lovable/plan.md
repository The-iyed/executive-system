

## Plan: Improve الجدولة tab UI/UX

### Changes

**1. `src/modules/UC02/features/meeting-detail/tabs/ScheduleTab.tsx`**
- Remove the inline success banner (`تم جدولة الاجتماع بنجاح`) — scheduling success will be shown as a toast instead
- Remove the `scheduleMutationSuccess` prop since it's no longer needed here
- Pass `viewLayout="cards"` to `InviteesTableForm` so invitees render as the card grid layout
- Clean up the empty section wrapper — since toggles and notes moved to the confirmation dialog, simplify to just render the invitees card list directly with a clean header

**2. `src/modules/UC02/features/meeting-detail/hooks/useMeetingDetailPage.ts`**
- Add a toast call (`toast({ title: "تم جدولة الاجتماع بنجاح" })`) inside the `scheduleMutation` `onSuccess` callback instead of relying on the inline banner
- Import `useToast` or `toast` from the project's toast utility

**3. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Remove `scheduleMutationSuccess` prop from `ScheduleTab` usage (no longer needed)

### Result
- Success feedback appears as a toast notification (visible from any tab)
- Invitees display as styled cards in a responsive grid instead of a flat table
- Cleaner, simpler tab layout

3 files changed.

