import { Tooltip, Button } from 'antd';
import { FaArrowPointer } from 'react-icons/fa6';
import { RiUploadCloud2Line } from 'react-icons/ri';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { HiOutlineSquare2Stack } from 'react-icons/hi2';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';

import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';

// Define toolbar item interface
interface ToolbarItem {
  icon: React.ElementType;
  value: string;
}

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
}

export const CanvasToolbar: FC<ToolbarProps> = ({ onToolSelect }) => {
  const { t } = useTranslation();
  const { setImportResourceModalVisible } = useImportResourceStoreShallow((state) => ({
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));
  // Define toolbar items
  const tools: ToolbarItem[] = [
    { icon: FaArrowPointer, value: 'changeMode' },
    { icon: RiUploadCloud2Line, value: 'importResource' },
    { icon: HiOutlineSquare3Stack3D, value: 'addResource' },
    { icon: HiOutlineSquare2Stack, value: 'addSkill' },
    { icon: HiOutlineWrenchScrewdriver, value: 'addTool' },
    { icon: HiOutlineDocumentText, value: 'addDocument' },
  ];

  const handleToolSelect = (event: React.MouseEvent, tool: string) => {
    event.stopPropagation();
    // Handle tool selection
    switch (tool) {
      case 'importResource':
        setImportResourceModalVisible(true);
        break;
      case 'addResource':
        break;
      case 'addSkill':
        break;
      case 'addTool':
        break;
      case 'addDocument':
        break;
    }
    onToolSelect?.(tool);
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-10 border-solid border-1 border-gray-100">
      {tools.map((tool, index) => (
        <Tooltip key={index} title={t(`canvas.toolbar.${tool.value}`)} placement="right">
          <Button
            type="text"
            onClick={(event) => handleToolSelect(event, tool.value)}
            className="h-[32px] w-[32px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            icon={<tool.icon className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900" />}
          ></Button>
        </Tooltip>
      ))}
    </div>
  );
};
