

## Plan: Improve DetailPageHeader UI/UX

### Changes

**`src/modules/shared/components/DetailPageHeader.tsx`**

1. **Remove "تغييرات غير محفوظة" badge** — delete the `hasChanges` rendering block (lines 99-109) and remove the prop from the interface (keep the prop in the type for backward compat but stop rendering it)

2. **Improve Edit button styling** — replace inline `style` gradient with Tailwind classes using the project's teal theme. Add smooth hover animations:
   - `transition-all duration-200`
   - `hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]`
   - Use `bg-gradient-to-l from-[#048F86] to-[#34C3BA]` instead of inline style
   - Add `rounded-xl` pill shape with proper padding

3. **Improve Back button** — add `transition-all duration-200` and `hover:scale-105 active:scale-95` for micro-interaction feedback

4. **Improve primary/secondary action wrapper** — add `[&_button]:transition-all [&_button]:duration-200` so any button passed as `primaryAction` or `secondaryAction` inherits smooth transitions

5. **Polish the overall card** — replace inline `boxShadow` style with Tailwind `shadow-sm hover:shadow-md transition-shadow` for consistency

### Result
- Cleaner header without the distracting unsaved-changes pulse badge
- All buttons have consistent teal gradient theme with smooth hover/active animations
- Better micro-interactions across back, edit, and action buttons
- 1 file changed

