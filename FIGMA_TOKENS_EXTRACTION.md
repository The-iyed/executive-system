# Figma Design Tokens Extraction Guide

## Step 1: Open Figma in Dev Mode

1. Open the Figma file: https://www.figma.com/design/B7hgpC18wqDGXzts0Ho2EU/sanad-AI-V1--Copy-?node-id=187-30007&m=dev
2. Enable Dev Mode by clicking the "Dev Mode" toggle in the toolbar (or press `Shift + D`)
3. Select the frame/component you want to extract tokens from (node-id=187-30007)

## Step 2: Extract Design Tokens

### Colors

1. **In Dev Mode**, select any element with a color
2. In the **Inspect panel** (right sidebar), you'll see:
   - Fill color (hex, rgb, or hsl)
   - Variable name (if using Figma Variables)
3. Copy the color values and variable names

**Example:**
- Primary color: `#3B82F6` → Convert to RGB: `59 130 246`
- Variable name: `Primary/500` → Use as `--color-primary-500`

### Typography

1. Select a text element
2. In the Inspect panel, find:
   - **Font family**: e.g., "Inter", "Roboto"
   - **Font size**: e.g., "16px" → Convert to rem: `1rem`
   - **Font weight**: e.g., "500", "600"
   - **Line height**: e.g., "24px" or "1.5"

### Spacing

1. Select any element
2. In the Inspect panel, check:
   - **Padding**: e.g., "16px" → `1rem`
   - **Margin**: e.g., "24px" → `1.5rem`
   - **Gap**: e.g., "8px" → `0.5rem`

### Border Radius

1. Select an element with rounded corners
2. In the Inspect panel, find:
   - **Border radius**: e.g., "8px" → `0.5rem`

### Shadows

1. Select an element with a shadow/effect
2. In the Inspect panel, find:
   - **Shadow/Elevation**: Copy the box-shadow value
   - Example: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`

## Step 3: Update CSS Variables

Edit `libs/ui/src/styles.css` and replace the placeholder values:

```css
:root {
  /* Colors - Replace with Figma values */
  --color-primary-500: 59 130 246; /* RGB values, space-separated */
  
  /* Typography - Replace with Figma values */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-size-base: 1rem; /* 16px */
  
  /* Spacing - Replace with Figma values */
  --spacing-md: 1rem; /* 16px */
  
  /* Border Radius - Replace with Figma values */
  --radius-lg: 0.5rem; /* 8px */
}
```

## Step 4: Using Figma Variables (Recommended)

If your Figma file uses **Variables** (Design Tokens):

1. In Figma, go to the **Variables** panel (right sidebar)
2. Click the **Export** icon (or right-click on a variable collection)
3. Choose **CSS** format
4. Copy the exported CSS
5. Replace the corresponding variables in `libs/ui/src/styles.css`

## Quick Reference: Converting Figma Values

- **Hex to RGB**: `#3B82F6` → `59 130 246` (remove `#`, convert to RGB, space-separated)
- **Pixels to Rem**: `16px` → `1rem` (divide by 16)
- **Figma Variable**: `Primary/500` → `--color-primary-500` (replace `/` with `-`, lowercase)

## Automated Extraction (Future)

For automated extraction, you can:
1. Use Figma's REST API (requires access token)
2. Use Figma plugins like "Design Tokens" or "Figma to Code"
3. Use Figma MCP server (if configured)

