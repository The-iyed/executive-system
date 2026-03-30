

## Plan: Production-grade MeetingActionsBar redesign

### Problems (from screenshots)
- FAB looks flat and oversized with no depth or visual polish
- Action pills have no icon color differentiation, weak shadows, and feel like plain HTML buttons
- No visual grouping or hierarchy between actions
- The open/close transition feels abrupt — no spring or easing refinement
- Danger action (رفض) doesn't stand out enough from the rest
- Overall aesthetic doesn't match a polished SaaS product

### Design direction
Inspired by Apple's iOS action sheets and Linear's command palette — a floating glass-morphism menu with depth, subtle gradients, and refined micro-interactions.

### Changes — 1 file: `src/modules/shared/components/MeetingActionsBar.tsx`

**1. FAB button**
- Add `shadow-[0_4px_20px_rgba(4,143,134,0.35)]` for a colored glow effect when closed
- Increase border to `border-2 border-white/40` for definition
- Use `X` icon (from lucide) when open instead of rotated Zap — cleaner close affordance
- Smooth spring: `transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]`

**2. Actions container**
- Wrap pills in a single glass card: `bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 p-2`
- This groups all actions visually as one cohesive panel instead of floating separate pills
- Add container entrance animation: scale from 0.9 + fade in with spring easing

**3. Action items (inside the card)**
- Remove individual `shadow-md` and `border` — items live inside the card now
- Style as clean rows: `rounded-xl px-4 py-3 hover:bg-gray-50/80 transition-colors duration-150`
- Icon gets a subtle circular background: `w-8 h-8 rounded-lg bg-[#048F86]/10 flex items-center justify-center` for normal, `bg-red-50` for danger
- Icon color: `text-[#048F86]` normal, `text-red-500` danger
- Label: `text-[13px] font-medium text-gray-800` — not too bold
- Add thin `border-b border-gray-100/80` separator between items (except last)
- Danger item: no separator above, instead a `mt-1` gap + `bg-red-50/50 rounded-xl` to visually isolate it

**4. Stagger animation**
- Keep per-item stagger but reduce to 30ms intervals for snappier feel
- Use `opacity-0` initial state with `animate-in fade-in-0 slide-in-from-bottom-2` (smaller slide distance)

**5. Backdrop**
- Upgrade to `bg-black/20 backdrop-blur-[6px]` — more blur, less darkness for elegance

**6. Disabled state**
- `opacity-40` instead of `opacity-50` — more clearly disabled
- Tooltip behavior unchanged

### Result
- Cohesive glass-morphism panel that looks like a native OS action sheet
- FAB with colored glow shadow for visual weight
- Clean icon containers with subtle tinted backgrounds
- Smooth spring animations on open/close
- Clear visual separation for the danger action
- Production-ready SaaS quality
- 1 file changed

