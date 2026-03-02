import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import type { Plugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr(),
    {
      name: 'rewrite-ui-font-paths',
      enforce: 'pre' as const,
      transform(code: string, id: string) {
        if ((id.includes('src/lib/ui') || id.includes('lib/ui')) && id.endsWith('.css')) {
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
  resolve: {
    alias: [
      { find: /^@\/lib\/api$/, replacement: resolve(__dirname, './src/lib/api/index.ts') },
      { find: /^@\/lib\/ui\/styles\.css$/, replacement: resolve(__dirname, './src/lib/ui/styles.css') },
      { find: /^@\/lib\/ui$/, replacement: resolve(__dirname, './src/lib/ui/index.ts') },
      { find: /^@\/modules\/shared$/, replacement: resolve(__dirname, './src/modules/shared/index.ts') },
      { find: /^@\/modules\/auth$/, replacement: resolve(__dirname, './src/modules/auth/index.ts') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
  },
  server: {
    port: 4404,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
