import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import type { Plugin } from 'vite';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const buildMode = process.env.BUILD_MODE || 'app'; // 'app' or 'standalone'
  
  const config: any = {
    plugins: [
      react(), 
      viteTsconfigPaths({
        // Skip TypeScript errors in standalone builds
        skipTsErrors: buildMode === 'standalone'
      }), 
      svgr(),
      // Plugin to rewrite font paths in CSS from UI library
      {
        name: 'rewrite-ui-font-paths',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
          // Rewrite font paths in CSS files from UI library
          if ((id.includes('libs/ui') || id.includes('@sanad-ai/ui')) && id.endsWith('.css')) {
            return {
              code: code.replace(
                /url\(['"]?\.\/assets\/font\/([^'"]+)['"]?\)/g,
                "url('/fonts/$1')"
              ),
              map: null,
            };
          }
          return null;
        },
      } as Plugin,
    ],
    css: {
      preprocessorOptions: {
        css: {
          // This will be handled by the transform plugin
        },
      },
    },
    resolve: {
      alias: {
        '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
        '@shared': resolve(__dirname, './src/modules/shared'),
        '@auth': resolve(__dirname, './src/modules/auth'),
      },
    },
    // PostCSS config is handled by postcss.config.js
    server: {
      port: 4404,
    },
    esbuild: buildMode === 'standalone' ? {
      // Skip TypeScript checking in standalone builds to avoid build failures
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      target: 'esnext',
      tsconfigRaw: {
        compilerOptions: {
          skipLibCheck: true,
          noEmit: true
        }
      }
    } : undefined,
  };

  // Different build configurations based on mode
  if (isDev) {
    // Dev server mode - keep existing server config
    return config;
  }

  if (buildMode === 'standalone') {
    // Standalone build - let Nx handle outputPath from project.json
    config.build = {
      emptyOutDir: true,
      cssCodeSplit: false, // Ensure all CSS is in one file
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
        output: {
          // Ensure CSS is properly extracted
          assetFileNames: (assetInfo: any) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    };
  } else {
    // Regular app build mode
    config.build = {
      outDir: 'dist/apps/minister-mind',
      emptyOutDir: true,
      cssCodeSplit: false, // Ensure all CSS is in one file
      rollupOptions: {
        output: {
          // Ensure CSS is properly extracted
          assetFileNames: (assetInfo: any) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    };
  }

  return config;
});