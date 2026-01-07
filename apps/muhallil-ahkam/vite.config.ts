import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  
  if (isDev) {
    // Dev server mode - run as standalone app
    return {
      plugins: [react(), viteTsconfigPaths()],
      server: {
        port: 4202,
        open: true,
      },
    };
  }
  
  // Build mode - build as library
  return {
    plugins: [react(), viteTsconfigPaths()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/bootstrap.ts'),
        name: 'AHKAM_APP',
        fileName: 'index',
        formats: ['umd'],
      },
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            '@tanstack/react-query': 'ReactQuery',
          },
        },
      },
      outDir: 'dist/packages/muhallil-ahkam',
      emptyOutDir: true,
    },
  };
});

