

## Plan: Unify all module mappers to use shared `mapMeetingToCardData` and remove dead code

### Problem
- UC01, UC03, UC04, UC05, UC06 each have their own mapper files with duplicate logic
- UC02 correctly uses the shared `mapMeetingToCardData` from `src/modules/shared/utils/meetingMapper.ts`
- The shared mapper already has `resolveSubmitterName` that extracts name from the `submitter` object (ar_name → name → first+last → email → username → submitter_name fallback)
- Other modules read only `submitter_name` (often null), causing missing submitter names in lists

### Changes

**1. Update API interfaces to include `submitter` object**

Add `submitter?: SubmitterObject | string | null` to each module's API response interface so they satisfy `MeetingMapperInput`:
- `src/modules/UC01/data/meetingsApi.ts`
- `src/modules/UC03/data/consultationsApi.ts`
- `src/modules/UC04/data/guidanceApi.ts`
- `src/modules/UC05/data/contentApi.ts`
- `src/modules/UC06/data/contentConsultantApi.ts`

**2. Switch all list pages to use shared mapper**

Replace local mapper imports with the shared one:

| File | Old import | New import |
|------|-----------|------------|
| `src/modules/UC01/features/Meeting/index.tsx` | `from '../../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC01/features/PreviousMeeting/index.tsx` | `from '../../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC01/hooks/useMeetings.ts` | `from '../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC01/hooks/usePreviousMeetings.ts` | `from '../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC01/pages/workBasket.tsx` | `from '../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC01/pages/scheduledMeetings.tsx` | `from '../utils/meetingMapper'` | `from '@/modules/shared/utils/meetingMapper'` |
| `src/modules/UC03/pages/consultationRequests.tsx` | `mapConsultationRequestToCardData` | `mapMeetingToCardData` from shared |
| `src/modules/UC04/pages/guidanceRequests.tsx` | `mapGuidanceRequestToCardData` | `mapMeetingToCardData` from shared |
| `src/modules/UC04/pages/exceptionRequest.tsx` | `mapGuidanceRequestToCardData` | `mapMeetingToCardData` from shared |
| `src/modules/UC05/pages/contentRequests.tsx` | `mapContentRequestToCardViewData` | `mapMeetingToCardData` from shared |
| `src/modules/UC06/pages/contentConsultationRequests.tsx` | `mapContentConsultationRequestToCardData` | `mapMeetingToCardData` from shared |

For UC01 hooks that use `MeetingDisplayData`, change type to `MeetingCardData` (the shared mapper's return type already includes all the fields needed: `requestNumber`, `meetingCategory`, `meetingDate`, `isDataComplete`).

**3. Delete dead mapper files and unused components**

Remove entirely:
- `src/modules/UC01/utils/meetingMapper.ts` — replaced by shared mapper
- `src/modules/UC03/utils/consultationMapper.ts` — replaced by shared mapper
- `src/modules/UC04/utils/guidanceMapper.ts` — replaced by shared mapper
- `src/modules/UC05/utils/contentMapper.ts` — replaced by shared mapper
- `src/modules/UC06/utils/contentConsultantMapper.ts` — replaced by shared mapper
- `src/modules/UC03/components/consultation-request-card.tsx` — unused component
- `src/modules/UC03/components/consultation-requests-grid.tsx` — unused component
- `src/modules/UC04/components/guidance-request-card.tsx` — unused component
- `src/modules/UC04/components/guidance-requests-grid.tsx` — unused component

### Result
- All modules use one shared mapper with proper submitter name resolution
- Submitter names display correctly across all list pages (including `/meetings`)
- ~300 lines of duplicate code removed
- No behavioral change for UC02 (already using shared mapper)

