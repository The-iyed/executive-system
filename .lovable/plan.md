

## Plan: Relax required indicators in scheduler CREATE form

### Problem
The scheduler's own `SchedulerStep1Form` (used for creating meetings) doesn't pass `required={false}` to fields that are optional in the schema. This means asterisks (`*`) appear on fields like Sector, Meeting Type, Confidentiality, Urgent Reason, etc. — misleading since the schema doesn't require them.

Additionally, `meeting_confidentiality` on line 47 of `scheduler/schema.ts` uses `z.nativeEnum(MeetingConfidentiality)` which is strict — it should be made optional to match the relaxed rules.

### Required fields (keep asterisk)
1. طبيعة الاجتماع (`meeting_nature`) ✅
2. مقدّم الطلب (`submitter`) ✅
3. مالك الاجتماع (`meeting_owner` — when on-behalf) ✅
4. عنوان الاجتماع (`meeting_title`) ✅
5. آلية انعقاد الاجتماع (`meeting_channel`) ✅
6. الموقع (`meeting_location` — when physical/hybrid) ✅

### Changes

#### 1. `scheduler/schema.ts` — Make `meeting_confidentiality` optional
Change line 47 from `z.nativeEnum(MeetingConfidentiality)` to `z.nativeEnum(MeetingConfidentiality).optional()`.

#### 2. `scheduler/Step1Form.tsx` — Pass `required={false}` to optional fields
Update the following field usages to include `required={false}`:
- `<SectorField required={false} />`
- `<MeetingTypeField required={false} />`
- `<UrgentReasonField required={false} />`
- `<MeetingDateField ... required={false} />`
- `<MeetingCategoryField ... required={false} />`
- `<MeetingJustificationField required={false} />`
- `<ClassificationTypeField required={false} />`
- `<RelatedTopicField required={false} />`
- `<DeadlineField required={false} />`
- `<ConfidentialityField required={false} />`

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | Make `meeting_confidentiality` optional |
| `scheduler/Step1Form.tsx` | Pass `required={false}` to all non-required fields |

