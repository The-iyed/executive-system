

## Plan: Remove required asterisk (*) from directive fields for scheduler officer

### Problem
When a scheduler officer edits a meeting, the directive fields (طريقة التوجيه, محضر الاجتماع, التوجيه) show a red `*` asterisk even though they are not required for scheduler edits (we already made them optional in the schema).

### Changes

#### 1. `DirectiveSection.tsx` — Accept `required` prop and pass it to child fields
Add a `required?: boolean` prop (default `true`). Pass it to the three `FormField` components instead of hardcoded `required`.

```tsx
interface Props {
  showMethod: boolean;
  showFile: boolean;
  showText: boolean;
  required?: boolean;  // NEW
}

export function DirectiveSection({ showMethod, showFile, showText, required = true }: Props) {
```

- Line 40: `<FormField ... required={required} ...>` (طريقة التوجيه)
- Line 55: `<FormField ... required={required} ...>` (التوجيه)
- Line 78 (MeetingMinutesFileField): pass `required` prop down

#### 2. `submitter/Step1Form.tsx` — Pass `required={!isSchedulerEdit}` to DirectiveSection

```tsx
<DirectiveSection
  showMethod={visibility.directive_method}
  showFile={visibility.previous_meeting_minutes_file_content}
  showText={visibility.directive_text}
  required={!isSchedulerEdit}
/>
```

### Files changed

| File | Change |
|---|---|
| `DirectiveSection.tsx` | Add `required` prop, pass to all `FormField` children and `MeetingMinutesFileField` |
| `submitter/Step1Form.tsx` | Pass `required={!isSchedulerEdit}` to `DirectiveSection` |

