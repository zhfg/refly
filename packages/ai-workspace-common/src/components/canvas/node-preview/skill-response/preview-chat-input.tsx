import { useTranslation } from 'react-i18next';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

import { PreviewContextManager } from './preview-context-manager';
import { useEffect, useState } from 'react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { ChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-history';
import { SelectedSkillHeader } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/selected-skill-header';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';

interface PreviewChatInputProps {
  contextItems: NodeItem[];
  historyItems: NodeItem[];
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  query: string;
  actionMeta?: {
    icon?: any;
    name?: string;
  };
  readonly?: boolean;
}

export const PreviewChatInput = (props: PreviewChatInputProps) => {
  const { contextItems, historyItems, chatHistoryOpen, setChatHistoryOpen, query, actionMeta, readonly } = props;
  const { t } = useTranslation();
  const [userQuery, setUserQuery] = useState(query);

  useEffect(() => {
    setUserQuery(query);
  }, [query]);

  const hideSelectedSkillHeader = !actionMeta || actionMeta?.name === 'commonQnA' || !actionMeta?.name;

  return (
    <div className="ai-copilot-chat-container">
      <div className={cn('border border-solid border-gray-200 rounded-lg')}>
        {!hideSelectedSkillHeader && (
          <SelectedSkillHeader
            readonly={readonly}
            skill={{
              icon: actionMeta?.icon,
              name: actionMeta?.name,
            }}
            className="rounded-t-[7px]"
          />
        )}
        {contextItems?.length === 0 && historyItems?.length === 0 ? null : (
          <PreviewContextManager
            contextItems={contextItems}
            historyItems={historyItems}
            chatHistoryOpen={chatHistoryOpen}
            setChatHistoryOpen={setChatHistoryOpen}
          />
        )}
        <ChatHistory readonly items={historyItems} />
        <div className="text-base mx-4 my-2">{userQuery}</div>

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
