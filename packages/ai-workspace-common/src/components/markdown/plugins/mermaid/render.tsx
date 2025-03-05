import { useEffect, useRef, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash.debounce';
import { cn, BRANDING_NAME } from '@refly/utils';
import { CopyIcon, DownloadIcon, Code } from 'lucide-react';
import { Tooltip, Button, Space, message } from 'antd';
import { domToPng } from 'modern-screenshot';
import copyToClipboard from 'copy-to-clipboard';

// Initialize mermaid config
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

interface MermaidProps {
  children: ReactNode;
}

// Generate unique ID for each mermaid diagram
const generateUniqueId = (() => {
  let counter = 0;
  return () => `mermaid-diagram-${counter++}`;
})();

// Cache for rendered diagrams
const diagramCache = new Map<string, string>();

const MermaidComponent = memo(
  ({ children }: MermaidProps) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<string>('');
    const { t } = useTranslation();
    const [showOriginalCode, setShowOriginalCode] = useState(false);
    const [rendered, setRendered] = useState(false);

    // Generate a unique ID for this instance
    const diagramId = useMemo(() => generateUniqueId(), []);

    // Memoize the mermaid code to prevent unnecessary recalculations
    const mermaidCode = useMemo(() => children?.toString().trim() ?? '', [children]);

    // Extract a title for the diagram file name
    const diagramTitle = useMemo(() => {
      const firstLine = mermaidCode.split('\n')[0] || '';
      // Try to extract a meaningful title from the first line
      const titleMatch = firstLine.match(/\s+([a-zA-Z0-9\s]+)$/);
      return (titleMatch?.[1] || 'diagram').trim().replace(/\s+/g, '_').slice(0, 20);
    }, [mermaidCode]);

    // Generate PNG from the rendered SVG
    const generatePng = useCallback(async () => {
      if (!mermaidRef.current) return '';

      try {
        // Find SVG element within the mermaid container
        const svgElement = mermaidRef.current.querySelector('svg') as SVGElement;
        if (!svgElement) return '';

        // Set a white background to ensure transparency is handled properly
        const originalBg = svgElement.style.background;
        svgElement.style.background = 'white';

        // Use domToPng with proper settings for diagrams
        const dataUrl = await domToPng(svgElement, {
          features: {
            removeControlCharacter: false,
          },
          scale: 10, // Higher resolution
          quality: 1,
          backgroundColor: '#ffffff',
        });

        // Restore original background
        svgElement.style.background = originalBg;

        return dataUrl;
      } catch (error) {
        console.error('Error generating PNG:', error);
        return '';
      }
    }, []);

    // Copy the diagram to clipboard
    const copyImage = useCallback(async () => {
      const messageKey = 'copyMermaid';
      message.loading({
        content: t('components.markdown.mermaid.copyStarted') ?? 'Starting to copy...',
        key: messageKey,
      });

      try {
        const dataUrl = await generatePng();
        if (!dataUrl) {
          throw new Error('Failed to generate image');
        }

        const res = await fetch(dataUrl);
        const blob = await res.blob();

        // Ensure the blob has the correct MIME type
        const pngBlob = new Blob([blob], { type: 'image/png' });

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob,
          }),
        ]);

        message.success({
          content: t('components.markdown.mermaid.copySuccess') ?? 'Diagram copied to clipboard',
          key: messageKey,
        });
      } catch (error) {
        console.error('Failed to copy image:', error);
        message.error({
          content: t('components.markdown.mermaid.copyError') ?? 'Failed to copy image',
          key: messageKey,
        });
      }
    }, [generatePng, t]);

    // Download the diagram as PNG
    const downloadImage = useCallback(async () => {
      const messageKey = 'downloadMermaid';
      message.loading({
        content: t('components.markdown.mermaid.downloadStarted') ?? 'Starting download...',
        key: messageKey,
      });

      try {
        const dataUrl = await generatePng();
        if (!dataUrl) {
          throw new Error('Failed to generate image');
        }

        // Convert data URL to blob to ensure proper file format
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const pngBlob = new Blob([blob], { type: 'image/png' });
        const blobUrl = URL.createObjectURL(pngBlob);

        const link = document.createElement('a');
        link.download = `${BRANDING_NAME}_mermaid_${diagramTitle}.png`;
        link.href = blobUrl;
        link.click();

        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          link.remove();
        }, 100);

        message.success({
          content:
            t('components.markdown.mermaid.downloadSuccess') ?? 'Diagram downloaded successfully',
          key: messageKey,
        });
      } catch (error) {
        console.error('Failed to download image:', error);
        message.error({
          content: t('components.markdown.mermaid.downloadError') ?? 'Failed to download image',
          key: messageKey,
        });
      }
    }, [generatePng, diagramTitle, t]);

    // Copy the source code to clipboard
    const copySourceCode = useCallback(() => {
      if (!mermaidCode) return;

      const messageKey = 'copySourceCode';
      try {
        copyToClipboard(mermaidCode);
        message.success({
          content:
            t('components.markdown.mermaid.copySourceSuccess') ?? 'Source code copied to clipboard',
          key: messageKey,
        });
      } catch (error) {
        console.error('Failed to copy source code:', error);
        message.error({
          content: t('components.markdown.mermaid.copySourceError') ?? 'Failed to copy source code',
          key: messageKey,
        });
      }
    }, [mermaidCode, t]);

    // Memoize the render function to maintain referential equality
    const renderDiagram = useCallback(
      debounce(async () => {
        if (!mermaidRef.current) return;

        try {
          // Check cache first
          const cachedSvg = diagramCache.get(mermaidCode);
          if (cachedSvg) {
            mermaidRef.current.innerHTML = cachedSvg;
            svgRef.current = cachedSvg;
            setShowOriginalCode(false);
            setRendered(true);
            return;
          }

          // Clear previous content
          mermaidRef.current.innerHTML = '';

          // Validate mermaid syntax first
          await mermaid.parse(mermaidCode);

          // Generate and render the diagram with unique ID
          const { svg } = await mermaid.render(diagramId, mermaidCode);

          // Cache the result
          diagramCache.set(mermaidCode, svg);
          svgRef.current = svg;

          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
            setShowOriginalCode(false);
            setRendered(true);
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          setShowOriginalCode(true);
          setRendered(false);
          if (mermaidRef.current) {
            // Show original code in a pre tag with error message
            mermaidRef.current.innerHTML = `
              <div class="text-red-500 text-xs mb-2">${t('components.markdown.mermaidError')}</div>
              <pre class="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                <code>${mermaidCode}</code>
              </pre>
            `;
          }
        }
      }, 300),
      [mermaidCode, t, diagramId],
    );

    useEffect(() => {
      renderDiagram();
      return () => {
        renderDiagram.cancel();
      };
    }, [renderDiagram]);

    // Memoize the className to prevent inline object creation
    const containerClassName = useMemo(
      () =>
        cn(
          'mermaid-diagram w-full flex justify-center items-center overflow-x-auto relative group',
          showOriginalCode && 'bg-gray-50 rounded',
        ),
      [showOriginalCode],
    );

    return (
      <div className={containerClassName}>
        <div ref={mermaidRef} className="w-full flex justify-center" />

        {/* Action Buttons - Only show when successfully rendered */}
        {rendered && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Space.Compact className="shadow-sm rounded-md overflow-hidden">
              <Tooltip
                title={t('components.markdown.mermaid.copySourceCode') ?? 'Copy source code'}
              >
                <Button
                  type="default"
                  className="flex items-center justify-center bg-white/80 hover:bg-white hover:text-green-600 hover:border-green-600 border-x border-gray-200"
                  icon={<Code className="w-4 h-4" />}
                  onClick={copySourceCode}
                >
                  <span className="sr-only">Source</span>
                </Button>
              </Tooltip>
              <Tooltip title={t('components.markdown.mermaid.downloadAsPng') ?? 'Download as PNG'}>
                <Button
                  type="default"
                  className="flex items-center justify-center bg-white/80 hover:bg-white hover:text-blue-600 hover:border-blue-600 border-x border-gray-200"
                  icon={<DownloadIcon className="w-4 h-4" />}
                  onClick={downloadImage}
                >
                  <span className="sr-only">PNG</span>
                </Button>
              </Tooltip>
              <Tooltip
                title={t('components.markdown.mermaid.copyToClipboard') ?? 'Copy to clipboard'}
              >
                <Button
                  type="default"
                  className="flex items-center justify-center bg-white/80 hover:bg-white hover:text-purple-600 hover:border-purple-600 border border-gray-200"
                  icon={<CopyIcon className="w-4 h-4" />}
                  onClick={copyImage}
                >
                  <span className="sr-only">Copy</span>
                </Button>
              </Tooltip>
            </Space.Compact>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.children?.toString() === nextProps.children?.toString();
  },
);

MermaidComponent.displayName = 'MermaidComponent';

export default MermaidComponent;
