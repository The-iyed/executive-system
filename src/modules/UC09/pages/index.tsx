import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/modules/auth';
import { UEP_REMOTE_URL } from '@/lib/env';

const REMOTE_ENTRY_URL = `${UEP_REMOTE_URL}/assets/remoteEntry.js`;

type ViteFederationRemote = {
  init?: (shareScope: unknown) => Promise<void> | void;
  get: (module: string) => Promise<() => unknown>;
};

type BootstrapModule = {
  mountApp?: (
    element: HTMLElement | string, 
    options?: { 
      basename?: string;
      assetBaseUrl?: string;
      onLogout?: () => void;
      hostOrigin?: string;
    }
  ) => (() => void) | void;
  unmountApp?: () => void;
  default?: {
    mountApp?: (
      element: HTMLElement | string, 
      options?: { 
        basename?: string;
        assetBaseUrl?: string;
        onLogout?: () => void;
        hostOrigin?: string;
      }
    ) => (() => void) | void;
    unmountApp?: () => void;
  };
};

const UC09Page = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout: hostLogout } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadMicrofrontend = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait a tick to ensure ref is set
        await new Promise(resolve => setTimeout(resolve, 0));

        if (!mounted) return;

        if (!containerRef.current) {
          throw new Error('Container element not available');
        }

        // Dynamically import the remote entry
        const remote = (await import(
          /* @vite-ignore */
          REMOTE_ENTRY_URL
        )) as unknown as ViteFederationRemote;

        if (!mounted) return;

        if (!remote || typeof remote.get !== 'function') {
          throw new Error('Invalid module federation remote: missing get() method');
        }

        // Initialize the remote with an empty shared scope
        // This ensures the remote uses its own dependencies
        await remote.init?.({});

        if (!mounted) return;

        // Load the bootstrap module that contains mountApp
        const bootstrapFactory = await remote.get('./bootstrap');
        const bootstrapModule = bootstrapFactory() as BootstrapModule;

        if (!mounted) return;

        // Get the mountApp function from the module
        const mountApp = 
          bootstrapModule.mountApp || 
          bootstrapModule.default?.mountApp;

        if (typeof mountApp !== 'function') {
          throw new Error(
            'Remote module does not export a mountApp function. ' +
            'Please ensure ./bootstrap exports mountApp(element).'
          );
        }

        // Double-check container is still available
        if (!containerRef.current) {
          throw new Error('Container element was unmounted before mount');
        }

        // Mount the application with all options
        const cleanup = mountApp(containerRef.current, { 
          basename: '/uc09',
          assetBaseUrl: UEP_REMOTE_URL,
          onLogout: hostLogout,  // Pass host logout function
          hostOrigin: window.location.origin  // Pass host's origin for navigation
        });
        
        // Store cleanup function if provided
        if (typeof cleanup === 'function') {
          cleanupRef.current = cleanup;
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Unknown error occurred while loading UC09';
        
        console.error('UC09 Microfrontend Load Error:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadMicrofrontend();

    // Cleanup function
    return () => {
      mounted = false;
      
      // Call cleanup function if it exists
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (err) {
          console.error('Error during UC09 cleanup:', err);
        }
        cleanupRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative overflow-visible" dir="rtl">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            <div className="text-lg text-gray-600 mb-2">جاري تحميل تطبيق UC09...</div>
            <div className="text-sm text-gray-500">يرجى الانتظار</div>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-white z-10">
          <div
            className="max-w-md rounded-lg border border-red-200 bg-red-50 px-6 py-4"
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              خطأ في تحميل التطبيق
            </h3>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <details className="text-xs text-red-600">
              <summary className="cursor-pointer hover:text-red-800">
                معلومات تقنية
              </summary>
              <div className="mt-2 p-2 bg-red-100 rounded">
                <p>Remote URL: {REMOTE_ENTRY_URL}</p>
                <p className="mt-1">
                  تأكد من أن تطبيق UEP System Admin متاح على:
                </p>
                <p className="mt-1 font-mono text-xs">
                  {UEP_REMOTE_URL}
                </p>
                <p className="mt-2">
                  تحقق من:
                </p>
                <ul className="list-disc list-inside mt-1">
                  <li>صحة رابط الخادم</li>
                  <li>إعدادات CORS</li>
                  <li>توفر الملفات المطلوبة</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      )}
      
      {/* Container - always rendered with overflow-visible for hover effects */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full overflow-visible" id="uc09-container" />
    </div>
  );
};

export default UC09Page;

