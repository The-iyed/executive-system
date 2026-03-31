

## Plan: Fix طبيعة الاجتماع error message

### Problem
`z.nativeEnum(MeetingNature)` produces an English error like `"Invalid enum value. Expected 'NORMAL' | 'SEQUENTIAL' | 'PERIODIC', received '...'"` because Zod lists the enum **keys**. The `required_error` only covers the "missing" case, not the "invalid value" case.

### Fix

In **both** schema files, replace `z.nativeEnum(MeetingNature, ...)` with `z.enum(...)` using actual enum values + Arabic messages:

**`scheduler/schema.ts` (line 16) and `submitter/schema.ts` (line 27)**

Replace:
```ts
meeting_nature: z.nativeEnum(MeetingNature, { required_error: "طبيعة الاجتماع مطلوبة" }),
```

With:
```ts
meeting_nature: z.enum(
  [MeetingNature.NORMAL, MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC] as [string, ...string[]],
  { required_error: "طبيعة الاجتماع مطلوبة", invalid_type_error: "طبيعة الاجتماع غير صالحة" }
) as z.ZodType<MeetingNature>,
```

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | Replace `z.nativeEnum` with `z.enum` + Arabic error messages |
| `submitter/schema.ts` | Same change for consistency |

