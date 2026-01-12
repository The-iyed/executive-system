import React from 'react';
import { BookOpen } from 'lucide-react';

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code }) => {
  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono" dir="ltr">
      <code>{code}</code>
    </pre>
  );
};

export const DocsPage: React.FC = () => {
  const bundleUrl = import.meta.env.VITE_PORTAL_BASE_URL 
    ? `${import.meta.env.VITE_PORTAL_BASE_URL}/muhallil-ahkam.js`
    : 'https://your-portal-domain.com/muhallil-ahkam.js';

  return (
    <div className="w-full max-w-4xl mx-auto p-6" dir="ltr" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">How to Integrate Muhallil Ahkam into Your Website</h1>
        </div>
        <p className="text-gray-600 text-lg">
          This package allows you to add Muhallil Ahkam to any website with just a few steps. You can mount the application in any container element on your website.
        </p>
      </div>

      <div className="space-y-8">
        {/* Installation */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Installation</h2>
          <p className="text-gray-600 mb-4">
            Add the script tag to your website (just before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code>):
          </p>
          <CodeBlock code={`<script src="${bundleUrl}"></script>`} />
          <p className="text-gray-600 mt-4">
            This will:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Initialize the Muhallil Ahkam application</li>
            <li>Expose a global <code className="bg-gray-100 px-1 rounded">window.MuhallilAhkam</code> API</li>
          </ul>
        </section>

        {/* Global API */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Global API</h2>
          <p className="text-gray-600 mb-4">
            Once the script is loaded, you can control the Muhallil Ahkam application programmatically:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Method</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">window.MuhallilAhkam.open(container)</code>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Opens Muhallil Ahkam in the specified container element</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">window.MuhallilAhkam.close()</code>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Closes the Muhallil Ahkam application</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">window.MuhallilAhkam.toggle(container)</code>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Toggles between open/close</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">window.MuhallilAhkam.isOpen()</code>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Returns <code className="bg-gray-100 px-1 rounded">true</code> if the app is currently open</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Example */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Example — Mount in Container</h2>
          <p className="text-gray-600 mb-4">
            You can mount Muhallil Ahkam in any container element on your site:
          </p>
          <CodeBlock code={`<div id="muhallil-ahkam-container"></div>
<button id="open-muhallil-ahkam">Open Muhallil Ahkam</button>

<script>
  document.getElementById("open-muhallil-ahkam").addEventListener("click", () => {
    const container = document.getElementById("muhallil-ahkam-container");
    window.MuhallilAhkam.open(container);
  });
</script>`} />
        </section>

        {/* TypeScript Support */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. TypeScript Support</h2>
          <p className="text-gray-600 mb-4">
            To avoid type errors in TypeScript projects, declare the global API once:
          </p>
          <CodeBlock code={`// global.d.ts
export {};

declare global {
  interface Window {
    MuhallilAhkam: {
      open: (container: HTMLElement) => void;
      close: () => void;
      toggle: (container: HTMLElement) => void;
      isOpen: () => boolean;
    };
  }
}`} />
          <p className="text-gray-600 mt-4">
            After adding this, VSCode and other editors will autocomplete <code className="bg-gray-100 px-1 rounded">window.MuhallilAhkam</code>.
          </p>
        </section>

        {/* React */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">React</h2>
          <p className="text-gray-600 mb-4">
            Add the script inside the <code className="bg-gray-100 px-1 rounded">&lt;body&gt;</code> tag of <code className="bg-gray-100 px-1 rounded">public/index.html</code>:
          </p>
          <CodeBlock code={`<!-- public/index.html -->
<body>
  <div id="root"></div>

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "${bundleUrl}";
      document.body.appendChild(e);
    });
  </script>
</body>`} />
        </section>

        {/* Angular */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Angular</h2>
          <p className="text-gray-600 mb-4">
            Insert the script into <code className="bg-gray-100 px-1 rounded">src/index.html</code> at the end of the <code className="bg-gray-100 px-1 rounded">&lt;body&gt;</code>:
          </p>
          <CodeBlock code={`<!-- src/index.html -->
<body>
  <app-root></app-root>

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "${bundleUrl}";
      document.body.appendChild(e);
    });
  </script>
</body>`} />
        </section>

        {/* .NET */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">.NET (Razor Pages or MVC)</h2>
          <p className="text-gray-600 mb-4">
            Add the script in your <code className="bg-gray-100 px-1 rounded">_Layout.cshtml</code>, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag:
          </p>
          <CodeBlock code={`<!-- Views/Shared/_Layout.cshtml -->
<body>
  @RenderBody()

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "${bundleUrl}";
      document.body.appendChild(e);
    });
  </script>
</body>`} />
        </section>

        {/* Vanilla HTML / JS */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vanilla HTML / JS</h2>
          <p className="text-gray-600 mb-4">
            Paste the script near the end of your main <code className="bg-gray-100 px-1 rounded">index.html</code> file:
          </p>
          <CodeBlock code={`<!-- index.html -->
<body>
  <!-- Your content -->

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      let e = document.createElement("script");
      e.src = "${bundleUrl}";
      document.body.appendChild(e);
    });
  </script>
</body>`} />
        </section>
      </div>
    </div>
  );
};

