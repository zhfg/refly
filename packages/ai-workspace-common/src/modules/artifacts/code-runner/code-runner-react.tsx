import {
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react/unstyled';
// import dedent from 'dedent';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';

export default function ReactCodeRunner({
  code,
  language,
  onRequestFix,
  showErrorMessage = true,
}: {
  code: string;
  language?: string;
  onRequestFix?: (e: string) => void;
  showErrorMessage?: boolean;
}) {
  console.log('code', code, 'language', language);
  return (
    <SandpackProvider
      key={code}
      template="react-ts"
      className="relative h-full w-full [&_.sp-preview-container]:flex [&_.sp-preview-container]:h-full [&_.sp-preview-container]:w-full [&_.sp-preview-container]:grow [&_.sp-preview-container]:flex-col [&_.sp-preview-container]:justify-center [&_.sp-preview-iframe]:grow"
      files={{
        'App.tsx': code,
        ...shadcnFiles,
        '/tsconfig.json': {
          code: `{
            "include": [
              "./**/*"
            ],
            "compilerOptions": {
              "strict": true,
              "esModuleInterop": true,
              "lib": [ "dom", "es2015" ],
              "jsx": "react-jsx",
              "baseUrl": "./",
              "paths": {
                "@/components/*": ["components/*"]
              }
            }
          }
        `,
        },
      }}
      options={{
        externalResources: ['https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css'],
      }}
      customSetup={{
        dependencies,
      }}
    >
      <SandpackPreview
        showNavigator={false}
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        showRestartButton={false}
        showOpenNewtab={false}
        className="h-full w-full"
      />
      {onRequestFix && showErrorMessage && <ErrorMessage onRequestFix={onRequestFix} />}
    </SandpackProvider>
  );
}

function ErrorMessage({ onRequestFix }: { onRequestFix: (e: string) => void }) {
  const { sandpack } = useSandpack();
  const [didCopy, setDidCopy] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!sandpack.error || !isVisible) return null;

  return (
    <div className="absolute inset-0 px-4 flex flex-col items-center justify-center gap-4 bg-white/5 text-base backdrop-blur-sm">
      <div className="relative max-w-[400px] rounded-md bg-red-500 p-4 text-white shadow-xl shadow-black/20">
        <div className="absolute right-2 top-2">
          <Button
            type="text"
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1 text-red-100 hover:bg-red-600 hover:text-white"
            aria-label="Close error message"
          >
            <IconClose />
          </Button>
        </div>

        <p className="text-lg font-medium">Error</p>

        <p className="mt-4 line-clamp-[10] overflow-x-auto whitespace-pre font-mono text-xs">
          {sandpack.error.message}
        </p>

        <div className="mt-8 flex justify-between gap-4">
          <Button
            type="text"
            onClick={async () => {
              if (!sandpack.error) return;

              setDidCopy(true);
              await window.navigator.clipboard.writeText(sandpack.error.message);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              setDidCopy(false);
            }}
            className="rounded border-red-300 px-2.5 py-1.5 text-sm font-semibold text-red-50"
          >
            {didCopy ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </Button>
          <Button
            type="text"
            onClick={() => {
              if (!sandpack.error) return;
              onRequestFix(sandpack.error.message);
            }}
            className="rounded bg-white px-2.5 py-1.5 text-sm font-medium text-black"
          >
            Try to fix
          </Button>
        </div>
      </div>
    </div>
  );
}

const shadcnFiles = {
  '/public/index.html': `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `,
};

const dependencies = {
  'lucide-react': 'latest',
  recharts: '2.9.0',
  'react-router-dom': 'latest',
  'class-variance-authority': '^0.7.0',
  clsx: '^2.1.1',
  'date-fns': '^3.6.0',
  'embla-carousel-react': '^8.1.8',
  'react-day-picker': '^8.10.1',
  'tailwind-merge': '^2.4.0',
  'tailwindcss-animate': '^1.0.7',
  'framer-motion': '^11.15.0',
  axios: '^1.7.7',
  vaul: '^0.9.1',
};
