import { createMount } from './mount';
import { AppConfig } from '@sanad-ai/config';
// Import styles to ensure Tailwind CSS is included in the bundle
import './styles.css';

const mount = createMount();

// Export mount for UMD bundle (Vite will assign this to window.AHKAM_APP)
export default mount;

// Ensure it's also available on window for direct access
if (typeof window !== 'undefined') {
  window.AHKAM_APP = mount;
  
  // Add a window function to open the app programmatically
  (window as any).openMuhallilAhkam = (container: HTMLElement, config?: AppConfig) => {
    if (mount && container) {
      mount.mount(container, config || {});
    }
  };
}
