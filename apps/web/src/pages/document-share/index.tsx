import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { Result } from 'antd';
import { useFetchShareData } from '@refly-packages/ai-workspace-common/hooks/use-fetch-share-data';
import { CanvasProvider } from '@refly-packages/ai-workspace-common/context/canvas';
import { memo, useEffect, useCallback } from 'react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/preview-markdown';
import Logo from '@/assets/logo.svg';

// PoweredByRefly component to display when sidebar is collapsed
const PoweredByRefly = memo(({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-4 left-4 flex items-center gap-2 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-2 shadow-sm hover:shadow-lg z-10 cursor-pointer transition-all border border-gray-200/80 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 border-solid"
      style={{ borderWidth: '0.5px' }}
      onClick={onClick}
    >
      <img src={Logo} alt={t('productName')} className="h-6 w-6" />
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.poweredBy')}</span>
        <span className="text-sm font-bold text-gray-800 dark:text-white" translate="no">
          {t('productName')}
        </span>
      </div>
    </div>
  );
});

const DocumentSharePage = () => {
  const { shareId = '' } = useParams();
  const { t } = useTranslation();
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  const { data: documentData, loading: isLoading } = useFetchShareData(shareId);

  // Force collapse by default
  useEffect(() => {
    setCollapse(true);
  }, [setCollapse]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setCollapse(!collapse);
  }, [collapse, setCollapse]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full grow items-center justify-center">
        <div className="text-gray-500">
          {t('document.shareLoading', 'Loading shared document...')}
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Result
          status="404"
          title={t('document.notFound', 'Document Not Found')}
          subTitle={t(
            'document.notFoundDesc',
            'The document you are looking for does not exist or has been removed.',
          )}
        />
      </div>
    );
  }

  const { title, content } = documentData;

  return (
    <CanvasProvider canvasId="" readonly>
      <div className="flex h-full w-full grow relative">
        {collapse && <PoweredByRefly onClick={toggleSidebar} />}

        {/* Main content */}
        <div className="flex h-full w-full grow bg-white overflow-auto">
          <div className="flex flex-col space-y-4 p-4 h-full max-w-[1024px] mx-auto w-full">
            {title && <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-4">{title}</h1>}

            <div className="flex-grow prose prose-lg max-w-full">
              {content && <Markdown content={content} />}
            </div>
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
};

export default DocumentSharePage;
