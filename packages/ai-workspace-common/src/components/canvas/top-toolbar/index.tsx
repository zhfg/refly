import { Button, Divider, Tooltip, Avatar } from 'antd';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';

import { MdOutlineHideImage } from 'react-icons/md';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import { IconMoreHorizontal } from '@refly-packages/ai-workspace-common/components/common/icon';
import SiderPopover from '../../../../../../apps/web/src/pages/sider-popover';
import { BsLayoutWtf } from 'react-icons/bs';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import Logo from '../../../../../../apps/web/src/assets/logo.svg';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';

interface TopToolbarProps {}

export const TopToolbar: FC<TopToolbarProps> = ({}) => {
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
        <div className="flex items-center gap-2 bg-[#FCFCF9] rounded-lg px-2 py-1 border border-solid border-1 border-[#EAECF0] box-shadow-[0px_2px_6px_0px_rgba(0,0,0,0.1)]">
          <Tooltip title={showPreview ? 'Hide Preview' : 'Show Preview'}>
            <Button
              type="text"
              icon={<MdOutlineHideImage style={{ color: showPreview ? '#9CA3AF' : '#000' }} />}
              onClick={() => setShowPreview(!showPreview)}
            />
          </Tooltip>
          <Divider type="vertical" />
          <Button type="text" icon={<IconMoreHorizontal />} />
        </div>
      </div>
    </div>
  );
};
