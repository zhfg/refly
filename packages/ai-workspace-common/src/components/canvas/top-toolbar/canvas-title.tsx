import { useEffect, useState, useCallback, memo } from 'react';
import { Tooltip, Skeleton, Typography } from 'antd';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { IconCanvas, IconEdit } from '@refly-packages/ai-workspace-common/components/common/icon';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useCanvasSync } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-sync';
import { CanvasRename } from './canvas-rename';

export const CanvasTitle = memo(
  ({
    canvasId,
    canvasTitle,
    hasCanvasSynced,
    debouncedUnsyncedChanges,
    language,
  }: {
    canvasId: string;
    canvasTitle?: string;
    hasCanvasSynced: boolean;
    debouncedUnsyncedChanges: number;
    language: LOCALE;
  }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { syncTitleToYDoc } = useCanvasSync();
    const { updateCanvasTitle } = useSiderStoreShallow((state) => ({
      updateCanvasTitle: state.updateCanvasTitle,
    }));

    const handleEditClick = useCallback(() => {
      setIsModalOpen(true);
    }, []);

    const handleModalOk = useCallback(
      (newTitle: string) => {
        if (newTitle?.trim()) {
          syncTitleToYDoc(newTitle);
          setIsModalOpen(false);
        }
      },
      [canvasId, syncTitleToYDoc, updateCanvasTitle],
    );

    const handleModalCancel = useCallback(() => {
      setIsModalOpen(false);
    }, []);

    // Refetch canvas list when canvas title changes
    useEffect(() => {
      updateCanvasTitle(canvasId, canvasTitle);
    }, [canvasTitle]);

    return (
      <>
        <div
          className="ml-1 group flex items-center gap-2 text-sm font-bold text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={handleEditClick}
          data-cy="canvas-title-edit"
        >
          <Tooltip
            title={
              debouncedUnsyncedChanges > 0
                ? t('canvas.toolbar.syncingChanges')
                : t('canvas.toolbar.synced', {
                    time: time(new Date(), language)?.utc()?.fromNow(),
                  })
            }
          >
            <div
              className={`
              relative w-2.5 h-2.5 rounded-full
              transition-colors duration-700 ease-in-out
              ${debouncedUnsyncedChanges > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-400'}
            `}
            />
          </Tooltip>
          {!hasCanvasSynced ? (
            <Skeleton className="w-28" active paragraph={false} />
          ) : (
            <Typography.Text className="!max-w-72" ellipsis={{ tooltip: true }}>
              {canvasTitle || t('common.untitled')}
            </Typography.Text>
          )}
          <IconEdit />
        </div>

        <CanvasRename
          canvasId={canvasId}
          canvasTitle={canvasTitle}
          isModalOpen={isModalOpen}
          handleModalOk={handleModalOk}
          handleModalCancel={handleModalCancel}
        />
      </>
    );
  },
);

export const ReadonlyCanvasTitle = memo(
  ({
    canvasTitle,
    isLoading,
  }: {
    canvasTitle?: string;
    isLoading: boolean;
  }) => {
    const { t } = useTranslation();

    return (
      <div
        className="ml-1 group flex items-center gap-2 text-sm font-bold text-gray-500"
        data-cy="canvas-title-readonly"
      >
        <IconCanvas />
        {isLoading ? (
          <Skeleton className="w-28" active paragraph={false} />
        ) : (
          canvasTitle || t('common.untitled')
        )}
      </div>
    );
  },
);
