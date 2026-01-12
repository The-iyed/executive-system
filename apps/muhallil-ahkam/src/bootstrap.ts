import { createMount } from './mount';
// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

const mount = createMount();
let currentContainer: HTMLElement | null = null;
let createdContainer: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

// Store CSS content to inject into shadow root
let cssContent: string | null = null;

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
  const style = document.createElement('style');
  style.textContent = css;
  shadowRoot.appendChild(style);
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
  
  // Create inner container inside shadow root
  const innerContainer = document.createElement('div');
  innerContainer.style.width = '100%';
  innerContainer.style.height = '100%';
  innerContainer.style.position = 'relative';
  innerContainer.style.overflow = 'hidden';
  innerContainer.style.backgroundColor = '#ffffff';
  shadow.appendChild(innerContainer);
  
  // Inject CSS into shadow root if available
  if (cssContent) {
    injectStylesIntoShadowRoot(shadow, cssContent);
  }
  
  // Ensure host container is appended to body
  document.body.appendChild(hostContainer);
  
  // Return inner container for React to mount into
  return innerContainer;
};

// Function to set CSS content (called from vite build)
if (typeof window !== 'undefined') {
  (window as any).__MUHALLIL_AHKAM_CSS__ = (css: string) => {
    cssContent = css;
    // If shadow root already exists, inject styles
    if (shadowRoot) {
      injectStylesIntoShadowRoot(shadowRoot, css);
    }
  };
}

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
          
          // Prevent body scroll when container is open
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          
          mount.mount(targetContainer);
          
          // Store original overflow to restore on close
          (targetContainer as any).__originalBodyOverflow = originalOverflow;
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
          const targetContainer = createFullscreenContainer();
          createdContainer = targetContainer;
          currentContainer = targetContainer;
          mount.mount(targetContainer);
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
