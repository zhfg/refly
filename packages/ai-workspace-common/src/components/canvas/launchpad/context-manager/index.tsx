import { memo, useMemo, useState } from 'react';
import { ContextItem } from './context-item';

import { AddBaseMarkContext } from './components/add-base-mark-context';
import { mapSelectionTypeToContentList } from './utils/contentListSelection';
import { FilterErrorInfo, IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useReactFlow } from '@xyflow/react';

interface ContextManagerProps {
  contextItems: IContextItem[];
  setContextItems: (items: IContextItem[]) => void;
  filterErrorInfo?: FilterErrorInfo;
}

const ContextManagerComponent = ({ contextItems = [], setContextItems, filterErrorInfo }: ContextManagerProps) => {
  const { getNodes } = useReactFlow();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const itemSelected = useMemo(() => {
    const nodes = getNodes();
    const entityIdNodeMap = new Map(
      nodes.filter((node) => node.data?.entityId).map((node) => [node.data?.entityId, node]),
    );
    return new Map(contextItems.map((item) => [item.entityId, entityIdNodeMap.get(item.entityId)?.selected]));
  }, [contextItems]);

  const handleRemoveItem = (item: IContextItem) => {
    setContextItems(contextItems.filter((contextItem) => contextItem.entityId !== item.entityId));

    if (activeItemId === item.entityId) {
      setActiveItemId(null);
    }
  };

  return (
    <div className="flex flex-col h-full p-2 px-3">
      <div className="flex flex-col">
        <div className="flex flex-wrap content-start gap-1 w-full">
          <AddBaseMarkContext contextItems={contextItems} setContextItems={setContextItems} />
          {contextItems.filter(Boolean).map((item) => (
            <ContextItem
              key={item.entityId}
              item={item}
              isLimit={!!filterErrorInfo?.[mapSelectionTypeToContentList(item?.type)]}
              isActive={itemSelected.get(item.entityId)}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ContextManager = memo(ContextManagerComponent);

ContextManager.displayName = 'ContextManager';
