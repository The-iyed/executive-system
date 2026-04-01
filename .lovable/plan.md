

## Plan: Ensure only `is_presence_required` exists on normalized invitee objects

### Problem
The API returns both `is_required: true` and `is_presence_required: false` on the same invitee. While `normalizeInvitees` sets `is_presence_required` correctly, the spread (`...r`) preserves the original `is_required` field on the object. This leftover field may cause unexpected behavior in rendering or downstream logic.

### Fix

#### 1. `src/modules/shared/features/invitees-table-form/InviteesTableForm.tsx` — `normalizeInvitees`
After mapping `is_presence_required`, explicitly delete `is_required` from the result so only one canonical field exists:

```ts
const normalizeInvitees = (rows: TableRow[]) => rows.map(r => {
  const { is_required, ...rest } = r as any;
  return {
    ...rest,
    is_presence_required: r.is_presence_required ?? is_required ?? false,
  };
});
```

#### 2. `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts` — `transformDraftToInvitees`
Same approach — exclude `is_required` from spread and use only `is_presence_required`:

```ts
is_presence_required: (inv as Record<string, unknown>).is_presence_required ?? false,
```
Already correct. No change needed.

#### 3. `src/modules/UC02/data/meetingsApi.ts` — `getMeetingById` response
Add a normalization step to strip `is_required` from invitees at the API boundary, ensuring all downstream consumers receive clean data:

```ts
export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  const data = response.data;
  if (data.invitees) {
    data.invitees = data.invitees.map(inv => ({
      ...inv,
      is_presence_required: inv.is_presence_required ?? (inv as any).is_required ?? false,
    }));
  }
  return data;
};
```

### Files changed

| File | Change |
|---|---|
| `InviteesTableForm.tsx` | Destructure out `is_required` before spreading, use only `is_presence_required` |
| `meetingsApi.ts` | Normalize invitees at API boundary to ensure `is_presence_required` is set |

