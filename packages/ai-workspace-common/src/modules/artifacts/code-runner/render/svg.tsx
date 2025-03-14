import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { CopyIcon, DownloadIcon } from 'lucide-react';
import { PiMagnifyingGlassBold } from 'react-icons/pi';

import { BRANDING_NAME } from '@refly/utils';
import { useTranslation } from 'react-i18next';
import { domToPng } from 'modern-screenshot';
import { ImagePreview } from '@refly-packages/ai-workspace-common/components/common/image-preview';

interface SVGRendererProps {
  content: string;
  title?: string;
  width?: string;
  height?: string;
}

const SVG_ID = 'refly-svg-content';

const SVGRenderer = memo(
  ({ content, title, width = '100%', height = '100%' }: SVGRendererProps) => {
    const { t } = useTranslation();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState<number | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [zoomImageUrl, setZoomImageUrl] = useState<string>('');

    // Set up the iframe content when the component mounts or content changes
    useEffect(() => {
      if (!iframeRef.current) return;

      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      // Process the SVG content to add an ID to the SVG element
      let processedContent = content;
      if (content.includes('<svg') && !content.includes(`id="${SVG_ID}"`)) {
        // Add the ID attribute to the SVG tag
        processedContent = content.replace(/<svg/i, `<svg id="${SVG_ID}"`);
      }

      // Create a complete HTML document with the SVG content
      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: auto;
              overflow: visible;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: transparent;
            }
            svg {
              width: 100%;
              height: auto;
              max-width: 100%;
              display: block;
            }
            #container {
              width: 100%;
              height: auto;
              overflow: visible;
            }
          </style>
          <script>
            // Function to calculate SVG height based on multiple methods
            function getSvgHeight(svg) {
              if (!svg) return 0;
              
              // Method 1: Check explicit height attribute (might be in px, em, %, etc.)
              const heightAttr = svg.getAttribute('height');
              
              // Method 2: Check computed style
              const computedStyle = window.getComputedStyle(svg);
              const styleHeight = computedStyle.height;
              
              // Method 3: Check viewBox attribute
              const viewBox = svg.getAttribute('viewBox');
              let viewBoxHeight = 0;
              if (viewBox) {
                const viewBoxValues = viewBox.split(' ').map(Number);
                if (viewBoxValues.length === 4) {
                  // viewBox format: min-x min-y width height
                  viewBoxHeight = viewBoxValues[3];
                }
              }
              
              // Method 4: Get bounding client rect (actual rendered size)
              const rect = svg.getBoundingClientRect();
              const boundingHeight = rect.height;
              
              // Method 5: Check all child elements and get the max height
              let maxChildHeight = 0;
              if (svg.children && svg.children.length > 0) {
                for (let i = 0; i < svg.children.length; i++) {
                  const childRect = svg.children[i].getBoundingClientRect();
                  maxChildHeight = Math.max(maxChildHeight, childRect.height);
                }
              }
              
              // Use the most accurate measurement available
              // NEW PRIORITY: height attribute > Calculated style > Bounding rect > viewBox > Children
              
              console.log('SVG height measurements:', {
                heightAttr,
                styleHeight,
                viewBoxHeight,
                boundingHeight,
                maxChildHeight
              });
              
              // If height attribute is available and not percentage, use it as highest priority
              if (heightAttr && !heightAttr.includes('%')) {
                const numericHeight = parseFloat(heightAttr);
                if (!isNaN(numericHeight) && numericHeight > 0) {
                  return Math.ceil(numericHeight);
                }
              }
              
              // If computed style height is available and not 'auto', use it
              if (styleHeight && styleHeight !== 'auto' && styleHeight !== '0px') {
                const numericHeight = parseFloat(styleHeight);
                if (!isNaN(numericHeight) && numericHeight > 0) {
                  return Math.ceil(numericHeight);
                }
              }
              
              // Then use bounding height
              if (boundingHeight && boundingHeight > 10) {
                return Math.ceil(boundingHeight);
              }
              
              // Use viewBox height if other methods failed
              if (viewBoxHeight > 0) {
                return Math.ceil(viewBoxHeight);
              }
              
              // Fall back to max child height
              if (maxChildHeight > 0) {
                return Math.ceil(maxChildHeight);
              }
              
              // Last resort: arbitrary minimum height
              return 300;
            }
            
            // Function to send SVG dimensions to parent
            function reportSize() {
              const svg = document.querySelector('#${SVG_ID}');
              if (svg) {
                const height = getSvgHeight(svg);
                
                // Add a padding to ensure there's a little extra space
                const paddedHeight = height + 20;
                
                window.parent.postMessage({
                  type: 'svg-resize',
                  height: paddedHeight
                }, '*');
              }
            }
            
            // Function to ensure SVG preserves aspect ratio
            function ensureSvgAspectRatio() {
              const svg = document.querySelector('#${SVG_ID}');
              if (svg && !svg.hasAttribute('preserveAspectRatio')) {
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              }
            }
            
            // Setup mutation observer to detect changes in the SVG
            window.onload = function() {
              ensureSvgAspectRatio();
              reportSize();
              
              // Set up observer for any changes to the SVG
              const observer = new MutationObserver(() => {
                ensureSvgAspectRatio();
                reportSize();
              });
              
              const svg = document.querySelector('#${SVG_ID}');
              if (svg) {
                observer.observe(svg, { 
                  attributes: true,
                  childList: true,
                  subtree: true
                });
              }
              
              // Also report on window resize
              window.addEventListener('resize', reportSize);
            };
          </script>
        </head>
        <body><div id="container">${processedContent}</div></body>
      </html>
    `;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Listen for messages from the iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'svg-resize') {
          setIframeHeight(event.data.height);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [content]);

    const generatePng = async () => {
      const iframe = iframeRef.current;
      if (!iframe?.contentDocument) return null;

      try {
        // Get the SVG element directly instead of using the entire body
        const svgElement = iframe.contentDocument.getElementById(SVG_ID);
        if (!svgElement) {
          console.error('SVG element not found');
          return null;
        }

        // Capture just the SVG element
        const dataUrl = await domToPng(svgElement, {
          features: {
            // Don't enable control character removal to prevent Safari emoji issues
            removeControlCharacter: false,
          },
          // Use higher scale for better quality on high DPI displays
          scale: 5,
          quality: 1.0,
          backgroundColor: 'transparent', // Use transparent background for the SVG
        });

        return dataUrl;
      } catch (error) {
        console.error('Failed to generate PNG:', error);
        return null;
      }
    };

    // Handle opening zoom modal
    const handleZoom = useCallback(async () => {
      try {
        const dataUrl = await generatePng();
        if (dataUrl) {
          setZoomImageUrl(dataUrl);
          setIsModalVisible(true);
        } else {
          message.error('Failed to generate zoom image');
        }
      } catch (error) {
        console.error('Error generating zoom image:', error);
        message.error('Failed to generate zoom image');
      }
    }, [generatePng, t]);

    const downloadImage = useCallback(
      async (type: 'png' | 'svg') => {
        const messageKey = 'downloadImage';
        message.loading({ content: t('artifact.svg.downloadStarted'), key: messageKey });

        try {
          let dataUrl = '';
          let blob: Blob;

          if (type === 'png') {
            dataUrl = await generatePng();
            if (!dataUrl) {
              throw new Error('Failed to generate PNG');
            }
            const response = await fetch(dataUrl);
            blob = await response.blob();
          } else {
            // For SVG, properly serialize the SVG content with XML declaration
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>${content}`;
            blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            dataUrl = URL.createObjectURL(blob);
          }

          const link = document.createElement('a');
          link.download = `${BRANDING_NAME}_${title ?? 'image'}.${type}`;
          link.href = dataUrl;
          link.click();

          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(dataUrl);
            link.remove();
          }, 100);

          message.success({ content: t('artifact.svg.downloadSuccess'), key: messageKey });
        } catch (error) {
          console.error('Failed to download image:', error);
          message.error({ content: t('artifact.svg.downloadError'), key: messageKey });
        }
      },
      [content, title, t],
    );

    const copyImage = useCallback(async () => {
      const messageKey = 'copyImage';
      message.loading({ content: t('artifact.svg.copyStarted'), key: messageKey });

      try {
        const dataUrl = await generatePng();
        if (!dataUrl) {
          throw new Error('Failed to generate PNG');
        }

        const response = await fetch(dataUrl);
        const blob = await response.blob();

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);

        message.success({ content: t('artifact.svg.copySuccess'), key: messageKey });
      } catch (error) {
        console.error('Failed to copy image:', error);
        message.error({ content: t('artifact.svg.copyError'), key: messageKey });
      }
    }, [t]);

    // Calculate the style for the iframe
    const iframeStyle = {
      border: 'none',
      width,
      // Use calculated height if available, otherwise use default
      height: iframeHeight ? `${iframeHeight}px` : height,
      minHeight: iframeHeight ? `${iframeHeight}px` : '300px',
    };

    return (
      <div className="relative w-full h-full">
        {/* SVG Container */}
        <div className="w-full h-full flex items-center justify-center">
          <iframe
            ref={iframeRef}
            style={iframeStyle}
            title="svg-renderer"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 z-10">
          <Space.Compact className="shadow-sm rounded-md overflow-hidden">
            <Tooltip title={t('artifact.svg.downloadAsPng')}>
              <Button
                type="default"
                className="flex items-center justify-center bg-white hover:bg-gray-50 hover:text-blue-600 hover:border-blue-600 border-x border-gray-200"
                icon={<DownloadIcon className="w-4 h-4" />}
                onClick={() => downloadImage('png')}
              >
                <span className="sr-only">PNG</span>
              </Button>
            </Tooltip>
            <Tooltip title={t('artifact.svg.copyToClipboard')}>
              <Button
                type="default"
                className="flex items-center justify-center bg-white hover:bg-gray-50 hover:text-purple-600 hover:border-purple-600 border border-gray-200"
                icon={<CopyIcon className="w-4 h-4" />}
                onClick={copyImage}
              >
                <span className="sr-only">Copy</span>
              </Button>
            </Tooltip>
            <Tooltip title={t('artifact.svg.preview')}>
              <Button
                type="default"
                className="flex items-center justify-center bg-white hover:bg-gray-50 hover:text-purple-600 hover:border-purple-600 border border-gray-200"
                icon={<PiMagnifyingGlassBold className="w-4 h-4" />}
                onClick={handleZoom}
              >
                <span className="sr-only">Preview</span>
              </Button>
            </Tooltip>
          </Space.Compact>
        </div>

        <ImagePreview
          isPreviewModalVisible={isModalVisible}
          setIsPreviewModalVisible={setIsModalVisible}
          imageUrl={zoomImageUrl}
          imageTitle={title}
        />
      </div>
    );
  },
);

export default SVGRenderer;
