import { useEffect } from 'react';
import { ContextItem } from './context-item';

// components
import { AddBaseMarkContext } from './components/add-base-mark-context';

// stores
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { mapSelectionTypeToContentList } from './utils/contentListSelection';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export const ContextManager = (props: { source: MessageIntentSource }) => {
  const { selectedContextItems, addContextItem, removeContextItem, filterErrorInfo } = useContextPanelStoreShallow(
    (state) => ({
      selectedContextItems: state.selectedContextItems,
      addContextItem: state.addContextItem,
      removeContextItem: state.removeContextItem,
      filterErrorInfo: state.filterErrorInfo,
    }),
  );
  const { selectedNode, setSelectedNode } = useCanvasControl();

  const handleToggleItem = (item: CanvasNode) => {
    setSelectedNode(item);
  };

  const handleRemoveItem = (item: CanvasNode) => {
    removeContextItem(item.id);
  };

  useEffect(() => {
    if (selectedNode?.type === 'resource' || selectedNode?.type === 'document') {
      // Add the selected node as a preview item
      const item = selectedContextItems.find((item) => item.id === selectedNode.id);
      if (!item) {
        addContextItem({ ...selectedNode, isPreview: true });

        // Remove current preview item, since only one preview item is allowed
        const previewItem = selectedContextItems.find((item) => item.isPreview);
        if (previewItem) {
          removeContextItem(previewItem.id);
        }
      }
    }
  }, [selectedNode]);

  return (
    <div className="flex flex-col h-full p-2 px-3">
      <div className="flex flex-col">
        <div className="flex flex-wrap content-start gap-1 w-full">
          <AddBaseMarkContext source={props.source} />
          {selectedContextItems?.map((item) => (
            <ContextItem
              key={item?.id}
              item={item}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item?.type)]}
              isActive={item?.id === selectedNode?.id}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
