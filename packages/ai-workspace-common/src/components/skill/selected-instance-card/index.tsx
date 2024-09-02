import { Avatar, Button, Form } from '@arco-design/web-react';
import { IconClose } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

import './index.scss';
import { InstanceInvokeForm } from '@refly-packages/ai-workspace-common/components/skill/instance-invoke-form';

export const SelectedInstanceCard = () => {
  const [form] = Form.useForm();

  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
    setSelectedSkillInstalce: state.setSelectedSkillInstalce,
  }));

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
