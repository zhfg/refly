import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { ContextItem } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/context-item';
import { ChatHistorySwitch } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/components/chat-history-switch';

import './index.scss';

export const PreviewContextManager = (props: {
  contextItems: NodeItem[];
  historyItems: NodeItem[];
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
}) => {
  const { contextItems, historyItems, chatHistoryOpen, setChatHistoryOpen } = props;

  return (
    <div className="flex flex-col h-full p-2 px-3 launchpad-context-manager">
      <div className="flex flex-col context-content">
        <div className="flex flex-wrap content-start gap-1 w-full context-items-container">
          {historyItems?.length > 0 ? (
            <ChatHistorySwitch
              chatHistoryOpen={chatHistoryOpen}
              setChatHistoryOpen={setChatHistoryOpen}
              items={historyItems}
            />
          ) : null}
          {contextItems?.length > 0
            ? contextItems?.map((item) => (
                <ContextItem canNotRemove={true} key={item.id} item={item} isLimit={false} isActive={false} />
              ))
            : null}
        </div>
      </div>
    </div>
  );
};
