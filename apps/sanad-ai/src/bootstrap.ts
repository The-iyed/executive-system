import { createMount } from './mount';
// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

const mount = createMount();
let currentContainer: HTMLElement | null = null;
let createdContainer: HTMLElement | null = null;

// Helper function to add isolation styles
const addIsolationStyles = () => {
  const styleId = 'sanad-ai-isolation-styles';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #sanad-ai-container {
      all: initial;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 9999 !important;
      background-color: #ffffff !important;
      contain: layout style paint !important;
      isolation: isolate !important;
    }
    #sanad-ai-container * {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
};

// Helper function to create a fullscreen container
const createFullscreenContainer = (): HTMLElement => {
  // Add isolation styles
  addIsolationStyles();

  // Check if container already exists
  const existingContainer = document.getElementById('sanad-ai-container');
  if (existingContainer) {
    return existingContainer;
  }

  const container = document.createElement('div');
  container.id = 'sanad-ai-container';
  container.setAttribute('data-package-container', 'sanad-ai');
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

// Export mount for UMD bundle (Vite will assign this to window.SANAD_APP)
export default mount;

// Create window API
if (typeof window !== 'undefined') {
  // Keep backward compatibility
  window.SANAD_APP = mount;
  
  // New window API - container is now optional, creates its own isolated container
  (window as any).SanadAiV3 = {
    open: (_container?: HTMLElement) => {
      // Container parameter is ignored - package creates its own isolated container
      if (mount) {
        // Always create our own isolated container for better isolation
        const targetContainer = createFullscreenContainer();
        createdContainer = targetContainer;
        currentContainer = targetContainer;
        mount.mount(targetContainer);
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

  // Also create SanadAi alias for backward compatibility
  (window as any).SanadAi = (window as any).SanadAiV3;
}

