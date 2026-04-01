

## Plan: Add `name` and `is_presence_required` columns + update preview cards

### Changes

#### 1. `api.ts` — Add `name_ar`/`name_en` to `SuggestedAttendee` interface
Add optional fields: `name_ar?: string`, `name_en?: string`

#### 2. `columns.ts` — Add two new columns
- Add `name` column (optional, type `text`, placeholder "الاسم") right after `email`, with `autoFillFromSearch: true`
- Add `is_presence_required` column (type `checkbox`, label "الحضور إجباري", defaultValue `false`) after `meeting_owner`

#### 3. `InviteesTableForm.tsx` — Map name from search & AI

**Search mapping (line 72-79)** — update name priority order:
```ts
name: result.displayName || result.displayNameEN || result.givenName || "",
```

**AI suggestion mapping (line 57-69)** — add name and is_presence_required:
```ts
name: (s as any).name_ar || (s as any).name_en || `${s.first_name} ${s.last_name}`.trim(),
is_presence_required: false,
```

#### 4. `InviteeCard.tsx` — Use `name` field instead of email prefix

Replace the current logic that extracts name from email (`email.split('@')[0]`) with:
```ts
const name = getDisplayValue(invitee.name) !== "-"
  ? getDisplayValue(invitee.name)
  : email.split('@')[0];
```

Also add `is_presence_required` badge in the badges section (red badge "الحضور إجباري") when true.

### Files changed

| File | Change |
|---|---|
| `api.ts` | Add `name_ar`, `name_en` optional fields to `SuggestedAttendee` |
| `columns.ts` | Add `name` (text, optional) after email; add `is_presence_required` (checkbox) after `meeting_owner` |
| `InviteesTableForm.tsx` | Map `name` with correct priority from search & AI; add `is_presence_required` default |
| `InviteeCard.tsx` | Display real `name` field instead of email prefix; add `is_presence_required` badge |

