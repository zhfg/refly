import { Button, Divider, Tooltip, Avatar, Dropdown, MenuProps, Popconfirm, DropdownProps } from 'antd';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { FC, useState } from 'react';

import { PiShootingStar } from 'react-icons/pi';
import { MdOutlineHideImage } from 'react-icons/md';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import { IconDelete, IconMoreHorizontal } from '@refly-packages/ai-workspace-common/components/common/icon';
import SiderPopover from '../../../../../../apps/web/src/pages/sider-popover';
import { BsLayoutWtf } from 'react-icons/bs';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import Logo from '../../../../../../apps/web/src/assets/logo.svg';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { useDeleteCanvas } from '@refly-packages/ai-workspace-common/hooks/use-delete-canvas';

interface TopToolbarProps {
  canvasId: string;
}

export const TopToolbar: FC<TopToolbarProps> = ({ canvasId }) => {
  const { t } = useTranslation();
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  const { onLayout } = useCanvasControl();
  const { showPreview, setShowPreview } = useCanvasStoreShallow((state) => ({
    showPreview: state.showPreview,
    setShowPreview: state.setShowPreview,
  }));
  const { deleteCanvas } = useDeleteCanvas();

  const ActionDropdown = () => {
    const [popupVisible, setPopupVisible] = useState(false);

    const handleDelete = async () => {
      await deleteCanvas(canvasId);
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
        <Button type="text" icon={<IconMoreHorizontal />} />
      </Dropdown>
    );
  };

  return (
    <div
      className={`absolute h-16 top-0 left-0 right-0  box-border flex justify-between items-center py-2 px-4 z-10 bg-transparent ${
        collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
      }`}
    >
      <div className="flex items-center">
        {collapse ? (
          <>
            <SiderPopover>
              <Button
                type="text"
                icon={<AiOutlineMenuUnfold size={20} />}
                onClick={() => {
                  setCollapse(!collapse);
                }}
              />
            </SiderPopover>
            <Divider type="vertical" className="pr-[4px]" />
            <div className="flex items-center justify-center">
              <Avatar size={32} src={Logo} />
              <span className="text-sm font-bold ml-2">Refly</span>
            </div>
          </>
        ) : (
          <Button
            type="text"
            icon={<AiOutlineMenuFold size={20} />}
            onClick={() => {
              setCollapse(!collapse);
            }}
          />
        )}
        <Divider type="vertical" className="pr-[4px]" />
        <div className="text-sm font-bold text-gray-500">Canvas Name: xxxx</div>
        <Divider type="vertical" className="pr-[4px]" />
        <Button type="text" icon={<BsLayoutWtf />} onClick={() => onLayout('LR')}>
          Layout
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#FCFCF9] rounded-lg px-2 py-1 border border-solid border-1 border-[#EAECF0] box-shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
          <Button type="text" icon={<PiShootingStar />} />
          <Divider type="vertical" />
          <Tooltip title={t(`canvas.toolbar.${showPreview ? 'hidePreview' : 'showPreview'}`)}>
            <Button
              type="text"
              icon={<MdOutlineHideImage style={{ color: showPreview ? '#9CA3AF' : '#000' }} />}
              onClick={() => setShowPreview(!showPreview)}
            />
          </Tooltip>
        </div>

        <ActionDropdown />
      </div>
    </div>
  );
};
