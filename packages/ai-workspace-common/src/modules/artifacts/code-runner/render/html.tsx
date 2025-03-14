import { memo, useEffect, useRef, useState } from 'react';

interface HTMLRendererProps {
  height?: string;
  htmlContent: string;
  width?: string;
}

const HTMLRenderer = memo<HTMLRendererProps>(({ htmlContent, width = '100%', height = '100%' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Add script to measure content height and communicate it back to parent
    const modifiedHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              overflow-x: hidden;
              overflow-y: visible;
            }
          </style>
          <script>
            // Function to send document dimensions to parent
            function reportSize() {
              // Get the actual content height
              const height = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
              );
              
              window.parent.postMessage({
                type: 'html-resize',
                height: Math.ceil(height)
              }, '*');
            }
            
            // Setup mutation observer to detect DOM changes
            window.onload = function() {
              // Report initial size
              reportSize();
              
              // Set up observer for any changes to the DOM
              const observer = new MutationObserver(reportSize);
              observer.observe(document.body, { 
                attributes: true,
                childList: true,
                subtree: true
              });
              
              // Also report on window resize
              window.addEventListener('resize', reportSize);

              // Report size when images load
              document.querySelectorAll('img').forEach(img => {
                img.addEventListener('load', reportSize);
              });
            };
          </script>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;

    doc.open();
    doc.write(modifiedHtmlContent);
    doc.close();

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'html-resize') {
        setIframeHeight(event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent]);

  // Calculate the style for the iframe
  const iframeStyle = {
    border: 'none',
    width,
    // Use calculated height if available, otherwise use default
    height: iframeHeight ? `${iframeHeight}px` : height,
    minHeight: iframeHeight ? `${iframeHeight}px` : '300px',
  };

  return (
    <iframe
      ref={iframeRef}
      style={iframeStyle}
      title="html-renderer"
      sandbox="allow-same-origin allow-scripts"
    />
  );
});

export default HTMLRenderer;
