import { memo } from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { CopyIcon, DownloadIcon } from 'lucide-react';
import { BRANDING_NAME } from '@refly/utils';
import { useTranslation } from 'react-i18next';
import { domToPng } from 'modern-screenshot';

interface SVGRendererProps {
  content: string;
  title?: string;
}

const SVGRenderer = memo(({ content, title }: SVGRendererProps) => {
  const { t } = useTranslation();
  const DOM_ID = 'artifact-svg';

  const generatePng = async () => {
    return domToPng(document.querySelector(`#${DOM_ID}`) as HTMLDivElement, {
      features: {
        // Don't enable control character removal to prevent Safari emoji issues
        removeControlCharacter: false,
      },
      // Use higher scale for better quality on high DPI displays
      scale: 100,
    });
  };

  const downloadImage = async (type: 'png' | 'svg') => {
    try {
      let dataUrl = '';
      if (type === 'png') {
        dataUrl = await generatePng();
      } else {
        const blob = new Blob([content], { type: 'image/svg+xml' });
        dataUrl = URL.createObjectURL(blob);
      }

      const link = document.createElement('a');
      link.download = `${BRANDING_NAME}_${title}.${type}`;
      link.href = dataUrl;
      link.click();
      link.remove();
      message.success(t('artifact.svg.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download image:', error);
      message.error(t('artifact.svg.downloadError'));
    }
  };

  const copyImage = async () => {
    try {
      const dataUrl = await generatePng();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      message.success(t('artifact.svg.copySuccess'));
    } catch (error) {
      console.error('Failed to copy image:', error);
      message.error(t('artifact.svg.copyError'));
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* SVG Container */}
      <div className="w-full h-full flex items-center justify-center">
        <div
          id={DOM_ID}
          className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{ __html: content }}
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
        </Space.Compact>
      </div>
    </div>
  );
});

export default SVGRenderer;
