import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { ContextItem } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/context-item';
import { memo, useMemo } from 'react';
import './index.scss';

interface PreviewContextManagerProps {
  contextItems: NodeItem[];
  historyItems: NodeItem[];
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
}

const PreviewContextManagerComponent = (props: PreviewContextManagerProps) => {
  const { contextItems } = props;

  const renderedContextItems = useMemo(
    () =>
      contextItems?.length > 0
        ? contextItems.map((item, index) => (
            <ContextItem canNotRemove={true} key={`${item.id}-${index}`} item={item} isLimit={false} isActive={false} />
          ))
        : null,
    [contextItems],
  );

  return (
    <div className="flex flex-col h-full pt-2 pb-0 px-3 launchpad-context-manager">
      <div className="flex flex-col context-content">
        <div className="flex flex-wrap content-start gap-1 w-full context-items-container">{renderedContextItems}</div>
      </div>
    </div>
  );
};

export const PreviewContextManager = memo(PreviewContextManagerComponent, (prevProps, nextProps) => {
  return prevProps.contextItems === nextProps.contextItems && prevProps.chatHistoryOpen === nextProps.chatHistoryOpen;
});
