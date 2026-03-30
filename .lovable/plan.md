

## Plan: Fix SubmitterModal to sync `draftId` with `editMeetingId`

### Root Cause
`useModalSteps` initializes `draftId` via `useState(editMeetingId ?? null)`. Since React's `useState` only uses the initial value, when the `SubmitterModal` stays mounted and `editMeetingId` changes (e.g. from `null` to a UUID), the internal `draftId` stays `null` — causing Step 1 to POST (create) instead of PATCH (update).

### Fix

**File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useModalSteps.ts`**

Add a `useEffect` to sync `draftId` whenever `editMeetingId` changes:

```ts
import { useState, useRef, useCallback, useEffect } from "react";

// Inside useModalSteps, after line 20:
useEffect(() => {
  setDraftId(editMeetingId ?? null);
}, [editMeetingId]);
```

This ensures that when the calendar passes a new `editMeetingId`, the internal `draftId` updates accordingly, and `saveDraftBasicInfo` receives the correct `draftId` to trigger a PATCH request.

### Result
- 1 file changed, 4 lines added
- Step 1 correctly uses PATCH when `editMeetingId` is provided
- No impact on create flow (when `editMeetingId` is undefined, `draftId` stays null → POST)

