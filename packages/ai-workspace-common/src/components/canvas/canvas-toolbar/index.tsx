import { Button, Popover } from 'antd';
import { FaArrowPointer } from 'react-icons/fa6';
import { RiUploadCloud2Line } from 'react-icons/ri';
import { HiOutlineSquare3Stack3D } from 'react-icons/hi2';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import { Sparkles, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';

import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { CanvasNodeType, SearchDomain } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { ImportResourceModal } from '@refly-packages/ai-workspace-common/components/import-resource';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

// Define toolbar item interface
interface ToolbarItem {
  icon: React.ElementType;
  value: string;
  type: 'button' | 'popover';
  domain: string;
}

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
}

export const CanvasToolbar: FC<ToolbarProps> = ({ onToolSelect }) => {
  const { t } = useTranslation();
  const { addNode } = useCanvasControl();

  const { importResourceModalVisible, setImportResourceModalVisible } = useImportResourceStoreShallow((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));
  const sourceListDrawerVisible = useKnowledgeBaseStoreShallow((state) => state.sourceListDrawer.visible);

  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  // Define toolbar items
  const tools: ToolbarItem[] = [
    { icon: FaArrowPointer, value: 'changeMode', type: 'button', domain: 'changeMode' },
    { icon: RiUploadCloud2Line, value: 'importResource', type: 'button', domain: 'resource' },
    { icon: HiOutlineSquare3Stack3D, value: 'addResource', type: 'popover', domain: 'resource' },
    { icon: Sparkles, value: 'addSkill', type: 'popover', domain: 'skill' },
    // { icon: Wrench, value: 'addTool', type: 'popover', domain: 'tool' },
    { icon: HiOutlineDocumentText, value: 'addDocument', type: 'popover', domain: 'document' },
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

  const handleConfirm = (selectedItems: ContextItem[]) => {
    if (selectedItems.length > 0) {
      const domain = selectedItems[0]?.domain;
      selectedItems.forEach((item) => {
        addNode({
          type: domain as CanvasNodeType,
          data: { title: item.title, entityId: item.id },
        });
      });
    }
  };

  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-lg p-2 flex flex-col gap-2 z-10"
      style={{
        border: '1px solid rgba(16, 24, 40, 0.0784)',
        boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
      }}
    >
      {tools.map((tool, index) =>
        tool.type === 'button' ? (
          <Button
            key={index}
            type="text"
            onClick={(event) => handleToolSelect(event, tool.value)}
            className="h-[32px] w-[32px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            icon={<tool.icon className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900" />}
          ></Button>
        ) : (
          <SearchList key={index} domain={tool.domain as SearchDomain} handleConfirm={handleConfirm}>
            <Button
              type="text"
              onClick={(event) => handleToolSelect(event, tool.value)}
              className="h-[32px] w-[32px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
              icon={<tool.icon className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900" />}
            ></Button>
          </SearchList>
        ),
      )}
      {importResourceModalVisible ? <ImportResourceModal /> : null}
      {sourceListDrawerVisible && isWeb ? <SourceListModal classNames="source-list-modal" /> : null}
    </div>
  );
};
