

## Plan: Fix Zod schema to accept null values in user fields

### Root Cause
`meetingUserSchema` uses `z.string().optional()` which accepts `string | undefined` but **rejects `null`**. The API returns `null` for empty fields (e.g. `"objectGUID": null, "cn": null`), so Zod silently rejects the entire user object — the form thinks no valid user was selected and blocks submission.

### Changes

#### 1. `src/modules/shared/features/meeting-request-form/scheduler/schema.ts` (lines 5–13)
Replace `meetingUserSchema` with all fields as `.nullable().optional()` and add missing API fields:

```ts
const meetingUserSchema = z.object({
  id: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  displayNameAR: z.string().nullable().optional(),
  displayNameEN: z.string().nullable().optional(),
  givenName: z.string().nullable().optional(),
  mail: z.string().nullable().optional(),
  objectGUID: z.string().nullable().optional(),
  cn: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  manager: z.string().nullable().optional(),
  is_disabled: z.number().nullable().optional(),
}).passthrough();
```

#### 2. `src/modules/shared/features/meeting-request-form/submitter/schema.ts` (lines 15–24)
Same change (keeping the extra `name` field that already exists):

```ts
const meetingUserSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  displayNameAR: z.string().nullable().optional(),
  displayNameEN: z.string().nullable().optional(),
  givenName: z.string().nullable().optional(),
  mail: z.string().nullable().optional(),
  objectGUID: z.string().nullable().optional(),
  cn: z.string().nullable().optional(),
  sn: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  manager: z.string().nullable().optional(),
  is_disabled: z.number().nullable().optional(),
}).passthrough();
```

### Why this works
- `.nullable()` adds `null` to accepted types → `string | null | undefined`
- Adding all known API columns prevents silent rejection of the user object
- `.passthrough()` still allows any extra unknown fields
- The ID/label fallback chain already built handles display correctly

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | All meetingUserSchema fields → `.nullable().optional()`, add missing API fields |
| `submitter/schema.ts` | Same change |

