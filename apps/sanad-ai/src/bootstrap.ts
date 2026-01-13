// React, ReactDOM, and ReactQuery are now bundled with the package
// No need to check for external React dependencies

import { createMount } from './mount';

// Mount creation - React is now bundled, so we can create mount when needed
let mountInstance: any = null;

const getMount = () => {
  if (!mountInstance) {
    try {
      // Create mount - React is bundled, so this will work
      mountInstance = createMount();
    } catch (error: any) {
      console.error('[Sanad AI] Failed to create mount:', error);
      throw error;
    }
  }
  return mountInstance;
};

// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';
// Import images to get their resolved paths (Vite will handle the paths correctly)
import BackgroundImageUrl from './assets/bg.png';
import WelcomeAvatarUrl from './assets/9d53f805f9a8d5abf29c548b2ad39d3a6662b408.png';

// Preload critical images early for better performance
if (typeof window !== 'undefined') {
  const preloadImage = (src: string) => {
    // Check if already preloaded
    const existingLink = document.querySelector(`link[rel="preload"][href="${src}"]`);
    if (existingLink) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    // Also preload using Image object for better browser support
    const img = new Image();
    img.src = src;
  };
  
  // Preload background image and welcome avatar
  // These are critical images that should load as early as possible
  // Using imported URLs ensures Vite resolves paths correctly in both dev and production
  preloadImage(BackgroundImageUrl);
  preloadImage(WelcomeAvatarUrl);
}

// CRITICAL: Define CSS storage and function FIRST, before any other code
// This ensures the function is available when CSS injection code runs
let cssContent: string | null = null;
let shadowRoot: ShadowRoot | null = null;

// Simple CSS injection helper (defined early for use in CSS function)
const injectCSSIntoShadow = (shadow: ShadowRoot, css: string) => {
  const existingStyles = shadow.querySelectorAll('style');
  if (existingStyles.length > 0) {
    (existingStyles[0] as HTMLStyleElement).textContent = css;
    return;
  }
  const style = document.createElement('style');
  style.textContent = css;
  shadow.insertBefore(style, shadow.firstChild);
};

// Function to set CSS content (called from vite build)
// This MUST be defined at the very top, before any other code
if (typeof window !== 'undefined') {
  (window as any).__SANAD_AI_CSS__ = (css: string) => {
    cssContent = css;
    // Store CSS globally so it can be retrieved later
    (window as any).__SANAD_AI_CSS_STORED__ = css;
    // If shadow root already exists, inject styles immediately
    if (shadowRoot) {
      injectCSSIntoShadow(shadowRoot, css);
    }
  };
}

// Mount is created lazily via getMount() when actually needed
let currentContainer: HTMLElement | null = null;
let createdContainer: HTMLElement | null = null;

// Helper function to add isolation styles for the host container
const addIsolationStyles = () => {
  const styleId = 'sanad-ai-isolation-styles';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Strong isolation for Sanad AI container - prevents style leakage */
    #sanad-ai-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 9999 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      /* Create a new formatting context */
      display: block !important;
      /* Prevent pointer events from leaking to parent when closed */
      pointer-events: auto !important;
    }
    
    /* Prevent any styles from leaking to parent document */
    body:has(#sanad-ai-container) {
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(style);
};

// Helper function to inject CSS into shadow root
const injectStylesIntoShadowRoot = (shadowRoot: ShadowRoot, css: string) => {
  // Check if styles are already injected
  const existingStyles = shadowRoot.querySelectorAll('style');
  if (existingStyles.length > 0) {
    // Update the first style element if it exists
    (existingStyles[0] as HTMLStyleElement).textContent = css;
    return;
  }
  
  // Create new style element and inject CSS
  const style = document.createElement('style');
  style.textContent = css;
  // Insert at the beginning to ensure styles load before content
  shadowRoot.insertBefore(style, shadowRoot.firstChild);
};

// Helper function to create a fullscreen container with Shadow DOM
const createFullscreenContainer = (): HTMLElement => {
  // Add isolation styles for host container
  addIsolationStyles();

  // Check if container already exists
  const existingContainer = document.getElementById('sanad-ai-container');
  if (existingContainer && existingContainer.shadowRoot) {
    return existingContainer.shadowRoot as any; // Return shadow root content
  }

  // Create host container
  const hostContainer = document.createElement('div');
  hostContainer.id = 'sanad-ai-container';
  hostContainer.setAttribute('data-package-container', 'sanad-ai');
  hostContainer.setAttribute('data-isolated', 'true');
  hostContainer.setAttribute('data-package', 'sanad-ai');
  
  // Attach Shadow Root with open mode (allows external JS access if needed)
  const shadow = hostContainer.attachShadow({ mode: 'open' });
  shadowRoot = shadow;
  
  // CRITICAL: Inject CSS FIRST, before any other elements
  // This ensures all styles are available when React mounts
  // Try to get CSS from the global function if not already stored
  if (cssContent) {
    injectStylesIntoShadowRoot(shadow, cssContent);
  } else if (typeof window !== 'undefined') {
    // CSS might be available but not stored yet - try to get it
    // This handles the case where CSS injection code runs after shadow root creation
    const storedCSS = (window as any).__SANAD_AI_CSS_STORED__;
    if (storedCSS) {
      cssContent = storedCSS;
      injectStylesIntoShadowRoot(shadow, storedCSS);
    } else {
      // Log warning if CSS is not available (for debugging)
      console.warn('Sanad AI: CSS not available when creating shadow root. It will be injected when available.');
    }
  }
  
  // Create inner container inside shadow root
  const innerContainer = document.createElement('div');
  innerContainer.style.width = '100%';
  innerContainer.style.height = '100%';
  innerContainer.style.position = 'relative';
  innerContainer.style.overflow = 'hidden';
  innerContainer.style.backgroundColor = '#ffffff';
  shadow.appendChild(innerContainer);
  
  // Ensure host container is appended to body
  document.body.appendChild(hostContainer);
  
  // Return inner container for React to mount into
  return innerContainer;
};

// CSS function is already defined at the top and uses injectCSSIntoShadow
// The injectStylesIntoShadowRoot helper below will be used for consistency

// Helper function to remove created container
const removeCreatedContainer = () => {
  if (createdContainer && createdContainer.parentNode) {
    const hostContainer = createdContainer.getRootNode() as ShadowRoot;
    if (hostContainer && hostContainer.host) {
      document.body.removeChild(hostContainer.host);
    } else if (createdContainer.parentNode === document.body) {
      document.body.removeChild(createdContainer);
    }
    createdContainer = null;
    shadowRoot = null;
  }
};

/**
 * Internal helper to mount the app with CSS injection
 */
const ensureCSSAndMount = (targetContainer: HTMLElement) => {
  // Try to get CSS from stored global if not in cssContent
  if (!cssContent && typeof window !== 'undefined' && (window as any).__SANAD_AI_CSS_STORED__) {
    cssContent = (window as any).__SANAD_AI_CSS_STORED__;
  }
  
  if (cssContent && shadowRoot) {
    // Check if styles are already injected
    const hasStyles = Array.from(shadowRoot.querySelectorAll('style')).length > 0;
    if (!hasStyles) {
      injectStylesIntoShadowRoot(shadowRoot, cssContent);
    }
    
    // CSS is ready, now mount React
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    getMount().mount(targetContainer);
    
    // Store original overflow to restore on close
    (targetContainer as any).__originalBodyOverflow = originalOverflow;
  } else if (!cssContent) {
    // CSS not loaded yet, wait and retry (max 10 attempts = 1 second)
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
      attempts++;
      // Check both cssContent and stored CSS
      if (typeof window !== 'undefined' && (window as any).__SANAD_AI_CSS_STORED__) {
        cssContent = (window as any).__SANAD_AI_CSS_STORED__;
      }
      if (cssContent && shadowRoot) {
        clearInterval(checkInterval);
        ensureCSSAndMount(targetContainer);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Sanad AI: CSS failed to load after 1 second, mounting without styles');
        // Mount anyway (styles might load later)
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        getMount().mount(targetContainer);
        (targetContainer as any).__originalBodyOverflow = originalOverflow;
      }
    }, 100);
  } else {
    // shadowRoot not available (shouldn't happen)
    console.error('Sanad AI: Shadow root not available');
  }
};

/**
 * Utility to expose the SanadAiV3 API globally on the window object
 * This allows external websites to control the SanadAi programmatically
 * 
 * @description This function creates and exposes the SanadAiV3 API with methods to
 * open, close, toggle, and check the state of the Sanad AI interface.
 * The API uses Shadow DOM for complete style isolation.
 * 
 * @example
 * ```ts
 * // After script loads, the API is automatically available:
 * window.SanadAiV3.open();
 * window.SanadAiV3.close();
 * window.SanadAiV3.toggle();
 * window.SanadAiV3.isOpen();
 * 
 * // Listen to events
 * window.addEventListener('SanadAiV3:opened', (e) => {
 *   console.log('Sanad AI opened', e.detail);
 * });
 * ```
 */
const createSanadAiV3API = () => {
  /**
   * Opens the Sanad AI interface
   * @description Programmatically opens the Sanad AI interface in a Shadow DOM container.
   * Container parameter is ignored - the package creates its own isolated container.
   * 
   * @param {HTMLElement} _container - Optional container (ignored, package creates its own)
   */
  const open = (_container?: HTMLElement): void => {
    // Container parameter is ignored - package creates its own isolated container
    
    console.log('[Sanad AI] open() called');
    
    // React is now bundled with the package, no need to check for external dependencies
    
    if (currentContainer) {
      console.warn('[Sanad AI] Already open, use close() first or toggle()');
      return;
    }

    try {
      console.log('[Sanad AI] Creating fullscreen container...');
      // Always create our own isolated container for better isolation
      const targetContainer = createFullscreenContainer();
      createdContainer = targetContainer;
      currentContainer = targetContainer;
      console.log('[Sanad AI] ✓ Container created');
      
      // CRITICAL: Ensure CSS is injected BEFORE mounting React
      console.log('[Sanad AI] Ensuring CSS and mounting...');
      ensureCSSAndMount(targetContainer);
      console.log('[Sanad AI] ✓ Mounting completed');
      
      // Dispatch custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SanadAiV3:opened', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      console.log('[Sanad AI] ✓ Opened successfully');
    } catch (error) {
      console.error('[Sanad AI] ✗ Error opening:', error);
      console.error('[Sanad AI] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SanadAiV3:error', {
          detail: { error, action: 'open', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Closes the Sanad AI interface
   * @description Programmatically closes the Sanad AI interface and removes the Shadow DOM container.
   */
  const close = (): void => {
    if (!currentContainer) {
      console.warn('[Sanad AI] Not open, nothing to close');
      return;
    }

    try {
      getMount().unmount();
      
      // Restore body overflow
      if (createdContainer && (createdContainer as any).__originalBodyOverflow !== undefined) {
        document.body.style.overflow = (createdContainer as any).__originalBodyOverflow || '';
      } else {
        document.body.style.overflow = '';
      }
      
      if (createdContainer) {
        removeCreatedContainer();
      }
      currentContainer = null;
      
      // Dispatch custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SanadAiV3:closed', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      console.log('[Sanad AI] Closed programmatically');
    } catch (error) {
      console.error('[Sanad AI] Error closing:', error);
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SanadAiV3:error', {
          detail: { error, action: 'close', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Toggles the Sanad AI interface state
   * @description Opens the interface if closed, closes if open.
   */
  const toggle = (): void => {
    try {
      const wasOpen = currentContainer !== null;
      
      if (wasOpen) {
        close();
      } else {
        open();
      }
      
      // Dispatch appropriate event
      if (typeof window !== 'undefined') {
        const eventType = !wasOpen ? 'SanadAiV3:opened' : 'SanadAiV3:closed';
        window.dispatchEvent(new CustomEvent(eventType, {
          detail: { timestamp: Date.now(), toggled: true }
        }));
      }
      
      console.log(`[Sanad AI] ${!wasOpen ? 'Opened' : 'Closed'} programmatically (toggle)`);
    } catch (error) {
      console.error('[Sanad AI] Error toggling:', error);
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('SanadAiV3:error', {
          detail: { error, action: 'toggle', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Checks if the Sanad AI interface is currently open
   * @returns {boolean} True if the interface is open
   */
  const isOpen = (): boolean => {
    return currentContainer !== null;
  };

  return {
    open,
    close,
    toggle,
    isOpen
  };
};

// Create SanadAiV3 API object
const SanadAiV3 = createSanadAiV3API();

// Export SanadAiV3 as default - Vite will assign this to window.SanadAiV3
// We use ONLY default export to avoid Vite creating a namespace object
export default SanadAiV3;

/**
 * Exposes the SanadAiV3 API globally on the window object
 * @description This function should be called after the API is created.
 * It ensures the API is available on window.SanadAiV3 and dispatches a ready event.
 * 
 * @example
 * ```ts
 * // The API is automatically exposed when the script loads
 * // External websites can use:
 * window.SanadAiV3.open();
 * window.SanadAiV3.close();
 * window.SanadAiV3.toggle();
 * window.SanadAiV3.isOpen();
 * 
 * // Listen to events
 * window.addEventListener('SanadAiV3:ready', () => {
 *   console.log('Sanad AI is ready!');
 * });
 * ```
 */
const exposeSanadAiV3API = (): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('[Sanad AI] exposeSanadAiV3API: window object not available (SSR environment)');
    return;
  }

  // Attach the API to the window object
  (window as any).SanadAiV3 = SanadAiV3;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('SanadAiV3:ready', {
    detail: { api: SanadAiV3, timestamp: Date.now() }
  }));

  console.log('[Sanad AI] API exposed globally on window.SanadAiV3');
  console.log('[Sanad AI] Available methods:', Object.keys(SanadAiV3));
};

/**
 * Checks if the SanadAiV3 API is available on the window object
 * @returns {boolean} True if the API is available
 */
const isSanadAiV3APIAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).SanadAiV3 === 'object' && 
         typeof (window as any).SanadAiV3.open === 'function';
};

// Expose the API immediately when script loads
// Use multiple strategies to ensure it's set after Vite's UMD wrapper
if (typeof window !== 'undefined') {
  // Immediate assignment
  exposeSanadAiV3API();
  
  // Also ensure it's set after Vite's wrapper (if it runs after)
  Promise.resolve().then(() => {
    if (!isSanadAiV3APIAvailable()) {
      exposeSanadAiV3API();
    }
  });
  
  setTimeout(() => {
    if (!isSanadAiV3APIAvailable()) {
      exposeSanadAiV3API();
    }
  }, 0);
  
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      if (!isSanadAiV3APIAvailable()) {
        exposeSanadAiV3API();
      }
    });
  }
}

// Note: mount is not exported to avoid namespace issues
// If needed, it can be accessed via SanadAiV3 internally

