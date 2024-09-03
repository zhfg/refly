import { Avatar, Button, Form } from '@arco-design/web-react';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

import './index.scss';
import { InstanceInvokeForm } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-form';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';

// hooks
import { useBuildSkillContext } from '@refly-packages/ai-workspace-common/hooks/use-build-skill-context';
import { SkillContext, SkillInstance } from '@refly/openapi-schema';

export const SelectedInstanceCard = () => {
  // content for fill skill form
  const { newQAText } = useChatStore((state) => ({
    newQAText: state.newQAText,
  })); // fill query in the basic config
  const { buildSkillContext } = useBuildSkillContext();

  const [form] = Form.useForm();

  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstalce: state.setSelectedSkillInstalce,
  }));

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
        ...skill.invocationConfig,
        input: {
          ...skill.invocationConfig.input,
          query,
        },
      },
    };
  };

  const skillInstanceWithFillContext = getSkillInstanceWithFillContext(skillStore.selectedSkill, {
    query: newQAText,
    context: buildSkillContext(),
  });

  const onOk = async () => {};

  return (
    <div className="selected-instance-card-container">
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
                skillStore.setSelectedSkillInstalce(null);
              }}
            ></Button>
          </div>
        </div>
        <div className="selected-instance-card-content">
          <InstanceInvokeForm
            form={form}
            onOk={onOk}
            data={skillStore.selectedSkill}
            setVisible={(val) => {
              skillStore.setSelectedSkillInstalce(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};
