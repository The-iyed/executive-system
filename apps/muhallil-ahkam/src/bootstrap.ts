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

const mount = createMount();
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

// Export mount for UMD bundle (Vite will assign this to window.AHKAM_APP)
export default mount;

// Create window API
if (typeof window !== 'undefined') {
  // Keep backward compatibility
  window.AHKAM_APP = mount;
  
  // New window API - container is now optional, creates its own isolated container
  (window as any).MuhallilAhkam = {
    open: (_container?: HTMLElement) => {
      // Container parameter is ignored - package creates its own isolated container
      if (mount) {
        try {
          // Always create our own isolated container for better isolation
          const targetContainer = createFullscreenContainer();
          createdContainer = targetContainer;
          currentContainer = targetContainer;
          
          // CRITICAL: Ensure CSS is injected BEFORE mounting React
          // We MUST wait for CSS to be available before mounting
          const ensureCSSAndMount = () => {
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
              
              mount.mount(targetContainer);
              
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
                  ensureCSSAndMount();
                } else if (attempts >= maxAttempts) {
                  clearInterval(checkInterval);
                  console.error('Muhallil Ahkam: CSS failed to load after 1 second, mounting without styles');
                  // Mount anyway (styles might load later)
                  const originalOverflow = document.body.style.overflow;
                  document.body.style.overflow = 'hidden';
                  mount.mount(targetContainer);
                  (targetContainer as any).__originalBodyOverflow = originalOverflow;
                }
              }, 100);
            } else {
              // shadowRoot not available (shouldn't happen)
              console.error('Muhallil Ahkam: Shadow root not available');
            }
          };
          
          ensureCSSAndMount();
        } catch (error) {
          console.error('Error opening Muhallil Ahkam:', error);
        }
      }
    },
    toggle: () => {
      if (currentContainer) {
        // If already open, close it
        mount.unmount();
        if (createdContainer) {
          removeCreatedContainer();
        }
        currentContainer = null;
      } else {
        // Otherwise, open it
        if (mount) {
          try {
            const targetContainer = createFullscreenContainer();
            createdContainer = targetContainer;
            currentContainer = targetContainer;
            
            // CRITICAL: Ensure CSS is injected BEFORE mounting React
            const ensureCSSAndMount = () => {
              // Try to get CSS from stored global if not in cssContent
              if (!cssContent && typeof window !== 'undefined' && (window as any).__MUHALLIL_AHKAM_CSS_STORED__) {
                cssContent = (window as any).__MUHALLIL_AHKAM_CSS_STORED__;
              }
              
              if (cssContent && shadowRoot) {
                const hasStyles = Array.from(shadowRoot.querySelectorAll('style')).length > 0;
                if (!hasStyles) {
                  injectStylesIntoShadowRoot(shadowRoot, cssContent);
                }
                
                const originalOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                
                mount.mount(targetContainer);
                
                (targetContainer as any).__originalBodyOverflow = originalOverflow;
              } else if (!cssContent) {
                // Wait for CSS (max 10 attempts = 1 second)
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
                    ensureCSSAndMount();
                  } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('Muhallil Ahkam: CSS failed to load, mounting without styles');
                    const originalOverflow = document.body.style.overflow;
                    document.body.style.overflow = 'hidden';
                    mount.mount(targetContainer);
                    (targetContainer as any).__originalBodyOverflow = originalOverflow;
                  }
                }, 100);
              }
            };
            
            ensureCSSAndMount();
          } catch (error) {
            console.error('Error toggling Muhallil Ahkam:', error);
          }
        }
      }
    },
    close: () => {
      if (mount && currentContainer) {
        mount.unmount();
        
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
      }
    },
    isOpen: () => {
      return currentContainer !== null;
    },
  };
}
