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
import { useUserStore, useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useChatStore, MessageIntentContext } from '@refly-packages/ai-workspace-common/stores/chat';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
// hooks
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useContextFilterErrorTip } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-context-filter-errror-tip';
import { useProjectContext } from '@refly-packages/ai-workspace-common/components/project-detail/context-provider';

// types
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { editorEmitter, InPlaceSendMessagePayload } from '@refly-packages/utils/event-emitter/editor';
import { LOCALE, MarkType } from '@refly/common-types';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';

interface CopilotInputModuleProps {
  source: MessageIntentSource;
}

const CopilotOperationModuleInner: ForwardRefRenderFunction<HTMLDivElement, CopilotInputModuleProps> = (props, ref) => {
  const { source } = props;
  const { t } = useTranslation();

  // stores
  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
  }));
  const chatStore = useChatStore((state) => ({
    setMessageIntentContext: state.setMessageIntentContext,
  }));

  // hooks
  const { buildShutdownTaskAndGenResponse, sendChatMessage } = useBuildThreadAndRun();
  const { projectId } = useProjectContext();

  const [form] = Form.useForm();
  const { formErrors, setFormErrors } = useContextPanelStore((state) => ({
    formErrors: state.formErrors,
    setFormErrors: state.setFormErrors,
  }));

  const handleSendMessage = (userInput?: string) => {
    const tplConfig = form?.getFieldValue('tplConfig');
    const { messageIntentContext, messages = [], enableWebSearch, enableKnowledgeBaseSearch } = useChatStore.getState();
    const { currentSelectedMarks } = useContextPanelStore.getState();

    const currentCanvas = currentSelectedMarks?.find(
      (mark) => (mark.type as MarkType) === 'canvas' && mark.isCurrentContext,
    );
    const currentResource = currentSelectedMarks?.find(
      (mark) => (mark.type as MarkType) === 'resource' && mark.isCurrentContext,
    );

    // TODO: later may add more source
    const forceNewConv = [MessageIntentSource.HomePage, MessageIntentSource.Search].includes(source);

    const newMessageIntentContext: Partial<MessageIntentContext> = {
      ...(messageIntentContext || {}),
      source: messageIntentContext?.source || source, // may edit from other side
      isNewConversation: messageIntentContext?.isNewConversation || forceNewConv,
      projectContext: {
        projectId,
        canvasId: currentCanvas?.entityId || currentCanvas?.id,
      },
      resourceContext: {
        resourceId: currentResource?.entityId || currentResource?.id,
      },
      enableWebSearch,
      enableKnowledgeBaseSearch,
    };

    chatStore.setMessageIntentContext(newMessageIntentContext as MessageIntentContext);

    sendChatMessage({
      tplConfig,
      userInput,
      messageIntentContext: newMessageIntentContext as MessageIntentContext,
    });
  };

  const handleAbort = () => {
    buildShutdownTaskAndGenResponse();
  };

  const handleInPlaceEditSendMessage = (data: InPlaceSendMessagePayload) => {
    const { canvasEditConfig, userInput, inPlaceActionType } = data;
    const { localSettings } = useUserStore.getState();
    const locale = localSettings?.uiLocale || LOCALE.EN;

    const { messageIntentContext } = useChatStore.getState();
    let newUserInput = userInput;

    // TODO: temp handle in frontend: 1) edit need set canvasEditConfig 2) chat for normal chat
    const isEditAction = inPlaceActionType === 'edit';
    let newMessageIntentContext: Partial<MessageIntentContext> = {
      ...(messageIntentContext || {}),
      inPlaceActionType,
    };

    if (isEditAction) {
      newMessageIntentContext = {
        ...(newMessageIntentContext || {}),
        canvasEditConfig,
      };
    } else {
      const { selection } = canvasEditConfig || {};
      const selectedText = selection?.highlightedText || '';

      if (selectedText) {
        newUserInput =
          `> ${locale === LOCALE.EN ? '**User Selected Text:** ' : '**用户选中的文本:** '} ${selectedText}` +
          `\n\n` +
          `${locale === LOCALE.EN ? '**Please answer question based on the user selected text:** ' : '**请根据用户选中的文本回答问题:** '} ${userInput}`;
      }
    }

    chatStore.setMessageIntentContext(newMessageIntentContext as MessageIntentContext);
    handleSendMessage(newUserInput);
  };

  useEffect(() => {
    editorEmitter.on('inPlaceSendMessage', handleInPlaceEditSendMessage);

    return () => {
      editorEmitter.off('inPlaceSendMessage', handleInPlaceEditSendMessage);
    };
  }, []);
  useEffect(() => {
    if (!skillStore.selectedSkill?.tplConfigSchema?.items?.length) {
      form.setFieldValue('tplConfig', undefined);
    }
  }, [skillStore.selectedSkill?.skillId, skillStore.selectedSkill?.tplConfigSchema?.items]);

  return (
    <>
      <div ref={ref} className="ai-copilot-operation-container">
        <div className="ai-copilot-operation-body">
          {/* <SkillDisplay source={source} /> */}
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
