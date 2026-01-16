# Sanad AI Design System

This document defines the design system rules extracted from Figma and implemented in the codebase.

## Color Palette

### Primary Colors (Teal/Cyan)
Based on the Figma design, the primary color is teal/cyan:
- **Primary 50-950**: Teal scale from light to dark
- **Header Dark**: `hsl(173, 84%, 32%)` - Dark teal for top bar
- **Header Light**: `hsl(173, 80%, 40%)` - Lighter teal for navigation bar

### Usage
- Dark teal (`primary-600`): Top header bar
- Light teal (`primary-500`): Navigation bar
- White text on teal backgrounds
- White background for main content

## Typography

### Font Families
- **Arabic**: 'Cairo', 'Tajawal' (primary for Arabic text)
- **Sans**: 'Inter', system-ui (fallback)

### Font Sizes
- xs: 12px (0.75rem)
- sm: 14px (0.875rem)
- base: 16px (1rem)
- lg: 18px (1.125rem)
- xl: 20px (1.25rem)
- 2xl: 24px (1.5rem)
- 3xl: 30px (1.875rem)
- 4xl: 36px (2.25rem)

## Layout

### Header Structure
1. **Top Bar** (Dark Teal):
   - User profile on left (RTL: right)
   - Action icons in center
   - Logo on right (RTL: left)

2. **Navigation Bar** (Light Teal):
   - Horizontal navigation links
   - Active state with white background overlay
   - Border bottom indicator for active link

### RTL Support
- All layouts use `dir="rtl"` for Arabic text
- Fonts support Arabic characters
- Spacing and alignment adjusted for RTL

## Components

### Buttons
- Primary: Teal background with white text
- Secondary: White/light background with teal text
- Ghost: Transparent with hover state

### Cards
- White background
- Rounded corners
- Teal accent for buttons/actions

## Spacing
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)

## Border Radius
- sm: 2px
- md: 6px
- lg: 8px
- xl: 12px
- 2xl: 16px
- full: 9999px

## Shadows
- sm: Subtle shadow for cards
- md: Medium shadow for elevated elements
- lg: Large shadow for modals
- xl: Extra large shadow
- 2xl: Maximum shadow








