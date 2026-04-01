

## Plan: Extend calendar year range + remove date validation for scheduling officers

### Changes

#### 1. `src/lib/ui/components/calendar.tsx` — Extend year dropdown range
Add `startMonth` and `endMonth` defaults so the year dropdown covers current year - 1 to current year + 3:
```tsx
const currentYear = new Date().getFullYear();
// in DayPicker, before {...props}:
startMonth={props.startMonth ?? new Date(currentYear - 1, 0)}
endMonth={props.endMonth ?? new Date(currentYear + 3, 11)}
```

#### 2. `scheduler/Step1Form.tsx` — Remove `minDate` (create flow)
Remove the `minDate` prop from `<MeetingDateField>` and delete the unused `minDate` useMemo + `addDays`/`startOfDay` imports. Schedulers can pick any date.

#### 3. `submitter/Step1Form.tsx` — Remove `minDate` when `isSchedulerEdit` (edit flow)
Pass `minDate` conditionally:
```tsx
minDate={isSchedulerEdit ? undefined : minDate}
```
This ensures scheduling officers editing a meeting have no date restriction, while regular submitters keep the existing validation.

### Files changed

| File | Change |
|---|---|
| `src/lib/ui/components/calendar.tsx` | Add `startMonth`/`endMonth` defaults (year - 1 to year + 3) |
| `scheduler/Step1Form.tsx` | Remove `minDate` from `MeetingDateField`, clean up imports |
| `submitter/Step1Form.tsx` | Pass `minDate={isSchedulerEdit ? undefined : minDate}` |

