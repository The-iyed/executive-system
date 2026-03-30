

## Plan: Fix build errors, deduplicate enums, fix meeting detail field labels

### Part 1 — Fix build errors (blocking)

**1a. `src/modules/UC03/data/consultationsApi.ts`** — Add `id` to `ConsultationRequestDetailResponse`:
```ts
export interface ConsultationRequestDetailResponse {
  id?: string;
  meeting_request: ConsultationRequestApiResponse;
  consultation_question: string;
}
```

**1b. `src/modules/UC04/data/guidanceApi.ts`** — Add `id` and `meeting_owner` to `GuidanceRequestDetailResponse` and `GuidanceRequestApiResponse`:
```ts
// GuidanceRequestDetailResponse
export interface GuidanceRequestDetailResponse {
  id?: string;
  meeting_request: GuidanceRequestApiResponse;
  guidance_question: string | null;
}

// GuidanceRequestApiResponse — add:
meeting_owner?: { username?: string; name?: string } | null;
```

**1c. `src/modules/auth/context/AuthProvider.tsx`** — Fix `@analytics` import (alias not in tsconfig):
```ts
import { trackEvent } from '@/lib/analytics';
```

### Part 2 — Add `ORGANIZATIONAL_STRUCTURING` to shared `meeting-types.ts`

In `MeetingClassificationType` enum and labels:
```ts
export enum MeetingClassificationType {
  STRATEGIC = 'STRATEGIC',
  OPERATIONAL = 'OPERATIONAL',
  SPECIAL = 'SPECIAL',
  ORGANIZATIONAL_STRUCTURING = 'ORGANIZATIONAL_STRUCTURING',
}
// Labels — add:
[MeetingClassificationType.ORGANIZATIONAL_STRUCTURING]: 'بناء تنظيمي',
```

### Part 3 — Move form-only constants to `meeting-types.ts`

Add to `src/modules/shared/types/meeting-types.ts`:
- `BOOL` constant
- `DIRECTIVE_METHOD_OPTIONS` array
- `MEETING_MANAGERS` placeholder
- `MeetingNature` enum + labels + options
- `MINISTER_SUPPORT_OTHER_VALUE` constant
- `MEETING_CLASSIFICATION_TYPE_OPTIONS` (the `MEETING_CLASSIFICATION_OPTIONS` from form enums)
- `getMeetingSubCategoryLabel` helper

Note: The form's `AttendanceMechanism` uses English API values (`PHYSICAL`/`VIRTUAL`/`HYBRID`/`TBD`), which is the same concept as `Channel` already in `meeting-types.ts`. We'll re-export `Channel as AttendanceMechanism` so form imports don't break.

### Part 4 — Replace form `enums.ts` with re-exports

Replace the entire `src/modules/shared/features/meeting-request-form/shared/types/enums.ts` with re-exports from `@/modules/shared/types`:
```ts
export {
  Sector, SectorLabels, SECTOR_OPTIONS,
  MeetingType, MeetingTypeLabels, MEETING_TYPE_OPTIONS,
  MeetingClassification, MeetingClassificationLabels, MEETING_CATEGORY_OPTIONS,
  MeetingSubCategory, MeetingSubCategoryLabels, MEETING_SUB_CATEGORY_OPTIONS,
  MeetingConfidentiality, MeetingConfidentialityLabels,
  MeetingChannelLabels, MEETING_CHANNEL_OPTIONS,
  MeetingLocation, MEETING_LOCATION_OPTIONS,
  MINISTER_SUPPORT_TYPE_OPTIONS, MINISTER_SUPPORT_OTHER_VALUE,
  DIRECTIVE_METHOD_OPTIONS, DirectiveMethodLabels,
  BOOL,
  MeetingNature, MeetingNatureLabels, MEETING_NATURE_OPTIONS,
  Channel as AttendanceMechanism,
  getMeetingCategoryOptions,
  EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES as EXTERNAL_MEETING_EXCLUDED_CATEGORIES,
  MEETING_CLASSIFICATION_TYPE_OPTIONS as MEETING_CLASSIFICATION_OPTIONS,
  MEETING_MANAGERS,
} from '../../../../types';
```

No import changes needed in 19+ consumer files — they still import from `../types/enums`.

### Part 5 — Add `meeting_sub_category` to meeting info mapper

**`src/modules/shared/features/meeting-info/meetingInfoMapper.ts`**:
- Add `meeting_sub_category?: string | null` to `RawMeetingForInfo`
- Add field to `basicFields` array:
  ```ts
  { key: 'meeting_sub_category', label: 'التصنيف الفرعي',
    value: getMeetingSubCategoryLabel(meeting.meeting_sub_category) ?? null },
  ```

### Summary of files changed

| File | Action |
|------|--------|
| `src/modules/shared/types/meeting-types.ts` | Add `ORGANIZATIONAL_STRUCTURING`, `BOOL`, `DIRECTIVE_METHOD_OPTIONS`, `MeetingNature`, `MEETING_MANAGERS`, `MINISTER_SUPPORT_OTHER_VALUE`, `MEETING_CLASSIFICATION_TYPE_OPTIONS`, `getMeetingSubCategoryLabel` |
| `src/modules/shared/features/meeting-request-form/shared/types/enums.ts` | Replace with re-exports |
| `src/modules/shared/features/meeting-info/meetingInfoMapper.ts` | Add `meeting_sub_category` field |
| `src/modules/UC03/data/consultationsApi.ts` | Add `id` to detail response |
| `src/modules/UC04/data/guidanceApi.ts` | Add `id` to detail response, `meeting_owner` to API response |
| `src/modules/auth/context/AuthProvider.tsx` | Fix `@analytics` → `@/lib/analytics` |

