import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { Avatar, Button, Popconfirm } from '@arco-design/web-react';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';

// 样式
import './index.scss';
import { SkillTemplate } from '@refly/openapi-schema';

export const SkillManagement = () => {
  const skillStore = useSkillStore();
  const userStore = useUserStore();
  const { localSettings } = userStore;
  const { handleAddSkillInstance, handleRemoveSkillInstance } = useSkillManagement();

  const { skillInstances = [], skillTemplates = [] } = skillStore;
  // const needInstallSkillInstance = skillInstances?.length === 0 && skillTemplates?.length > 0;
  const needInstallSkillInstance = true;

  const checkIsInstalled = (skill: SkillTemplate) => {
    const matchedSkill = skillInstances?.find((item) => item?.skillName === skill?.name);

    return !!matchedSkill;
  };

  return (
    <div className="skill-onboarding">
      <div className="skill-recommend-and-manage">
        {/* <div className="manage-header">
          <p className="skill-recommend-title">新增 Skill 推荐</p>
          <Button
            className="manager-btn"
            type="text"
            onClick={() => {
              skillStore.setSkillManagerModalVisible(true);
            }}
          >
            管理技能
          </Button>
        </div> */}
        <div className="skill-recommend-list">
          {skillTemplates.map((item, index) => (
            <div className="skill-item" key={index}>
              <div className="skill-item-header">
                <div className="skill-profile">
                  <Avatar size={24} style={{ backgroundColor: '#00d0b6' }}>
                    {/* <img src={profile?.avatar} /> */}
                    {item?.displayName?.[localSettings.uiLocale] as string}
                  </Avatar>
                  <span className="skill-name">{item?.displayName?.[localSettings.uiLocale] as string}</span>
                </div>
                {checkIsInstalled(item) ? (
                  <Popconfirm
                    title="移除确认？"
                    content={`确定移除技能 ${item?.displayName?.[localSettings.uiLocale]} 吗？`}
                    onOk={() => {
                      handleRemoveSkillInstance(item?.name);
                    }}
                  >
                    <Button
                      className="skill-installer skill-installer-uninstall"
                      status="warning"
                      type="text"
                      onClick={() => {}}
                    >
                      卸载
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button
                    className="skill-installer skill-installer-install"
                    type="text"
                    onClick={() => {
                      handleAddSkillInstance(item?.name);
                    }}
                  >
                    添加
                  </Button>
                )}
              </div>
              <div className="skill-desc">{item?.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
