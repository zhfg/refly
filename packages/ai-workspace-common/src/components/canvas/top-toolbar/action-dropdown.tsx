import React, { useState, useCallback, useMemo } from 'react';
import { Button, Dropdown, MenuProps, Popconfirm, DropdownProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconDelete, IconMoreHorizontal } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-canvas';

interface ActionDropdownProps {
  canvasId: string;
  canvasTitle?: string;
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ canvasId, canvasTitle }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();
  const { deleteCanvas } = useDeleteCanvas();

  const handleDelete = async () => {
    await deleteCanvas(canvasId);
    setPopupVisible(false);
  };

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
