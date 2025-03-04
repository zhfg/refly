import {
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react/unstyled';
// import dedent from 'dedent';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, useCallback, memo, useMemo } from 'react';
import { Button, message } from 'antd';
import { IconClose } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const ReactCodeRunner = memo(
  ({
    code,
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    language,
    onRequestFix,
    showErrorMessage = true,
  }: {
    code: string;
    language?: string;
    onRequestFix?: (e: string) => void;
    showErrorMessage?: boolean;
  }) => {
    const { t } = useTranslation();
    // Memoize the shadcn files configuration
    const shadcnFiles = useMemo(
      () => ({
        '/public/index.html': `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t('codeArtifact.defaultTitle')}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `,
      }),
      [t],
    );

    // Memoize the dependencies configuration
    const dependencies = useMemo(
      () => ({
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
      }),
      [],
    );

    // Memoize tsconfig
    const tsConfig = useMemo(
      () => `{
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
    }`,
      [],
    );

    return (
      <SandpackProvider
        key={code}
        template="react-ts"
        className="relative h-full w-full [&_.sp-preview-container]:flex [&_.sp-preview-container]:h-full [&_.sp-preview-container]:w-full [&_.sp-preview-container]:grow [&_.sp-preview-container]:flex-col [&_.sp-preview-container]:justify-center [&_.sp-preview-iframe]:grow"
        files={{
          'App.tsx': code,
          ...shadcnFiles,
          '/tsconfig.json': {
            code: tsConfig,
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.code === nextProps.code &&
      prevProps.language === nextProps.language &&
      prevProps.showErrorMessage === nextProps.showErrorMessage &&
      prevProps.onRequestFix === nextProps.onRequestFix
    );
  },
);

export default ReactCodeRunner;

const ErrorMessage = memo(
  ({ onRequestFix }: { onRequestFix: (e: string) => void }) => {
    const { sandpack } = useSandpack();
    const [didCopy, setDidCopy] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const { t } = useTranslation();

    const handleClose = useCallback(() => {
      setIsVisible(false);
      message.info(t('codeArtifact.fix.errorDismissed'));
    }, [t]);

    const handleCopy = useCallback(async () => {
      if (!sandpack.error) return;

      try {
        setDidCopy(true);
        await window.navigator.clipboard.writeText(sandpack.error.message);
        message.success(t('codeArtifact.errorCopySuccess'));
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setDidCopy(false);
      } catch (error) {
        console.error('Failed to copy error message:', error);
        message.error(t('codeArtifact.errorCopyFailed'));
        setDidCopy(false);
      }
    }, [sandpack.error, t]);

    const handleRequestFix = useCallback(() => {
      if (!sandpack.error) return;
      onRequestFix(sandpack.error.message);
      message.info(t('codeArtifact.fix.requestingFix'));
    }, [sandpack.error, onRequestFix, t]);

    if (!sandpack.error || !isVisible) return null;

    return (
      <div className="absolute inset-0 px-4 flex flex-col items-center justify-center gap-4 bg-white/5 text-base backdrop-blur-sm">
        <div className="relative w-full max-w-[600px] rounded-md bg-red-600 p-4 text-white shadow-xl shadow-black/20">
          <div className="absolute right-2 top-2">
            <Button
              type="text"
              onClick={handleClose}
              className="rounded-full p-1 text-white hover:bg-red-700 hover:text-white"
              aria-label={t('codeArtifact.fix.closeErrorMessage')}
            >
              <IconClose className="hover:text-white text-white" />
            </Button>
          </div>

          <p className="text-lg font-medium">{t('codeArtifact.fix.error')}</p>

          <p className="mt-4 line-clamp-[10] overflow-x-auto whitespace-pre font-mono text-xs">
            {sandpack.error.message}
          </p>

          <div className="mt-8 flex justify-between gap-4">
            <Button
              type="text"
              onClick={handleCopy}
              className="rounded border border-red-300 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              title={t('codeArtifact.fix.copyErrorMessage')}
            >
              {didCopy ? (
                <CheckIcon size={18} className="text-white hover:text-white" />
              ) : (
                <CopyIcon size={18} className="text-white hover:text-white" />
              )}
            </Button>
            <Button
              type="default"
              onClick={handleRequestFix}
              className="rounded bg-white px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-gray-100"
            >
              {t('codeArtifact.fix.tryToFix')}
            </Button>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the onRequestFix function reference changes
    return prevProps.onRequestFix === nextProps.onRequestFix;
  },
);
