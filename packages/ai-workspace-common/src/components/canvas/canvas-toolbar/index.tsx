import { Button, Badge } from 'antd';
import { HiOutlineDocumentAdd } from 'react-icons/hi';
import { RiUploadCloud2Line } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { FC, useCallback } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';

import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { CanvasNodeType, SearchDomain } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { ImportResourceModal } from '@refly-packages/ai-workspace-common/components/import-resource';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { IconCanvas, IconDocument, IconResource } from '@refly-packages/ai-workspace-common/components/common/icon';
import TooltipWrapper from '@refly-packages/ai-workspace-common/components/common/tooltip-button';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { IoAnalyticsOutline } from 'react-icons/io5';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';

// Define toolbar item interface
interface ToolbarItem {
  icon: React.ElementType;
  value: string;
  type: 'button' | 'popover';
  domain: string;
  tooltip: string;
  active?: boolean;
}

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
}

export const CanvasToolbar: FC<ToolbarProps> = ({ onToolSelect }) => {
  const { t } = useTranslation();
  const { addNode, mode, setMode, updateAllEdgesStyle } = useCanvasControl();

  const { importResourceModalVisible, setImportResourceModalVisible } = useImportResourceStoreShallow((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));
  const sourceListDrawerVisible = useKnowledgeBaseStoreShallow((state) => state.sourceListDrawer.visible);

  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const { selectedNodes } = useContextPanelStoreShallow((state) => ({
    selectedNodes: state.contextItems,
  }));

  const { showLaunchpad, setShowLaunchpad } = useCanvasStoreShallow((state) => ({
    showLaunchpad: state.showLaunchpad,
    setShowLaunchpad: state.setShowLaunchpad,
  }));

  const { showEdges, setShowEdges } = useCanvasStoreShallow((state) => ({
    showEdges: state.showEdges,
    setShowEdges: state.setShowEdges,
  }));

  const handleEdgesVisibilityChange = useCallback(() => {
    setShowEdges(!showEdges);
    updateAllEdgesStyle(!showEdges);
  }, [showEdges, setShowEdges, updateAllEdgesStyle]);

  const { createSingleDocumentInCanvas, isCreating } = useCreateDocument();

  // Define toolbar items
  const tools: ToolbarItem[] = [
    // {
    //   icon: FaArrowPointer,
    //   value: 'changeMode',
    //   type: 'button',
    //   domain: 'changeMode',
    //   tooltip: mode === 'pointer' ? t('canvas.toolbar.disablePointerMode') : t('canvas.toolbar.enablePointerMode'),
    //   active: mode === 'pointer',
    // },
    {
      icon: RiUploadCloud2Line,
      value: 'importResource',
      type: 'button',
      domain: 'resource',
      tooltip: t('canvas.toolbar.importResource'),
    },
    {
      icon: IconResource,
      value: 'addResource',
      type: 'popover',
      domain: 'resource',
      tooltip: t('canvas.toolbar.addResource'),
    },
    // {
    //   icon: Sparkles,
    //   value: 'addSkill',
    //   type: 'popover',
    //   domain: 'skill',
    //   tooltip: t('canvas.toolbar.addSkill'),
    // },
    {
      icon: HiOutlineDocumentAdd,
      value: 'createDocument',
      type: 'button',
      domain: 'document',
      tooltip: t('canvas.toolbar.createDocument'),
    },
    {
      icon: IconDocument,
      value: 'addDocument',
      type: 'popover',
      domain: 'document',
      tooltip: t('canvas.toolbar.addDocument'),
    },
    {
      icon: IconCanvas,
      value: 'handleLaunchpad',
      type: 'button',
      domain: 'launchpad',
      tooltip: t(`canvas.toolbar.${showLaunchpad ? 'hideLaunchpad' : 'showLaunchpad'}`),
    },
    {
      icon: IoAnalyticsOutline,
      value: 'showEdges',
      type: 'button',
      domain: 'edges',
      tooltip: t(`canvas.toolbar.${showEdges ? 'hideEdges' : 'showEdges'}`),
    },
  ];

  const getIconColor = (tool: string) => {
    if (tool === 'showEdges' && !showEdges) {
      return '#9CA3AF';
    }
    if (tool === 'handleLaunchpad' && !showLaunchpad) {
      return '#9CA3AF';
    }
    return '';
  };

  const getIsLoading = (tool: string) => {
    if (tool === 'createDocument' && isCreating) {
      return true;
    }
    return false;
  };

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
      case 'createDocument':
        createSingleDocumentInCanvas();
        break;
      case 'changeMode':
        setMode(mode === 'pointer' ? 'hand' : 'pointer');
        break;
      case 'handleLaunchpad':
        setShowLaunchpad(!showLaunchpad);
        break;
      case 'showEdges':
        handleEdgesVisibilityChange();
        break;
    }
    onToolSelect?.(tool);
  };

  const handleConfirm = (selectedItems: ContextItem[]) => {
    if (selectedItems.length > 0) {
      const domain = selectedItems[0]?.domain;
      console.log('selectedItems', selectedItems);
      selectedItems.forEach((item) => {
        const contentPreview = item?.snippets?.map((snippet) => snippet?.text || '').join('\n');
        addNode({
          type: domain as CanvasNodeType,
          data: { title: item.title, entityId: item.id, contentPreview: item?.contentPreview || contentPreview },
        });
      });
    }
  };

  const ToolButton = ({ tool }: { tool: ToolbarItem }) => {
    return (
      <Button
        type="text"
        onClick={(event) => handleToolSelect(event, tool.value)}
        className={`
                  h-[32px] w-[32px] 
                  flex items-center justify-center 
                  hover:bg-gray-100 rounded-lg 
                  transition-colors duration-200 
                  group
                  ${tool.active ? 'bg-gray-100' : ''}
                `}
        icon={
          <tool.icon
            className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900"
            style={{ color: getIconColor(tool.value) }}
          />
        }
        loading={getIsLoading(tool.value)}
      />
    );
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
          <TooltipWrapper key={index} tooltip={tool.tooltip}>
            {selectedNodes.length > 0 && tool.value === 'handleLaunchpad' ? (
              <Badge size="small" color="#00968F" offset={[-2, 2]} count={selectedNodes.length} overflowCount={9999}>
                <ToolButton tool={tool} />
              </Badge>
            ) : (
              <ToolButton tool={tool} />
            )}
          </TooltipWrapper>
        ) : (
          <SearchList key={index} domain={tool.domain as SearchDomain} handleConfirm={handleConfirm} offset={12}>
            <TooltipWrapper key={index} tooltip={tool.tooltip}>
              <Button
                type="text"
                onClick={(event) => handleToolSelect(event, tool.value)}
                className={`
                  h-[32px] w-[32px] 
                  flex items-center justify-center 
                  hover:bg-gray-100 rounded-lg 
                  transition-colors duration-200 
                  group
                  ${tool.active ? 'bg-gray-100' : ''}
                `}
                icon={<tool.icon className="h-[18px] w-[18px] text-gray-600 group-hover:text-gray-900" />}
              />
            </TooltipWrapper>
          </SearchList>
        ),
      )}
      {importResourceModalVisible ? <ImportResourceModal /> : null}
      {sourceListDrawerVisible && isWeb ? <SourceListModal classNames="source-list-modal" /> : null}
    </div>
  );
};
