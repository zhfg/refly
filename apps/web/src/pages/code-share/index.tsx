import { useParams } from 'react-router-dom';
import { useMemo, useCallback, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import Renderer from '@refly-packages/ai-workspace-common/modules/artifacts/code-runner/render';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useFetchShareData } from '@refly-packages/ai-workspace-common/hooks/use-fetch-share-data';
import Logo from '@/assets/logo.svg';

// PoweredByRefly component to display when sidebar is collapsed
const PoweredByRefly = memo(({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-4 left-4 flex items-center gap-2 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-2 shadow-lg hover:shadow-md z-10 cursor-pointer transition-all border border-gray-200/80 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-700/80"
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

const ShareCodePage = () => {
  const { shareId = '' } = useParams();
  const { t } = useTranslation();
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  const { data: codeData, loading: isLoading } = useFetchShareData(shareId);

  // Force collapse by default
  useEffect(() => {
    setCollapse(true);
  }, [setCollapse]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setCollapse(!collapse);
  }, [collapse, setCollapse]);

  // Memoize the render key to prevent unnecessary re-renders
  const renderKey = useMemo(() => Date.now().toString(), [codeData?.content]);

  // Handle error reporting (no-op in read-only view)
  const handleRequestFix = useCallback(() => {}, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full grow items-center justify-center">
        <div className="text-gray-500">{t('codeArtifact.shareLoading')}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full grow relative">
      {collapse && <PoweredByRefly onClick={toggleSidebar} />}

      <div
        className={`absolute h-16 bottom-0 left-0 right-0 box-border flex justify-between items-center py-2 px-4 pr-0 bg-transparent ${
          collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
        }`}
      >
        {/* Removed the collapse button since we now use PoweredByRefly for toggling */}
      </div>

      {/* Main content */}
      <div className="flex h-full w-full grow items-center justify-center bg-white overflow-hidden">
        {codeData?.content ? (
          <div className="w-full h-full">
            <Renderer
              content={codeData.content}
              type={codeData.type}
              key={renderKey}
              title={codeData.title}
              language={codeData.language}
              onRequestFix={handleRequestFix}
            />
          </div>
        ) : (
          <div className="text-gray-500">{t('codeArtifact.noCodeFound')}</div>
        )}
      </div>
    </div>
  );
};

export default ShareCodePage;
