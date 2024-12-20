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
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { ConfigManager } from './config-manager';
import { ChatActions } from './chat-actions';
import { ChatHistory } from './chat-history';

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
  const selectedSkill = skillStore.selectedSkill;

  const chatStore = useChatStoreShallow((state) => ({
    newQAText: state.newQAText,
    setNewQAText: state.setNewQAText,
  }));
  const searchStore = useSearchStoreShallow((state) => ({
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!chatStore?.newQAText?.trim()) {
      if (e.keyCode === 13) {
        e.preventDefault(); // Prevent empty lines when text is empty
        return;
      }
      return;
    }

    const preventEmptyLine = () => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        e.preventDefault();

        const cursorPos = e.target.selectionStart ?? 0;
        const text = chatStore.newQAText;

        // Simply insert newline at cursor position
        const newValue = text.slice(0, cursorPos) + '\n' + text.slice(cursorPos);
        chatStore.setNewQAText(newValue);

        // Restore cursor position
        setTimeout(() => {
          if (e.target instanceof HTMLTextAreaElement) {
            e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
          }
        }, 0);
      }
    };

    if (e.keyCode === 13) {
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        preventEmptyLine();
      } else {
        e.preventDefault();
        if (chatStore?.newQAText?.trim()) {
          handleSendMessage();
        }
      }
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      searchStore.setIsSearchOpen(true);
    }
  };

  useEffect(() => {
    if (!selectedSkill?.configSchema?.items?.length) {
      form.setFieldValue('tplConfig', undefined);
    } else {
      // Create default config from schema if no config exists
      const defaultConfig = {};
      selectedSkill?.configSchema?.items?.forEach((item) => {
        if (item.defaultValue !== undefined) {
          defaultConfig[item.key] = {
            value: item.defaultValue,
            label: item.labelDict?.['en'] ?? item.key,
            displayValue: String(item.defaultValue),
          };
        }
      });

      // Use existing config or fallback to default config
      const initialConfig = selectedSkill?.tplConfig ?? defaultConfig;
      form.setFieldValue('tplConfig', initialConfig);
    }
  }, [selectedSkill?.name]);

  return (
    <div className="ai-copilot-chat-container">
      <div className="chat-input-container">
        <SelectedSkillHeader
          skill={selectedSkill}
          onClose={() => skillStore.setSelectedSkill(null)}
          className="rounded-t-[7px]"
        />
        <ContextManager />
        <ChatHistory />
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
                placeholder={
                  selectedSkill
                    ? t(`${selectedSkill?.name}.placeholder`, {
                        ns: 'skill',
                        defaultValue: t(`commonQnA.placeholder`, { ns: 'skill' }),
                      })
                    : t(`commonQnA.placeholder`, { ns: 'skill' })
                }
                autoSize={{
                  minRows: 1,
                  maxRows: 6,
                }}
              ></TextArea>
            </div>
          </div>
        </div>

        {selectedSkill?.configSchema?.items?.length > 0 && (
          <ConfigManager
            key={selectedSkill?.name}
            form={form}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            schema={selectedSkill?.configSchema}
            tplConfig={selectedSkill?.tplConfig}
            fieldPrefix="tplConfig"
            configScope="runtime"
            resetConfig={() => {
              const defaultConfig = selectedSkill?.tplConfig ?? {};
              form.setFieldValue('tplConfig', defaultConfig);
            }}
          />
        )}

        <ChatActions form={form} handleSendMessage={handleSendMessage} handleAbort={handleAbort} />
      </div>
    </div>
  );
};
