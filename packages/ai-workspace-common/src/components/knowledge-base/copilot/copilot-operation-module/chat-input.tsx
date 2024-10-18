import { Input, Notification, FormInstance } from '@arco-design/web-react';
import { useRef, useState } from 'react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStore, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';

// styles
import './index.scss';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useTranslation } from 'react-i18next';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
const TextArea = Input.TextArea;

interface ChatInputProps {
  placeholder: string;
  autoSize: { minRows: number; maxRows: number };
  form?: FormInstance;
}

export const ChatInput = (props: ChatInputProps) => {
  const { form } = props;

  const { t } = useTranslation();
  const inputRef = useRef<RefTextAreaType>(null);
  // stores
  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    setNewQAText: state.setNewQAText,
  }));
  const searchStore = useSearchStoreShallow((state) => ({
    setIsSearchOpen: state.setIsSearchOpen,
  }));
  const { runSkill, emptyConvRunSkill, buildShutdownTaskAndGenResponse } = useBuildThreadAndRun();
  // hooks
  const [isFocused, setIsFocused] = useState(false);

  const { handleFilterErrorTip } = useContextFilterErrorTip();

  const handleSendMessage = () => {
    const error = handleFilterErrorTip();
    if (error) {
      return;
    }

    const { formErrors } = useContextPanelStore.getState();
    if (formErrors && Object.keys(formErrors).length > 0) {
      Notification.error({
        style: { width: 400 },
        title: t('copilot.configManager.errorTipTitle'),
        content: t('copilot.configManager.errorTip'),
      });
      return;
    }

    const { messages, newQAText } = useChatStore.getState();
    searchStore.setIsSearchOpen(false);
    const tplConfig = form?.getFieldValue('tplConfig');
    const invokeParams = { tplConfig: tplConfig };

    if (messages?.length > 0) {
      // 追问阅读
      runSkill(newQAText, invokeParams);
    } else {
      // 新会话阅读，先创建会话，然后进行跳转之后发起聊天
      emptyConvRunSkill(newQAText, true, invokeParams);
    }
  };

  const handleAbort = () => {
    buildShutdownTaskAndGenResponse();
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
