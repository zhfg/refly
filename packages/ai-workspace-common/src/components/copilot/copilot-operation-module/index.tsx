import { forwardRef, ForwardRefRenderFunction, memo, useEffect } from 'react';
import { Form } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

import './index.scss';

import { ChatInput } from './chat-input';
import { SkillDisplay } from './skill-display';
import { ContextManager } from './context-manager';
import { ChatActions } from './chat-actions';
import { SelectedSkillHeader } from './selected-skill-header';
import { ConfigManager } from './config-manager';

import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

interface CopilotInputModuleProps {
  source?: string;
}

const CopilotOperationModuleInner: ForwardRefRenderFunction<HTMLDivElement, CopilotInputModuleProps> = (props, ref) => {
  const { source } = props;
  const { t } = useTranslation();

  const skillStore = useSkillStoreShallow((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstance: state.setSelectedSkillInstance,
  }));

  const [form] = Form.useForm();
  const { formErrors, setFormErrors } = useContextPanelStore((state) => ({
    formErrors: state.formErrors,
    setFormErrors: state.setFormErrors,
  }));

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

              <ChatActions form={form} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const CopilotOperationModule = memo(forwardRef(CopilotOperationModuleInner));
