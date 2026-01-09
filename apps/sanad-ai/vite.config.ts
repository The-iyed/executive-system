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
        port: 4201,
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
        name: 'SANAD_APP',
        fileName: (format) => `sanad-ai.${format}.js`,
        formats: ['umd'],
        // Ensure output is index.js not index.umd.js
      },
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          entryFileNames: 'sanad-ai.bundle.js',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            '@tanstack/react-query': 'ReactQuery',
          },
        },
      },
      outDir: 'dist/packages/sanad-ai',
      emptyOutDir: true,
    },
  };
});

