import { Button } from '@arco-design/web-react';
import { IconCaretDown, IconTranslate } from '@arco-design/web-react/icon';
import { ContextContentWithBadge } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel';
import { OutputLocaleList } from '@refly-packages/ai-workspace-common/components/output-locale-list';
import { SelectedTextContextActionBtn } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display//action-btn/selected-text-context-action-btn';
import { CurrentContextActionBtn } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-state-display/action-btn/current-context-action-btn';

// styles
import './index.scss';
import '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/common-styles/index.scss';

export const ChatInputAssistAction = (props: { rightContent?: React.ReactNode }) => {
  return (
    <div className="chat-input-assist-action">
      <div className="chat-input-assist-action-left">
        <SelectedTextContextActionBtn />
        {/* <CurrentContextActionBtn /> */}
        <ContextContentWithBadge />
        <OutputLocaleList />
      </div>
      {props.rightContent ? props.rightContent : null}
    </div>
  );
};
