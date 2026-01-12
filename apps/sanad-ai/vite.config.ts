import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// Helper function to scope CSS to a container
function scopeCssToContainer(css: string, containerSelector: string): string {
  // Extract @ rules that must be global
  const globalAtRules: string[] = [];
  const atRuleRegex = /@(font-face|keyframes|import|charset|namespace)\s+[^{]+\{[^}]+\}/g;
  let match;
  
  // Collect global @ rules
  while ((match = atRuleRegex.exec(css)) !== null) {
    globalAtRules.push(match[0]);
  }
  
  // Remove global @ rules from CSS
  let scoped = css.replace(atRuleRegex, '');
  
  // Prefix keyframe names to avoid conflicts
  scoped = scoped.replace(/@keyframes\s+(\w+)/g, '@keyframes sanad-ai-$1');
  scoped = scoped.replace(/(animation|animation-name):\s*(\w+)/g, (match, prop, name) => {
    // Only prefix if it's not already prefixed
    if (!name.startsWith('sanad-ai-')) {
      return `${prop}: sanad-ai-${name}`;
    }
    return match;
  });
  
  // Scope :root to container
  scoped = scoped.replace(/:root\s*\{/g, `${containerSelector} {`);
  
  // Scope body and html selectors
  scoped = scoped.replace(/\b(body|html)\s*\{/g, `${containerSelector} $1 {`);
  
  // Wrap everything else in container (but preserve @media, @layer, etc.)
  // Only wrap rules that aren't already inside @ rules
  const lines = scoped.split('\n');
  let inAtRule = false;
  let result: string[] = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('@') && (line.includes('media') || line.includes('layer') || line.includes('supports'))) {
      inAtRule = true;
      result.push(line);
    } else if (inAtRule && line.trim() === '}') {
      inAtRule = false;
      result.push(line);
    } else if (!inAtRule && line.trim() && !line.trim().startsWith('@')) {
      // Scope this line to container
      result.push(`${containerSelector} { ${line} }`);
    } else {
      result.push(line);
    }
  }
  
  scoped = result.join('\n');
  
  // Prepend global @ rules
  return [...globalAtRules, scoped].join('\n');
}

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
        fileName: () => `sanad-ai-v3.js`,
        formats: ['umd'],
      },
      cssCodeSplit: false,
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          entryFileNames: 'sanad-ai-v3.js',
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
            name: 'copy-fonts',
            generateBundle(_options, bundle) {
              // Copy font files to output
              const fontFiles = [
                { path: resolve(__dirname, 'src/assets/Font/Frutiger.ttf'), name: 'Frutiger.ttf' },
                { path: resolve(__dirname, 'src/assets/Font/Frutiger_bold.ttf'), name: 'Frutiger_bold.ttf' },
              ];
              
              const fs = require('fs');
              const path = require('path');
              
              fontFiles.forEach(({ path: fontPath, name: fontName }) => {
                try {
                  if (fs.existsSync(fontPath)) {
                    const fontContent = fs.readFileSync(fontPath);
                    this.emitFile({
                      type: 'asset',
                      fileName: `fonts/${fontName}`,
                      source: fontContent,
                    });
                  }
                } catch (error) {
                  // Error copying font
                }
              });
            },
          },
          {
            name: 'inline-css',
            generateBundle(_options, bundle) {
              // Find CSS files and inline them into JS
              for (const fileName in bundle) {
                const file = bundle[fileName];
                if (file.type === 'asset' && fileName.endsWith('.css')) {
                  let cssContent = file.source as string;
                  
                  // Rewrite font paths to use absolute paths from portal root
                  // Replace relative paths with absolute paths
                  cssContent = cssContent.replace(
                    /url\(['"]?\.\/assets\/Font\/([^'"]+)['"]?\)/g,
                    "url('/fonts/$1')"
                  );
                  
                  // Find the corresponding JS file
                  const jsFileName = 'sanad-ai-v3.js';
                  const jsFile = bundle[jsFileName];
                  if (jsFile && jsFile.type === 'chunk') {
                    // Scope CSS to only apply within the container
                    const scopedCss = scopeCssToContainer(cssContent, '#sanad-ai-container');
                    // Inject CSS as a style tag in the JS
                    const cssInjection = `
(function() {
  if (typeof document !== 'undefined') {
    var style = document.createElement('style');
    style.id = 'sanad-ai-scoped-styles';
    style.textContent = ${JSON.stringify(scopedCss)};
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

