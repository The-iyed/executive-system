## Plan: Fix Zod schema to accept null values in user fields

### Root Cause
`meetingUserSchema` uses `z.string().optional()` which accepts `string | undefined` but **rejects `null`**. The API returns `null` for empty fields (e.g. `"objectGUID": null, "cn": null`), so Zod silently rejects the entire user object — the form thinks no valid user was selected.

### Fix

#### 1. `scheduler/schema.ts` — meetingUserSchema (lines 5–13)
Change all fields to `.nullable().optional()` and add missing API fields:

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

#### 2. `submitter/schema.ts` — meetingUserSchema (lines 15–24)
Same change, adding `name` field that already exists:

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
- `.nullable()` adds `null` to the accepted types → `string | null | undefined`
- `.passthrough()` still allows any extra unknown fields
- Adding explicit fields for all known API columns prevents silent rejection
- No other code changes needed — the ID/label fallback chain handles display

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | All meetingUserSchema fields → `.nullable().optional()`, add missing API fields |
| `submitter/schema.ts` | Same change |
