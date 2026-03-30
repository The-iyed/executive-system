

## Plan: Improve معلومات الاجتماع tab display

### Problem
1. Fields with no data are hidden — user wants ALL fields always visible with "-" as fallback
2. Agenda empty state shows a plain text box instead of an empty table structure
3. Link field style needs to match the reference image (icon + label + URL + copy/open buttons in a row)

### Changes

**1. `src/modules/shared/features/meeting-info/MeetingInfoView.tsx`**

- **Show all fields always**: Remove the `isEmptyValue` filter from all sections — render every field, displaying "—" when value is empty
- **Update `FieldCell`**: Remove the early return for empty values — always render the field with `value ?? '—'`
- **Improve `LinkField`**: Redesign to match image — horizontal row with location icon on right, label text "رابط الاجتماع", truncated URL in parentheses, copy button and open-in-new-tab button on the left
- **Agenda empty state**: Replace the plain placeholder div with an empty table that still shows column headers and a single row with "لا توجد بنود" message spanning all columns

**2. `src/modules/shared/features/meeting-info/meetingInfoMapper.ts`**

- Remove `alwaysShow` usage since all fields will now always show
- Ensure all field values fall through to `null` gracefully (the view will handle showing "—")

### Result
- All meeting info fields are always visible with "—" for missing data
- Agenda section always shows table headers even when empty
- Link field matches the reference image design with copy + open buttons
- 2 files changed

