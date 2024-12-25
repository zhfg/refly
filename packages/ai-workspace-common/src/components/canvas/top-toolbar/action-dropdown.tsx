import React, { useState, useCallback, useMemo } from 'react';
import { Button, Dropdown, MenuProps, Popconfirm, DropdownProps, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IconDelete, IconMoreHorizontal } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCanvasStore, useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

interface ActionDropdownProps {
  canvasId: string;
  canvasTitle?: string;
  canvasList?: any[];
  getCanvasList: () => Promise<void>;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ canvasId, canvasTitle, canvasList, getCanvasList }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [isRequest, setIsRequest] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [currentCanvasId, setCurrentCanvasId] = useCanvasStoreShallow((state) => [
    state.currentCanvasId,
    state.setCurrentCanvasId,
  ]);

  const handleDelete = useCallback(async () => {
    if (isRequest) return;
    setIsRequest(true);

    try {
      const { data } = await getClient().deleteCanvas({
        body: { canvasId },
      });

      const { currentCanvasId, setCurrentCanvasId } = useCanvasStore.getState();

      if (data?.success) {
        message.success(t('canvas.action.deleteSuccess'));

        if (currentCanvasId === canvasId) {
          setCurrentCanvasId(null);
        }

        await getCanvasList();

        if (currentCanvasId === canvasId) {
          const firstCanvas = canvasList?.find((canvas) => canvas.id !== canvasId);
          if (firstCanvas?.id) {
            navigate(`/canvas/${firstCanvas?.id}`, { replace: true });
          } else {
            navigate('/canvas/empty', { replace: true });
          }
        }
      }
    } finally {
      setIsRequest(false);
      setPopupVisible(false);
    }
  }, [canvasId, currentCanvasId, isRequest, canvasList, navigate, getCanvasList, setCurrentCanvasId]);

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        label: (
          <Popconfirm
            title={t('workspace.deleteDropdownMenu.deleteConfirmForCanvas', { canvas: canvasTitle })}
            onConfirm={handleDelete}
            onCancel={() => setPopupVisible(false)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <div className="flex items-center text-red-600">
              <IconDelete size={16} className="mr-2" />
              {t('workspace.deleteDropdownMenu.delete')}
            </div>
          </Popconfirm>
        ),
        key: 'delete',
      },
    ],
    [handleDelete, canvasTitle],
  );

  const handleOpenChange = useCallback<DropdownProps['onOpenChange']>((open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  }, []);

  return (
    <Dropdown
      trigger={['click']}
      open={popupVisible}
      onOpenChange={handleOpenChange}
      destroyPopupOnHide
      menu={{ items }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center h-9 bg-[#ffffff] rounded-lg px-2 border border-solid border-1 border-[#EAECF0] box-shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
          <Button type="text" icon={<IconMoreHorizontal />} className="w-8 h-6 flex items-center justify-center" />
        </div>
      </div>
    </Dropdown>
  );
};
