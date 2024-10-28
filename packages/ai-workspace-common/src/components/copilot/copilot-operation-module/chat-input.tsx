import { Input, FormInstance } from '@arco-design/web-react';
import { useRef } from 'react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { ChatMode, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

// styles
import './index.scss';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';

const TextArea = Input.TextArea;

interface ChatInputProps {
  placeholder: string;
  autoSize: { minRows: number; maxRows: number };
  form?: FormInstance;
  handleSendMessage: (chatMode: ChatMode) => void;
}

export const ChatInput = (props: ChatInputProps) => {
  const { handleSendMessage } = props;

  const inputRef = useRef<RefTextAreaType>(null);

  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    setNewQAText: state.setNewQAText,
    setChatMode: state.setChatMode,
  }));
  const searchStore = useSearchStoreShallow((state) => ({
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!chatStore?.newQAText) {
      return;
    }

    if (e.keyCode === 13 && (e.ctrlKey || e.shiftKey || e.metaKey)) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.preventDefault();

        // Get cursor position
        const cursorPos = e.target.selectionStart;
        // Insert a newline character at the cursor position
        e.target.value =
          e.target.value.slice(0, cursorPos as number) + '\n' + e.target.value.slice(cursorPos as number);
        // Move the cursor to the newline character
        e.target.selectionStart = e.target.selectionEnd = (cursorPos as number) + 1;
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage('normal');
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      searchStore.setIsSearchOpen(true);
    }
  };

  return (
    <div className="ai-copilot-chat-input-container">
      <div className="ai-copilot-chat-input-body">
        <TextArea
          ref={inputRef}
          autoFocus
          value={chatStore?.newQAText}
          onChange={(value) => {
            chatStore.setNewQAText(value);
          }}
          onKeyDownCapture={(e) => handleKeyDown(e)}
          style={{
            borderRadius: 8,
            resize: 'none',
          }}
          placeholder={props.placeholder}
          autoSize={{ maxRows: 6 }}
        ></TextArea>
      </div>
    </div>
  );
};
