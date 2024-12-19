import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { ContextItem } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/context-item';

import './index.scss';

export const PreviewContextManager = (props: {
  contextItems: NodeItem[];
  historyItems: NodeItem[];
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
}) => {
  const { contextItems } = props;

  return (
    <div className="flex flex-col h-full pt-2 pb-0 px-3 launchpad-context-manager">
      <div className="flex flex-col context-content">
        <div className="flex flex-wrap content-start gap-1 w-full context-items-container">
          {contextItems?.length > 0
            ? contextItems?.map((item, index) => (
                <ContextItem
                  canNotRemove={true}
                  key={`${item.id}-${index}`}
                  item={item}
                  isLimit={false}
                  isActive={false}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
};
