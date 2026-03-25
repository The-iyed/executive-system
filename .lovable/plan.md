

## Missing Fields When Scheduler Edits via SubmitterModal

### Problem
When a scheduler officer clicks "تعديل" on the meeting detail page (`/meeting/:id`), it opens `SubmitterModal` with `callerRole={MeetingOwnerType.SCHEDULING}`. However, the `SubmitterStep1Form` used inside this modal is missing 3 fields that exist in the `SchedulerStep1Form`:

| # | Field | Arabic Label | In Scheduler Form? | In Submitter Form? |
|---|-------|-------------|-------|----------|
| 1 | `submitter` | مقدّم الطلب | Yes | No |
| 2 | `requires_protocol` | يتطلب بروتوكول | Yes | No |
| 3 | `related_directive` | التوجيه المرتبط | Yes | No |

The `isSchedulerEdit` prop is already passed to `SubmitterStep1Form` but is only used to control the date field's disabled state — it doesn't add the missing fields.

### Plan

#### 1. Add missing fields to `SubmitterStep1Form` (conditionally for scheduler)
**File:** `src/modules/shared/features/meeting-request-form/submitter/Step1Form.tsx`

When `isSchedulerEdit` is true, render the 3 additional fields:
- `MeetingManagerField` (as "مقدّم الطلب") — same component used in SchedulerStep1Form with `name="submitter"`
- `RequiresProtocolField` — already exported from shared fields
- `RelatedDirectiveField` — already exported from shared fields

Place them in the same grid positions as in the SchedulerStep1Form:
- `submitter` field after `PreviousMeetingField` (before `OnBehalfField`)
- `RequiresProtocolField` after the channel/location section
- `RelatedDirectiveField` alongside `NoteField` at the bottom

#### 2. Add missing fields to the submitter schema (optional, for scheduler)
**File:** `src/modules/shared/features/meeting-request-form/submitter/schema.ts`

Add optional fields to `submitterStep1Schema`:
```typescript
submitter: meetingUserSchema.nullable().optional(),
requires_protocol: z.enum([BOOL.TRUE, BOOL.FALSE]).optional(),
related_directive: z.string().optional(),
```

These are optional so submitter flow is unaffected, but they carry data when scheduler edits.

#### 3. Add missing fields to `useSubmitterStep1Form` default values
**File:** `src/modules/shared/features/meeting-request-form/submitter/hooks/useStep1Form.ts`

Add default values for the 3 new fields so they initialize correctly from edit data.

#### 4. Add mapper support for the 3 fields
**File:** `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts`

Ensure `mapMeetingToSubmitterStep1` maps `submitter`, `requires_protocol`, and `related_directive` from the API response so they populate on edit.

#### 5. Ensure `buildStep1FormData` sends the new fields
**File:** `src/modules/shared/features/meeting-request-form/shared/utils/buildStep1FormData.ts`

Add the 3 fields to the FormData builder so they are included in the API payload when present.

### Technical Details

**Files to edit:**
- `src/modules/shared/features/meeting-request-form/submitter/Step1Form.tsx` — conditionally render 3 fields when `isSchedulerEdit`
- `src/modules/shared/features/meeting-request-form/submitter/schema.ts` — add 3 optional fields
- `src/modules/shared/features/meeting-request-form/submitter/hooks/useStep1Form.ts` — add defaults
- `src/modules/shared/features/meeting-request-form/shared/utils/mappers.ts` — map new fields from API
- `src/modules/shared/features/meeting-request-form/shared/utils/buildStep1FormData.ts` — include in payload

No new files or dependencies needed. All field components already exist in the shared exports.

