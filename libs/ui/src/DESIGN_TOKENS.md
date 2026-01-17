# Design Tokens from Figma

This document explains how to update the design tokens with values from Figma.

## How to Extract Design Tokens from Figma

1. **Open Figma Desktop App** and enable Dev Mode (Shift + D)
2. **Select the design frame** you want to extract tokens from
3. **In the Inspect panel**, you'll see:
   - Colors (with hex/rgb values)
   - Typography (font family, size, weight, line height)
   - Spacing (padding, margin values)
   - Border radius
   - Shadows/Effects

## Updating CSS Variables

Edit `libs/ui/src/styles.css` and update the `:root` variables with values from Figma:

### Colors
Replace the color values in the format: `R G B` (without commas, space-separated)

Example from Figma:
- Figma shows: `#3B82F6` (blue-500)
- Convert to RGB: `59 130 246`
- Update: `--color-primary-500: 59 130 246;`

### Typography
- Font families: Update `--font-family-*` variables
- Font sizes: Update `--font-size-*` variables (in rem)
- Font weights: Update `--font-weight-*` variables
- Line heights: Update `--line-height-*` variables

### Spacing
- Update `--spacing-*` variables with values from Figma spacing tokens

### Border Radius
- Update `--radius-*` variables with values from Figma

### Shadows
- Update `--shadow-*` variables with box-shadow values from Figma

## Using Figma Variables

If your Figma file uses Variables (Design Tokens), you can:

1. **Export Variables as CSS**:
   - In Figma, go to the Variables panel
   - Click the export icon
   - Choose CSS format
   - Copy the CSS variables
   - Replace the corresponding variables in `styles.css`

2. **Use Figma MCP** (if configured):
   - Connect to Figma MCP server
   - Use MCP tools to extract design tokens
   - Update the CSS variables automatically

## Variable Naming Convention

Match Figma variable names when possible:
- If Figma has `Primary/500`, use `--color-primary-500`
- If Figma has `Spacing/16`, use `--spacing-md` (or map appropriately)
- If Figma has `Typography/Heading/XL`, use `--font-size-xl`

## After Updating

1. Restart your dev server
2. Check that colors/spacing match Figma design
3. Adjust any hardcoded values in components










