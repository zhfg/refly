import { useEffect, FC, useState, useCallback, memo } from 'react';
import { Button, Divider } from 'antd';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { useDebounce } from 'use-debounce';
import { AiOutlineMenuUnfold } from 'react-icons/ai';
import { SiderPopover } from '@refly-packages/ai-workspace-common/components/sider/popover';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { Helmet } from 'react-helmet';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { CanvasTitle, ReadonlyCanvasTitle } from './canvas-title';
import { ToolbarButtons, WarningButton } from './buttons';
import { CanvasActionDropdown } from '@refly-packages/ai-workspace-common/components/workspace/canvas-list-modal/canvasActionDropdown';
import ShareSettings from './share-settings';
import './index.scss';

interface TopToolbarProps {
  canvasId: string;
}

export const TopToolbar: FC<TopToolbarProps> = memo(({ canvasId }) => {
  const { i18n, t } = useTranslation();
  const language = i18n.language as LOCALE;

  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));

  const { provider, readonly } = useCanvasContext();
  const [unsyncedChanges, setUnsyncedChanges] = useState(provider?.unsyncedChanges || 0);
  const [debouncedUnsyncedChanges] = useDebounce(unsyncedChanges, 500);

  const handleUnsyncedChanges = useCallback((data: number) => {
    setUnsyncedChanges(data);
  }, []);

  useEffect(() => {
    provider?.on('unsyncedChanges', handleUnsyncedChanges);
    return () => {
      provider?.off('unsyncedChanges', handleUnsyncedChanges);
    };
  }, [provider, handleUnsyncedChanges]);

  const { data, config, showPreview, setShowPreview, showMaxRatio, setShowMaxRatio } =
    useCanvasStoreShallow((state) => ({
      data: state.data[canvasId],
      config: state.config[canvasId],
      showPreview: state.showPreview,
      setShowPreview: state.setShowPreview,
      showMaxRatio: state.showMaxRatio,
      setShowMaxRatio: state.setShowMaxRatio,
    }));

  const [connectionTimeout, setConnectionTimeout] = useState(false);

  useEffect(() => {
    if (readonly) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    if (provider?.status !== 'connected') {
      timeoutId = setTimeout(() => {
        setConnectionTimeout(true);
      }, 10000);
    } else {
      setConnectionTimeout(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [readonly, provider?.status]);

  const canvasTitle = data?.title;
  const hasCanvasSynced = config?.localSyncedAt > 0 && config?.remoteSyncedAt > 0;
  const showWarning = connectionTimeout && !hasCanvasSynced && provider?.status !== 'connected';

  return (
    <>
      <Helmet>
        <title>{canvasTitle?.toString() || t('common.untitled')} · Refly</title>
      </Helmet>
      <div
        className={`absolute h-16 top-0 left-0 right-0  box-border flex justify-between items-center py-2 px-4 pr-0 bg-transparent ${
          collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
        }`}
      >
        <div className="flex items-center relative z-10">
          {collapse && (
            <>
              <SiderPopover>
                <Button
                  type="text"
                  icon={<AiOutlineMenuUnfold size={16} className="text-gray-500" />}
                  onClick={() => {
                    setCollapse(!collapse);
                  }}
                />
              </SiderPopover>
              <Divider type="vertical" className="pr-[4px] h-4" />
            </>
          )}
          {readonly ? (
            <ReadonlyCanvasTitle canvasTitle={canvasTitle} isLoading={false} />
          ) : (
            <CanvasTitle
              canvasId={canvasId}
              canvasTitle={canvasTitle}
              hasCanvasSynced={hasCanvasSynced}
              debouncedUnsyncedChanges={debouncedUnsyncedChanges}
              language={language}
            />
          )}
          <WarningButton show={showWarning} />
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <ToolbarButtons
            showPreview={showPreview}
            showMaxRatio={showMaxRatio}
            setShowPreview={setShowPreview}
            setShowMaxRatio={setShowMaxRatio}
          />

          <ShareSettings canvasId={canvasId} />

          {!readonly && (
            <CanvasActionDropdown canvasId={canvasId} canvasName={canvasTitle} btnSize="large" />
          )}
        </div>
      </div>
    </>
  );
});
