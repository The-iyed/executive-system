

## Plan: Convert "مبدئي" and "البيانات مكتملة" to quick-action buttons

### Problem
The two toggle fields ("مبدئي" and "البيانات مكتملة") are currently rendered as full form sections with labels and switches inside the card. The user wants them displayed as compact quick-action buttons in the header area of the section instead.

### Changes

**File: `src/modules/UC02/features/meeting-detail/tabs/ScheduleTab.tsx`**

Move the two switches out of the form body (lines 51-66) and place them as inline quick-action toggle chips in the section header row (line 33), next to the title.

**Before (header):**
```tsx
<div className="flex items-center gap-3 px-6 py-4 ...">
  <div className="w-9 h-9 ..."><CalendarMinus .../></div>
  <h2>إعدادات الجدولة</h2>
</div>
```

**After (header with quick actions):**
```tsx
<div className="flex items-center gap-3 px-6 py-4 ...">
  <div className="w-9 h-9 ..."><CalendarMinus .../></div>
  <h2>إعدادات الجدولة</h2>
  <div className="mr-auto flex items-center gap-3">
    {/* Quick action: مبدئي */}
    <button
      type="button"
      onClick={() => onScheduleFormChange({ requires_protocol: !scheduleForm.requires_protocol })}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
        ${!scheduleForm.requires_protocol
          ? 'bg-[#048F86]/10 text-[#048F86] border-[#048F86]/30'
          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'}`}
    >
      مبدئي
    </button>
    {/* Quick action: البيانات مكتملة */}
    <button
      type="button"
      onClick={() => onScheduleFormChange({ is_data_complete: !scheduleForm.is_data_complete })}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
        ${scheduleForm.is_data_complete
          ? 'bg-[#048F86]/10 text-[#048F86] border-[#048F86]/30'
          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'}`}
    >
      البيانات مكتملة
    </button>
  </div>
</div>
```

- Remove the two `FormField` + `FormSwitch` blocks (lines 51-66) from the form body
- The notes textarea and invitees table remain unchanged in the body
- Active state shown with teal background/border, inactive with gray outline — matching the project's design language

Single file changed.

