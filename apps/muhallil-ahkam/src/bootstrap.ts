import { createMount } from './mount';
// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

const mount = createMount();
let currentContainer: HTMLElement | null = null;
let createdContainer: HTMLElement | null = null;

// Helper function to add isolation styles
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
      background-color: #ffffff !important;
      contain: layout style paint size !important;
      isolation: isolate !important;
      overflow: hidden !important;
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
    
    /* Ensure all children are contained and don't affect parent */
    #muhallil-ahkam-container *,
    #muhallil-ahkam-container *::before,
    #muhallil-ahkam-container *::after {
      box-sizing: border-box;
    }
    
    /* Prevent styles from Muhallil Ahkam affecting Sanad AI */
    body > *:not(#muhallil-ahkam-container) {
      /* Sanad AI elements remain unaffected */
    }
    
    /* Scoped styles - only apply to container and its children */
    #muhallil-ahkam-container {
      /* All styles are scoped to this container */
    }
  `;
  document.head.appendChild(style);
};

// Helper function to create a fullscreen container
const createFullscreenContainer = (): HTMLElement => {
  // Add isolation styles
  addIsolationStyles();

  // Check if container already exists
  const existingContainer = document.getElementById('muhallil-ahkam-container');
  if (existingContainer) {
    return existingContainer;
  }

  const container = document.createElement('div');
  container.id = 'muhallil-ahkam-container';
  container.setAttribute('data-package-container', 'muhallil-ahkam');
  
  // Add additional isolation attributes
  container.setAttribute('data-isolated', 'true');
  container.setAttribute('data-package', 'muhallil-ahkam');
  
  // Ensure container is appended to body (not inside Sanad AI's DOM tree)
  document.body.appendChild(container);
  return container;
};

// Helper function to remove created container
const removeCreatedContainer = () => {
  if (createdContainer && createdContainer.parentNode) {
    document.body.removeChild(createdContainer);
    createdContainer = null;
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
