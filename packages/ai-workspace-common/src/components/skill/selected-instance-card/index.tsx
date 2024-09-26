import { Avatar, Button, Form, Message } from '@arco-design/web-react';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

import './index.scss';
import { InstanceInvokeForm } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-form';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';

// hooks
import { useBuildSkillContext } from '@refly-packages/ai-workspace-common/hooks/use-build-skill-context';
import { SkillContext, SkillInstance } from '@refly/openapi-schema';
// requests
import { useTranslation } from 'react-i18next';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';

export const SelectedInstanceCard = () => {
  // content for fill skill form
  const { newQAText } = useChatStore((state) => ({
    newQAText: state.newQAText,
  })); // fill query in the basic config
  const { buildSkillContext } = useBuildSkillContext();
  const { runSkill, emptyConvRunSkill } = useBuildThreadAndRun();
  const { computedShowContextCard } = useCopilotContextState();

  const [form] = Form.useForm();
  const { t } = useTranslation();

  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstance: state.setSelectedSkillInstance,
  }));
  const data = skillStore.selectedSkill;

  // TODO: fill context with default value @mrcfps
  const getSkillInstanceWithFillContext = (
    skill: SkillInstance,
    {
      query,
      context,
    }: {
      query: string;
      context: SkillContext;
    },
  ) => {
    return {
      ...skill,
      invocationConfig: {
        ...(skill?.invocationConfig || {}),
        input: {
          ...(skill?.invocationConfig?.input || {}),
          query,
        },
      },
    };
  };

  const skillInstanceWithFillContext = getSkillInstanceWithFillContext(skillStore.selectedSkill, {
    query: newQAText,
    context: buildSkillContext(),
  });

  const onOk = async () => {
    try {
      const res = await form.validate();
      const { messages } = useChatStore.getState();

      const { input, context, tplConfig } = res;
      const { contentList = [], urls = [] } = context || {};

      const skillContext: SkillContext = {
        ...context,
        contentList,
        urls,
      };
      const newQAText = input?.query || '';

      // use copilot runSkill to run skill instance from copilot
      if (messages?.length > 0) {
        // 追问阅读
        runSkill(newQAText, { skillContext, tplConfig });
      } else {
        // 新会话阅读，先创建会话，然后进行跳转之后发起聊天
        emptyConvRunSkill(newQAText, true, { skillContext, tplConfig });
      }
    } catch (err) {
      Message.error({ content: t('common.putErr') });
    }
  };

  return (
    <div className="selected-instance-card-container">
      {/* {computedShowContextCard ? (
        <div className="ai-copilot-context-display">
          <ContextStateDisplay />
        </div>
      ) : null} */}
      <div className="selected-instance-card">
        <div className="selected-skill">
          <div className="selected-skill-profile">
            <Avatar size={16} />
            <p>
              和 <span className="selected-skill-name">{skillStore?.selectedSkill?.displayName}</span> 聊聊
            </p>
          </div>
          <div className="selected-skill-manage">
            <Button
              icon={<IconClose />}
              onClick={() => {
                skillStore.setSelectedSkillInstance(null);
              }}
            ></Button>
          </div>
        </div>
        <div className="selected-instance-card-content">
          <InstanceInvokeForm
            form={form}
            onOk={onOk}
            data={data}
            setVisible={(val) => {
              skillStore.setSelectedSkillInstance(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};
