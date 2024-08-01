import { IconSettings } from '@arco-design/web-react/icon';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';

export const SkillDisplay = () => {
  const skillStore = useSkillStore();

  return (
    <div className="skill-container">
      {skillStore?.skillInstances?.map((item, index) => (
        <div
          key={index}
          className="skill-item"
          onClick={() => {
            skillStore.setSelectedSkillInstalce(item);
          }}
        >
          <span className="skill-item-title">{item?.skillDisplayName}</span>
        </div>
      ))}
      <div
        key="more"
        className="skill-item"
        onClick={() => {
          skillStore.setSkillManagerModalVisible(true);
        }}
      >
        <IconSettings /> <p className="skill-title skill-item-title">管理</p>
      </div>
    </div>
  );
};
