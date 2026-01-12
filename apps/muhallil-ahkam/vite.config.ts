import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

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
    return kf.replace(/@keyframes\s+(\w+)/, (_, name) => `@keyframes muhallil-ahkam-${name}`);
  });
  
  // Update animation references to use prefixed names
  prefixedKeyframes.forEach(kf => {
    const match = kf.match(/@keyframes\s+muhallil-ahkam-(\w+)/);
    if (match) {
      const originalName = match[1];
      const prefixedName = `muhallil-ahkam-${originalName}`;
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
  scoped = scoped.replace(/(^|\n|\r)\s*\.([\w-]+)(?![^{]*#muhallil-ahkam-container)(?![^{]*@media)(?![^{]*@layer)/gm, `$1${containerSelector} .$2`);
  
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
  
  // Build mode - check if building UMD or standalone
  if (buildMode === 'standalone') {
    // Standalone build - regular app build (Nx will use outputPath from project.json)
    // We need to not use lib mode so it builds as a regular app
    return {
      plugins: [react(), viteTsconfigPaths(), svgr()],
      resolve: {
        alias: {
          '@sanad-ai/ui/styles.css': resolve(__dirname, '../../libs/ui/src/styles.css'),
        },
      },
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
        fileName: () => `muhallil-ahkam.js`,
        formats: ['umd'],
      },
      cssCodeSplit: false,
      rollupOptions: {
        external: ['react', 'react-dom', '@tanstack/react-query'],
        output: {
          entryFileNames: 'muhallil-ahkam.js',
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
                  const jsFileName = 'muhallil-ahkam.js';
                  const jsFile = bundle[jsFileName];
                  if (jsFile && jsFile.type === 'chunk') {
                    // Inject CSS function that will be called to inject into shadow root
                    const cssInjection = `
(function() {
  if (typeof window !== 'undefined' && window.__MUHALLIL_AHKAM_CSS__) {
    window.__MUHALLIL_AHKAM_CSS__(${JSON.stringify(cssContent)});
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
      outDir: 'dist/packages/muhallil-ahkam',
      emptyOutDir: true,
    },
  });

});

