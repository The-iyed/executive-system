const baseConfig = require('../../libs/ui/tailwind.config.js');
const path = require('path');

module.exports = {
  ...baseConfig,
  content: [
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, '../../libs/ui/src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      fontFamily: {
        sans: ['Frutiger LT Pro', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
};

