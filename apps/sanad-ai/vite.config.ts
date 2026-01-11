import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const buildMode = process.env.BUILD_MODE || 'umd'; // 'umd' or 'standalone'
  
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
  
  // Build mode - check if building UMD or standalone
  if (buildMode === 'standalone') {
    // Standalone build - regular app build (Nx will use outputPath from project.json)
    // We need to not use lib mode so it builds as a regular app
    return {
      plugins: [react(), viteTsconfigPaths()],
      build: {
        // Don't set outDir here - let Nx handle it via project.json outputPath
        // But we need to ensure it's not a lib build
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
        },
      },
    };
  }
  
  // UMD build mode - build as library
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
          entryFileNames: 'sanad-ai.umd.js',
          // Inline CSS into JS - don't extract CSS files
          assetFileNames: () => {
            // Return a name that won't be used since we're inlining
            return 'dummy.css';
          },
          banner: 'var process = { env: { NODE_ENV: "production" } };',
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            '@tanstack/react-query': 'ReactQuery',
          },
        },
        plugins: [
          {
            name: 'inline-css',
            generateBundle(_options, bundle) {
              // Find CSS files and inline them into JS
              for (const fileName in bundle) {
                const file = bundle[fileName];
                if (file.type === 'asset' && fileName.endsWith('.css')) {
                  const cssContent = file.source as string;
                  // Find the corresponding JS file
                  const jsFileName = 'sanad-ai.umd.js';
                  const jsFile = bundle[jsFileName];
                  if (jsFile && jsFile.type === 'chunk') {
                    // Inject CSS as a style tag in the JS
                    const cssInjection = `
(function() {
  if (typeof document !== 'undefined') {
    var style = document.createElement('style');
    style.textContent = ${JSON.stringify(cssContent)};
    document.head.appendChild(style);
  }
})();`;
                    jsFile.code = cssInjection + '\n' + jsFile.code;
                    // Delete the CSS file
                    delete bundle[fileName];
                  }
                }
              }
            },
          },
        ],
      },
      outDir: 'dist/packages/sanad-ai',
      emptyOutDir: true,
    },
  };
});

