

## Plan: Hide required asterisk (`*`) on non-required fields for scheduler

### Problem
Several conditionally-visible fields hardcode `required` on their `<FormField>`, showing a `*` asterisk even for scheduling officers — but the schema does NOT require them for schedulers. This is misleading.

### Fields to fix

These 5 fields hardcode `required` in their JSX but are skipped in the schema for schedulers:

| Field | File | Schema enforces for scheduler? |
|---|---|---|
| مبرر الاستعجال (UrgentReasonField) | `UrgentReasonField.tsx` | No (line 90) |
| مبرر اللقاء (MeetingJustificationField) | `MeetingJustificationField.tsx` | No (line 120) |
| تصنيف الاجتماع (ClassificationTypeField) | `ClassificationTypeField.tsx` | No (not validated) |
| موضوع التكليف المرتبط (RelatedTopicField) | `RelatedTopicField.tsx` | No (line 123) |
| تاريخ الاستحقاق (DeadlineField) | `DeadlineField.tsx` | No (line 126) |

**Note**: `LocationField` and `LocationCustomField` remain always required (schema enforces for all users) — no change needed.

### Changes

#### 1. Each of the 5 field components — Accept optional `required` prop

Add `required?: boolean` to each component's Props interface, default to `true`, and pass it to `<FormField>`.

#### 2. `Step1Form.tsx` — Pass `required={!isSchedulerEdit}` to each

```tsx
{visibility.urgent_reason && <UrgentReasonField required={!isSchedulerEdit} />}
{visibility.meeting_justification && <MeetingJustificationField required={!isSchedulerEdit} />}
{visibility.meeting_classification_type && <ClassificationTypeField required={!isSchedulerEdit} />}
{visibility.related_topic && <RelatedTopicField required={!isSchedulerEdit} />}
{visibility.deadline && <DeadlineField required={!isSchedulerEdit} />}
```

### Files changed

| File | Change |
|---|---|
| `UrgentReasonField.tsx` | Add `required` prop, pass to `<FormField>` |
| `MeetingJustificationField.tsx` | Add `required` prop, pass to `<FormField>` |
| `ClassificationTypeField.tsx` | Add `required` prop, pass to `<FormField>` |
| `RelatedTopicField.tsx` | Add `required` prop, pass to `<FormField>` |
| `DeadlineField.tsx` | Add `required` prop, pass to `<FormField>` |
| `Step1Form.tsx` | Pass `required={!isSchedulerEdit}` to the 5 fields above |

