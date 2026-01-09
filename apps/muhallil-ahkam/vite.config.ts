import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  
  if (isDev) {
    // Dev server mode - run as standalone app
    return {
      plugins: [react(), viteTsconfigPaths()],
      resolve: {
        alias: {
          '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
        },
      },
      server: {
        port: 4202,
        open: true,
      },
    };
  }
  
  // Build mode - build as library
  return ({
    plugins: [react(), viteTsconfigPaths(), svgr()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': '{}',
      'global': 'globalThis',
    },
    resolve: {
      alias: {
        '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/bootstrap.ts'),
        name: 'AHKAM_APP',
        fileName: (format) => `muhallil-ahkam.${format}.js`,
        formats: ['umd'],
      },
      cssCodeSplit: false,
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          entryFileNames: 'muhallil-ahkam.bundle.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') {
              return 'muhallil-ahkam.bundle.css';
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
      outDir: 'dist/packages/muhallil-ahkam',
      emptyOutDir: true,
    },
  });

});

