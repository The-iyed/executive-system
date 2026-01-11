import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, Package, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@sanad-ai/ui';

interface AppDoc {
  name: string;
  description: string;
  bundlePath: string;
  globalName: string;
  windowApi: string;
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

const appDocs: AppDoc[] = [
  {
    name: 'Sanad AI',
    description: 'AI-powered legal advisor application for providing legal consultations and document analysis.',
    bundlePath: 'sanad-ai.umd.js',
    globalName: 'SanadAi',
    windowApi: 'window.SanadAi',
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: 'Loading the Bundle',
            description: 'Dynamically load the bundle from your current origin. CSS is included in the JS bundle.',
            code: `// Get current origin dynamically
const currentOrigin = window.location.origin;

// Load Sanad AI bundle - CSS is automatically injected when the script loads
const script = document.createElement('script');
script.src = \`\${currentOrigin}/sanad-ai.umd.js\`;
document.head.appendChild(script);

// Wait for script to load
script.onload = () => {
  // Sanad AI loaded! window.SanadAi is now available
};`,
          },
          {
            title: 'Opening the App',
            description: 'Open Sanad AI in a container element with optional configuration.',
            code: `// Get container element
const container = document.getElementById('sanad-ai-container');

// Configure API endpoint and authentication
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'your_username',
    password: 'your_password'
  }
};

// Open the app
window.SanadAi.open(container, config);`,
          },
          {
            title: 'Toggle the App',
            description: 'Toggle the app open/closed state. If open, it closes; if closed, it opens.',
            code: `const container = document.getElementById('sanad-ai-container');
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
};

// Toggle open/closed
window.SanadAi.toggle(container, config);`,
          },
          {
            title: 'Closing the App',
            description: 'Close the app and unmount it from the container.',
            code: `// Close the app
window.SanadAi.close();`,
          },
          {
            title: 'Check if App is Open',
            description: 'Check whether the app is currently mounted and open.',
            code: `if (window.SanadAi.isOpen()) {
  // Sanad AI is currently open
} else {
  // Sanad AI is closed
}`,
          },
          {
            title: 'Complete Integration Example',
            description: 'Full example showing how to integrate Sanad AI in your application.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Sanad AI</title>
</head>
<body>
  <button id="open-btn">Open Sanad AI</button>
  <button id="close-btn">Close Sanad AI</button>
  <div id="sanad-ai-container"></div>

  <script>
    // Get current origin dynamically
    const currentOrigin = window.location.origin;
    
    // Load Sanad AI bundle
    const script = document.createElement('script');
    script.src = \`\${currentOrigin}/sanad-ai.umd.js\`;
    document.head.appendChild(script);
    
    // Wait for script to load
    script.onload = () => {
      const container = document.getElementById('sanad-ai-container');
      const config = {
        apiBaseUrl: 'https://api.example.com/api',
        basicAuth: {
          username: 'your_username',
          password: 'your_password'
        }
      };

      document.getElementById('open-btn').addEventListener('click', () => {
        window.SanadAi.open(container, config);
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
            title: 'Environment Variables',
            description: 'Configure API endpoint and authentication via environment variables or config object.',
            code: `// Option 1: Pass config directly
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'user',
    password: 'pass'
  }
};
window.SanadAi.open(container, config);

// Option 2: Use environment variables (if using a build tool)
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  basicAuth: {
    username: import.meta.env.VITE_API_BASIC_AUTH_USERNAME,
    password: import.meta.env.VITE_API_BASIC_AUTH_PASSWORD
  }
};
window.SanadAi.open(container, config);`,
          },
        ],
      },
    ],
  },
  {
    name: 'Muhallil Ahkam',
    description: 'Islamic legal rulings application for providing fatwas and religious consultations.',
    bundlePath: 'muhallil-ahkam.umd.js',
    globalName: 'MuhallilAhkam',
    windowApi: 'window.MuhallilAhkam',
    languages: [
      {
        name: 'JavaScript/TypeScript',
        code: 'typescript',
        examples: [
          {
            title: 'Loading the Bundle',
            description: 'Simply load the bundle from your current origin. CSS is included in the JS bundle.',
            code: `<!-- Load Muhallil Ahkam bundle from current origin -->
<!-- CSS is automatically injected when the script loads -->
<script src="/muhallil-ahkam.umd.js"></script>

<!-- That's it! window.MuhallilAhkam is now available -->`,
          },
          {
            title: 'Opening the App',
            description: 'Open Muhallil Ahkam in a container element with optional configuration.',
            code: `// Get container element
const container = document.getElementById('muhallil-ahkam-container');

// Configure API endpoint and authentication
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'your_username',
    password: 'your_password'
  }
};

// Open the app
window.MuhallilAhkam.open(container, config);`,
          },
          {
            title: 'Toggle the App',
            description: 'Toggle the app open/closed state. If open, it closes; if closed, it opens.',
            code: `const container = document.getElementById('muhallil-ahkam-container');
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: { username: 'user', password: 'pass' }
};

// Toggle open/closed
window.MuhallilAhkam.toggle(container, config);`,
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
            title: 'Complete Integration Example',
            description: 'Full example showing how to integrate Muhallil Ahkam in your application.',
            code: `<!DOCTYPE html>
<html>
<head>
  <title>My App with Muhallil Ahkam</title>
</head>
<body>
  <button id="open-btn">Open Muhallil Ahkam</button>
  <button id="close-btn">Close Muhallil Ahkam</button>
  <div id="muhallil-ahkam-container"></div>

  <script>
    // Get current origin dynamically
    const currentOrigin = window.location.origin;
    
    // Load Muhallil Ahkam bundle
    const script = document.createElement('script');
    script.src = \`\${currentOrigin}/muhallil-ahkam.umd.js\`;
    document.head.appendChild(script);
    
    // Wait for script to load
    script.onload = () => {
      const container = document.getElementById('muhallil-ahkam-container');
      const config = {
        apiBaseUrl: 'https://api.example.com/api',
        basicAuth: {
          username: 'your_username',
          password: 'your_password'
        }
      };

      document.getElementById('open-btn').addEventListener('click', () => {
        window.MuhallilAhkam.open(container, config);
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
            title: 'Environment Variables',
            description: 'Configure API endpoint and authentication via environment variables or config object.',
            code: `// Option 1: Pass config directly
const config = {
  apiBaseUrl: 'https://api.example.com/api',
  basicAuth: {
    username: 'user',
    password: 'pass'
  }
};
window.MuhallilAhkam.open(container, config);

// Option 2: Use environment variables (if using a build tool)
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  basicAuth: {
    username: import.meta.env.VITE_API_BASIC_AUTH_USERNAME,
    password: import.meta.env.VITE_API_BASIC_AUTH_PASSWORD
  }
};
window.MuhallilAhkam.open(container, config);`,
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
          Learn how to integrate Sanad AI applications into your website or application. 
          Both apps are available as UMD bundles that can be loaded and controlled via a simple window API.
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
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.open(container, config?)</code> - Open the app in a container</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.toggle(container, config?)</code> - Toggle the app open/closed</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.close()</code> - Close the app</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.SanadAi.isOpen()</code> - Check if app is open</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-teal-800 mb-2">Muhallil Ahkam API</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.open(container, config?)</code> - Open the app in a container</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.toggle(container, config?)</code> - Toggle the app open/closed</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.close()</code> - Close the app</li>
              <li><code className="bg-teal-100 px-2 py-0.5 rounded">window.MuhallilAhkam.isOpen()</code> - Check if app is open</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
