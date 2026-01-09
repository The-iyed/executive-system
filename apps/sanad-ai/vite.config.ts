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
        port: 4173,
        open: true,
      },
    };
  }
  
  // Build mode - build as library
  return {
    plugins: [react(), viteTsconfigPaths()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': '{}',
      'global': 'globalThis',
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/bootstrap.ts'),
        name: 'SANAD_APP',
        fileName: (format) => `sanad-ai.${format}.js`,
        formats: ['umd'],
      },
      cssCodeSplit: false,
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          entryFileNames: 'sanad-ai.bundle.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') {
              return 'sanad-ai.bundle.css';
            }
            return assetInfo.name || 'asset';
          },
          banner: 'var process = { env: { NODE_ENV: "production" } };',
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

