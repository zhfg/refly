import { useEffect, useState } from 'react';
import { Button, Dropdown, DropdownProps, Popconfirm, MenuProps, message, Modal, Checkbox, CheckboxProps } from 'antd';
import { IconMoreHorizontal, IconDelete, IconEdit } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-canvas';
import { useTranslation } from 'react-i18next';
import { CanvasRename } from '@refly-packages/ai-workspace-common/components/canvas/top-toolbar/canvas-rename';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useUpdateCanvas } from '@refly-packages/ai-workspace-common/queries';
import { IoAlertCircle } from 'react-icons/io5';

interface CanvasActionDropdown {
  canvasId: string;
  canvasName: string;
  updateShowStatus?: (canvasId: string | null) => void;
  afterDelete?: () => void;
  afterRename?: (newTitle: string, canvasId: string) => void;
}

export const CanvasActionDropdown = (props: CanvasActionDropdown) => {
  const { canvasId, canvasName, updateShowStatus, afterDelete, afterRename } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();
  const { deleteCanvas } = useDeleteCanvas();
  const { mutate: updateCanvas } = useUpdateCanvas();
  const { updateCanvasTitle } = useSiderStoreShallow((state) => ({
    updateCanvasTitle: state.updateCanvasTitle,
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteFile, setIsDeleteFile] = useState(false);
  const onChange: CheckboxProps['onChange'] = (e) => {
    setIsDeleteFile(e.target.checked);
  };

  const handleDelete = async () => {
    const success = await deleteCanvas(canvasId, isDeleteFile);
    setPopupVisible(false);
    if (success) {
      setIsDeleteModalOpen(false);
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
          className="flex items-center text-red-600"
          onClick={() => {
            setIsDeleteModalOpen(true);
            setPopupVisible(false);
          }}
        >
          <IconDelete size={16} className="mr-2" />
          {t('workspace.deleteDropdownMenu.delete')}
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
      updateCanvas({ body: { canvasId, title: newTitle } });
      updateCanvasTitle(canvasId, newTitle);
      setIsModalOpen(false);
      afterRename?.(newTitle, canvasId);
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
    return () => {
      setIsDeleteFile(false);
    };
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <IoAlertCircle size={26} className="mr-2 text-[#faad14]" />
            {t('workspace.deleteDropdownMenu.deleteConfirmForCanvas', { canvas: canvasName })}
          </div>
        }
        centered
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        destroyOnClose
        closeIcon={null}
      >
        <div className="pl-10">
          <Checkbox onChange={onChange}>{t('canvas.toolbar.deleteCanvasFile')}</Checkbox>
        </div>
      </Modal>
    </>
  );
};
