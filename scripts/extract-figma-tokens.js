/**
 * Figma Design Tokens Extraction Helper
 * 
 * This script helps extract design tokens from Figma.
 * 
 * Usage:
 * 1. Open Figma in Dev Mode
 * 2. Select elements in your design
 * 3. Manually copy values from the Inspect panel
 * 4. Update the values in libs/ui/src/styles.css
 * 
 * For automated extraction, use Figma's REST API or plugins.
 */

// Example: How to convert Figma values to CSS variables

const figmaToCSS = {
  // Convert hex to RGB (space-separated for CSS)
  hexToRGB: (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
  },
  
  // Convert pixels to rem
  pxToRem: (px) => {
    return `${px / 16}rem`;
  },
  
  // Convert Figma variable name to CSS variable name
  // Example: "Primary/500" -> "--color-primary-500"
  figmaVarToCSS: (figmaVar) => {
    return `--color-${figmaVar.toLowerCase().replace(/\//g, '-')}`;
  }
};

// Example conversions
console.log('Example conversions:');
console.log('Hex to RGB:', figmaToCSS.hexToRGB('#3B82F6')); // "59 130 246"
console.log('Px to Rem:', figmaToCSS.pxToRem(16)); // "1rem"
console.log('Figma Var:', figmaToCSS.figmaVarToCSS('Primary/500')); // "--color-primary-500"

module.exports = figmaToCSS;







