import { Button, Divider } from 'antd';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import SiderPopover from '../../../../../../apps/web/src/pages/sider-popover';

interface TopToolbarProps {}

export const TopToolbar: FC<TopToolbarProps> = ({}) => {
  const { t } = useTranslation();
  const { collapse, setCollapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));

  return (
    <div
      className={`absolute h-16 top-0 left-0 right-0  box-border flex justify-between items-center py-2 px-4 z-10 bg-[#EEF4F7] ${
        collapse ? 'w-[calc(100vw-12px)]' : 'w-[calc(100vw-232px)]'
      }`}
    >
      <div className="flex items-center">
        {collapse ? (
          <SiderPopover>
            <Button
              type="text"
              icon={<AiOutlineMenuUnfold size={20} />}
              onClick={() => {
                setCollapse(!collapse);
              }}
            />
          </SiderPopover>
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
      </div>

      <div className="flex items-center gap-2">action buttons</div>
    </div>
  );
};
