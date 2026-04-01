

## Plan: Reduce required fields for scheduling officers

### Problem
The scheduler schema enforces many required fields (sector, meeting_type, dates, classification, etc.) that should be optional for scheduling officers. Only these fields should be required:
- طبيعة الاجتماع (`meeting_nature`)
- مقدّم الطلب (`submitter`)
- مالك الاجتماع (`meeting_owner` — when `is_on_behalf_of` is true)
- عنوان الاجتماع (`meeting_title`)
- آلية انعقاد الاجتماع (`meeting_channel`)
- الموقع (`meeting_location` — when channel is physical/hybrid)

This applies to both create (scheduler schema) and edit (`isSchedulerEdit` in submitter schema).

### Changes

#### 1. `scheduler/schema.ts` — Relax field-level + superRefine validations

**Field-level changes:**
- `sector`: change `.min(1, ...)` → `.optional()` (remove required)
- `meeting_type`: change `z.nativeEnum(MeetingType, { required_error })` → add `.optional()` or make it have a default
- `meeting_classification`: change `.min(1, ...)` → `.optional()` (remove required)

**superRefine changes — remove these checks entirely:**
- Remove `meeting_start_date` required check (lines 63-64)
- Remove `meeting_end_date` required check (line 64)
- Remove `urgent_reason` required check (lines 60-61)
- Remove `meeting_classification === BUSINESS` → `meeting_classification_type` required (lines 71-72)
- Remove `PRIVATE_MEETING / BILATERAL_MEETING` → `meeting_justification` required (lines 74-75)
- Remove `GOVERNMENT_CENTER_TOPICS` → `related_topic` + `deadline` required (lines 77-80)

**Keep these checks:**
- `meeting_nature` sequential/periodic → `previous_meeting_id` required
- `is_on_behalf_of === TRUE` → `meeting_owner` required
- `meeting_channel` physical/hybrid → `meeting_location` required
- `meeting_location === OTHER` → `meeting_location_custom` required
- Agenda validation (only when items exist)

#### 2. `submitter/schema.ts` — Guard existing validations with `!is_scheduler_edit`

Wrap the following superRefine checks with `if (!data.is_scheduler_edit)`:
- `meeting_start_date` required (lines 87-89)
- `meeting_end_date` required (lines 90-92)
- `urgent_reason` required (line 78-80)
- `meeting_classification`-dependent checks: `meeting_justification`, `related_topic`, `deadline` (lines 105-113)
- `sector` required for internal (lines 69-71)

Keep unconditionally:
- `meeting_location` / `meeting_location_custom` (channel-dependent)
- `meeting_owner` (on-behalf-dependent)
- `previous_meeting_id` (nature-dependent)
- Agenda validation (already guarded by `is_scheduler_edit`)

#### 3. `scheduler/Step1Form.tsx` — Remove `required` prop from `SectorField`

Change `<SectorField required />` → `<SectorField />` since sector is no longer required for schedulers.

### Files changed

| File | Change |
|---|---|
| `scheduler/schema.ts` | Make `sector`, `meeting_type`, `meeting_classification` optional; remove date/classification superRefine checks |
| `submitter/schema.ts` | Guard date, sector, classification superRefine checks with `!is_scheduler_edit` |
| `scheduler/Step1Form.tsx` | Remove `required` from `SectorField` |

