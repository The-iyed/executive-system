

## Plan: Remove auto-close logic from توثيق الاجتماع tab

### Changes

**`src/modules/UC02/features/meeting-detail/tabs/MeetingDocumentationTab.tsx`**

1. **Remove auto-close imports and code**:
   - Remove `useEffect`, `useRef` from imports
   - Remove `useQueryClient`, `useMutation` from react-query imports
   - Remove `closeMeetingRequest` from API imports
   - Remove `MeetingStatus` from shared imports
   - Remove `useToast` import
   - Delete `hasTriggeredClose` ref
   - Delete `queryClient` and `toast` declarations
   - Delete the entire `closeMutation` block (~30 lines)
   - Delete the `useEffect` auto-close block (~10 lines)

2. **Simplify props interface**:
   - Remove `meetingId` and `meetingStatus` props (no longer needed)
   - Keep only `meetingTitle`

3. **Update comment** at the top — remove mention of auto-close

**`src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Stop passing `meetingId` and `meetingStatus` to `MeetingDocumentationTab`

### Result
- Tab becomes a pure read-only view (PDF + directives) with no side effects
- Visible in both SCHEDULED and CLOSED states as before
- 2 files changed

