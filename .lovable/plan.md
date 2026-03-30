

## Plan: Radial circle action menu

### Design concept
Replace the vertical card menu with a radial/arc layout where each action is a circular icon button that fans out from the FAB in a semicircle above it. Labels appear on hover as floating tooltips. This creates a compact, modern, visually striking interaction — similar to Path app or Pinterest's radial menus.

### Layout

```text
        ○  ○  ○
      ○          ○
        ○  (danger)
           ⚡ FAB
```

Actions are positioned in a semicircular arc (180 degrees) above the FAB. Each action is a 48px circle with an icon, positioned using trigonometric calculations based on index and total count. Radius ~120px from center of FAB.

### Changes — 1 file: `src/modules/shared/components/MeetingActionsBar.tsx`

**1. Arc positioning logic**
- Calculate angle for each action: spread evenly across 180° arc (from left to right above FAB)
- Use `Math.cos` / `Math.sin` to compute `left` and `bottom` offsets relative to FAB center
- Radius: 120px for normal actions, danger actions at a slightly closer radius (90px) directly below the arc
- RTL-aware: arc opens upward so direction doesn't matter

**2. Action circles**
- Each action: `w-12 h-12 rounded-full` with `bg-white shadow-lg border border-gray-100/80`
- Icon centered inside, color `text-[#048F86]` (normal) or `text-red-500` (danger)
- Hover: `hover:scale-110 hover:shadow-xl hover:bg-[#048F86]/5` with `transition-all duration-200`
- Danger: `bg-red-50 border-red-100 hover:bg-red-100`
- Disabled: `opacity-40 cursor-not-allowed`

**3. Labels**
- Each circle has a label positioned below it: `text-[11px] font-medium text-gray-600 mt-1.5`
- Always visible (no tooltip needed for non-disabled), centered under the circle
- For long labels, use `max-w-[70px] text-center leading-tight`

**4. Staggered spring animation**
- Each circle starts from the FAB center position (scale 0, opacity 0)
- Animates outward to its arc position with staggered delay: `40ms * index`
- Use CSS transform + transition: `transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`
- When `open` changes to true, each item transitions from `scale-0 opacity-0` at FAB center to `scale-100 opacity-100` at its arc position

**5. FAB button**
- Keep current white/teal styling
- Smooth rotation: `transition-transform duration-300`, rotate 90° when open
- Icon: `Zap` when closed, `X` when open (keep current)

**6. Backdrop**
- Keep `bg-black/15 backdrop-blur-[4px]` — lighter than current for the airy radial feel

**7. Disabled tooltips**
- Wrap disabled circles in `TooltipProvider` / `Tooltip` with `disabledReason` — same as current

### Technical details
- Arc angle calculation: `const angle = Math.PI - (Math.PI * (i + 0.5)) / totalNormalActions`
- Position: `left: R * Math.cos(angle)`, `bottom: R * Math.sin(angle)` (relative to FAB center)
- Container: `position: relative` on the FAB wrapper, circles use `position: absolute`
- All actions rendered inside a single container div with `pointer-events: none` when closed, `pointer-events: auto` when open

### Result
- Compact radial menu that feels like a native mobile FAB pattern
- Each action is a recognizable circle icon with label underneath
- Smooth spring-out animation from FAB center
- Danger action visually separated with red tint
- Modern, production-ready SaaS aesthetic
- 1 file changed

