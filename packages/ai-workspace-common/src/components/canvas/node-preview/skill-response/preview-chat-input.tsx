import { SelectedSkillHeader } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/selected-skill-header';
import { Input, FormInstance, Form } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { IContextItem, IResultItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { PreviewContextManager } from './preview-context-manager';

const TextArea = Input.TextArea;

interface PreviewChatInputProps {
  contextItems: IContextItem[];
  resultItems: IResultItem[];
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  query: string;
  actionMeta?: {
    icon?: any;
    name?: string;
  };
}

export const PreviewChatInput = (props: PreviewChatInputProps) => {
  const { contextItems, resultItems, chatHistoryOpen, setChatHistoryOpen, query, actionMeta } = props;
  const { t } = useTranslation();

  return (
    <div className="ai-copilot-chat-container">
      <div className="chat-input-container">
        <SelectedSkillHeader
          readonly
          skill={{
            icon: actionMeta?.icon,
            displayName: actionMeta?.name,
          }}
        />
        <PreviewContextManager
          contextItems={contextItems}
          resultItems={resultItems}
          chatHistoryOpen={chatHistoryOpen}
          setChatHistoryOpen={setChatHistoryOpen}
        />
        <div className="chat-input-body">
          <div className="ai-copilot-chat-input-container">
            <div className="ai-copilot-chat-input-body">
              <TextArea
                value={query}
                disabled
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
      </div>
    </div>
  );
};
