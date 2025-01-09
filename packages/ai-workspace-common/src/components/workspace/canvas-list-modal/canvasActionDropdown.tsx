import { useEffect, useState } from 'react';
import { Button, Dropdown, DropdownProps, Popconfirm, MenuProps, message } from 'antd';
import { IconMoreHorizontal, IconDelete, IconEdit } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-canvas';
import { useTranslation } from 'react-i18next';
import { CanvasRename } from '@refly-packages/ai-workspace-common/components/canvas/top-toolbar/canvas-rename';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';

interface CanvasActionDropdown {
  canvasId: string;
  canvasName: string;
  updateShowStatus?: (canvasId: string | null) => void;
  afterDelete?: () => void;
}

export const CanvasActionDropdown = (props: CanvasActionDropdown) => {
  const { canvasId, canvasName, updateShowStatus, afterDelete } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();
  const { deleteCanvas } = useDeleteCanvas();

  const { updateCanvasTitle } = useSiderStoreShallow((state) => ({
    updateCanvasTitle: state.updateCanvasTitle,
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleDelete = async () => {
    const success = await deleteCanvas(canvasId);
    if (success) {
      setPopupVisible(false);
      afterDelete?.();
    }
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <div
          className="flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
            setPopupVisible(false);
          }}
        >
          <IconEdit size={16} className="mr-2" />
          {t('canvas.toolbar.rename')}
        </div>
      ),
      key: 'rename',
    },
    {
      label: (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Popconfirm
            title={t('workspace.deleteDropdownMenu.deleteConfirmForCanvas', { canvas: canvasName })}
            onConfirm={handleDelete}
            onCancel={() => setPopupVisible(false)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <div
              className="flex items-center text-red-600"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <IconDelete size={16} className="mr-2" />
              {t('workspace.deleteDropdownMenu.delete')}
            </div>
          </Popconfirm>
        </div>
      ),
      key: 'delete',
    },
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  const handleModalOk = (newTitle: string) => {
    if (newTitle?.trim()) {
      // TODO: syncTitleToYDoc(newTitle);
      updateCanvasTitle(canvasId, newTitle);
      setIsModalOpen(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (popupVisible) {
      updateShowStatus?.(canvasId);
    } else {
      updateShowStatus?.(null);
    }
  }, [popupVisible]);

  return (
    <>
      <Dropdown
        trigger={['click']}
        open={popupVisible}
        onOpenChange={handleOpenChange}
        menu={{
          items,
        }}
      >
        <Button onClick={(e) => e.stopPropagation()} size="small" type="text" icon={<IconMoreHorizontal />} />
      </Dropdown>

      <div onClick={(e) => e.stopPropagation()}>
        <CanvasRename
          canvasTitle={canvasName}
          isModalOpen={isModalOpen}
          handleModalOk={handleModalOk}
          handleModalCancel={handleModalCancel}
        />
      </div>
    </>
  );
};
