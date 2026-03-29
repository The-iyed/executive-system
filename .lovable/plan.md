

## Plan: Fix meeting_owner cleanup when toggling off "on behalf of"

### Problem
When `is_on_behalf_of` is toggled off, `useVisibilityCleanup` resets `meeting_owner` to `""` (empty string, the default for string entries). But the schema expects `meeting_owner` to be an **object or null** — an empty string fails the `meetingUserSchema` object validation silently, blocking form submission with no visible error.

### Fix

**File: `src/modules/shared/features/meeting-request-form/submitter/hooks/useStep1Form.ts`**

Change the `meeting_owner` entry in `SUBMITTER_FIELD_RESET_MAP` from a plain string to an object with `resetValue: null`:

```
// Before
meeting_owner: ["meeting_owner"],

// After
meeting_owner: [{ name: "meeting_owner", resetValue: null }],
```

Single line change, one file. This ensures the field resets to `null` (matching the schema's `.nullable()`) so validation passes when the field is hidden.

