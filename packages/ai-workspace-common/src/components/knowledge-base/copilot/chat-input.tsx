import { Avatar, Button, Input } from '@arco-design/web-react';
import { useRef, useState } from 'react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
// styles
import './index.scss';
import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { IconClose, IconSend } from '@arco-design/web-react/icon';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { buildConversation } from '@refly-packages/ai-workspace-common/utils/conversation';
import { useConversationStore } from '@refly-packages/ai-workspace-common/stores/conversation';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

const TextArea = Input.TextArea;

interface ChatInputProps {
  placeholder: string;
  autoSize: { minRows: number; maxRows: number };
}

export const ChatInput = (props: ChatInputProps) => {
  const inputRef = useRef<RefTextAreaType>(null);
  // stores
  const chatStore = useChatStore();
  const quickSearchStateStore = useQuickSearchStateStore();
  const conversationStore = useConversationStore();
  const messageStateStore = useMessageStateStore();
  const skillStore = useSkillStore();
  const { runTask, emptyConvRunTask } = useBuildThreadAndRun();
  // hooks
  const [isFocused, setIsFocused] = useState(false);

  const handleSendMessage = () => {
    const { messages, newQAText } = useChatStore.getState();
    quickSearchStateStore.setVisible(false);

    if (messages?.length > 0) {
      // 追问阅读
      runTask(newQAText);
    } else {
      // 新会话阅读，先创建会话，然后进行跳转之后发起聊天
      emptyConvRunTask(newQAText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.shiftKey || e.metaKey)) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // 阻止默认行为,即不触发 enter 键的默认事件
        e.preventDefault();
        // 在输入框中插入换行符

        // 获取光标位置
        const cursorPos = e.target.selectionStart;
        // 在光标位置插入换行符
        e.target.value =
          e.target.value.slice(0, cursorPos as number) + '\n' + e.target.value.slice(cursorPos as number);
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd = (cursorPos as number) + 1;
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage();
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      quickSearchStateStore.setVisible(true);
    }
  };

  return (
    <div className="ai-copilot-chat-input-container">
      {skillStore?.selectedSkill ? (
        <div className="selected-skill">
          <div className="selected-skill-profile">
            <Avatar size={16} />
            <p>
              和 <span className="selected-skill-name">{skillStore?.selectedSkill?.displayName}</span> 聊聊
            </p>
          </div>
          <div className="selected-skill-manage">
            <Button
              icon={<IconClose />}
              onClick={() => {
                skillStore.setSelectedSkillInstalce(null);
              }}
            ></Button>
          </div>
        </div>
      ) : null}
      <div className="ai-copilot-chat-input-body">
        <TextArea
          ref={inputRef}
          autoFocus
          value={chatStore?.newQAText}
          onChange={(value) => {
            chatStore.setNewQAText(value);
          }}
          onKeyDownCapture={(e) => handleKeyDown(e)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            borderRadius: 8,
            resize: 'none',
          }}
          placeholder={props.placeholder}
          autoSize={props.autoSize}
        ></TextArea>
        <div className="ai-copilot-chat-input-action">
          <Button
            shape="circle"
            loading={messageStateStore?.pending}
            icon={<IconSend />}
            disabled={messageStateStore?.pending}
            className="search-btn"
            style={{ color: '#FFF', background: '#00968F' }}
            onClick={() => {
              handleSendMessage();
            }}
          ></Button>
        </div>
      </div>
    </div>
  );
};
