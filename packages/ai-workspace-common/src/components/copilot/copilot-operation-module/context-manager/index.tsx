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
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

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
  const { selectedNodes, removeNode, resetState, filterErrorInfo } = useContextPanelStoreShallow((state) => ({
    selectedNodes: state.selectedContextItems,
    removeNode: state.removeContextItem,
    resetState: state.resetState,
    filterErrorInfo: state.filterErrorInfo,
  }));
  const { setSelectedNode } = useCanvasControl();

  const handleToggleItem = (item: CanvasNode) => {
    setSelectedNode(item);
  };

  const handleRemoveItem = (item: CanvasNode) => {
    removeNode(item.id);
  };

  // const { initMessageListener } = useSelectedMark();

  // useEffect(() => {
  //   const clearEvent = initMessageListener();

  //   return () => {
  //     resetState();
  //     clearEvent?.();
  //   };
  // }, []);

  return (
    <div className="context-manager">
      <div className="context-content">
        <div className="context-items-container">
          <AddBaseMarkContext source={props.source} />
          {selectedNodes.map((item) => (
            <ContextItem
              key={item.id}
              item={item}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item.type)]}
              isActive={item.id === activeItemId}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
