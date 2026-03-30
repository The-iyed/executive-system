
## Plan: Fix Step 3 invitees optimistic update on the detail page

### Root cause
The optimistic cache update is already patching the meeting queries, including the `preview` key. The real issue is in the shared invitees view component:

- `InviteesTableForm` initializes local state with `useState(initialInvitees)`
- when the detail page receives updated `meeting.invitees` after save/refetch, that local state does not refresh
- so the الجدولة tab keeps rendering the old invitees list until a full page reload

This affects all Step 3 changes:
- add new invitee
- edit invitee info
- remove invitee

### Changes

**1. `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx`**
- add a `useEffect` that syncs local `invitees` state whenever `initialInvitees` changes
- keep the current editable behavior for create/edit mode, but ensure view mode reflects external updates immediately
- use a safe fallback so `undefined` becomes `[]`

Example direction:
```ts
const [invitees, setInvitees] = useState<TableRow[]>(initialInvitees ?? []);

useEffect(() => {
  setInvitees(initialInvitees ?? []);
}, [initialInvitees]);
```

**2. Verify consumers that depend on refreshed invitees**
No API or cache-key change is needed for this fix, but this will immediately unblock:
- `UC02/features/meeting-detail/tabs/ScheduleTab.tsx`
- `UC02/features/meeting-detail/tabs/InviteesTab.tsx`
- `UC01/features/PreviewMeeting/tabs/InviteesTab.tsx`
- `UC05/features/content-request-detail/tabs/InviteesTab.tsx`

Because all of them pass `initialInvitees={meeting.invitees}` into the same shared component.

### Result
After editing Step 3 and saving successfully, the detail page invitees section updates right away in قائمة المدعوين without refresh, whether the user:
- updates an existing invitee
- deletes one
- adds a new one

### Technical note
The optimistic cache layer is already present in:
- `optimisticMergeMeeting(...)`
- `buildStep3Patch(...)`
- `syncMeetingDetails(...)`

So this is primarily a view-state synchronization fix, not a React Query fix.

### Files to change
- `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx`
