import { useState, useEffect } from 'react';
import { ContextItem } from './context-item';
import { ContextPreview } from './context-preview';

// hooks
import { useProcessContextItems } from './hooks/use-process-context-items';
import { useProcessContextFilter } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-process-context-filter';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';

// components
import { AddBaseMarkContext } from './components/add-base-mark-context';
import './index.scss';

// components
import { ResetContentSelectorBtn } from './reset-content-selector-btn';
import { ContextFilter } from './components/context-filter/index';
import { SaveToKnowledgeBase } from './components/save-to-knowledge-base/index';
// stores
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

// types
import { Project, Canvas, Resource, SearchDomain, SearchResult } from '@refly/openapi-schema';
import {
  backendBaseMarkTypes,
  BaseMarkType,
  frontendBaseMarkTypes,
  Mark,
  SelectedTextDomain,
  selectedTextDomains,
} from '@refly/common-types';

import { mapSelectionTypeToContentList } from './utils/contentListSelection';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

const mapMarkToSearchResult = (marks: Mark[]): SearchResult[] => {
  let searchResults: SearchResult[] = [];

  searchResults = marks
    .filter((item) => backendBaseMarkTypes.includes(item?.type as BaseMarkType))
    .map((mark) => ({
      id: mark.id,
      domain: mark.type as SearchDomain,
      title: mark.title,
      url: mark.url,
    }));

  return searchResults;
};

export const ContextManager = (props: { source: MessageIntentSource }) => {
  const [activeItemId, setActiveItemId] = useState(null);
  const { processedContextItems } = useProcessContextItems();
  const {
    addMark,
    removeMark,
    toggleMarkActive,
    clearMarks,
    updateMark,
    resetState,
    currentSelectedMarks,
    filterIdsOfCurrentSelectedMarks,
    filterErrorInfo,
  } = useContextPanelStoreShallow((state) => ({
    addMark: state.addMark,
    removeMark: state.removeMark,
    toggleMarkActive: state.toggleMarkActive,
    clearMarks: state.clearMarks,
    updateMark: state.updateMark,
    resetState: state.resetState,
    currentSelectedMarks: state.currentSelectedMarks,
    filterIdsOfCurrentSelectedMarks: state.filterIdsOfCurrentSelectedMarks,
    filterErrorInfo: state.filterErrorInfo,
  }));
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const handleToggleItem = (id) => {
    toggleMarkActive(id);
    setActiveItemId((prevId) => (prevId === id ? null : id));
  };

  const handleRemoveItem = (id) => {
    removeMark(id);
    if (activeItemId === id) {
      setActiveItemId(null);
    }
  };

  const activeItem = processedContextItems.find((item) => item.id === activeItemId);

  const handleExpandItem = (id) => {
    // 这里可以添加展开项目的逻辑
    console.log(`Expanding item with id: ${id}`);
    // 例如，可以设置一个新的状态来跟踪展开的项目
    // setExpandedItems(prev => [...prev, id]);
  };

  const processContextFilterProps = useProcessContextFilter(true);

  const { currentResource } = useResourceStoreShallow((state) => ({
    currentResource: state.resource.data,
  }));
  const currentCanvas = useDocumentStoreShallow((state) => state.currentCanvas);
  const { project } = useProjectStoreShallow((state) => ({
    project: state?.project?.data,
  }));

  const { initMessageListener } = useSelectedMark();

  const currentSelectedContentList =
    (currentSelectedMarks || []).filter(
      (mark) =>
        selectedTextDomains?.includes(mark?.domain) || selectedTextDomains.includes(mark?.type as SelectedTextDomain),
    ) || [];

  const buildEnvContext = (data: Project | Resource | Canvas, type: 'project' | 'resource' | 'canvas'): Mark[] => {
    if (!data) return [];

    const typeMap = {
      resource: 'resourceId',
      project: 'projectId',
      canvas: 'canvasId',
    };

    const idKey = typeMap[type];
    const id = data[idKey];

    if (!id) return [];

    return [
      {
        title: data.title,
        type,
        id,
        entityId: id,
        data: type === 'project' ? (data as Project).description : (data as Resource | Canvas).content,
        onlyForCurrentContext: true,
        isCurrentContext: true,
        url: (data as Resource)?.data?.url || '',
        metadata: type === 'canvas' ? { projectId: (data as Canvas).projectId } : null,
      },
    ];
  };

  const removeNotCurrentContext = (type: string) => {
    currentSelectedMarks
      .filter((mark) => mark.type === type)
      .forEach((mark) => {
        if (mark.onlyForCurrentContext) {
          removeMark(mark.id);
        } else if (mark.isCurrentContext) {
          updateMark({ ...mark, isCurrentContext: false });
        }
      });
  };

  const updateContext = (item: any, type: 'project' | 'resource' | 'canvas') => {
    const envContext = buildEnvContext(item, type);
    const contextItem = envContext?.[0];

    if (!contextItem) {
      removeNotCurrentContext(type);
      return;
    }

    // Find existing mark of the same type
    const existingMark = currentSelectedMarks.find((mark) => mark.type === type && mark.onlyForCurrentContext);

    if (!existingMark) {
      // No existing mark, add new one
      addMark(contextItem);
    } else if (existingMark.entityId !== contextItem.entityId) {
      // Different entity, replace old with new
      removeMark(existingMark.id);
      addMark(contextItem);
    } else if (
      existingMark.title !== contextItem.title ||
      existingMark.data !== contextItem.data ||
      existingMark.url !== contextItem.url
    ) {
      // Same entity but content changed, update properties
      updateMark({
        ...existingMark,
        title: contextItem.title,
        data: contextItem.data,
        url: contextItem.url,
      });
    }
    // If everything is the same, do nothing
  };

  useEffect(() => {
    updateContext(project, 'project');
  }, [project?.projectId, project?.title]);

  useEffect(() => {
    updateContext(currentResource, 'resource');
  }, [currentResource?.resourceId, currentResource?.title]);

  useEffect(() => {
    updateContext(currentCanvas, 'canvas');
  }, [currentCanvas?.canvasId, currentCanvas?.title]);

  useEffect(() => {
    const clearEvent = initMessageListener();

    return () => {
      resetState();
      clearEvent?.();
    };
  }, []);

  return (
    <div className="context-manager">
      <div className="context-content">
        <div className="context-items-container">
          <AddBaseMarkContext source={props.source} />

          {/* {processedContextItems?.length > 0 && <ResetContentSelectorBtn />} */}

          {/* <ContextFilter processContextFilterProps={processContextFilterProps} /> */}

          {!isWeb && currentSelectedContentList?.length > 0 && <SaveToKnowledgeBase />}

          {processedContextItems.map((item) => (
            <ContextItem
              key={item.id}
              item={item}
              disabled={(filterIdsOfCurrentSelectedMarks || []).includes(item.id)}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item.type)]}
              isActive={item.id === activeItemId}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {activeItem && (
          <ContextPreview
            item={activeItem}
            onClose={() => setActiveItemId(null)}
            onRemove={handleRemoveItem}
            onOpenUrl={(url) => {
              if (typeof url === 'function') {
                url(); // 执行跳转函数
              } else {
                window.open(url, '_blank'); // 打开外部链接
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
