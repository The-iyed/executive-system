import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Package, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@sanad-ai/ui';

interface AppDoc {
  name: string;
  description: string;
  bundlePath?: string;
  globalName?: string;
  windowApi?: string;
  version?: string;
  languages: {
    name: string;
    code: string;
    examples: {
      title: string;
      code: string;
      description?: string;
    }[];
  }[];
}

// Get package version from build-time environment variable
const PACKAGE_VERSION = (import.meta.env.PACKAGE_VERSION as string) || '0.0.0';

// Get portal base URL from environment variable
const PORTAL_BASE_URL = import.meta.env.VITE_PORTAL_BASE_URL || 'https://legal-portal.momrahai.com';

const appDocs: AppDoc[] = [
  {
    name: 'Portal - المنصة القانونية الموحدة',
    description: 'Unified Legal Platform portal that provides access to multiple legal services including Sanad AI, Muhallil Ahkam, and Legal Stats.',
    version: PACKAGE_VERSION,
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: '1. Installation',
            description: 'Embed the Portal in your website using an iframe. The Portal is a full-featured application that can be integrated into any platform.',
            code: `<!-- Add the iframe to your website -->
<iframe 
  id="portal-iframe"
  src="https://your-portal-domain.com"
  width="100%" 
  height="800px"
  frameborder="0"
  allowfullscreen
></iframe>`,
          },
          {
            title: '2. Dynamic Loading',
            description: 'Load the Portal dynamically using JavaScript for better control.',
            code: `// Create and configure the iframe
const portalUrl = 'https://your-portal-domain.com';
const iframe = document.createElement('iframe');
iframe.src = portalUrl;
iframe.width = '100%';
iframe.height = '800px';
iframe.frameBorder = '0';
iframe.setAttribute('allowfullscreen', 'true');

// Append to container
const container = document.getElementById('portal-container');
container.appendChild(iframe);`,
          },
          {
            title: '3. Responsive Integration',
            description: 'Make the Portal responsive and handle window resizing.',
            code: `// Responsive iframe setup
function createPortalIframe(containerId, portalUrl) {
  const container = document.getElementById(containerId);
  const iframe = document.createElement('iframe');
  
  iframe.src = portalUrl;
  iframe.style.width = '100%';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.setAttribute('allowfullscreen', 'true');
  
  // Handle responsive height
  function adjustHeight() {
    iframe.style.height = window.innerHeight + 'px';
  }
  
  window.addEventListener('resize', adjustHeight);
  adjustHeight();
  
  container.appendChild(iframe);
  
  return iframe;
}

// Usage
const portal = createPortalIframe('portal-container', 'https://your-portal-domain.com');`,
          },
        ],
      },
      {
        name: 'React',
        code: 'typescript',
        examples: [
          {
            title: 'React Component Integration',
            description: 'Create a React component to embed the Portal.',
            code: `import React, { useRef, useEffect } from 'react';

interface PortalProps {
  portalUrl?: string;
  width?: string;
  height?: string;
}

export const Portal: React.FC<PortalProps> = ({ 
  portalUrl = 'https://your-portal-domain.com',
  width = '100%',
  height = '800px'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Handle messages from portal if needed
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== new URL(portalUrl).origin) {
        return;
      }
      // Handle messages from portal
      console.log('Message from portal:', event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [portalUrl]);

  return (
    <iframe
      ref={iframeRef}
      src={portalUrl}
      width={width}
      height={height}
      frameBorder="0"
      allowFullScreen
      style={{ border: 'none' }}
    />
  );
};

// Usage
function App() {
  return (
    <div>
      <h1>My Application</h1>
      <Portal 
        portalUrl="https://your-portal-domain.com"
        height="100vh"
      />
    </div>
  );
}`,
          },
        ],
      },
      {
        name: 'Angular',
        code: 'typescript',
        examples: [
          {
            title: 'Angular Component Integration',
            description: 'Create an Angular component to embed the Portal.',
            code: `<!-- portal.component.html -->
<iframe
  [src]="portalUrl"
  [width]="width"
  [height]="height"
  frameborder="0"
  allowfullscreen
  style="border: none;"
></iframe>

<!-- portal.component.ts -->
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.css']
})
export class PortalComponent implements OnInit {
  @Input() portalUrl: string = 'https://your-portal-domain.com';
  @Input() width: string = '100%';
  @Input() height: string = '800px';
  
  safeUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.portalUrl);
    
    // Listen for messages from portal
    window.addEventListener('message', (event) => {
      if (event.origin !== new URL(this.portalUrl).origin) {
        return;
      }
      console.log('Message from portal:', event.data);
    });
  }
}

<!-- Usage in app.component.html -->
<app-portal 
  [portalUrl]="'https://your-portal-domain.com'"
  [height]="'100vh'"
></app-portal>`,
          },
        ],
      },
      {
        name: '.NET (Razor Pages or MVC)',
        code: 'html',
        examples: [
          {
            title: 'Razor Page Integration',
            description: 'Embed the Portal in a Razor page.',
            code: `<!-- Views/Shared/_Layout.cshtml or Views/Home/Index.cshtml -->
@{
    ViewData["Title"] = "Legal Portal";
    var portalUrl = "https://your-portal-domain.com";
}

<div class="container-fluid p-0">
    <iframe 
        src="@portalUrl"
        width="100%" 
        height="800px"
        frameborder="0"
        allowfullscreen
        style="border: none;"
    ></iframe>
</div>

<script>
    // Optional: Handle messages from portal
    window.addEventListener('message', function(event) {
        // Verify origin
        if (event.origin !== '@portalUrl') {
            return;
        }
        console.log('Message from portal:', event.data);
    });
</script>`,
          },
        ],
      },
      {
        name: 'Vanilla HTML / JS',
        code: 'html',
        examples: [
          {
            title: 'Simple HTML Integration',
            description: 'Basic HTML integration of the Portal.',
            code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Portal Integration</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        #portal-container {
            width: 100%;
            height: 100vh;
        }
        #portal-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div id="portal-container">
        <iframe 
            src="https://your-portal-domain.com"
            allowfullscreen
        ></iframe>
    </div>

    <script>
        // Optional: Handle messages from portal
        window.addEventListener('message', function(event) {
            // Verify origin for security
            const portalOrigin = 'https://your-portal-domain.com';
            if (event.origin !== portalOrigin) {
                return;
            }
            console.log('Message from portal:', event.data);
        });
    </script>
</body>
</html>`,
          },
        ],
      },
      {
        name: 'TypeScript Support',
        code: 'typescript',
        examples: [
          {
            title: 'TypeScript Type Definitions',
            description: 'Add type definitions for Portal integration in TypeScript projects.',
            code: `// portal.d.ts
export interface PortalConfig {
  url: string;
  width?: string;
  height?: string;
  onMessage?: (event: MessageEvent) => void;
}

export class Portal {
  private iframe: HTMLIFrameElement;
  private config: PortalConfig;

  constructor(container: HTMLElement, config: PortalConfig) {
    this.config = config;
    this.iframe = document.createElement('iframe');
    this.iframe.src = config.url;
    this.iframe.width = config.width || '100%';
    this.iframe.height = config.height || '800px';
    this.iframe.frameBorder = '0';
    this.iframe.setAttribute('allowfullscreen', 'true');
    
    if (config.onMessage) {
      window.addEventListener('message', (event) => {
        if (event.origin === new URL(config.url).origin) {
          config.onMessage!(event);
        }
      });
    }
    
    container.appendChild(this.iframe);
  }

  destroy() {
    this.iframe.remove();
  }
}

// Usage
const portal = new Portal(
  document.getElementById('container')!,
  {
    url: 'https://your-portal-domain.com',
    height: '100vh',
    onMessage: (event) => {
      console.log('Portal message:', event.data);
    }
  }
);`,
          },
        ],
      },
    ],
  },
  {
    name: 'Sanad AI',
    description: 'AI-powered legal advisor application for providing legal consultations and document analysis.',
    bundlePath: 'sanad-ai-v3.js',
    globalName: 'SanadAiV3',
    windowApi: 'window.SanadAiV3',
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: 'Loading the Bundle',
            description: 'Load the bundle from the portal base URL. CSS is included in the JS bundle.',
            code: `// Portal base URL
const portalBaseUrl = '${PORTAL_BASE_URL}';

// Load Sanad AI bundle - CSS is automatically injected when the script loads
const script = document.createElement('script');
script.src = \`\${portalBaseUrl}/packages/sanad-ai-v3.js\`;
document.head.appendChild(script);

// Wait for script to load
script.onload = () => {
  // Sanad AI loaded! window.SanadAi or window.SanadAiV3 is now available
};`,
          },
          {
            title: 'Opening the App (No Container Required)',
            description: 'Open Sanad AI - the package will create its own fullscreen container automatically. Container parameter is optional.',
            code: `// Simple - no container needed! Package creates its own fullscreen container
window.SanadAi.open();

// Or with optional container if you want to use your own
const container = document.getElementById('sanad-ai-container');
window.SanadAi.open(container);

// Or with config (container still optional)
window.SanadAi.open(undefined, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
});`,
          },
          {
            title: 'Toggle the App',
            description: 'Toggle the app open/closed state. If open, it closes; if closed, it opens. Container is optional.',
            code: `// Toggle without container - package creates its own
window.SanadAi.toggle();

// Or with optional container
const container = document.getElementById('sanad-ai-container');
window.SanadAi.toggle(container);`,
          },
          {
            title: 'Closing the App',
            description: 'Close the app and unmount it from the container.',
            code: `// Close the app
window.SanadAiV3.close();`,
          },
          {
            title: 'Check if App is Open',
            description: 'Check whether the app is currently mounted and open.',
            code: `if (window.SanadAiV3.isOpen()) {
  // Sanad AI is currently open
} else {
  // Sanad AI is closed
}`,
          },
          {
            title: 'Complete Integration Example (No Container)',
            description: 'Simplest integration - no container needed. The package creates its own fullscreen container.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Sanad AI</title>
</head>
<body>
  <button id="open-btn">Open Sanad AI</button>
  <button id="close-btn">Close Sanad AI</button>
  <!-- No container div needed! -->

  <script>
    // Portal base URL
    const portalBaseUrl = '${PORTAL_BASE_URL}';
    
    // Load Sanad AI bundle
    const script = document.createElement('script');
    script.src = \`\${portalBaseUrl}/packages/sanad-ai.umd.js\`;
    document.head.appendChild(script);
    
    // Wait for script to load
    script.onload = () => {
      document.getElementById('open-btn').addEventListener('click', () => {
        // No container needed - package creates its own!
        window.SanadAi.open();
      });

      document.getElementById('close-btn').addEventListener('click', () => {
        window.SanadAi.close();
      });
    };
  </script>
</body>
</html>`,
          },
          {
            title: 'Integration with Custom Container (Optional)',
            description: 'If you want to use your own container element, you can still pass it as an optional parameter.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Sanad AI</title>
</head>
<body>
  <button id="open-btn">Open Sanad AI</button>
  <button id="close-btn">Close Sanad AI</button>
  <div id="my-custom-container"></div>

  <script>
    const portalBaseUrl = '${PORTAL_BASE_URL}';
    const script = document.createElement('script');
    script.src = \`\${portalBaseUrl}/packages/sanad-ai.umd.js\`;
    document.head.appendChild(script);
    
    script.onload = () => {
      const container = document.getElementById('my-custom-container');
      
      document.getElementById('open-btn').addEventListener('click', () => {
        // Use your own container (optional)
        window.SanadAi.open(container);
      });

      document.getElementById('close-btn').addEventListener('click', () => {
        window.SanadAi.close();
      });
    };
  </script>
</body>
</html>`,
          },
          {
            title: 'Configuration',
            description: 'Configuration can be passed as the second parameter. Container is still optional.',
            code: `// Open with config but no container (package creates its own)
window.SanadAi.open(undefined, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'your_username',
    password: 'your_password'
  }
});

// Or with both container and config
const container = document.getElementById('my-container');
window.SanadAi.open(container, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
});`,
          },
        ],
      },
    ],
  },
  {
    name: 'Muhallil Ahkam',
    description: 'Islamic legal rulings application for providing fatwas and religious consultations.',
    bundlePath: 'muhallil-ahkam.js',
    globalName: 'MuhallilAhkam',
    windowApi: 'window.MuhallilAhkam',
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: 'Loading the Bundle',
            description: 'Load the bundle from the portal base URL. CSS is included in the JS bundle.',
            code: `// Portal base URL
const portalBaseUrl = '${PORTAL_BASE_URL}';

// Load Muhallil Ahkam bundle - CSS is automatically injected when the script loads
const script = document.createElement('script');
script.src = \`\${portalBaseUrl}/packages/muhallil-ahkam.js\`;
document.head.appendChild(script);

// Wait for script to load
script.onload = () => {
  // Muhallil Ahkam loaded! window.MuhallilAhkam is now available
};`,
          },
          {
            title: 'Opening the App (No Container Required)',
            description: 'Open Muhallil Ahkam - the package will create its own fullscreen container automatically. Container parameter is optional.',
            code: `// Simple - no container needed! Package creates its own fullscreen container
window.MuhallilAhkam.open();

// Or with optional container if you want to use your own
const container = document.getElementById('muhallil-ahkam-container');
window.MuhallilAhkam.open(container);

// Or with config (container still optional)
window.MuhallilAhkam.open(undefined, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
});`,
          },
          {
            title: 'Toggle the App',
            description: 'Toggle the app open/closed state. If open, it closes; if closed, it opens. Container is optional.',
            code: `// Toggle without container - package creates its own
window.MuhallilAhkam.toggle();

// Or with optional container
const container = document.getElementById('muhallil-ahkam-container');
window.MuhallilAhkam.toggle(container);`,
          },
          {
            title: 'Closing the App',
            description: 'Close the app and unmount it from the container.',
            code: `// Close the app
window.MuhallilAhkam.close();`,
          },
          {
            title: 'Check if App is Open',
            description: 'Check whether the app is currently mounted and open.',
            code: `if (window.MuhallilAhkam.isOpen()) {
  // Muhallil Ahkam is currently open
} else {
  // Muhallil Ahkam is closed
}`,
          },
          {
            title: 'Complete Integration Example (No Container)',
            description: 'Simplest integration - no container needed. The package creates its own fullscreen container.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Muhallil Ahkam</title>
</head>
<body>
  <button id="open-btn">Open Muhallil Ahkam</button>
  <button id="close-btn">Close Muhallil Ahkam</button>
  <!-- No container div needed! -->

  <script>
    // Portal base URL
    const portalBaseUrl = '${PORTAL_BASE_URL}';
    
    // Load Muhallil Ahkam bundle
    const script = document.createElement('script');
    script.src = \`\${portalBaseUrl}/packages/muhallil-ahkam.umd.js\`;
    document.head.appendChild(script);
    
    // Wait for script to load
    script.onload = () => {
      document.getElementById('open-btn').addEventListener('click', () => {
        // No container needed - package creates its own!
        window.MuhallilAhkam.open();
      });

      document.getElementById('close-btn').addEventListener('click', () => {
        window.MuhallilAhkam.close();
      });
    };
  </script>
</body>
</html>`,
          },
          {
            title: 'Integration with Custom Container (Optional)',
            description: 'If you want to use your own container element, you can still pass it as an optional parameter.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Muhallil Ahkam</title>
</head>
<body>
  <button id="open-btn">Open Muhallil Ahkam</button>
  <button id="close-btn">Close Muhallil Ahkam</button>
  <div id="my-custom-container"></div>

  <script>
    const portalBaseUrl = '${PORTAL_BASE_URL}';
    const script = document.createElement('script');
    script.src = \`\${portalBaseUrl}/packages/muhallil-ahkam.umd.js\`;
    document.head.appendChild(script);
    
    script.onload = () => {
      const container = document.getElementById('my-custom-container');
      
      document.getElementById('open-btn').addEventListener('click', () => {
        // Use your own container (optional)
        window.MuhallilAhkam.open(container);
      });

      document.getElementById('close-btn').addEventListener('click', () => {
        window.MuhallilAhkam.close();
      });
    };
  </script>
</body>
</html>`,
          },
          {
            title: 'Configuration',
            description: 'Configuration can be passed as the second parameter. Container is still optional.',
            code: `// Open with config but no container (package creates its own)
window.MuhallilAhkam.open(undefined, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'your_username',
    password: 'your_password'
  }
});

// Or with both container and config
const container = document.getElementById('my-container');
window.MuhallilAhkam.open(container, {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
});`,
          },
        ],
      },
    ],
  },
  {
    name: 'Legal Assistant - المذكرة القانونية',
    description: 'AI-powered legal assistant chatbot that provides instant answers to legal questions through an interactive conversation interface.',
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: '1. Installation',
            description: 'Add the script tag to your website (just before </body>). Styles (CSS) are automatically loaded with the JavaScript file.',
            code: `<script src="https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js"></script>

<!-- This will:
- Initialize the Legal Assistant store
- Expose a global window.LegalAssistant API
- Automatically load styles (no need to add CSS separately) -->`,
          },
          {
            title: '2. Global API',
            description: 'Once the script is loaded, you can control the Legal Assistant modal programmatically.',
            code: `// Open the Legal Assistant modal
window.LegalAssistant.open();

// Close the Legal Assistant modal
window.LegalAssistant.close();

// Toggle between open/close
window.LegalAssistant.toggle();`,
          },
          {
            title: '3. Example — Trigger Modal from Any Button',
            description: 'You can open the chat from any element on your site.',
            code: `<button id="open-chat">المذكرة القانونية - Legal Assistant</button>

<script>
  document.getElementById("open-chat").addEventListener("click", () => {
    window.LegalAssistant.open();
  });
</script>`,
          },
          {
            title: '4. TypeScript Support',
            description: 'To avoid type errors in TypeScript projects, declare the global API once.',
            code: `// global.d.ts
export {};

declare global {
  interface Window {
    LegalAssistant: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}

// After adding this, VSCode and other editors will autocomplete window.LegalAssistant.`,
          },
          {
            title: '5. Events',
            description: 'You can listen to custom events to know when the Legal Assistant is ready, opened, or closed.',
            code: `// Fired when the package is ready to use
window.addEventListener('legal-assistant:ready', () => {
  console.log('Legal Assistant is ready!');
  // You can now use window.LegalAssistant
});

// Fired when the Legal Assistant is opened
window.addEventListener('legal-assistant:opened', () => {
  console.log('Legal Assistant opened');
});

// Fired when the Legal Assistant is closed
window.addEventListener('legal-assistant:closed', () => {
  console.log('Legal Assistant closed');
});`,
          },
        ],
      },
      {
        name: 'React',
        code: 'typescript',
        examples: [
          {
            title: 'React Integration',
            description: 'Add the script inside the <body> tag of public/index.html.',
            code: `<!-- public/index.html -->
<body>
  <div id="root"></div>

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js";
      document.body.appendChild(e);
    });
  </script>
</body>`,
          },
        ],
      },
      {
        name: 'Angular',
        code: 'typescript',
        examples: [
          {
            title: 'Angular Integration',
            description: 'Insert the script into src/index.html at the end of <body>.',
            code: `<!-- src/index.html -->
<body>
  <app-root></app-root>

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js";
      document.body.appendChild(e);
    });
  </script>
</body>`,
          },
        ],
      },
      {
        name: '.NET (Razor Pages or MVC)',
        code: 'html',
        examples: [
          {
            title: '.NET Integration',
            description: 'Add the script in _Layout.cshtml, just before the closing </body> tag.',
            code: `<!-- Views/Shared/_Layout.cshtml -->
<body>
  @RenderBody()

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js";
      document.body.appendChild(e);
    });
  </script>
</body>`,
          },
        ],
      },
      {
        name: 'Vanilla HTML / JavaScript',
        code: 'html',
        examples: [
          {
            title: 'Vanilla HTML Integration',
            description: 'Paste the script near the end of your main index.html file.',
            code: `<!-- index.html -->
<body>
  <!-- Your content -->

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js";
      document.body.appendChild(e);
    });
  </script>
</body>`,
          },
        ],
      },
    ],
  },
];

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code }) => {
  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
      <code>{code}</code>
    </pre>
  );
};

export const DocsPage: React.FC = () => {
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [openLanguage, setOpenLanguage] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Integration Documentation</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Learn how to integrate Sanad AI Portal and applications into your website or platform. 
          The Portal is a full-featured application that can be embedded via iframe, while individual apps (Sanad AI, Muhallil Ahkam, Legal Assistant) 
          are available as UMD bundles that can be loaded and controlled via a simple window API.
        </p>
      </div>

      <div className="space-y-4">
        {appDocs.map((appDoc, appIndex) => (
          <Collapsible
            key={appIndex}
            open={openApp === appDoc.name}
            onOpenChange={(open) => setOpenApp(open ? appDoc.name : null)}
            className="border border-gray-200 rounded-lg bg-white shadow-sm"
          >
            <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-600" />
                <div className="text-right">
                  <h3 className="font-semibold text-lg text-gray-900">{appDoc.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{appDoc.description}</p>
                </div>
              </div>
              {openApp === appDoc.name ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 pb-6">
              {appDoc.version && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Package Version:</strong> <code className="bg-green-100 px-2 py-1 rounded">v{appDoc.version}</code>
                  </p>
                  <p className="text-xs text-green-600">
                    Current version of the Portal package. The Portal is a full-featured application that can be embedded via iframe.
                  </p>
                </div>
              )}
              {appDoc.bundlePath && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Bundle Path:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{`${window.location.origin}/${appDoc.bundlePath}`}</code>
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Window API:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{appDoc.windowApi}</code>
                  </p>
                  <p className="text-xs text-blue-600">
                    Served as UMD bundle from current origin. Load via script tag and use the window API to control the app.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {appDoc.languages.map((language, langIndex) => (
                  <Collapsible
                    key={langIndex}
                    open={openLanguage === `${appDoc.name}-${language.name}`}
                    onOpenChange={(open) => setOpenLanguage(open ? `${appDoc.name}-${language.name}` : null)}
                    className="border border-gray-200 rounded-lg"
                  >
                    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{language.name}</span>
                      </div>
                      {openLanguage === `${appDoc.name}-${language.name}` ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pb-3">
                      <div className="space-y-6 mt-3">
                        {language.examples.map((example, exampleIndex) => (
                          <div key={exampleIndex} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              {example.title}
                            </h4>
                            {example.description && (
                              <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                            )}
                            <CodeBlock code={example.code} language={language.code} />
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <div className="mt-8 p-6 bg-teal-50 border border-teal-200 rounded-lg">
        <h2 className="text-xl font-semibold text-teal-900 mb-3">Window API Reference</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-teal-800 mb-2">Sanad AI API</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.open(container?, config?)</code> - Open the app. Container is optional - package creates its own fullscreen container if not provided.</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.toggle(container?, config?)</code> - Toggle the app open/closed. Container is optional.</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.close()</code> - Close the app</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.isOpen()</code> - Check if app is open</li>
            </ul>
            <p className="text-xs text-teal-600 mt-2">
              <strong>Note:</strong> <code className="bg-teal-100 px-1 py-0.5 rounded">window.SanadAiV3</code> is also available as an alias.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-teal-800 mb-2">Muhallil Ahkam API</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.open(container?, config?)</code> - Open the app. Container is optional - package creates its own fullscreen container if not provided.</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.toggle(container?, config?)</code> - Toggle the app open/closed. Container is optional.</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.close()</code> - Close the app</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.isOpen()</code> - Check if app is open</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-teal-800 mb-2">Legal Assistant API - المذكرة القانونية</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.LegalAssistant.open()</code> - Open the Legal Assistant modal</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.LegalAssistant.close()</code> - Close the Legal Assistant modal</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.LegalAssistant.toggle()</code> - Toggle between open/close</li>
            </ul>
            <p className="text-xs text-teal-600 mt-2">
              <strong>Events:</strong> Listen to <code className="bg-teal-100 px-1 py-0.5 rounded">legal-assistant:ready</code>, <code className="bg-teal-100 px-1 py-0.5 rounded">legal-assistant:opened</code>, and <code className="bg-teal-100 px-1 py-0.5 rounded">legal-assistant:closed</code> events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
