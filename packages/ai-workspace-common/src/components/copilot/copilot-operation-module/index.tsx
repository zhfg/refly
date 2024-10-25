import { forwardRef, ForwardRefRenderFunction, memo, useEffect } from 'react';
import { Form } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { Notification } from '@arco-design/web-react';

import './index.scss';

import { ChatInput } from './chat-input';
import { SkillDisplay } from './skill-display';
import { ContextManager } from './context-manager';
import { ChatActions } from './chat-actions';
import { SelectedSkillHeader } from './selected-skill-header';
import { ConfigManager } from './config-manager';

// stores
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { ChatMode, useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
// hooks
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { useProjectContext } from '@refly-packages/ai-workspace-common/components/project-detail/context-provider';

// types
import { CopilotSource } from '@refly-packages/ai-workspace-common/types/copilot';

interface CopilotInputModuleProps {
  source?: CopilotSource;
}

const CopilotOperationModuleInner: ForwardRefRenderFunction<HTMLDivElement, CopilotInputModuleProps> = (props, ref) => {
  const { source } = props;
  const { t } = useTranslation();

  // stores
  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
  }));

  // hooks
  const { buildShutdownTaskAndGenResponse, sendChatMessage } = useBuildThreadAndRun();
  const { projectId } = useProjectContext();

  const [form] = Form.useForm();
  const { formErrors, setFormErrors } = useContextPanelStore((state) => ({
    formErrors: state.formErrors,
    setFormErrors: state.setFormErrors,
  }));

  const handleSendMessage = (chatMode: ChatMode) => {
    const tplConfig = form?.getFieldValue('tplConfig');
    // TODO: later may add more source
    const forceNewConv = [CopilotSource.HomePage].includes(source);

    sendChatMessage({
      chatMode,
      projectId,
      tplConfig,
      forceNewConv,
    });
  };

  const handleAbort = () => {
    buildShutdownTaskAndGenResponse();
  };

  useEffect(() => {
    if (!skillStore.selectedSkill?.tplConfigSchema?.items?.length) {
      form.setFieldValue('tplConfig', undefined);
    }
  }, [skillStore.selectedSkill?.skillId, skillStore.selectedSkill?.tplConfigSchema?.items]);

  return (
    <>
      <div ref={ref} className="ai-copilot-operation-container">
        <div className="ai-copilot-operation-body">
          <SkillDisplay source={source} />
          <div className="ai-copilot-chat-container">
            <div className="chat-input-container">
              <SelectedSkillHeader />
              <ContextManager />
              <div className="chat-input-body">
                <ChatInput
                  form={form}
                  placeholder={t('copilot.chatInput.placeholder')}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  handleSendMessage={handleSendMessage}
                />
              </div>

              {skillStore.selectedSkill?.tplConfigSchema?.items?.length > 0 && (
                <ConfigManager
                  form={form}
                  formErrors={formErrors}
                  setFormErrors={setFormErrors}
                  schema={skillStore.selectedSkill?.tplConfigSchema}
                  tplConfig={skillStore.selectedSkill?.tplConfig}
                  fieldPrefix="tplConfig"
                  configScope="runtime"
                  resetConfig={() => {
                    form.setFieldValue('tplConfig', skillStore.selectedSkill?.tplConfig || {});
                  }}
                />
              )}

              <ChatActions form={form} handleSendMessage={handleSendMessage} handleAbort={handleAbort} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const CopilotOperationModule = memo(forwardRef(CopilotOperationModuleInner));
