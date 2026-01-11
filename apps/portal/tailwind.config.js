const baseConfig = require('../../libs/ui/tailwind.config.js');
const path = require('path');

module.exports = {
  ...baseConfig,
  content: [
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, '../../libs/ui/src/**/*.{js,ts,jsx,tsx}'),
  ],
  // Ensure critical classes are not purged in production
  safelist: [
    // Common utility classes that might be used dynamically
    'w-full',
    'h-full',
    'flex',
    'flex-col',
    'flex-row',
    'items-center',
    'justify-center',
    'gap-4',
    'gap-6',
    'p-4',
    'p-6',
    'px-4',
    'px-6',
    'py-4',
    'py-8',
    'text-right',
    'text-left',
    'text-center',
    'bg-white',
    'bg-background',
    'text-foreground',
    'border',
    'rounded',
    'shadow',
    'hover:shadow-lg',
    'transition-all',
    'duration-300',
    // Responsive classes
    'sm:w-auto',
    'sm:flex-row',
    'sm:items-center',
    'sm:gap-6',
    'sm:gap-10',
    'sm:text-[24px]',
    'sm:leading-[38px]',
    'sm:pt-8',
    'sm:px-0',
    'sm:mx-0',
  ],
};
