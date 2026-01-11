import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  resolve: {
    alias: {
      '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
    },
  },
  build: {
    outDir: 'dist/apps/portal',
    emptyOutDir: true,
    cssCodeSplit: false, // Ensure all CSS is in one file
    rollupOptions: {
      output: {
        // Ensure CSS is properly extracted
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  // PostCSS config is handled by postcss.config.js
  server: {
    port: 4200,
  },
});

