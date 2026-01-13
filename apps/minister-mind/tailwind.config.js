const baseConfig = require('../../libs/ui/tailwind.config.js');
const path = require('path');

// Extract base colors and keep only the ones we don't need to override
const baseColors = { ...baseConfig.theme.extend.colors };
const colorsToOverride = ['background', 'foreground', 'border', 'input', 'ring', 'card', 'popover', 'primary', 'secondary', 'muted', 'accent', 'destructive'];

// Remove colors that need overriding
colorsToOverride.forEach(key => {
  delete baseColors[key];
});

module.exports = {
  darkMode: baseConfig.darkMode,
  content: [
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, '../../libs/ui/src/**/*.{js,ts,jsx,tsx}'),
  ],
  important: true,
  corePlugins: {
    preflight: true,
  },
  safelist: [
    // Ensure these classes are always included
    'bg-[#183231]',
    'bg-[#131E1D]',
    'bg-[#00A991]',
    'text-[#FAFAFA]',
    'text-[#00A991]',
    'rounded-[14px]',
    'rounded-[8px]',
    'w-[43px]',
    'h-[43px]',
    'w-[200px]',
    'h-10',
    'w-5',
    'h-5',
    'w-8',
    'h-8',
    'w-16',
    'h-16',
    'w-4',
    'h-4',
    'text-[42px]',
    'leading-[67px]',
    'z-0',
    'z-[1]',
    'z-[3]',
    'z-10',
    'max-w-[1415px]',
    'w-[calc(100%-24px)]',
    'min-h-[548px]',
    'h-[398px]',
    'w-[1104px]',
    'h-[1104px]',
    'w-[894px]',
    'h-[423px]',
    'w-[909px]',
    'h-[327px]',
    '-left-[363px]',
    'top-[235px]',
    '-left-5',
    'top-[125px]',
    'blur-[200px]',
  ],
  theme: {
    container: baseConfig.theme.container,
    extend: {
      borderRadius: baseConfig.theme.extend.borderRadius,
      fontFamily: baseConfig.theme.extend.fontFamily,
      colors: {
        // Keep other colors from base config (header, sidebar, chart, etc.)
        ...baseColors,
        // Override with rgb() wrapper for RGB space-separated values from CSS variables
        background: 'rgb(var(--color-background))',
        foreground: 'rgb(var(--color-foreground))',
        border: 'rgb(var(--color-border))',
        input: 'rgb(var(--color-input))',
        ring: 'rgb(var(--color-ring))',
        card: {
          DEFAULT: 'rgb(var(--color-card))',
          foreground: 'rgb(var(--color-card-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--color-popover))',
          foreground: 'rgb(var(--color-popover-foreground))',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          foreground: 'rgb(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          foreground: 'rgb(var(--color-secondary-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted))',
          foreground: 'rgb(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          foreground: 'rgb(var(--color-accent-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive))',
          foreground: 'rgb(var(--color-destructive-foreground))',
        },
      },
    },
  },
  plugins: baseConfig.plugins,
};
