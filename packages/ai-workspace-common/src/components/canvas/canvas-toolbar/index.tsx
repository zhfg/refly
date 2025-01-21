import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { memo, useCallback, useMemo, useState } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { CanvasNodeType, SearchDomain } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { ImportResourceModal } from '@refly-packages/ai-workspace-common/components/import-resource';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import {
  IconAskAI,
  IconAskAIInput,
  IconCreateDocument,
  IconDocument,
  IconImportResource,
  IconMemo,
  IconResource,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import TooltipWrapper from '@refly-packages/ai-workspace-common/components/common/tooltip-button';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { IoAnalyticsOutline } from 'react-icons/io5';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useEdgeVisible } from '@refly-packages/ai-workspace-common/hooks/canvas/use-edge-visible';
import { ToolButton, ToolbarItem } from './tool-button';
import { HoverCard, HoverContent } from '@refly-packages/ai-workspace-common/components/hover-card';
import { genMemoID, genSkillID } from '@refly-packages/utils/id';

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
}

const useToolbarConfig = () => {
  const { t } = useTranslation();
  const { showLaunchpad, showEdges } = useCanvasStoreShallow((state) => ({
    showLaunchpad: state.showLaunchpad,
    showEdges: state.showEdges,
  }));

  const sourceListDrawerVisible = useKnowledgeBaseStoreShallow((state) => state.sourceListDrawer.visible);
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  return useMemo(
    () => ({
      tools: [
        {
          icon: IconAskAI,
          value: 'askAI',
          type: 'button',
          isPrimary: true,
          domain: 'skill',
          tooltip: t('canvas.toolbar.askAI'),
          hoverContent: {
            title: t('canvas.toolbar.askAI'),
            description: t('canvas.toolbar.askAIDescription'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          icon: IconMemo,
          value: 'createMemo',
          type: 'button',
          domain: 'memo',
          tooltip: t('canvas.toolbar.createMemo'),
          hoverContent: {
            title: t('canvas.toolbar.createMemo'),
            description: t('canvas.toolbar.createMemoDescription'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          icon: IconImportResource,
          value: 'importResource',
          type: 'button',
          domain: 'resource',
          tooltip: t('canvas.toolbar.importResource'),
          hoverContent: {
            title: t('canvas.toolbar.importResource'),
            description: t('canvas.toolbar.importResourceDescription'),
            videoUrl: 'https://static.refly.ai/static/20250118-182618.mp4',
          },
        },
        {
          icon: IconResource,
          value: 'addResource',
          type: 'popover',
          domain: 'resource',
          tooltip: t('canvas.toolbar.addResource'),
          hoverContent: {
            title: t('canvas.toolbar.addResource'),
            description: t('canvas.toolbar.addResourceDescription'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          icon: IconCreateDocument,
          value: 'createDocument',
          type: 'button',
          domain: 'document',
          tooltip: t('canvas.toolbar.createDocument'),
          hoverContent: {
            title: t('canvas.toolbar.createDocument'),
            description: t('canvas.toolbar.createDocumentDescription'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          icon: IconDocument,
          value: 'addDocument',
          type: 'popover',
          domain: 'document',
          tooltip: t('canvas.toolbar.addDocument'),
          hoverContent: {
            title: t('canvas.toolbar.addDocument'),
            description: t('canvas.toolbar.addDocumentDescription'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          type: 'divider',
        },
        {
          icon: IconAskAIInput,
          value: 'handleLaunchpad',
          type: 'button',
          domain: 'launchpad',
          tooltip: t(`canvas.toolbar.${showLaunchpad ? 'hideLaunchpad' : 'showLaunchpad'}`),
          hoverContent: {
            title: t('canvas.toolbar.toggleLaunchpadTitle'),
            videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
          },
        },
        {
          icon: IoAnalyticsOutline,
          value: 'showEdges',
          type: 'button',
          domain: 'edges',
          tooltip: t(`canvas.toolbar.${showEdges ? 'hideEdges' : 'showEdges'}`),
          hoverContent: {
            title: t('canvas.toolbar.toggleEdgeTitle'),
            videoUrl: 'https://static.refly.ai/static/20250118-182618.mp4',
          },
        },
      ] as ToolbarItem[],
      modals: {
        sourceList: sourceListDrawerVisible && isWeb,
      },
    }),
    [t, showEdges, showLaunchpad, sourceListDrawerVisible, isWeb],
  );
};

const SearchListWrapper = memo(
  ({ tool, handleConfirm }: { tool: ToolbarItem; handleConfirm: (items: ContextItem[]) => void }) => {
    const handleToolSelect = useCallback((event: React.MouseEvent) => {
      event.preventDefault();
    }, []);

    const [open, setOpen] = useState(false);

    const button = (
      <Button
        type="text"
        onClick={handleToolSelect}
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
    );

    return (
      <SearchList
        domain={tool.domain as SearchDomain}
        handleConfirm={handleConfirm}
        offset={12}
        placement="right"
        open={open}
        setOpen={setOpen}
      >
        {tool.hoverContent ? (
          <HoverCard
            title={tool.hoverContent.title}
            description={tool.hoverContent.description}
            videoUrl={tool.hoverContent.videoUrl}
            placement="right"
            overlayStyle={{ marginLeft: '12px' }}
            align={{ offset: [12, 0] }}
          >
            {button}
          </HoverCard>
        ) : (
          <TooltipWrapper tooltip={tool.tooltip}>{button}</TooltipWrapper>
        )}
      </SearchList>
    );
  },
);

export const CanvasToolbar = memo<ToolbarProps>(({ onToolSelect }) => {
  const { t } = useTranslation();
  const { addNode } = useAddNode();

  // 4. 使用 selector 函数分离状态
  const { showLaunchpad, setShowLaunchpad, showEdges } = useCanvasStoreShallow((state) => ({
    showLaunchpad: state.showLaunchpad,
    setShowLaunchpad: state.setShowLaunchpad,
    showEdges: state.showEdges,
  }));

  const { importResourceModalVisible, setImportResourceModalVisible } = useImportResourceStoreShallow((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));

  const contextItems = useContextPanelStoreShallow((state) => state.contextItems);
  const { createSingleDocumentInCanvas, isCreating } = useCreateDocument();
  const { toggleEdgeVisible } = useEdgeVisible();

  const { tools, modals } = useToolbarConfig();

  const getIconColor = useCallback(
    (tool: string) => {
      if (tool === 'showEdges' && !showEdges) return '#9CA3AF';
      if (tool === 'handleLaunchpad' && !showLaunchpad) return '#9CA3AF';
      return '';
    },
    [showEdges, showLaunchpad],
  );

  const getIsLoading = useCallback(
    (tool: string) => {
      return tool === 'createDocument' && isCreating;
    },
    [isCreating],
  );

  const createSkillNode = useCallback(() => {
    addNode({
      type: 'skill',
      data: { title: 'Skill', entityId: genSkillID() },
    });
  }, [addNode]);

  const createMemo = useCallback(() => {
    const memoId = genMemoID();
    addNode({
      type: 'memo',
      data: { title: t('canvas.nodeTypes.memo'), entityId: memoId },
    });
  }, [addNode, t]);

  const handleToolSelect = useCallback(
    (event: React.MouseEvent, tool: string) => {
      switch (tool) {
        case 'importResource':
          setImportResourceModalVisible(true);
          break;
        case 'createDocument':
          createSingleDocumentInCanvas();
          break;
        case 'handleLaunchpad':
          setShowLaunchpad(!showLaunchpad);
          break;
        case 'showEdges':
          toggleEdgeVisible();
          break;
        case 'askAI':
          createSkillNode();
          break;
        case 'createMemo':
          createMemo();
          break;
      }
      onToolSelect?.(tool);
    },
    [
      setImportResourceModalVisible,
      createSingleDocumentInCanvas,
      setShowLaunchpad,
      toggleEdgeVisible,
      createSkillNode,
      createMemo,
      onToolSelect,
    ],
  );

  const handleConfirm = useCallback(
    (selectedItems: ContextItem[]) => {
      selectedItems.forEach((item) => {
        const contentPreview = item?.snippets?.map((snippet) => snippet?.text || '').join('\n');
        addNode(
          {
            type: item.domain as CanvasNodeType,
            data: {
              title: item.title,
              entityId: item.id,
              contentPreview: item?.contentPreview || contentPreview,
            },
          },
          undefined,
          false,
          true,
        );
      });
    },
    [addNode],
  );

  return (
    <div
      className="absolute left-[12px] top-1/2 -translate-y-1/2 bg-white border border-solid border-gray-100 shadow-sm rounded-lg p-2 flex flex-col gap-2 z-10"
      style={
        {
          // border: '1px solid rgba(16, 24, 40, 0.0784)',
          // boxShadow: '0px 4px 6px 0px rgba(16, 24, 40, 0.03)',
        }
      }
    >
      {tools.map((tool, index) => {
        if (tool.type === 'divider') {
          return <Divider key={index} className="m-0" />;
        }

        if (tool.type === 'button') {
          return (
            <ToolButton
              key={index}
              tool={tool}
              contextCnt={contextItems?.length}
              handleToolSelect={handleToolSelect}
              getIconColor={getIconColor}
              getIsLoading={getIsLoading}
            />
          );
        }

        return <SearchListWrapper key={index} tool={tool} handleConfirm={handleConfirm} />;
      })}

      <ImportResourceModal />
      {modals.sourceList && <SourceListModal classNames="source-list-modal" />}
    </div>
  );
});
