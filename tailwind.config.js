const path = require('path');

/** @type {import('tailwindcss').Config} */
const baseConfig = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        header: {
          dark: 'var(--color-header-dark)',
          light: 'var(--color-header-light)',
          text: 'var(--color-header-text)',
          'action-bg': 'var(--color-header-action-bg)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          foreground: 'var(--color-sidebar-foreground)',
          primary: 'var(--color-sidebar-primary)',
          'primary-foreground': 'var(--color-sidebar-primary-foreground)',
          accent: 'var(--color-sidebar-accent)',
          'accent-foreground': 'var(--color-sidebar-accent-foreground)',
          border: 'var(--color-sidebar-border)',
          ring: 'var(--color-sidebar-ring)',
        },
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['Frutiger LT Arabic', 'Cairo', 'Tajawal', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

// Minister Mind overrides: RGB colors and important
const baseColors = { ...baseConfig.theme.extend.colors };
const colorsToOverride = ['background', 'foreground', 'border', 'input', 'ring', 'card', 'popover', 'primary', 'secondary', 'muted', 'accent', 'destructive'];
colorsToOverride.forEach(key => {
  delete baseColors[key];
});

module.exports = {
  ...baseConfig,
  content: [
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './index.html'),
  ],
  important: true,
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      colors: {
        ...baseColors,
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
  safelist: [
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
};
