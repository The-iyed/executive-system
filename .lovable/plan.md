

## Plan: Relax scheduler-only required fields in schema and UI

### Problem
For scheduling officers (`isSchedulerEdit`), only these 6 fields should be required:
1. طبيعة الاجتماع (meeting_nature)
2. مقدّم الطلب (submitter)
3. مالك الاجتماع (meeting_owner — when on-behalf is active)
4. عنوان الاجتماع (meeting_title)
5. آلية انعقاد الاجتماع (meeting_channel)
6. الموقع (meeting_location — when channel is physical/hybrid)

Currently, `meeting_type`, `meeting_classification`, and `meeting_confidentiality` are enforced at the **base schema level** (via `nativeEnum` / `.min(1)`), meaning they fail validation even for schedulers. These need to be relaxed.

### Changes

#### 1. `schema.ts` — Make 3 base-level fields optional, enforce in superRefine for non-scheduler only

- **`meeting_type`**: Change from `z.nativeEnum(MeetingType, {...})` to allow empty/optional, then add a superRefine check that enforces it only when `!is_scheduler_edit`
- **`meeting_classification`**: Change from `z.string().min(1, ...)` to `z.string().optional()` (or `.default("")`), add superRefine check for non-scheduler
- **`meeting_confidentiality`**: Change from `z.nativeEnum(MeetingConfidentiality, {...})` to allow optional, add superRefine check for non-scheduler

This ensures scheduler officers can submit without filling these fields.

#### 2. `Step1Form.tsx` — Pass `isSchedulerEdit` to field components that show asterisk

Several field components hardcode `required` in their `<FormField>` call. We need to conditionally hide the asterisk for scheduler. The affected fields:
- **`MeetingTypeField`** — add `required` prop, pass `required={!isSchedulerEdit}`
- **`MeetingCategoryField`** — add `required` prop, pass `required={!isSchedulerEdit}`
- **`ConfidentialityField`** — add `required` prop (if it has one), pass `required={!isSchedulerEdit}`
- **`SectorField`** — already conditionally validated, but ensure asterisk is hidden for scheduler
- **`MeetingDateField`** — already skipped for scheduler in schema, pass `required={!isSchedulerEdit}`

Fields that remain always required (keep `required` as-is):
- `MeetingNatureField` — always required ✅
- `MeetingTitleField` — always required ✅
- `MeetingChannelField` — always required ✅
- `LocationField` — conditionally required (physical/hybrid) for all ✅
- `MeetingOwnerField` — conditionally required (on-behalf) for all ✅

#### 3. Field components — Accept optional `required` prop

Update these field components to accept a `required?: boolean` prop instead of hardcoding `required` on `<FormField>`:
- `MeetingTypeField.tsx`
- `MeetingCategoryField.tsx`
- `ConfidentialityField.tsx` (need to check current implementation)
- `SectorField.tsx`

### Files changed

| File | Change |
|---|---|
| `schema.ts` | Make `meeting_type`, `meeting_classification`, `meeting_confidentiality` optional at base level; enforce via superRefine for non-scheduler |
| `Step1Form.tsx` | Pass `required={!isSchedulerEdit}` to relaxed fields |
| `MeetingTypeField.tsx` | Accept optional `required` prop |
| `MeetingCategoryField.tsx` | Accept optional `required` prop |
| `ConfidentialityField.tsx` | Accept optional `required` prop |
| `SectorField.tsx` | Accept optional `required` prop (if needed) |

