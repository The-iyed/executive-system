import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// Helper function to scope CSS to a container
function scopeCssToContainer(css: string, containerSelector: string): string {
  // Extract @ rules that must be global (@font-face, @keyframes)
  const fontFaceRegex = /@font-face\s*\{[^}]+\}/g;
  const keyframesRegex = /@keyframes\s+\w+\s*\{[^}]+\}/g;
  const fontFaces = css.match(fontFaceRegex) || [];
  const keyframes = css.match(keyframesRegex) || [];
  
  // Remove @ rules from CSS temporarily
  let scoped = css.replace(fontFaceRegex, '').replace(keyframesRegex, '');
  
  // Prefix keyframe names to avoid conflicts
  const prefixedKeyframes = keyframes.map(kf => {
    return kf.replace(/@keyframes\s+(\w+)/, (_, name) => `@keyframes sanad-ai-${name}`);
  });
  
  // Update animation references to use prefixed names
  prefixedKeyframes.forEach(kf => {
    const match = kf.match(/@keyframes\s+sanad-ai-(\w+)/);
    if (match) {
      const originalName = match[1];
      const prefixedName = `sanad-ai-${originalName}`;
      // Replace animation references
      scoped = scoped.replace(
        new RegExp(`(animation|animation-name):\\s*${originalName}(?![\\w-])`, 'g'),
        `$1: ${prefixedName}`
      );
    }
  });
  
  // Scope :root to container
  scoped = scoped.replace(/:root\s*\{/g, `${containerSelector} {`);
  
  // Scope body and html selectors
  scoped = scoped.replace(/\b(body|html)\s*\{/g, `${containerSelector} $1 {`);
  
  // Scope universal selector at start of rules
  scoped = scoped.replace(/^\s*\*\s*\{/gm, `${containerSelector} * {`);
  
  // Scope @layer base - wrap its content
  scoped = scoped.replace(/@layer\s+base\s*\{([^}]+)\}/gs, (match, content) => {
    return `@layer base { ${containerSelector} { ${content} } }`;
  });
  
  // Scope element selectors (but not inside @ rules)
  const elementSelectors = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'input', 'textarea', 'select', 'label', 'li', 'ul', 'ol', 'td', 'th', 'table', 'tr', 'thead', 'tbody', 'tfoot'];
  elementSelectors.forEach(selector => {
    // Only scope standalone selectors (not already scoped or in @ rules)
    const regex = new RegExp(`(^|\\n|\\r)\\s*${selector}\\s*([,{])`, 'gm');
    scoped = scoped.replace(regex, (match, before, after) => {
      // Don't scope if already inside container selector or in @ rules
      if (match.includes(containerSelector) || match.includes('@')) {
        return match;
      }
      return `${before}${containerSelector} ${selector}${after}`;
    });
  });
  
  // Scope class selectors (but preserve @media, @layer, etc.)
  scoped = scoped.replace(/(^|\n|\r)\s*\.([\w-]+)(?![^{]*#sanad-ai-container)(?![^{]*@media)(?![^{]*@layer)/gm, `$1${containerSelector} .$2`);
  
  // Prepend global @ rules
  return [...fontFaces, ...prefixedKeyframes, scoped].join('\n');
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
                  
                  // Verify CSS content is not empty (Tailwind generates a lot of CSS)
                  if (!cssContent || cssContent.trim().length === 0) {
                    console.warn(`Sanad AI: CSS file ${fileName} is empty. Tailwind CSS may not have been processed.`);
                    continue;
                  }
                  
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
                    // Inject CSS function IMMEDIATELY when script loads
                    // This ensures CSS is available before open() is called
                    // Use IIFE to execute immediately and synchronously
                    // Store CSS globally first, then call the function if it exists
                    const cssInjection = `
(function() {
  try {
    if (typeof window !== 'undefined') {
      // Store CSS globally first (always do this)
      // This includes all Tailwind CSS utilities, base styles, and components
      window.__SANAD_AI_CSS_STORED__ = ${JSON.stringify(cssContent)};
      // Then call the function if it exists
      if (window.__SANAD_AI_CSS__) {
        window.__SANAD_AI_CSS__(${JSON.stringify(cssContent)});
      }
    }
  } catch (e) {
    console.error('Error injecting Sanad AI CSS:', e);
  }
})();`;
                    // Inject CSS at the very beginning of the bundle (before any other code)
                    jsFile.code = cssInjection + '\n' + jsFile.code;
                    // Delete the CSS file
                    delete bundle[fileName];
                  } else {
                    console.warn(`Sanad AI: Could not find JS file ${jsFileName} to inject CSS into.`);
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

