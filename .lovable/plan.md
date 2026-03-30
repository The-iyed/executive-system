

## Top Navigation Bar - Professional Redesign Plan

### Current Issues
1. **Responsive overflow**: With 6+ nav items (dashboard, directives, previous meetings, work basket, waiting list, calendar), the pill buttons overflow and get cramped on viewports under ~1200px
2. **Logo text too long**: "المنصة الموحدة / للشؤون التنفيذية بمكتب معالي الوزير" takes significant horizontal space
3. **No mobile menu**: No hamburger/drawer pattern for small screens
4. **Fixed height constraint**: The `h-[60px]` header doesn't adapt well when content overflows
5. **Nav items don't truncate or collapse** -- they just squeeze together

### Plan

#### 1. Responsive Logo Component
- On large screens (>=1280px): show full logo with title + subtitle
- On medium screens (>=768px): show logo icon + title only (hide subtitle)
- On small screens (<768px): show logo icon only

#### 2. Responsive Navigation with Overflow Handling
- On large screens (>=1280px): show all nav items with icon + text as pill buttons
- On medium screens (768px-1279px): show nav items with icon + text, but use horizontal scroll with fade edges if they overflow (CSS `overflow-x: auto` with gradient masks)
- On small screens (<768px): collapse navigation into a hamburger menu that opens a slide-out drawer/sheet from the right (RTL-aware)

#### 3. Mobile Drawer Menu
- Create a `MobileNavDrawer` component using the existing shadcn Sheet component
- Triggered by a hamburger icon button that replaces the nav on small screens
- Full-height drawer with vertical nav items, user info at bottom, logout button
- Smooth open/close animation

#### 4. Header Polish
- Increase header height slightly on desktop to `h-[64px]` for breathing room
- Add `backdrop-blur-sm` for a frosted glass effect
- Subtle `top-2 mx-3` margin for the floating nav card feel
- Ensure bell icon and avatar stay visible at all breakpoints

### Files to Edit
- `src/modules/shared/components/logo.tsx` -- responsive logo breakpoints
- `src/modules/shared/components/Layout/shared-layout.tsx` -- responsive header layout with mobile menu toggle
- `src/modules/shared/components/navigation-actions.tsx` -- horizontal scroll with fade on medium screens, hide on mobile
- **New**: `src/modules/shared/components/mobile-nav-drawer.tsx` -- mobile slide-out drawer

### Technical Details
- Use Tailwind responsive classes (`md:`, `lg:`, `xl:`) for breakpoint logic
- Use `useState` for mobile drawer open/close state
- Use shadcn `Sheet` component for the drawer
- Add CSS gradient masks for the horizontal scroll fade effect on the nav
- No new dependencies needed

