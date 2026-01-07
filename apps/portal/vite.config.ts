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
  },
  server: {
    port: 4200,
  },
});

