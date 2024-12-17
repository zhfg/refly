import { useState } from 'react';
import { Button, Dropdown, DropdownProps, Popconfirm, MenuProps, message } from 'antd';
import { IconMoreHorizontal, IconDelete } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/use-delete-canvas';
import { useTranslation } from 'react-i18next';

interface CanvasActionDropdown {
  canvasId: string;
  afterDelete?: () => void;
}
export const CanvasActionDropdown = (props: CanvasActionDropdown) => {
  const { canvasId, afterDelete } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();
  const { deleteCanvas } = useDeleteCanvas();

  const handleDelete = async () => {
    const success = await deleteCanvas(canvasId);
    if (success) {
      afterDelete?.();
    }
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <Popconfirm
          title={t('workspace.deleteDropdownMenu.deleteConfirmForCanvas')}
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
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  return (
    <Dropdown
      trigger={['click']}
      open={popupVisible}
      onOpenChange={handleOpenChange}
      menu={{
        items,
      }}
    >
      <Button size="small" type="text" icon={<IconMoreHorizontal />} />
    </Dropdown>
  );
};
