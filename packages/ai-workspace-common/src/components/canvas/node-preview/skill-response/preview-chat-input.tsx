import { useTranslation } from 'react-i18next';
import { NodeItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { PreviewContextManager } from './preview-context-manager';
import { useMemo, memo } from 'react';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { ChatHistory } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/chat-history';
import { SelectedSkillHeader } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/selected-skill-header';

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

const PreviewChatInputComponent = (props: PreviewChatInputProps) => {
  const { contextItems, historyItems, chatHistoryOpen, setChatHistoryOpen, query, actionMeta, readonly } = props;
  const { t } = useTranslation();

  const hideSelectedSkillHeader = useMemo(
    () => !actionMeta || actionMeta?.name === 'commonQnA' || !actionMeta?.name,
    [actionMeta?.name],
  );

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
        <div className="text-base mx-4 my-2">{query}</div>

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

const arePropsEqual = (prevProps: PreviewChatInputProps, nextProps: PreviewChatInputProps) => {
  return (
    prevProps.query === nextProps.query &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.chatHistoryOpen === nextProps.chatHistoryOpen &&
    prevProps.contextItems === nextProps.contextItems &&
    prevProps.historyItems === nextProps.historyItems &&
    prevProps.actionMeta?.name === nextProps.actionMeta?.name
  );
};

export const PreviewChatInput = memo(PreviewChatInputComponent, arePropsEqual);
