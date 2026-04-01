

## Plan: Remove dead/replaced code from UC06 detail page

### Problem
After replacing the 4 tabs (request-info, content, meeting-info, invitees) with shared components, significant dead code remains: inline tab markup, helper functions, unused imports, unused state, and the entire commented-out "attachments" tab.

### Code to remove

#### 1. Unused imports (line 4, 8-12, 25)
- **Lucide icons**: `ChevronDown`, `ChevronUp`, `Eye`, `Download`, `User`, `Hash` — none used after shared components replace inline markup. Keep `Clock` (consultations-log tab).
- **Shared components**: `MeetingInfo`, `Mou7tawaContentTab`, `ReadOnlyField`, `MeetingInfoData` — replaced by shared feature imports (`RequestInfo`, `MeetingInfoView`, `ContentInfoView`).
- **`pdfIcon`** import (line 25) — only used in dead attachments tab.

#### 2. Helper functions (lines 30-76)
- **`getStatusLabel`** (lines 30-35) — keep, still used at line 293.
- **`formatFileSize`** (lines 38-42) — remove, only used in dead attachments tab.
- **`getNotesText`** (lines 45-76) — remove, replaced by shared mappers.

#### 3. Unused state (line 82)
- **`activeSubTab`** state — only used in dead attachments tab.

#### 4. Dead `meetingInfoData` useMemo (lines 140-180)
- Entire block removed — replaced by `mapMeetingToInfo`.

#### 5. Dead attachment filter variables (lines 183-190)
- **`presentationAttachments`**, **`prevAttId`**, **`additionalAttachments`** — only used in dead tabs being replaced by shared components.

#### 6. Dead "attachments" tab content (lines 384-586)
- The entire `{activeTab === "attachments" && ...}` block — the tab was already commented out of the tabs array but the render code remained (~200 lines of dead markup).

### Summary of removals

| What | Lines | Reason |
|---|---|---|
| Lucide icons: `ChevronDown`, `ChevronUp`, `Eye`, `Download`, `User`, `Hash` | 4 | Unused after shared components |
| `MeetingInfo`, `Mou7tawaContentTab`, `ReadOnlyField`, `MeetingInfoData` | 8-12 | Replaced by shared features |
| `pdfIcon` import | 25 | Only used in dead attachments tab |
| `formatFileSize` helper | 38-42 | Only used in dead attachments tab |
| `getNotesText` helper | 45-76 | Replaced by shared mappers |
| `activeSubTab` state | 82 | Only used in dead attachments tab |
| `meetingInfoData` useMemo | 140-180 | Replaced by `mapMeetingToInfo` |
| `presentationAttachments`, `prevAttId`, `additionalAttachments` | 183-190 | Only used in replaced tabs |
| Entire attachments tab render block | 384-586 | Dead code (tab commented out) |
| Inline request-info tab (ReadOnlyField grid) | 310-348 | Replaced by shared `RequestInfo` |
| Inline content tab (Mou7tawaContentTab) | 351-382 | Replaced by shared `ContentInfoView` |
| Inline meeting-info tab (MeetingInfo) | 588-592 | Replaced by shared `MeetingInfoView` |
| Inline invitees tab (unwrapped) | 595-597 | Replaced by wrapped shared version |

### Files changed

| File | Change |
|---|---|
| `contentConsultationRequestDetail.tsx` | Remove ~350 lines of dead code, unused imports, helpers, state, and useMemo; replace 4 tab renders with shared components |

