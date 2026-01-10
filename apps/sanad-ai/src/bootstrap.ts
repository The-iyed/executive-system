import { createMount } from './mount';
import { AppConfig } from '@sanad-ai/config';
// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

const mount = createMount();
let currentContainer: HTMLElement | null = null;

// Export mount for UMD bundle (Vite will assign this to window.SANAD_APP)
export default mount;

// Create window API
if (typeof window !== 'undefined') {
  // Keep backward compatibility
  window.SANAD_APP = mount;
  
  // New window API
  (window as any).SanadAi = {
    open: (container: HTMLElement, config?: AppConfig) => {
      if (mount && container) {
        currentContainer = container;
        mount.mount(container, config || {});
      }
    },
    toggle: (container: HTMLElement, config?: AppConfig) => {
      if (currentContainer && currentContainer === container) {
        // If already mounted in this container, close it
        mount.unmount();
        currentContainer = null;
      } else {
        // Otherwise, open it
        if (mount && container) {
          currentContainer = container;
          mount.mount(container, config || {});
        }
      }
    },
    close: () => {
      if (mount && currentContainer) {
        mount.unmount();
        currentContainer = null;
      }
    },
    isOpen: () => {
      return currentContainer !== null;
    },
  };
}

