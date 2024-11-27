import { Input, FormInstance, Form } from '@arco-design/web-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

// styles
import './index.scss';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { ChatActions } from './chat-actions';
import { ContextManager } from './context-manager';
import { SelectedSkillHeader } from './selected-skill-header';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';

const TextArea = Input.TextArea;

interface ChatInputProps {
  handleSendMessage: () => void;
  handleAbort: () => void;
}

export const ChatInput = (props: ChatInputProps) => {
  const { handleSendMessage, handleAbort } = props;
  const { t } = useTranslation();
  const inputRef = useRef<RefTextAreaType>(null);

  const [form] = Form.useForm();
  const { formErrors, setFormErrors } = useContextPanelStoreShallow((state) => ({
    formErrors: state.formErrors,
    setFormErrors: state.setFormErrors,
  }));

  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
  }));
  useEffect(() => {
    if (!skillStore.selectedSkill?.configSchema?.items?.length) {
      form.setFieldValue('tplConfig', undefined);
    }
  }, [skillStore.selectedSkill?.name, skillStore.selectedSkill?.configSchema?.items]);

  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    setNewQAText: state.setNewQAText,
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
        // Create new value with newline
        const newValue =
          chatStore.newQAText.slice(0, cursorPos as number) + '\n' + chatStore.newQAText.slice(cursorPos as number);

        // Update store to trigger re-render
        chatStore.setNewQAText(newValue);

        // Restore cursor position after state update
        setTimeout(() => {
          if (e.target instanceof HTMLTextAreaElement) {
            e.target.selectionStart = e.target.selectionEnd = (cursorPos as number) + 1;
          }
        }, 0);
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
    <div className="ai-copilot-chat-container">
      <div className="chat-input-container">
        <SelectedSkillHeader />
        <ContextManager />
        <div className="chat-input-body">
          <div className="ai-copilot-chat-input-container">
            <div className="ai-copilot-chat-input-body">
              <TextArea
                ref={inputRef}
                autoFocus
                value={chatStore?.newQAText === '' ? '' : chatStore?.newQAText}
                onChange={(value) => {
                  chatStore.setNewQAText(value);
                }}
                onKeyDownCapture={(e) => handleKeyDown(e)}
                style={{
                  borderRadius: 8,
                  resize: 'none',
                }}
                placeholder={t('copilot.chatInput.placeholder')}
                autoSize={{
                  minRows: 1,
                  maxRows: 3,
                }}
              ></TextArea>
            </div>
          </div>
        </div>

        {/* {skillStore.selectedSkill?.configSchema?.items?.length > 0 && (
          <ConfigManager
            form={form}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            schema={skillStore.selectedSkill?.configSchema}
            tplConfig={skillStore.selectedSkill?.config}
            fieldPrefix="tplConfig"
            configScope="runtime"
            resetConfig={() => {
              form.setFieldValue('tplConfig', skillStore.selectedSkill?.tplConfig || {});
            }}
          />
        )} */}

        <ChatActions form={form} handleSendMessage={handleSendMessage} handleAbort={handleAbort} />
      </div>
    </div>
  );
};
