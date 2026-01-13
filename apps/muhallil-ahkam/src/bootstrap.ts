// React, ReactDOM, and ReactQuery are now bundled with the package
// No need to check for external React dependencies

import { createMount } from './mount';

// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

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
  (window as any).__MUHALLIL_AHKAM_CSS__ = (css: string) => {
    cssContent = css;
    // Store CSS globally so it can be retrieved later
    (window as any).__MUHALLIL_AHKAM_CSS_STORED__ = css;
    // If shadow root already exists, inject styles immediately
    if (shadowRoot) {
      injectCSSIntoShadow(shadowRoot, css);
    }
  };
}

// Mount creation - React is now bundled, so we can create mount when needed
let mountInstance: any = null;

const getMount = () => {
  if (!mountInstance) {
    try {
      // Create mount - React is bundled, so this will work
      mountInstance = createMount();
    } catch (error: any) {
      console.error('[Muhallil Ahkam] Failed to create mount:', error);
      throw error;
    }
  }
  return mountInstance;
};

let currentContainer: HTMLElement | null = null;
let createdContainer: HTMLElement | null = null;

// Helper function to add isolation styles for the host container
const addIsolationStyles = () => {
  const styleId = 'muhallil-ahkam-isolation-styles';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Strong isolation for Muhallil Ahkam container - prevents style leakage */
    #muhallil-ahkam-container {
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
    body:has(#muhallil-ahkam-container) {
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
  const existingContainer = document.getElementById('muhallil-ahkam-container');
  if (existingContainer && existingContainer.shadowRoot) {
    return existingContainer.shadowRoot as any; // Return shadow root content
  }

  // Create host container
  const hostContainer = document.createElement('div');
  hostContainer.id = 'muhallil-ahkam-container';
  hostContainer.setAttribute('data-package-container', 'muhallil-ahkam');
  hostContainer.setAttribute('data-isolated', 'true');
  hostContainer.setAttribute('data-package', 'muhallil-ahkam');
  
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
    const storedCSS = (window as any).__MUHALLIL_AHKAM_CSS_STORED__;
    if (storedCSS) {
      cssContent = storedCSS;
      injectStylesIntoShadowRoot(shadow, storedCSS);
    } else {
      // Log warning if CSS is not available (for debugging)
      console.warn('Muhallil Ahkam: CSS not available when creating shadow root. It will be injected when available.');
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
  if (!cssContent && typeof window !== 'undefined' && (window as any).__MUHALLIL_AHKAM_CSS_STORED__) {
    cssContent = (window as any).__MUHALLIL_AHKAM_CSS_STORED__;
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
      if (typeof window !== 'undefined' && (window as any).__MUHALLIL_AHKAM_CSS_STORED__) {
        cssContent = (window as any).__MUHALLIL_AHKAM_CSS_STORED__;
      }
      if (cssContent && shadowRoot) {
        clearInterval(checkInterval);
        ensureCSSAndMount(targetContainer);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Muhallil Ahkam: CSS failed to load after 1 second, mounting without styles');
        // Mount anyway (styles might load later)
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        getMount().mount(targetContainer);
        (targetContainer as any).__originalBodyOverflow = originalOverflow;
      }
    }, 100);
  } else {
    // shadowRoot not available (shouldn't happen)
    console.error('Muhallil Ahkam: Shadow root not available');
  }
};

/**
 * Utility to expose the MuhallilAhkam API globally on the window object
 * This allows external websites to control the Muhallil Ahkam programmatically
 * 
 * @description This function creates and exposes the MuhallilAhkam API with methods to
 * open, close, toggle, and check the state of the Muhallil Ahkam interface.
 * The API uses Shadow DOM for complete style isolation.
 * 
 * @example
 * ```ts
 * // After script loads, the API is automatically available:
 * window.MuhallilAhkam.open();
 * window.MuhallilAhkam.close();
 * window.MuhallilAhkam.toggle();
 * window.MuhallilAhkam.isOpen();
 * 
 * // Listen to events
 * window.addEventListener('MuhallilAhkam:opened', (e) => {
 *   console.log('Muhallil Ahkam opened', e.detail);
 * });
 * ```
 */
const createMuhallilAhkamAPI = () => {
  /**
   * Opens the Muhallil Ahkam interface
   * @description Programmatically opens the Muhallil Ahkam interface in a Shadow DOM container.
   * Container parameter is ignored - the package creates its own isolated container.
   * 
   * @param {HTMLElement} _container - Optional container (ignored, package creates its own)
   */
  const open = (_container?: HTMLElement): void => {
    // Container parameter is ignored - package creates its own isolated container
    
    console.log('[Muhallil Ahkam] open() called');
    
    // React is now bundled with the package, no need to check for external dependencies
    
    if (currentContainer) {
      console.warn('[Muhallil Ahkam] Already open, use close() first or toggle()');
      return;
    }

    try {
      console.log('[Muhallil Ahkam] Creating fullscreen container...');
      // Always create our own isolated container for better isolation
      const targetContainer = createFullscreenContainer();
      createdContainer = targetContainer;
      currentContainer = targetContainer;
      console.log('[Muhallil Ahkam] ✓ Container created');
      
      // CRITICAL: Ensure CSS is injected BEFORE mounting React
      console.log('[Muhallil Ahkam] Ensuring CSS and mounting...');
      ensureCSSAndMount(targetContainer);
      console.log('[Muhallil Ahkam] ✓ Mounting completed');
      
      // Dispatch custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MuhallilAhkam:opened', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      console.log('[Muhallil Ahkam] ✓ Opened successfully');
    } catch (error) {
      console.error('[Muhallil Ahkam] ✗ Error opening:', error);
      console.error('[Muhallil Ahkam] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MuhallilAhkam:error', {
          detail: { error, action: 'open', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Closes the Muhallil Ahkam interface
   * @description Programmatically closes the Muhallil Ahkam interface and removes the Shadow DOM container.
   */
  const close = (): void => {
    if (!currentContainer) {
      console.warn('[Muhallil Ahkam] Not open, nothing to close');
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
        window.dispatchEvent(new CustomEvent('MuhallilAhkam:closed', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      console.log('[Muhallil Ahkam] Closed programmatically');
    } catch (error) {
      console.error('[Muhallil Ahkam] Error closing:', error);
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MuhallilAhkam:error', {
          detail: { error, action: 'close', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Toggles the Muhallil Ahkam interface state
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
        const eventType = !wasOpen ? 'MuhallilAhkam:opened' : 'MuhallilAhkam:closed';
        window.dispatchEvent(new CustomEvent(eventType, {
          detail: { timestamp: Date.now(), toggled: true }
        }));
      }
      
      console.log(`[Muhallil Ahkam] ${!wasOpen ? 'Opened' : 'Closed'} programmatically (toggle)`);
    } catch (error) {
      console.error('[Muhallil Ahkam] Error toggling:', error);
      
      // Dispatch error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('MuhallilAhkam:error', {
          detail: { error, action: 'toggle', timestamp: Date.now() }
        }));
      }
    }
  };

  /**
   * Checks if the Muhallil Ahkam interface is currently open
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

// Create MuhallilAhkam API object
const MuhallilAhkam = createMuhallilAhkamAPI();

// Export MuhallilAhkam as default - Vite will assign this to window.MuhallilAhkam
// We use ONLY default export to avoid Vite creating a namespace object
export default MuhallilAhkam;

/**
 * Exposes the MuhallilAhkam API globally on the window object
 * @description This function should be called after the API is created.
 * It ensures the API is available on window.MuhallilAhkam and dispatches a ready event.
 * 
 * @example
 * ```ts
 * // The API is automatically exposed when the script loads
 * // External websites can use:
 * window.MuhallilAhkam.open();
 * window.MuhallilAhkam.close();
 * window.MuhallilAhkam.toggle();
 * window.MuhallilAhkam.isOpen();
 * 
 * // Listen to events
 * window.addEventListener('MuhallilAhkam:ready', () => {
 *   console.log('Muhallil Ahkam is ready!');
 * });
 * ```
 */
const exposeMuhallilAhkamAPI = (): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('[Muhallil Ahkam] exposeMuhallilAhkamAPI: window object not available (SSR environment)');
    return;
  }

  // Attach the API to the window object
  (window as any).MuhallilAhkam = MuhallilAhkam;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('MuhallilAhkam:ready', {
    detail: { api: MuhallilAhkam, timestamp: Date.now() }
  }));

  console.log('[Muhallil Ahkam] API exposed globally on window.MuhallilAhkam');
  console.log('[Muhallil Ahkam] Available methods:', Object.keys(MuhallilAhkam));
};

/**
 * Checks if the MuhallilAhkam API is available on the window object
 * @returns {boolean} True if the API is available
 */
const isMuhallilAhkamAPIAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).MuhallilAhkam === 'object' && 
         typeof (window as any).MuhallilAhkam.open === 'function';
};

// Expose the API immediately when script loads
// Use multiple strategies to ensure it's set after Vite's UMD wrapper
if (typeof window !== 'undefined') {
  // Immediate assignment
  exposeMuhallilAhkamAPI();
  
  // Also ensure it's set after Vite's wrapper (if it runs after)
  Promise.resolve().then(() => {
    if (!isMuhallilAhkamAPIAvailable()) {
      exposeMuhallilAhkamAPI();
    }
  });
  
  setTimeout(() => {
    if (!isMuhallilAhkamAPIAvailable()) {
      exposeMuhallilAhkamAPI();
    }
  }, 0);
  
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      if (!isMuhallilAhkamAPIAvailable()) {
        exposeMuhallilAhkamAPI();
      }
    });
  }
}
