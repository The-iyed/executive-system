

## Plan: Modernize MeetingActionsBar UI/UX

### Current state
The FAB opens an arc of small icon-only circles (44px) with tooltips. Issues: icons are hard to identify without hovering, the arc layout feels dated, no labels visible, no staggered animation.

### Approach
Replace the arc layout with a vertical stack of labeled pill buttons that fan out from the FAB with staggered spring animations. Each action shows icon + label inline. The FAB itself gets the branded teal gradient. The backdrop gets a smoother blur.

### Changes — 1 file: `src/modules/shared/components/MeetingActionsBar.tsx`

1. **Replace arc layout with vertical stack** — actions render as a column of pill-shaped buttons above the FAB, each with icon + label side-by-side. Remove the `R`, `ARC_SPAN`, angle math, and `compact` mode entirely.

2. **Staggered entrance animation** — each action pill gets an inline `animationDelay` based on its index (50ms increments), using `animate-in fade-in-0 slide-in-from-bottom-3` from Tailwind animate. Actions cascade upward smoothly.

3. **Action pill styling**:
   - Default: `bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-md rounded-2xl px-4 py-2.5`
   - Hover: `hover:shadow-lg hover:scale-[1.03] hover:bg-white transition-all duration-200`
   - Danger variant: `bg-red-50/90 border-red-200/60 text-red-600 hover:bg-red-100`
   - Disabled: `opacity-50 cursor-not-allowed`
   - Icon + label in a row with `gap-3`, label uses `text-sm font-semibold text-gray-700`

4. **FAB button upgrade**:
   - Closed: branded teal gradient (`from-[#048F86] via-[#069E95] to-[#0BB5AA]`), white icon, `shadow-lg`
   - Open: rotate icon 45deg to form an "X" shape, switch to `bg-gray-100` with gray icon
   - Add `transition-all duration-300` for smooth morph
   - Size stays 56px (w-14 h-14)

5. **Backdrop** — upgrade to `bg-black/25 backdrop-blur-[3px]` with `animate-in fade-in-0 duration-200`

6. **Remove `ActionBubble` component** — replace with inline pill rendering since the arc/compact mode is gone

### Technical details
- The vertical stack container: `flex flex-col-reverse items-center gap-2` positioned above the FAB
- Each pill: `min-w-[180px]` to keep labels readable, RTL-friendly with `text-right`
- Stagger: `style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}`
- Tooltips kept only for disabled items with `disabledReason`

### Note on build errors
The listed build errors are all pre-existing in UC03, UC04, guiding-light, and auth modules — none relate to this component. They will not be addressed in this change.

### Result
- Modern vertical pill menu with icon + label visible at a glance
- Smooth staggered cascade animation on open
- Branded teal FAB with rotate-to-close transition
- Better backdrop blur
- 1 file changed

