import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';


export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgr()],
  resolve: {
    alias: {
      '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
    },
  },
  build: {
    outDir: 'dist/apps/muhallil-ahkam',
    emptyOutDir: true,
  },
  server: {
    port: 4202,
  },
});

