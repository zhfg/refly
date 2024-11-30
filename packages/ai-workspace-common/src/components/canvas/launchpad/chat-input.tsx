import { FormInstance, Input } from '@arco-design/web-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

// styles
import './index.scss';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { ContextManager } from './context-manager';
import { SelectedSkillHeader } from './selected-skill-header';
import {
  useContextPanelStore,
  useContextPanelStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { ConfigManager } from './config-manager';
import { ChatActions } from './chat-actions';

const TextArea = Input.TextArea;

interface ChatInputProps {
  handleSendMessage: () => void;
  handleAbort: () => void;
  form: FormInstance;
}

export const ChatInput = (props: ChatInputProps) => {
  const { handleSendMessage, handleAbort, form } = props;
  const { t } = useTranslation();
  const inputRef = useRef<RefTextAreaType>(null);

  const { formErrors, setFormErrors } = useContextPanelStore((state) => ({
    formErrors: state.formErrors,
    setFormErrors: state.setFormErrors,
  }));

  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkill: state.setSelectedSkill,
  }));

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

  useEffect(() => {
    if (!skillStore.selectedSkill?.configSchema?.items?.length) {
      form.setFieldValue('tplConfig', undefined);
    } else {
      // Create default config from schema if no config exists
      const defaultConfig = {};
      skillStore.selectedSkill?.configSchema?.items?.forEach((item) => {
        if (item.defaultValue !== undefined) {
          defaultConfig[item.key] = {
            value: item.defaultValue,
            label: item.labelDict?.['en'] ?? item.key,
            displayValue: String(item.defaultValue),
          };
        }
      });

      // Use existing config or fallback to default config
      const initialConfig = skillStore.selectedSkill?.tplConfig ?? defaultConfig;
      form.setFieldValue('tplConfig', initialConfig);
    }
  }, [skillStore.selectedSkill?.name]);

  return (
    <div className="ai-copilot-chat-container">
      <div className="chat-input-container">
        <SelectedSkillHeader skill={skillStore.selectedSkill} onClose={() => skillStore.setSelectedSkill(null)} />
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

        {skillStore.selectedSkill?.configSchema?.items?.length > 0 && (
          <ConfigManager
            key={skillStore.selectedSkill?.name}
            form={form}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            schema={skillStore.selectedSkill?.configSchema}
            tplConfig={skillStore.selectedSkill?.tplConfig}
            fieldPrefix="tplConfig"
            configScope="runtime"
            resetConfig={() => {
              const defaultConfig = skillStore.selectedSkill?.tplConfig ?? {};
              form.setFieldValue('tplConfig', defaultConfig);
            }}
          />
        )}

        <ChatActions form={form} handleSendMessage={handleSendMessage} handleAbort={handleAbort} />
      </div>
    </div>
  );
};
